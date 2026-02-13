/**
 * Tracking Module (PostgreSQL-Aligned)
 * 
 * Zero-latency usage tracking with SQLite buffer and smart PostgreSQL sync.
 * Uses registry's ENTITLEMENT_FEATURES as the single source of truth for:
 * - Valid feature keys
 * - Metering types (NONE, COUNT, SUM)
 * - Aggregation methods (COUNT, SUM)
 * 
 * SQLite schema mirrors PostgreSQL (UsageTracking, UsageEvent) for seamless flush.
 * 
 * @example
 * ```ts
 * import { trackingBuffer, flushToPostgres, isValidFeatureKey } from '@/lib/core/tracking'
 * 
 * // Validate feature key against registry
 * if (!isValidFeatureKey(featureKey)) {
 *   throw new Error('Invalid feature key')
 * }
 * 
 * // Track feature usage (new style - preferred)
 * const status = trackingBuffer.track({
 *   scope: 'AGENCY',
 *   agencyId: '123',
 *   featureKey: 'fi.general_ledger.journal_entries',
 *   quantity: 1,
 * })
 * 
 * // Legacy style (deprecated)
 * const status = trackingBuffer.trackUsage('agency:123', 'fi.general_ledger.journal_entries', 1)
 * 
 * // Check if near quota
 * if (status.needsFlush) {
 *   await flushToPostgres('THRESHOLD')
 * }
 * 
 * // Get all usage for an agency
 * const usages = trackingBuffer.getAllUsage('123')
 * ```
 */

export {
  trackingBuffer,
  // New PostgreSQL-aligned types
  type UsageInfo,
  type MeteringScope,
  type UsagePeriod,
  type BufferedUsageEvent,
  type TrackUsageInput,
  type FlushResult,
  // Legacy types (deprecated)
  type QuotaInfo,
  type UsageEvent,
  // Helper functions
  parseScopeKey,
  buildScopeKey,
} from './sqlite-buffer'

export {
  FLUSH_CONFIG,
  getFlushConfigForFeature,
  getEntitlementFeature,
  getMeteredFeatures,
  isValidFeatureKey,
  shouldFlush,
  type FlushTrigger,
  type FeatureFlushConfig,
  type FeatureKey,
} from './flush-config'

export {
  flushToPostgres,
  syncQuotasFromPostgres,
  checkAndFlushThresholds,
  // Legacy (deprecated)
  syncQuotasFromEntitlements,
} from './flush-to-postgres'
