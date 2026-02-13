/**
 * Tracking Flush Configuration (SSoT-Integrated)
 * 
 * Defines flush triggers and thresholds for the smart tracking buffer.
 * Uses registry's ENTITLEMENT_FEATURES as the single source of truth for:
 * - Feature metering types (NONE, COUNT, SUM)
 * - Aggregation methods (COUNT, SUM)
 * - Period scoping (MONTHLY, YEARLY)
 * 
 * Events are buffered locally (SQLite) and flushed to PostgreSQL based on:
 * - Time intervals (background sync)
 * - Quota thresholds (proactive warning)
 * - Critical thresholds (immediate enforcement)
 * - Manual triggers (logout, navigation)
 */

import 'server-only'

import { ENTITLEMENT_FEATURES, type FeatureKey, type EntitlementFeatureSeed } from '@/lib/registry'
import type { MeteringType, MeterAggregation } from '@/generated/prisma/client'

// ─────────────────────────────────────────────────────────────────────────────
// Flush Trigger Types
// ─────────────────────────────────────────────────────────────────────────────

export type FlushTrigger = 
  | 'TIME'       // Scheduled interval
  | 'THRESHOLD'  // Usage approaching limit
  | 'CRITICAL'   // Usage at/near limit
  | 'MANUAL'     // User-initiated (logout, etc)
  | 'STARTUP'    // Application start

/** Re-export FeatureKey for convenience */
export type { FeatureKey }

// ─────────────────────────────────────────────────────────────────────────────
// Default Configuration
// ─────────────────────────────────────────────────────────────────────────────

export const FLUSH_CONFIG = {
  /** Default flush interval in milliseconds (4 hours) */
  intervalMs: 4 * 60 * 60 * 1000,
  
  /** Maximum interval between flushes (24 hours) */
  maxIntervalMs: 24 * 60 * 60 * 1000,
  
  /** Minimum interval between flushes (5 minutes) - prevent spam */
  minIntervalMs: 5 * 60 * 1000,
  
  /** Threshold percentage to trigger proactive flush (80%) */
  flushAtPercent: 80,
  
  /** Critical threshold for immediate flush (95%) */
  criticalPercent: 95,
  
  /** Number of events to batch per flush operation */
  batchSize: 500,
  
  /** Maximum events to keep in buffer before forced flush */
  maxBufferSize: 10_000,
  
  /** Enable verbose logging */
  debug: process.env.NODE_ENV === 'development',
} as const

// ─────────────────────────────────────────────────────────────────────────────
// Feature-Specific Overrides (SSoT: Registry + Local Tuning)
// ─────────────────────────────────────────────────────────────────────────────

export type FeatureFlushConfig = {
  flushAtPercent?: number
  criticalPercent?: number
  intervalMs?: number
}

/**
 * Override flush settings for specific features.
 * Uses FeatureKey from registry for type safety.
 * Features not listed use FLUSH_CONFIG defaults.
 */
export const FEATURE_FLUSH_OVERRIDES: Partial<Record<FeatureKey, FeatureFlushConfig>> = {
  // AI features flush more aggressively due to cost
  // 'ai.chat.messages': {
  //   flushAtPercent: 70,
  //   criticalPercent: 90,
  //   intervalMs: 60 * 60 * 1000, // 1 hour
  // },
}

// ─────────────────────────────────────────────────────────────────────────────
// Registry Lookup (SSoT)
// ─────────────────────────────────────────────────────────────────────────────

/** Feature registry index for O(1) lookup */
const FEATURE_REGISTRY_INDEX = new Map<string, EntitlementFeatureSeed>(
  ENTITLEMENT_FEATURES.map(f => [f.key, f])
)

const METERED_FEATURES = ENTITLEMENT_FEATURES.filter((f) => f.metering !== 'NONE')

/**
 * Get entitlement feature from registry (SSoT)
 * @returns EntitlementFeatureSeed or undefined if not found
 */
export function getEntitlementFeature(featureKey: FeatureKey | string): EntitlementFeatureSeed | undefined {
  return FEATURE_REGISTRY_INDEX.get(featureKey)
}

/**
 * Validate feature key against registry
 * @returns true if feature key exists in registry
 */
export function isValidFeatureKey(featureKey: string): featureKey is FeatureKey {
  return FEATURE_REGISTRY_INDEX.has(featureKey)
}

/**
 * Get all metered features (those with metering !== 'NONE')
 */
export function getMeteredFeatures(): EntitlementFeatureSeed[] {
  return METERED_FEATURES
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper Functions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get effective flush config for a feature
 * Merges registry defaults with local overrides
 */
export function getFlushConfigForFeature(featureKey: FeatureKey | string): {
  flushAtPercent: number
  criticalPercent: number
  intervalMs: number
  metering: MeteringType
  aggregation: MeterAggregation | null
} {
  // Get registry config (SSoT)
  const entitlementFeature = getEntitlementFeature(featureKey)
  
  // Get local override if exists
  const override = isValidFeatureKey(featureKey) 
    ? FEATURE_FLUSH_OVERRIDES[featureKey] 
    : undefined
  
  return {
    flushAtPercent: override?.flushAtPercent ?? FLUSH_CONFIG.flushAtPercent,
    criticalPercent: override?.criticalPercent ?? FLUSH_CONFIG.criticalPercent,
    intervalMs: override?.intervalMs ?? FLUSH_CONFIG.intervalMs,
    metering: entitlementFeature?.metering ?? 'NONE',
    aggregation: entitlementFeature?.aggregation ?? null,
  }
}

/**
 * Determine if flush is needed based on usage percentage
 */
export function shouldFlush(
  usagePercent: number,
  config: { flushAtPercent: number; criticalPercent: number } = FLUSH_CONFIG
): { shouldFlush: boolean; trigger: FlushTrigger | null; priority: 'normal' | 'high' | 'critical' } {
  if (usagePercent >= config.criticalPercent) {
    return { shouldFlush: true, trigger: 'CRITICAL', priority: 'critical' }
  }
  if (usagePercent >= config.flushAtPercent) {
    return { shouldFlush: true, trigger: 'THRESHOLD', priority: 'high' }
  }
  return { shouldFlush: false, trigger: null, priority: 'normal' }
}
