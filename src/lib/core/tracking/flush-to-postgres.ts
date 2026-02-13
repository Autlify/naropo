/**
 * PostgreSQL Flush Handler
 * 
 * Syncs buffered events from SQLite to PostgreSQL using existing billing infrastructure.
 * Uses consumeUsage() from /lib/features/org/billing/usage/consume.ts
 * 
 * Flow:
 * 1. Get unsynced events from SQLite
 * 2. Call consumeUsage() for each unique scope+feature
 * 3. Mark events as synced in SQLite
 * 4. Update flushed_usage in SQLite tracking
 */

import 'server-only'

import { db } from '@/lib/db'
import { 
  trackingBuffer, 
  type FlushResult, 
  type BufferedUsageEvent,
  type MeteringScope,
} from './sqlite-buffer'
import { FLUSH_CONFIG, type FlushTrigger } from './flush-config'
import { consumeUsage } from '@/lib/features/org/billing/usage/consume'

// ─────────────────────────────────────────────────────────────────────────────
// Flush to PostgreSQL via consumeUsage()
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Flush buffered events to PostgreSQL using existing billing consumeUsage()
 * 
 * This integrates with the existing billing infrastructure:
 * - UsageTracking (currentUsage, period handling)
 * - UsageEvent (with idempotency)
 * - FeatureCreditBalance (overage handling)
 */
export async function flushToPostgres(trigger: FlushTrigger): Promise<FlushResult> {
  const startTime = Date.now()
  const errors: string[] = []
  let eventsFlushed = 0
  let quotasUpdated = 0

  try {
    // Get unsynced events (already has idempotencyKey from SQLite)
    const events = trackingBuffer.getUnsyncedEvents(FLUSH_CONFIG.batchSize)
    
    if (events.length === 0) {
      const result: FlushResult = {
        success: true,
        eventsFlushed: 0,
        quotasUpdated: 0,
        trigger,
        duration: Date.now() - startTime,
      }
      trackingBuffer.logFlush(result)
      return result
    }

    // Group events by scope+feature for batch processing
    const aggregated = aggregateEvents(events)
    
    if (FLUSH_CONFIG.debug) {
      console.log(`[tracking] Flushing ${events.length} events (trigger: ${trigger})`)
      for (const [key, data] of Object.entries(aggregated)) {
        console.log(`  ${key}: +${data.totalQuantity} (${data.events.length} events)`)
      }
    }
    
    // Process each aggregated group via consumeUsage()
    const eventIdsToMark: number[] = []
    const flushUpdates: Array<{
      scope: MeteringScope
      agencyId: string
      subAccountId: string | null
      featureKey: string
      flushedDelta: number
    }> = []

    for (const [_key, data] of Object.entries(aggregated)) {
      const firstEvent = data.events[0]
      
      try {
        // Call existing PostgreSQL consumeUsage() for the aggregated batch
        const result = await consumeUsage({
          scope: firstEvent.scope,
          agencyId: firstEvent.agencyId,
          subAccountId: firstEvent.subAccountId ?? undefined,
          featureKey: firstEvent.featureKey,
          quantity: data.totalQuantity,
          actionKey: firstEvent.actionKey ?? undefined,
          // Use first event's idempotencyKey - PostgreSQL will handle deduplication
          idempotencyKey: firstEvent.idempotencyKey,
        })

        // Track success regardless of decision (allowed or not - the event was processed)
        const eventIds = data.events.map(e => e.id)
        eventIdsToMark.push(...eventIds)
        eventsFlushed += data.events.length
        
        // Only update flushed_usage if usage was actually consumed
        if (result.allowed) {
          flushUpdates.push({
            scope: firstEvent.scope,
            agencyId: firstEvent.agencyId,
            subAccountId: firstEvent.subAccountId,
            featureKey: firstEvent.featureKey,
            flushedDelta: data.totalQuantity,
          })
          quotasUpdated++
        }
      } catch (error) {
        // Handle idempotency conflicts gracefully (event already processed)
        if (error instanceof Error && error.message.includes('already exists')) {
          // Mark as synced anyway - it's already in PostgreSQL
          const eventIds = data.events.map(e => e.id)
          eventIdsToMark.push(...eventIds)
          eventsFlushed += data.events.length
        } else {
          errors.push(`${firstEvent.featureKey}: ${error instanceof Error ? error.message : String(error)}`)
        }
      }
    }

    // Mark events as synced in SQLite
    if (eventIdsToMark.length > 0) {
      trackingBuffer.markEventsSynced(eventIdsToMark)
    }

    // Update flushed_usage in SQLite tracking
    if (flushUpdates.length > 0) {
      trackingBuffer.batchCompleteFlushNew(flushUpdates)
    }

  } catch (error) {
    errors.push(error instanceof Error ? error.message : String(error))
  }

  const result: FlushResult = {
    success: errors.length === 0,
    eventsFlushed,
    quotasUpdated,
    trigger,
    duration: Date.now() - startTime,
    errors: errors.length > 0 ? errors : undefined,
  }

  trackingBuffer.logFlush(result)
  return result
}

/**
 * Aggregate events by scope+feature for batch processing
 */
function aggregateEvents(events: BufferedUsageEvent[]): Record<string, {
  totalQuantity: number
  events: BufferedUsageEvent[]
  lastCreatedAt: number
}> {
  const aggregated: Record<string, {
    totalQuantity: number
    events: BufferedUsageEvent[]
    lastCreatedAt: number
  }> = {}

  for (const event of events) {
    // Key: scope-agencyId-subAccountId-featureKey
    const key = `${event.scope}:${event.agencyId}:${event.subAccountId ?? 'null'}:${event.featureKey}`
    
    if (!aggregated[key]) {
      aggregated[key] = {
        totalQuantity: 0,
        events: [],
        lastCreatedAt: 0,
      }
    }
    
    aggregated[key].totalQuantity += event.quantity
    aggregated[key].events.push(event)
    aggregated[key].lastCreatedAt = Math.max(aggregated[key].lastCreatedAt, event.createdAt)
  }

  return aggregated
}

/**
 * Sync quota limits from PostgreSQL to SQLite
 * Called on login to ensure SQLite has accurate baseline
 * 
 * Note: This syncs usage tracking records. Limits are resolved via
 * resolveEffectiveEntitlements() which is called during usage checks.
 */
export async function syncQuotasFromPostgres(
  scope: MeteringScope,
  agencyId: string,
  subAccountId?: string | null
): Promise<void> {
  try {
    // Get all usage tracking records for this scope from PostgreSQL
    const usageRecords = await db.usageTracking.findMany({
      where: {
        scope,
        agencyId,
        subAccountId: subAccountId ?? null,
      },
    })

    // Sync each record to SQLite with baseline usage
    // Limits will be resolved via resolveEffectiveEntitlements() during usage checks
    for (const record of usageRecords) {
      trackingBuffer.syncFromPg(
        scope,
        agencyId,
        subAccountId ?? null,
        record.featureKey,
        Number(record.currentUsage), // Decimal to number
        0, // Limit resolved dynamically via resolveEffectiveEntitlements
        false // isUnlimited resolved dynamically
      )
    }

    if (FLUSH_CONFIG.debug) {
      console.log(`[tracking] Synced ${usageRecords.length} records from PostgreSQL for ${scope}:${agencyId}`)
    }
  } catch (error) {
    console.error('[tracking] Error syncing from PostgreSQL:', error)
  }
}

/**
 * @deprecated Use syncQuotasFromPostgres instead
 */
export async function syncQuotasFromEntitlements(scopeKey: string): Promise<void> {
  const parts = scopeKey.split(':')
  if (parts[0] === 'agency') {
    await syncQuotasFromPostgres('AGENCY', parts[1])
  } else if (parts[0] === 'subaccount') {
    await syncQuotasFromPostgres('SUBACCOUNT', parts[2] || '', parts[1])
  }
}

/**
 * Check and flush if any features are at threshold
 */
export async function checkAndFlushThresholds(): Promise<FlushResult | null> {
  const needingFlush = trackingBuffer.getFeaturesNeedingFlush()
  
  if (needingFlush.length === 0) return null
  
  // Check if any are critical
  const hasCritical = needingFlush.some(q => q.flushPriority === 'critical')
  
  return flushToPostgres(hasCritical ? 'CRITICAL' : 'THRESHOLD')
}
