/**
 * Usage Sync API Route
 * 
 * POST /api/features/core/billing/usage/sync
 * Syncs entitlement limits and current usage from PostgreSQL to SQLite.
 * Called on login/context change to initialize local buffer state.
 * 
 * Flow:
 * 1. Resolve effective entitlements from subscription + addons
 * 2. Get current usage records from PostgreSQL UsageTracking
 * 3. Update SQLite with baseline usage + limits
 * 
 * Response:
 * { synced: number, features: string[] }
 */

import 'server-only'

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

import { requireRequestAccess, ApiAuthzError } from '@/lib/features/iam/authz/require'
import { resolveEffectiveEntitlements } from '@/lib/features/org/billing/entitlements/resolve'
import { db } from '@/lib/db'
import { logger } from '@/lib/logger'
import type { MeteringScope, UsagePeriod } from '@/generated/prisma/client'
import { trackingBuffer } from '@/lib/core/tracking'

// ─────────────────────────────────────────────────────────────────────────────
// POST: Sync PostgreSQL → SQLite
// ─────────────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const { scope } = await requireRequestAccess({
      req,
      requiredKeys: ['org.billing.usage.view'],
      requireActiveSubscription: false,
    })

    const agencyId = scope.agencyId
    const subAccountId = scope.kind === 'subaccount' ? scope.subAccountId : null
    const meteringScope: MeteringScope = scope.kind === 'subaccount' ? 'SUBACCOUNT' : 'AGENCY'

    // 1. Resolve effective entitlements (limits from subscription + addons + overrides)
    const entitlements = await resolveEffectiveEntitlements({
      scope: meteringScope,
      agencyId,
      subAccountId,
    })

    // 2. Get current usage records from PostgreSQL
    const usageRecords = await db.usageTracking.findMany({
      where: {
        scope: meteringScope,
        agencyId,
        subAccountId: subAccountId ?? null,
      },
    })

    // Build usage lookup map
    const usageByFeature = new Map<string, { currentUsage: number; period: UsagePeriod }>()
    for (const record of usageRecords) {
      usageByFeature.set(record.featureKey, {
        currentUsage: Number(record.currentUsage),
        period: record.period,
      })
    }

    // 3. Sync to SQLite
    const syncedFeatures: string[] = []
    
    for (const [featureKey, entitlement] of Object.entries(entitlements)) {
      const usage = usageByFeature.get(featureKey)
      const currentUsage = usage?.currentUsage ?? 0
      const period = usage?.period ?? 'MONTHLY'
      
      // Determine limit from entitlement
      const limit = entitlement.maxInt ?? entitlement.includedInt ?? 0
      const isUnlimited = entitlement.isUnlimited ?? false

      trackingBuffer.syncFromPg(
        meteringScope,
        agencyId,
        subAccountId,
        featureKey,
        currentUsage,
        limit,
        isUnlimited,
        period
      )

      syncedFeatures.push(featureKey)
    }

    // Also sync any usage records that don't have entitlements (edge case)
    for (const [featureKey, usage] of usageByFeature) {
      if (!entitlements[featureKey]) {
        // Feature has usage but no entitlement - sync with 0 limit
        trackingBuffer.syncFromPg(
          meteringScope,
          agencyId,
          subAccountId,
          featureKey,
          usage.currentUsage,
          0,
          false,
          usage.period
        )
        syncedFeatures.push(featureKey)
      }
    }

    logger.info('Usage sync completed', {
      scope: meteringScope,
      agencyId,
      subAccountId,
      synced: syncedFeatures.length,
    })

    return NextResponse.json({
      ok: true,
      synced: syncedFeatures.length,
      features: syncedFeatures,
    })
  } catch (error) {
    if (error instanceof ApiAuthzError) {
      return NextResponse.json(
        { ok: false, reason: error.code, message: error.message },
        { status: error.status }
      )
    }
    logger.error('Error syncing usage', { error })
    return NextResponse.json(
      { ok: false, reason: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}
