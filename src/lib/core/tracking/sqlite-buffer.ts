/**
 * Smart Tracking Buffer (SQLite) - PostgreSQL Schema Aligned
 * 
 * Zero-latency event tracking with intelligent PostgreSQL sync.
 * SQLite schema mirrors PostgreSQL (UsageEvent, UsageTracking) for easy flush.
 * 
 * Architecture:
 * - Event → SQLite (unflushed_delta++) → Flush (consumeUsage) → PostgreSQL
 * - On login: PostgreSQL → sync to SQLite (flushed_usage, unflushed_delta=0)
 * - SQLite is the SINGLE READ SOURCE for UI (no PostgreSQL queries needed)
 * 
 * Schema mirrors PostgreSQL:
 * - usage_events → UsageEvent (same fields + synced, pg_event_id)
 * - usage_tracking → UsageTracking (same fields + unflushed_delta, limits)
 * 
 * @example
 * ```ts
 * import { trackingBuffer } from '@/lib/core/tracking/sqlite-buffer'
 * 
 * // Track usage (mirrors PostgreSQL consumeUsage)
 * const usage = trackingBuffer.trackUsage({
 *   scope: 'AGENCY',
 *   agencyId: '123',
 *   featureKey: 'fi.general_ledger.journal_entries',
 *   quantity: 1,
 * })
 * 
 * // Get full usage info for UI
 * const info = trackingBuffer.getUsageInfo('AGENCY', '123', null, 'fi.general_ledger.journal_entries')
 * ```
 */

import 'server-only'

import Database, { type Database as DatabaseType } from 'better-sqlite3'
import path from 'path'
import fs from 'fs'
import { randomUUID } from 'crypto'
import { 
  FLUSH_CONFIG, 
  getFlushConfigForFeature, 
  shouldFlush, 
  isValidFeatureKey,
  type FlushTrigger,
  type FeatureKey,
} from './flush-config'

// ─────────────────────────────────────────────────────────────────────────────
// Types (PostgreSQL-aligned)
// ─────────────────────────────────────────────────────────────────────────────

/** Mirrors PostgreSQL MeteringScope enum */
export type MeteringScope = 'AGENCY' | 'SUBACCOUNT'

/** Mirrors PostgreSQL UsagePeriod enum */
export type UsagePeriod = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY' | 'LIFETIME'

/**
 * SQLite UsageEvent - mirrors PostgreSQL UsageEvent
 * Additional fields: synced, pg_event_id for flush tracking
 */
export interface BufferedUsageEvent {
  id: number
  scope: MeteringScope
  agencyId: string
  subAccountId: string | null
  featureKey: string
  quantity: number
  actionKey: string | null
  idempotencyKey: string
  createdAt: number
  // Flush tracking (not in PostgreSQL)
  synced: boolean
  pgEventId: string | null
}

/**
 * Full usage info for UI display
 * Combines PostgreSQL UsageTracking fields with buffer fields
 * Includes scopeKey for backward compatibility
 */
export interface UsageInfo {
  // PostgreSQL UsageTracking fields
  scope: MeteringScope
  agencyId: string
  subAccountId: string | null
  featureKey: FeatureKey | string
  period: UsagePeriod
  periodStart: number
  periodEnd: number
  /** Baseline usage (synced from PostgreSQL UsageTracking.currentUsage) */
  flushedUsage: number
  /** Local writes not yet flushed to PostgreSQL */
  unflushedDelta: number
  /** Total usage = flushedUsage + unflushedDelta */
  total: number
  // Entitlement fields (from sync)
  limit: number
  isUnlimited: boolean
  // Computed fields
  usagePercent: number
  flushAtPercent: number
  nextFlushPercent: number
  needsFlush: boolean
  flushPriority: 'normal' | 'high' | 'critical'
  isValidFeature: boolean
  lastEventAt: number | null
  lastSyncAt: number | null
  lastFlushAt: number | null
  /** @deprecated Use scope/agencyId/subAccountId instead. Kept for backward compat */
  scopeKey: string
}

/** Track usage input - mirrors consumeUsage args */
export interface TrackUsageInput {
  scope: MeteringScope
  agencyId: string
  subAccountId?: string | null
  featureKey: string
  quantity?: number
  actionKey?: string | null
  metadata?: Record<string, unknown>
}

export interface FlushResult {
  success: boolean
  eventsFlushed: number
  quotasUpdated: number
  trigger: FlushTrigger
  duration: number
  errors?: string[]
}

/** @deprecated Use UsageInfo instead */
export interface QuotaInfo {
  scopeKey: string
  featureKey: FeatureKey | string
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

/** @deprecated Use BufferedUsageEvent instead */
export interface UsageEvent {
  id?: number
  scopeKey: string
  featureKey: string
  delta: number
  timestamp: number
  metadata?: string
  synced: boolean
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Parse scopeKey (legacy format) to scope parts */
export function parseScopeKey(scopeKey: string): { scope: MeteringScope; agencyId: string; subAccountId: string | null } {
  if (scopeKey.startsWith('subaccount:')) {
    const [, subAccountId, agencyId] = scopeKey.split(':')
    return { scope: 'SUBACCOUNT', agencyId: agencyId || '', subAccountId }
  }
  if (scopeKey.startsWith('agency:')) {
    const [, agencyId] = scopeKey.split(':')
    return { scope: 'AGENCY', agencyId, subAccountId: null }
  }
  // Assume agency if no prefix
  return { scope: 'AGENCY', agencyId: scopeKey, subAccountId: null }
}

/** Build scopeKey from parts (legacy format for backward compat) */
export function buildScopeKey(scope: MeteringScope, agencyId: string, subAccountId: string | null): string {
  if (scope === 'SUBACCOUNT' && subAccountId) {
    return `subaccount:${subAccountId}:${agencyId}`
  }
  return `agency:${agencyId}`
}

/** Get current usage period window */
function getUsageWindow(period: UsagePeriod, now: Date = new Date()): { periodStart: Date; periodEnd: Date } {
  const year = now.getFullYear()
  const month = now.getMonth()
  const day = now.getDate()
  const dayOfWeek = now.getDay()

  switch (period) {
    case 'DAILY': {
      const start = new Date(year, month, day, 0, 0, 0, 0)
      const end = new Date(year, month, day + 1, 0, 0, 0, 0)
      return { periodStart: start, periodEnd: end }
    }
    case 'WEEKLY': {
      const start = new Date(year, month, day - dayOfWeek, 0, 0, 0, 0)
      const end = new Date(year, month, day - dayOfWeek + 7, 0, 0, 0, 0)
      return { periodStart: start, periodEnd: end }
    }
    case 'MONTHLY': {
      const start = new Date(year, month, 1, 0, 0, 0, 0)
      const end = new Date(year, month + 1, 1, 0, 0, 0, 0)
      return { periodStart: start, periodEnd: end }
    }
    case 'YEARLY': {
      const start = new Date(year, 0, 1, 0, 0, 0, 0)
      const end = new Date(year + 1, 0, 1, 0, 0, 0, 0)
      return { periodStart: start, periodEnd: end }
    }
    case 'LIFETIME':
    default: {
      const start = new Date(2020, 0, 1, 0, 0, 0, 0)
      const end = new Date(2100, 0, 1, 0, 0, 0, 0)
      return { periodStart: start, periodEnd: end }
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SQLite Buffer Implementation
// ─────────────────────────────────────────────────────────────────────────────

class SmartTrackingBuffer {
  private db: DatabaseType | null = null
  private dbPath: string
  private initialized = false

  constructor() {
    // Store in project data directory
    const dataDir = process.env.DATA_DIR || path.join(process.cwd(), '.data')
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true })
    }
    this.dbPath = path.join(dataDir, 'tracking.db')
  }

  /**
   * Initialize database and schema
   * Schema mirrors PostgreSQL UsageTracking/UsageEvent for easy flush
   */
  private init(): DatabaseType {
    if (this.db && this.initialized) return this.db

    this.db = new Database(this.dbPath)
    this.db.pragma('journal_mode = WAL')
    this.db.pragma('synchronous = NORMAL')
    this.db.pragma('cache_size = 10000')

    // Create schema - now aligned with PostgreSQL
    this.db.exec(`
      -- Usage tracking (mirrors PostgreSQL UsageTracking)
      CREATE TABLE IF NOT EXISTS usage_tracking (
        scope TEXT NOT NULL CHECK(scope IN ('AGENCY', 'SUBACCOUNT')),
        agency_id TEXT NOT NULL,
        sub_account_id TEXT,
        feature_key TEXT NOT NULL,
        period TEXT NOT NULL DEFAULT 'MONTHLY' CHECK(period IN ('DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY', 'LIFETIME')),
        period_start INTEGER NOT NULL,
        period_end INTEGER NOT NULL,
        flushed_usage INTEGER NOT NULL DEFAULT 0,      -- currentUsage from PostgreSQL
        unflushed_delta INTEGER NOT NULL DEFAULT 0,    -- Local writes not yet flushed
        max_limit INTEGER NOT NULL DEFAULT 0,          -- Available limit from entitlements
        is_unlimited INTEGER NOT NULL DEFAULT 0,
        flush_at_percent REAL NOT NULL DEFAULT 80,
        next_flush_percent REAL NOT NULL DEFAULT 95,
        last_event_at INTEGER,
        last_flush_at INTEGER,
        last_sync_at INTEGER,
        updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
        PRIMARY KEY (scope, agency_id, sub_account_id, feature_key, period_start)
      );

      -- Usage events (mirrors PostgreSQL UsageEvent + flush tracking)
      CREATE TABLE IF NOT EXISTS usage_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        scope TEXT NOT NULL CHECK(scope IN ('AGENCY', 'SUBACCOUNT')),
        agency_id TEXT NOT NULL,
        sub_account_id TEXT,
        feature_key TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        action_key TEXT,
        idempotency_key TEXT NOT NULL UNIQUE,
        created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
        synced INTEGER NOT NULL DEFAULT 0,
        pg_event_id TEXT
      );

      -- Legacy feature_quotas table (deprecated, kept for migration)
      CREATE TABLE IF NOT EXISTS feature_quotas (
        scope_key TEXT NOT NULL,
        feature_key TEXT NOT NULL,
        flushed_usage INTEGER NOT NULL DEFAULT 0,
        unflushed_delta INTEGER NOT NULL DEFAULT 0,
        max_limit INTEGER NOT NULL DEFAULT 0,
        is_unlimited INTEGER NOT NULL DEFAULT 0,
        flush_at_percent REAL NOT NULL DEFAULT 80,
        next_flush_percent REAL NOT NULL DEFAULT 95,
        last_flush_at INTEGER,
        last_sync_at INTEGER,
        updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
        PRIMARY KEY (scope_key, feature_key)
      );

      -- Flush history for audit/debugging
      CREATE TABLE IF NOT EXISTS flush_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        trigger TEXT NOT NULL,
        events_flushed INTEGER NOT NULL,
        quotas_updated INTEGER NOT NULL,
        duration_ms INTEGER NOT NULL,
        success INTEGER NOT NULL,
        error_message TEXT,
        created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
      );

      -- Indexes for common queries
      CREATE INDEX IF NOT EXISTS idx_usage_events_unsynced ON usage_events(synced) WHERE synced = 0;
      CREATE INDEX IF NOT EXISTS idx_usage_events_scope ON usage_events(scope, agency_id, sub_account_id);
      CREATE INDEX IF NOT EXISTS idx_usage_tracking_agency ON usage_tracking(agency_id);
      CREATE INDEX IF NOT EXISTS idx_usage_tracking_scope ON usage_tracking(scope, agency_id);
    `)

    // Migrate from old schema
    this.migrateSchema()

    this.initialized = true
    return this.db
  }

  /**
   * Migrate from old feature_quotas schema to new usage_tracking schema
   */
  private migrateSchema(): void {
    if (!this.db) return

    // Check if old table has data that needs migration
    const oldRows = this.db.prepare(`
      SELECT * FROM feature_quotas
    `).all() as Array<{
      scope_key: string
      feature_key: string
      flushed_usage: number
      unflushed_delta: number
      max_limit: number
      is_unlimited: number
      flush_at_percent: number
      next_flush_percent: number
      last_flush_at: number | null
      last_sync_at: number | null
    }>

    if (oldRows.length === 0) return

    // Migrate each row to new schema
    const now = Date.now()
    const { periodStart, periodEnd } = getUsageWindow('MONTHLY')

    const insertStmt = this.db.prepare(`
      INSERT OR IGNORE INTO usage_tracking (
        scope, agency_id, sub_account_id, feature_key, period, period_start, period_end,
        flushed_usage, unflushed_delta, max_limit, is_unlimited,
        flush_at_percent, next_flush_percent, last_flush_at, last_sync_at, updated_at
      ) VALUES (?, ?, ?, ?, 'MONTHLY', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)

    for (const row of oldRows) {
      const { scope, agencyId, subAccountId } = parseScopeKey(row.scope_key)
      insertStmt.run(
        scope,
        agencyId,
        subAccountId,
        row.feature_key,
        periodStart.getTime(),
        periodEnd.getTime(),
        row.flushed_usage,
        row.unflushed_delta,
        row.max_limit,
        row.is_unlimited,
        row.flush_at_percent,
        row.next_flush_percent,
        row.last_flush_at,
        row.last_sync_at,
        now
      )
    }
  }

  /**
   * Build UsageInfo from tracking row (helper to reduce duplication)
   */
  private buildUsageInfo(row: {
    scope: string
    agency_id: string
    sub_account_id: string | null
    feature_key: string
    period: string
    period_start: number
    period_end: number
    flushed_usage: number
    unflushed_delta: number
    max_limit: number
    is_unlimited: number
    flush_at_percent: number
    next_flush_percent: number
    last_event_at: number | null
    last_flush_at: number | null
    last_sync_at: number | null
  }): UsageInfo {
    const config = getFlushConfigForFeature(row.feature_key)
    const isUnlimited = row.is_unlimited === 1
    const total = row.flushed_usage + row.unflushed_delta
    const usagePercent = isUnlimited || row.max_limit === 0
      ? 0
      : (total / row.max_limit) * 100

    const { shouldFlush: needsFlush, priority } = shouldFlush(usagePercent, {
      flushAtPercent: row.flush_at_percent || config.flushAtPercent,
      criticalPercent: row.next_flush_percent || config.criticalPercent,
    })

    return {
      scope: row.scope as MeteringScope,
      agencyId: row.agency_id,
      subAccountId: row.sub_account_id,
      featureKey: row.feature_key,
      period: row.period as UsagePeriod,
      periodStart: row.period_start,
      periodEnd: row.period_end,
      flushedUsage: row.flushed_usage,
      unflushedDelta: row.unflushed_delta,
      total,
      limit: row.max_limit,
      isUnlimited,
      usagePercent,
      flushAtPercent: row.flush_at_percent || config.flushAtPercent,
      nextFlushPercent: row.next_flush_percent || config.criticalPercent,
      needsFlush,
      flushPriority: priority,
      isValidFeature: isValidFeatureKey(row.feature_key),
      lastEventAt: row.last_event_at,
      lastSyncAt: row.last_sync_at,
      lastFlushAt: row.last_flush_at,
      // Legacy scopeKey for backward compat
      scopeKey: buildScopeKey(row.scope as MeteringScope, row.agency_id, row.sub_account_id),
    }
  }

  /**
   * Build empty UsageInfo for non-existent tracking
   */
  private buildEmptyUsageInfo(
    scope: MeteringScope,
    agencyId: string,
    subAccountId: string | null,
    featureKey: string,
    period: UsagePeriod = 'MONTHLY'
  ): UsageInfo {
    const config = getFlushConfigForFeature(featureKey)
    const { periodStart, periodEnd } = getUsageWindow(period)

    return {
      scope,
      agencyId,
      subAccountId,
      featureKey,
      period,
      periodStart: periodStart.getTime(),
      periodEnd: periodEnd.getTime(),
      flushedUsage: 0,
      unflushedDelta: 0,
      total: 0,
      limit: 0,
      isUnlimited: false,
      usagePercent: 0,
      flushAtPercent: config.flushAtPercent,
      nextFlushPercent: config.criticalPercent,
      needsFlush: false,
      flushPriority: 'normal',
      isValidFeature: isValidFeatureKey(featureKey),
      lastEventAt: null,
      lastSyncAt: null,
      lastFlushAt: null,
      scopeKey: buildScopeKey(scope, agencyId, subAccountId),
    }
  }

  /**
   * Track feature usage (instant write to SQLite)
   * Accepts both new TrackUsageInput style or legacy scopeKey+featureKey
   * 
   * @example New style (preferred):
   * ```ts
   * trackingBuffer.track({ scope: 'AGENCY', agencyId: '123', featureKey: 'fi.gl.entries', quantity: 1 })
   * ```
   * 
   * @example Legacy style (deprecated):
   * ```ts
   * trackingBuffer.trackUsage('agency:123', 'fi.gl.entries', 1)
   * ```
   */
  track(input: TrackUsageInput): UsageInfo {
    const db = this.init()
    const now = Date.now()
    const { periodStart, periodEnd } = getUsageWindow('MONTHLY')
    const idempotencyKey = `${input.agencyId}-${input.featureKey}-${now}-${randomUUID().slice(0, 8)}`

    // Insert event for flush audit trail (new schema)
    db.prepare(`
      INSERT INTO usage_events (
        scope, agency_id, sub_account_id, feature_key, quantity, action_key, idempotency_key, created_at, synced
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)
    `).run(
      input.scope,
      input.agencyId,
      input.subAccountId ?? null,
      input.featureKey,
      input.quantity ?? 1,
      input.actionKey ?? null,
      idempotencyKey,
      now
    )

    // Update unflushed_delta in usage_tracking (upsert)
    db.prepare(`
      INSERT INTO usage_tracking (
        scope, agency_id, sub_account_id, feature_key, period, period_start, period_end,
        unflushed_delta, last_event_at, updated_at
      )
      VALUES (?, ?, ?, ?, 'MONTHLY', ?, ?, ?, ?, ?)
      ON CONFLICT(scope, agency_id, sub_account_id, feature_key, period_start) DO UPDATE SET
        unflushed_delta = unflushed_delta + excluded.unflushed_delta,
        last_event_at = excluded.last_event_at,
        updated_at = excluded.updated_at
    `).run(
      input.scope,
      input.agencyId,
      input.subAccountId ?? null,
      input.featureKey,
      periodStart.getTime(),
      periodEnd.getTime(),
      input.quantity ?? 1,
      now,
      now
    )

    return this.getUsage(input.scope, input.agencyId, input.subAccountId ?? null, input.featureKey)
  }

  /**
   * @deprecated Use track() instead - legacy scopeKey wrapper
   */
  trackUsage(
    scopeKey: string,
    featureKey: string,
    delta: number = 1,
    metadata?: Record<string, unknown>
  ): UsageInfo {
    const { scope, agencyId, subAccountId } = parseScopeKey(scopeKey)
    return this.track({
      scope,
      agencyId,
      subAccountId,
      featureKey,
      quantity: delta,
      metadata,
    })
  }

  /**
   * Get full usage info for UI (single source - no PostgreSQL queries needed)
   * Returns: flushed, unflushed, total, limit, usage%, flush thresholds
   */
  getUsage(
    scope: MeteringScope,
    agencyId: string,
    subAccountId: string | null,
    featureKey: string,
    period: UsagePeriod = 'MONTHLY'
  ): UsageInfo {
    const db = this.init()
    const { periodStart } = getUsageWindow(period)

    const row = db.prepare(`
      SELECT * FROM usage_tracking 
      WHERE scope = ? AND agency_id = ? AND (sub_account_id = ? OR (sub_account_id IS NULL AND ? IS NULL))
        AND feature_key = ? AND period_start = ?
    `).get(scope, agencyId, subAccountId, subAccountId, featureKey, periodStart.getTime()) as {
      scope: string
      agency_id: string
      sub_account_id: string | null
      feature_key: string
      period: string
      period_start: number
      period_end: number
      flushed_usage: number
      unflushed_delta: number
      max_limit: number
      is_unlimited: number
      flush_at_percent: number
      next_flush_percent: number
      last_event_at: number | null
      last_flush_at: number | null
      last_sync_at: number | null
    } | undefined

    if (!row) {
      return this.buildEmptyUsageInfo(scope, agencyId, subAccountId, featureKey, period)
    }

    return this.buildUsageInfo(row)
  }

  /**
   * @deprecated Use getUsage() instead - legacy scopeKey wrapper
   */
  getUsageInfo(scopeKey: string, featureKey: string): UsageInfo {
    const { scope, agencyId, subAccountId } = parseScopeKey(scopeKey)
    return this.getUsage(scope, agencyId, subAccountId, featureKey)
  }

  /**
   * @deprecated Use getUsage instead - keeping for backward compat
   */
  getQuotaStatus(scopeKey: string, featureKey: string): QuotaInfo {
    const info = this.getUsageInfo(scopeKey, featureKey)
    return {
      scopeKey: info.scopeKey,
      featureKey: info.featureKey,
      maxLimit: info.limit,
      currentUsage: info.total,
      usagePercent: info.usagePercent,
      flushAtPercent: info.flushAtPercent,
      nextFlushPercent: info.nextFlushPercent,
      isUnlimited: info.isUnlimited,
      needsFlush: info.needsFlush,
      flushPriority: info.flushPriority,
      isValidFeature: info.isValidFeature,
    }
  }

  /**
   * Set quota limits (called when entitlements change)
   * Uses new PostgreSQL-aligned schema
   */
  setLimits(
    scope: MeteringScope,
    agencyId: string,
    subAccountId: string | null,
    featureKey: string,
    limits: {
      maxLimit: number
      isUnlimited?: boolean
      flushAtPercent?: number
      nextFlushPercent?: number
    },
    period: UsagePeriod = 'MONTHLY'
  ): void {
    const db = this.init()
    const config = getFlushConfigForFeature(featureKey)
    const now = Date.now()
    const { periodStart, periodEnd } = getUsageWindow(period)

    db.prepare(`
      INSERT INTO usage_tracking (
        scope, agency_id, sub_account_id, feature_key, period, period_start, period_end,
        max_limit, is_unlimited, flush_at_percent, next_flush_percent, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(scope, agency_id, sub_account_id, feature_key, period_start) DO UPDATE SET
        max_limit = excluded.max_limit,
        is_unlimited = excluded.is_unlimited,
        flush_at_percent = excluded.flush_at_percent,
        next_flush_percent = excluded.next_flush_percent,
        updated_at = excluded.updated_at
    `).run(
      scope,
      agencyId,
      subAccountId,
      featureKey,
      period,
      periodStart.getTime(),
      periodEnd.getTime(),
      limits.maxLimit,
      limits.isUnlimited ? 1 : 0,
      limits.flushAtPercent ?? config.flushAtPercent,
      limits.nextFlushPercent ?? config.criticalPercent,
      now
    )
  }

  /**
   * @deprecated Use setLimits() instead - legacy scopeKey wrapper
   */
  setQuotaLimits(
    scopeKey: string,
    featureKey: string,
    limits: {
      maxLimit: number
      isUnlimited?: boolean
      flushAtPercent?: number
      nextFlushPercent?: number
    }
  ): void {
    const { scope, agencyId, subAccountId } = parseScopeKey(scopeKey)
    this.setLimits(scope, agencyId, subAccountId, featureKey, limits)
  }

  /**
   * Get all usage info for an agency (batch read for UI)
   * Uses new PostgreSQL-aligned schema
   */
  getAllUsage(agencyId: string): UsageInfo[] {
    const db = this.init()
    
    const rows = db.prepare(`
      SELECT * FROM usage_tracking WHERE agency_id = ?
    `).all(agencyId) as Array<{
      scope: string
      agency_id: string
      sub_account_id: string | null
      feature_key: string
      period: string
      period_start: number
      period_end: number
      flushed_usage: number
      unflushed_delta: number
      max_limit: number
      is_unlimited: number
      flush_at_percent: number
      next_flush_percent: number
      last_event_at: number | null
      last_flush_at: number | null
      last_sync_at: number | null
    }>

    return rows.map(row => this.buildUsageInfo(row))
  }

  /**
   * @deprecated Use getAllUsage() instead - legacy scopeKey wrapper
   */
  getAllUsageInfo(scopeKey: string): UsageInfo[] {
    const { agencyId } = parseScopeKey(scopeKey)
    return this.getAllUsage(agencyId)
  }

  /**
   * @deprecated Use getAllUsage instead - keeping for backward compat
   */
  getAllQuotas(scopeKey: string): QuotaInfo[] {
    return this.getAllUsageInfo(scopeKey).map(info => ({
      scopeKey: info.scopeKey,
      featureKey: info.featureKey,
      maxLimit: info.limit,
      currentUsage: info.total,
      usagePercent: info.usagePercent,
      flushAtPercent: info.flushAtPercent,
      nextFlushPercent: info.nextFlushPercent,
      isUnlimited: info.isUnlimited,
      needsFlush: info.needsFlush,
      flushPriority: info.flushPriority,
      isValidFeature: info.isValidFeature,
    }))
  }

  /**
   * Get unsynced events for flush (new schema)
   */
  getUnsyncedEvents(limit: number = FLUSH_CONFIG.batchSize): BufferedUsageEvent[] {
    const db = this.init()
    
    const rows = db.prepare(`
      SELECT * FROM usage_events WHERE synced = 0 ORDER BY created_at ASC LIMIT ?
    `).all(limit) as Array<{
      id: number
      scope: string
      agency_id: string
      sub_account_id: string | null
      feature_key: string
      quantity: number
      action_key: string | null
      idempotency_key: string
      created_at: number
      synced: number
      pg_event_id: string | null
    }>

    return rows.map(row => ({
      id: row.id,
      scope: row.scope as MeteringScope,
      agencyId: row.agency_id,
      subAccountId: row.sub_account_id,
      featureKey: row.feature_key,
      quantity: row.quantity,
      actionKey: row.action_key,
      idempotencyKey: row.idempotency_key,
      createdAt: row.created_at,
      synced: row.synced === 1,
      pgEventId: row.pg_event_id,
    }))
  }

  /**
   * @deprecated Use getUnsyncedEvents() for new schema
   */
  getUnsyncedEventsLegacy(limit: number = FLUSH_CONFIG.batchSize): UsageEvent[] {
    const db = this.init()
    
    // Query legacy table if it exists
    const rows = db.prepare(`
      SELECT * FROM feature_quotas LIMIT 0
    `).all()
    
    // Return empty - legacy table should not be used
    return []
  }

  /**
   * Mark events as synced after successful PostgreSQL flush
   */
  markEventsSynced(eventIds: number[], pgEventIds?: (string | null)[]): void {
    if (eventIds.length === 0) return
    
    const db = this.init()
    const now = Date.now()

    if (pgEventIds && pgEventIds.length === eventIds.length) {
      // Update with PostgreSQL event IDs
      const stmt = db.prepare(`
        UPDATE usage_events SET synced = 1, pg_event_id = ? WHERE id = ?
      `)
      const batchUpdate = db.transaction((ids: number[], pgIds: (string | null)[]) => {
        for (let i = 0; i < ids.length; i++) {
          stmt.run(pgIds[i], ids[i])
        }
      })
      batchUpdate(eventIds, pgEventIds)
    } else {
      // Simple sync without PostgreSQL event IDs
      const placeholders = eventIds.map(() => '?').join(',')
      db.prepare(`
        UPDATE usage_events SET synced = 1 WHERE id IN (${placeholders})
      `).run(...eventIds)
    }
  }

  /**
   * Sync baseline from PostgreSQL (on login or after external changes)
   * Uses new PostgreSQL-aligned schema
   */
  syncFromPg(
    scope: MeteringScope,
    agencyId: string,
    subAccountId: string | null,
    featureKey: string,
    postgresUsage: number,
    postgresLimit: number,
    isUnlimited: boolean,
    period: UsagePeriod = 'MONTHLY'
  ): void {
    const db = this.init()
    const now = Date.now()
    const config = getFlushConfigForFeature(featureKey)
    const { periodStart, periodEnd } = getUsageWindow(period)

    db.prepare(`
      INSERT INTO usage_tracking (
        scope, agency_id, sub_account_id, feature_key, period, period_start, period_end,
        flushed_usage, unflushed_delta, max_limit, is_unlimited,
        flush_at_percent, next_flush_percent, last_sync_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(scope, agency_id, sub_account_id, feature_key, period_start) DO UPDATE SET
        flushed_usage = excluded.flushed_usage,
        unflushed_delta = 0,
        max_limit = excluded.max_limit,
        is_unlimited = excluded.is_unlimited,
        last_sync_at = excluded.last_sync_at,
        updated_at = excluded.updated_at
    `).run(
      scope,
      agencyId,
      subAccountId,
      featureKey,
      period,
      periodStart.getTime(),
      periodEnd.getTime(),
      postgresUsage,
      postgresLimit,
      isUnlimited ? 1 : 0,
      config.flushAtPercent,
      config.criticalPercent,
      now,
      now
    )
  }

  /**
   * @deprecated Use syncFromPg() instead - legacy scopeKey wrapper
   */
  syncFromPostgres(
    scopeKey: string,
    featureKey: string,
    postgresTotal: number,
    postgresLimit: number,
    isUnlimited: boolean
  ): void {
    const { scope, agencyId, subAccountId } = parseScopeKey(scopeKey)
    this.syncFromPg(scope, agencyId, subAccountId, featureKey, postgresTotal, postgresLimit, isUnlimited)
  }

  /**
   * @deprecated Use syncFromPostgres instead
   */
  syncQuotaFromPostgres(
    scopeKey: string,
    featureKey: string,
    postgresUsage: number,
    postgresLimit: number,
    isUnlimited: boolean
  ): void {
    this.syncFromPostgres(scopeKey, featureKey, postgresUsage, postgresLimit, isUnlimited)
  }

  /**
   * Complete flush: move unflushed_delta into flushed_usage
   * Uses new PostgreSQL-aligned schema
   */
  completeFlushNew(
    scope: MeteringScope,
    agencyId: string,
    subAccountId: string | null,
    featureKey: string,
    flushedDelta: number,
    period: UsagePeriod = 'MONTHLY'
  ): void {
    const db = this.init()
    const now = Date.now()
    const { periodStart } = getUsageWindow(period)

    db.prepare(`
      UPDATE usage_tracking 
      SET 
        flushed_usage = flushed_usage + ?,
        unflushed_delta = unflushed_delta - ?,
        last_flush_at = ?,
        updated_at = ?
      WHERE scope = ? AND agency_id = ? AND (sub_account_id = ? OR (sub_account_id IS NULL AND ? IS NULL))
        AND feature_key = ? AND period_start = ?
    `).run(flushedDelta, flushedDelta, now, now, scope, agencyId, subAccountId, subAccountId, featureKey, periodStart.getTime())
  }

  /**
   * @deprecated Use completeFlushNew() - legacy scopeKey wrapper
   */
  completeFlush(scopeKey: string, featureKey: string, flushedDelta: number): void {
    const { scope, agencyId, subAccountId } = parseScopeKey(scopeKey)
    this.completeFlushNew(scope, agencyId, subAccountId, featureKey, flushedDelta)
  }

  /**
   * Batch complete flush for multiple features
   * Uses new PostgreSQL-aligned schema
   */
  batchCompleteFlushNew(
    flushes: Array<{ 
      scope: MeteringScope
      agencyId: string
      subAccountId: string | null
      featureKey: string
      flushedDelta: number
      period?: UsagePeriod
    }>
  ): void {
    const db = this.init()
    const now = Date.now()

    const batchUpdate = db.transaction((items: typeof flushes) => {
      for (const item of items) {
        const { periodStart } = getUsageWindow(item.period || 'MONTHLY')
        db.prepare(`
          UPDATE usage_tracking 
          SET 
            flushed_usage = flushed_usage + ?,
            unflushed_delta = unflushed_delta - ?,
            last_flush_at = ?,
            updated_at = ?
          WHERE scope = ? AND agency_id = ? AND (sub_account_id = ? OR (sub_account_id IS NULL AND ? IS NULL))
            AND feature_key = ? AND period_start = ?
        `).run(
          item.flushedDelta, item.flushedDelta, now, now,
          item.scope, item.agencyId, item.subAccountId, item.subAccountId,
          item.featureKey, periodStart.getTime()
        )
      }
    })

    batchUpdate(flushes)
  }

  /**
   * @deprecated Use batchCompleteFlushNew() - legacy scopeKey wrapper
   */
  batchCompleteFlush(
    flushes: Array<{ scopeKey: string; featureKey: string; flushedDelta: number }>
  ): void {
    const newFlushes = flushes.map(f => {
      const { scope, agencyId, subAccountId } = parseScopeKey(f.scopeKey)
      return { scope, agencyId, subAccountId, featureKey: f.featureKey, flushedDelta: f.flushedDelta }
    })
    this.batchCompleteFlushNew(newFlushes)
  }

  /**
   * Log flush operation for audit
   */
  logFlush(result: FlushResult): void {
    const db = this.init()
    
    db.prepare(`
      INSERT INTO flush_log (trigger, events_flushed, quotas_updated, duration_ms, success, error_message)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      result.trigger,
      result.eventsFlushed,
      result.quotasUpdated,
      result.duration,
      result.success ? 1 : 0,
      result.errors?.join('; ') ?? null
    )
  }

  /**
   * Get features that need flushing based on thresholds
   * Uses new PostgreSQL-aligned schema
   */
  getFeaturesNeedingFlush(): UsageInfo[] {
    const db = this.init()
    
    const rows = db.prepare(`
      SELECT * FROM usage_tracking 
      WHERE is_unlimited = 0 
        AND max_limit > 0 
        AND ((flushed_usage + unflushed_delta) * 100.0 / max_limit) >= flush_at_percent
        AND unflushed_delta > 0
    `).all() as Array<{
      scope: string
      agency_id: string
      sub_account_id: string | null
      feature_key: string
      period: string
      period_start: number
      period_end: number
      flushed_usage: number
      unflushed_delta: number
      max_limit: number
      is_unlimited: number
      flush_at_percent: number
      next_flush_percent: number
      last_event_at: number | null
      last_flush_at: number | null
      last_sync_at: number | null
    }>

    return rows.map(row => this.buildUsageInfo(row))
  }

  /**
   * Get all features with unflushed data (for batch flush)
   * Uses new PostgreSQL-aligned schema
   */
  getFeaturesWithUnflushed(): UsageInfo[] {
    const db = this.init()
    
    const rows = db.prepare(`
      SELECT * FROM usage_tracking WHERE unflushed_delta > 0
    `).all() as Array<{
      scope: string
      agency_id: string
      sub_account_id: string | null
      feature_key: string
      period: string
      period_start: number
      period_end: number
      flushed_usage: number
      unflushed_delta: number
      max_limit: number
      is_unlimited: number
      flush_at_percent: number
      next_flush_percent: number
      last_event_at: number | null
      last_flush_at: number | null
      last_sync_at: number | null
    }>

    return rows.map(row => this.buildUsageInfo(row))
  }

  /**
   * Get buffer statistics
   */
  getStats(): {
    totalEvents: number
    unsyncedEvents: number
    totalQuotas: number
    quotasNeedingFlush: number
    totalUnflushedDelta: number
    lastFlush: { trigger: string; timestamp: number } | null
  } {
    const db = this.init()
    
    const eventStats = db.prepare(`
      SELECT COUNT(*) as total, SUM(CASE WHEN synced = 0 THEN 1 ELSE 0 END) as unsynced
      FROM usage_events
    `).get() as { total: number; unsynced: number }
    
    const quotaStats = db.prepare(`
      SELECT COUNT(*) as total, COALESCE(SUM(unflushed_delta), 0) as total_unflushed
      FROM usage_tracking
    `).get() as { total: number; total_unflushed: number }
    
    const needingFlush = db.prepare(`
      SELECT COUNT(*) as count
      FROM usage_tracking
      WHERE is_unlimited = 0
        AND max_limit > 0
        AND ((flushed_usage + unflushed_delta) * 100.0 / max_limit) >= flush_at_percent
        AND unflushed_delta > 0
    `).get() as { count: number }
    
    const lastFlush = db.prepare(`
      SELECT trigger, created_at FROM flush_log ORDER BY created_at DESC LIMIT 1
    `).get() as { trigger: string; created_at: number } | undefined

    return {
      totalEvents: eventStats.total,
      unsyncedEvents: eventStats.unsynced ?? 0,
      totalQuotas: quotaStats.total,
      quotasNeedingFlush: needingFlush.count,
      totalUnflushedDelta: quotaStats.total_unflushed,
      lastFlush: lastFlush ? { trigger: lastFlush.trigger, timestamp: lastFlush.created_at } : null,
    }
  }

  /**
   * Clean up old synced events (retention policy)
   */
  cleanupOldEvents(olderThanMs: number = 7 * 24 * 60 * 60 * 1000): number {
    const db = this.init()
    const cutoff = Date.now() - olderThanMs
    
    const result = db.prepare(`
      DELETE FROM usage_events WHERE synced = 1 AND created_at < ?
    `).run(cutoff)
    
    return result.changes
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Deprecated: Kept for backward compatibility with existing API
  // These now read from the simplified schema
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * @deprecated Use getUsageInfo().unflushedDelta instead
   * Get unflushed delta for a feature
   */
  getUnflushedDelta(scopeKey: string, featureKey: string): number {
    const info = this.getUsageInfo(scopeKey, featureKey)
    return info.unflushedDelta
  }

  /**
   * @deprecated Use getAllUsageInfo() and map to unflushedDelta instead
   * Get combined usage info (now just returns from simplified schema)
   */
  getCombinedUsageInfo(
    scopeKey: string,
    featureKey: string,
    _pgBaseline: number,  // Ignored - we use our flushed_usage
    _pgLimit: number,     // Ignored - we use our max_limit
    _pgIsUnlimited: boolean
  ): {
    pgBaseline: number
    sqliteDelta: number
    combined: number
    limit: number
    isUnlimited: boolean
    usagePercent: number
    needsFlush: boolean
    flushPriority: 'normal' | 'high' | 'critical'
    isValidFeature: boolean
  } {
    const info = this.getUsageInfo(scopeKey, featureKey)
    return {
      pgBaseline: info.flushedUsage,
      sqliteDelta: info.unflushedDelta,
      combined: info.total,
      limit: info.limit,
      isUnlimited: info.isUnlimited,
      usagePercent: info.usagePercent,
      needsFlush: info.needsFlush,
      flushPriority: info.flushPriority,
      isValidFeature: info.isValidFeature,
    }
  }

  /**
   * @deprecated Use getAllUsageInfo() instead
   * Get all unflushed deltas for a scope
   */
  getAllUnflushedDeltas(scopeKey: string): Map<string, number> {
    const infos = this.getAllUsageInfo(scopeKey)
    return new Map(infos.map(info => [info.featureKey as string, info.unflushedDelta]))
  }

  /**
   * Close database connection
   */
  close(): void {
    if (this.db) {
      this.db.close()
      this.db = null
      this.initialized = false
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Singleton Export
// ─────────────────────────────────────────────────────────────────────────────

export const trackingBuffer = new SmartTrackingBuffer()
