/**
 * Tracking Hook (SSoT-Integrated)
 * 
 * Client-side hook for tracking feature usage via the tracking API.
 * Uses registry's FeatureKey type for type-safe feature tracking.
 * SQLite is the single read source - provides instant feedback.
 * 
 * @example
 * ```tsx
 * 'use client'
 * 
 * import { useTracking } from '@/lib/client/hooks/use-tracking'
 * 
 * function JournalEntryForm() {
 *   const { track, usage, isNearLimit } = useTracking('fi.general_ledger.journal_entries')
 *   
 *   const createEntry = async (data: JournalEntryData) => {
 *     if (isNearLimit) {
 *       toast.warning('Approaching journal entry limit')
 *     }
 *     await saveJournalEntry(data)
 *     track() // Increment usage
 *   }
 *   
 *   return (
 *     <div>
 *       {usage && (
 *         <UsageBar current={usage.total} max={usage.limit} />
 *       )}
 *       <JournalForm onSubmit={createEntry} />
 *     </div>
 *   )
 * }
 * ```
 */

'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { useSessionMemory } from '../stores/session-memory'
import type { FeatureKey } from '@/lib/registry'

// ─────────────────────────────────────────────────────────────────────────────
// Types (matches SQLite schema)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Full usage info from SQLite (single read source)
 * SQLite stores: flushed (from PostgreSQL) + unflushed (local writes)
 */
export interface UsageInfo {
  scopeKey: string
  featureKey: FeatureKey 
  /** Baseline usage (synced from PostgreSQL) */
  flushedUsage: number
  /** Local writes not yet flushed to PostgreSQL */
  unflushedDelta: number
  /** Total usage = flushedUsage + unflushedDelta */
  total: number
  /** Available limit from entitlements */
  limit: number
  /** Whether feature is unlimited */
  isUnlimited: boolean
  /** Usage percentage = (total / limit) * 100 */
  usagePercent: number
  /** Threshold to trigger flush */
  flushAtPercent: number
  /** Critical threshold for immediate flush */
  nextFlushPercent: number
  /** Whether flush is needed */
  needsFlush: boolean
  /** Flush priority based on usage */
  flushPriority: 'normal' | 'high' | 'critical'
  /** Whether feature key is valid per registry */
  isValidFeature: boolean
  /** Last sync from PostgreSQL timestamp */
  lastSyncAt: number | null
  /** Last flush timestamp */
  lastFlushAt: number | null
}

/** @deprecated Use UsageInfo instead */
export interface QuotaStatus {
  scopeKey: string
  featureKey: FeatureKey 
  maxLimit: number
  currentUsage: number
  usagePercent: number
  flushAtPercent: number
  nextFlushPercent: number
  isUnlimited: boolean
  needsFlush: boolean
  flushPriority: 'normal' | 'high' | 'critical'
  isValidFeature: boolean
}

/** @deprecated Use UsageInfo instead */
export interface CombinedUsageInfo {
  pgBaseline: number
  sqliteDelta: number
  combined: number
  limit: number
  isUnlimited: boolean
  usagePercent: number
  needsFlush: boolean
  flushPriority: 'normal' | 'high' | 'critical'
  isValidFeature: boolean
}

export interface UseTrackingOptions {
  /**
   * Auto-fetch usage on mount
   * @default true
   */
  autoFetch?: boolean
  /**
   * Scope key override (defaults to current session scope)
   */
  scopeKey?: string
}

export interface UseTrackingReturn {
  /** Track a usage event */
  track: (delta?: number, metadata?: Record<string, unknown>) => Promise<UsageInfo | null> 
  /** Full usage info from SQLite */
  usage: UsageInfo | null
  /** @deprecated Use usage instead */
  quota: QuotaStatus | null
  /** Whether the feature is approaching its limit */
  isNearLimit: boolean
  /** Whether the feature is at critical usage */
  isAtCritical: boolean
  /** Loading state */
  isLoading: boolean
  /** Error state */
  error: string | null
  /** Refresh usage */
  refresh: () => Promise<void>
}

// ─────────────────────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────────────────────

export function useTracking(
  featureKey: FeatureKey,
  options: UseTrackingOptions = {}
): UseTrackingReturn {
  const { autoFetch = true, scopeKey: overrideScopeKey } = options
  
  const context = useSessionMemory((s) => s.context)
  const [usage, setUsage] = useState<UsageInfo | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const scopeKey = overrideScopeKey || (context 
    ? (context.subAccountId 
        ? `subaccount:${context.subAccountId}` 
        : `agency:${context.agencyId}`)
    : null)

  // Fetch current usage from SQLite
  const refresh = useCallback(async () => {
    if (!scopeKey) return
    
    setIsLoading(true)
    setError(null)
    
    try {
      const res = await fetch(
        `/api/track?scopeKey=${encodeURIComponent(scopeKey)}&featureKey=${encodeURIComponent(featureKey)}`
      )
      
      if (!res.ok) {
        throw new Error('Failed to fetch usage')
      }
      
      const data = await res.json()
      setUsage(data.usage)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }, [scopeKey, featureKey])

  // Track usage event
  const track = useCallback(
    async (delta = 1, metadata?: Record<string, unknown>): Promise<UsageInfo | null> => {
      if (!scopeKey) {
        setError('No scope available')
        return null
      }
      
      try {
        const res = await fetch('/api/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            scopeKey,
            featureKey,
            delta,
            metadata,
          }),
        })
        
        if (!res.ok) {
          throw new Error('Failed to track usage')
        }
        
        const data = await res.json()
        setUsage(data.usage)
        return data.usage
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
        return null
      }
    },
    [scopeKey, featureKey]
  )

  useEffect(() => {
    if (autoFetch && scopeKey) {
      refresh()
    }
  }, [autoFetch, scopeKey, refresh])

  // Computed states
  const isNearLimit = usage 
    ? !usage.isUnlimited && usage.usagePercent >= usage.flushAtPercent
    : false
    
  const isAtCritical = usage
    ? !usage.isUnlimited && usage.usagePercent >= usage.nextFlushPercent
    : false

  // Backward compat: quota maps to UsageInfo
  const quota: QuotaStatus | null = usage ? {
    scopeKey: usage.scopeKey,
    featureKey: usage.featureKey,
    maxLimit: usage.limit,
    currentUsage: usage.total,
    usagePercent: usage.usagePercent,
    flushAtPercent: usage.flushAtPercent,
    nextFlushPercent: usage.nextFlushPercent,
    isUnlimited: usage.isUnlimited,
    needsFlush: usage.needsFlush,
    flushPriority: usage.flushPriority,
    isValidFeature: usage.isValidFeature,
  } : null

  return {
    track,
    usage,
    quota,
    isNearLimit,
    isAtCritical,
    isLoading,
    error,
    refresh,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// All Usage Hook
// ─────────────────────────────────────────────────────────────────────────────

export interface UseAllUsageReturn {
  usages: UsageInfo[]
  /** @deprecated Use usages instead */
  quotas: QuotaStatus[]
  isLoading: boolean
  error: string | null
  refresh: () => Promise<void>
}

/** @deprecated Use useAllUsage instead */
export interface UseAllQuotasReturn {
  quotas: QuotaStatus[]
  isLoading: boolean
  error: string | null
  refresh: () => Promise<void>
}

export function useAllUsage(scopeKey?: string): UseAllUsageReturn {
  const context = useSessionMemory((s) => s.context)
  const [usages, setUsages] = useState<UsageInfo[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const effectiveScopeKey = scopeKey || (context 
    ? (context.subAccountId 
        ? `subaccount:${context.subAccountId}` 
        : `agency:${context.agencyId}`)
    : null)

  const refresh = useCallback(async () => {
    if (!effectiveScopeKey) return
    
    setIsLoading(true)
    setError(null)
    
    try {
      const res = await fetch(
        `/api/track?scopeKey=${encodeURIComponent(effectiveScopeKey)}`
      )
      
      if (!res.ok) {
        throw new Error('Failed to fetch usage')
      }
      
      const data = await res.json()
      setUsages(data.usages || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }, [effectiveScopeKey])

  useEffect(() => {
    if (effectiveScopeKey) {
      refresh()
    }
  }, [effectiveScopeKey, refresh])

  // Backward compat
  const quotas: QuotaStatus[] = usages.map(u => ({
    scopeKey: u.scopeKey,
    featureKey: u.featureKey,
    maxLimit: u.limit,
    currentUsage: u.total,
    usagePercent: u.usagePercent,
    flushAtPercent: u.flushAtPercent,
    nextFlushPercent: u.nextFlushPercent,
    isUnlimited: u.isUnlimited,
    needsFlush: u.needsFlush,
    flushPriority: u.flushPriority,
    isValidFeature: u.isValidFeature,
  }))

  return { usages, quotas, isLoading, error, refresh }
}

/** @deprecated Use useAllUsage instead */
export function useAllQuotas(scopeKey?: string): UseAllQuotasReturn {
  const { quotas, isLoading, error, refresh } = useAllUsage(scopeKey)
  return { quotas, isLoading, error, refresh }
}

// ─────────────────────────────────────────────────────────────────────────────
// Usage Sync Hook (PostgreSQL → SQLite on context change)
// ─────────────────────────────────────────────────────────────────────────────

export interface UseUsageSyncReturn {
  /** Whether sync is in progress */
  isSyncing: boolean
  /** Last sync timestamp */
  lastSyncAt: number | null
  /** Number of features synced */
  syncedCount: number
  /** Error if sync failed */
  error: string | null
  /** Force a sync */
  sync: () => Promise<void>
}

/**
 * Hook to sync usage data from PostgreSQL to SQLite.
 * Automatically syncs when context changes.
 * 
 * @example
 * ```tsx
 * function Layout({ children }) {
 *   const { isSyncing, lastSyncAt } = useUsageSync()
 *   
 *   if (isSyncing) return <LoadingSpinner />
 *   
 *   return <>{children}</>
 * }
 * ```
 */
export function useUsageSync(): UseUsageSyncReturn {
  const context = useSessionMemory((s) => s.context)
  const [isSyncing, setIsSyncing] = useState(false)
  const [lastSyncAt, setLastSyncAt] = useState<number | null>(null)
  const [syncedCount, setSyncedCount] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const syncedContextRef = useRef<string | null>(null)

  const contextKey = context 
    ? `${context.scope}:${context.agencyId}:${context.subAccountId ?? ''}` 
    : null

  const sync = useCallback(async () => {
    if (!context) return
    
    setIsSyncing(true)
    setError(null)
    
    try {
      const res = await fetch('/api/features/core/billing/usage/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      
      if (!res.ok) {
        throw new Error('Failed to sync usage')
      }
      
      const data = await res.json()
      setLastSyncAt(Date.now())
      setSyncedCount(data.synced || 0)
      syncedContextRef.current = contextKey
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsSyncing(false)
    }
  }, [context, contextKey])

  // Auto-sync when context changes
  useEffect(() => {
    if (contextKey && contextKey !== syncedContextRef.current) {
      sync()
    }
  }, [contextKey, sync])

  return {
    isSyncing,
    lastSyncAt,
    syncedCount,
    error,
    sync,
  }
}

/** @deprecated No longer needed - SQLite is single read source */
export interface UseCombinedUsageReturn {
  usage: CombinedUsageInfo | null
  isLoadingPg: boolean
  isLoadingDelta: boolean
  isLoading: boolean
  error: string | null
  refresh: () => Promise<void>
  refreshDelta: () => Promise<void>
}

/**
 * @deprecated No longer needed - use useTracking instead
 * SQLite now stores both flushed (from PostgreSQL) and unflushed (local writes)
 */
export function useCombinedUsage(
  featureKey: FeatureKey,
  options: { scopeKey?: string } = {}
): UseCombinedUsageReturn {
  const { usage: fullUsage, isLoading, error, refresh } = useTracking(featureKey, options)
  
  // Map to old CombinedUsageInfo format
  const usage: CombinedUsageInfo | null = fullUsage ? {
    pgBaseline: fullUsage.flushedUsage,
    sqliteDelta: fullUsage.unflushedDelta,
    combined: fullUsage.total,
    limit: fullUsage.limit,
    isUnlimited: fullUsage.isUnlimited,
    usagePercent: fullUsage.usagePercent,
    needsFlush: fullUsage.needsFlush,
    flushPriority: fullUsage.flushPriority,
    isValidFeature: fullUsage.isValidFeature,
  } : null

  return {
    usage,
    isLoadingPg: false,
    isLoadingDelta: isLoading,
    isLoading,
    error,
    refresh,
    refreshDelta: refresh,
  }
}
