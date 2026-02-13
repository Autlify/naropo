/**
 * Client Module (SSoT-Integrated)
 * 
 * Client-side utilities for session management and tracking.
 * Uses Zustand for state and SSE for real-time updates.
 * Feature keys are type-checked against registry's ENTITLEMENT_FEATURES.
 * 
 * @example
 * ```tsx
 * // Session memory
 * import { useSessionMemory, useHasPermission } from '@/lib/client'
 * 
 * // Tracking with type-safe feature keys
 * import { useTracking, useAllQuotas, type FeatureKey } from '@/lib/client'
 * 
 * // SSE events
 * import { useSessionEvents } from '@/lib/client'
 * ```
 */

// Re-export FeatureKey type from registry for client convenience
export type { FeatureKey } from '@/lib/registry'

// Session Memory Store
export {
  useSessionMemory,
  usePermissions,
  useEnabledFeatures,
  useSessionContext,
  useIsSessionLoaded,
  usePlanInfo,
  useHasPermission,
  useHasAnyPermission,
  useHasFeature,
  type SessionContext,
  type SessionMemoryState,
  type SessionMemoryActions,
  type SessionMemoryStore,
} from './stores/session-memory'

// Tracking Hooks
export {
  useTracking,
  useAllUsage,
  useAllQuotas,
  useCombinedUsage,
  useUsageSync,
  type UsageInfo,
  type QuotaStatus,
  type CombinedUsageInfo,
  type UseTrackingOptions,
  type UseTrackingReturn,
  type UseAllUsageReturn,
  type UseAllQuotasReturn,
  type UseCombinedUsageReturn,
  type UseUsageSyncReturn,
} from './hooks/use-tracking'

export {
  usePermissionVersionSync,
  type PermissionVersionSyncScope,
  type UsePermissionVersionSyncOptions,
  type UsePermissionVersionSyncReturn,
} from './hooks/use-permission-version-sync'

// Session Events (SSE)
export {
  useSessionEvents,
  type SessionEventData,
  type UseSessionEventsOptions,
  type UseSessionEventsReturn,
} from './events/use-session-events'
