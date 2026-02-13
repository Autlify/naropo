/**
 * Track API Route (SQLite Buffer - PostgreSQL Aligned)
 * 
 * POST /api/features/core/billing/usage/track
 * Records feature usage events with zero-latency SQLite buffering.
 * Feature keys are validated against registry's ENTITLEMENT_FEATURES.
 * 
 * GET /api/features/core/billing/usage/track?featureKey=xxx
 * Returns full usage info from SQLite (single read source).
 * 
 * Context headers (preferred):
 * - x-autlify-agency-id: <agencyId>
 * - x-autlify-subaccount-id: <subAccountId> (optional)
 * 
 * Response schema:
 * { flushedUsage, unflushedDelta, total, limit, usagePercent, needsFlush, ... }
 * 
 * Permissions: org.billing.usage.track (or consume)
 */

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

import { requireRequestAccess, ApiAuthzError } from '@/lib/features/iam/authz/require'
import { logger } from '@/lib/logger'
import type { MeteringScope } from '@/generated/prisma/client'
import { trackingBuffer, checkAndFlushThresholds, isValidFeatureKey } from '@/lib/core/tracking'

// ─────────────────────────────────────────────────────────────────────────────
// POST: Track usage event (SQLite buffer)
// ─────────────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const { scope } = await requireRequestAccess({
      req,
      requiredKeys: ['org.billing.usage.consume'], // Reuse consume permission
      requireActiveSubscription: true,
    })

    const agencyId = scope.kind === 'agency' ? scope.agencyId : scope.agencyId
    const subAccountId = scope.kind === 'subaccount' ? scope.subAccountId : null
    const meteringScope: MeteringScope = scope.kind === 'subaccount' ? 'SUBACCOUNT' : 'AGENCY'

    const body = await req.json().catch(() => null)
    if (!body?.featureKey) {
      return NextResponse.json({ ok: false, reason: 'BAD_REQUEST' }, { status: 400 })
    }

    const featureKey: string = body.featureKey
    const quantityRaw = body.quantity ?? 1
    const quantity = Number(quantityRaw)
    const actionKey: string | null = body.actionKey ?? null

    // Validate feature key against registry SSoT
    if (!isValidFeatureKey(featureKey)) {
      return NextResponse.json(
        { ok: false, reason: 'INVALID_FEATURE_KEY', message: `Feature key '${featureKey}' not found in registry` },
        { status: 400 }
      )
    }

    if (!Number.isFinite(quantity) || quantity <= 0) {
      return NextResponse.json({ ok: false, reason: 'INVALID_QUANTITY' }, { status: 400 })
    }

    // Track usage using new PostgreSQL-aligned schema
    const usage = trackingBuffer.track({
      scope: meteringScope,
      agencyId,
      subAccountId,
      featureKey,
      quantity,
      actionKey,
    })

    // Check if threshold flush needed (async, don't block response)
    if (usage.needsFlush) {
      checkAndFlushThresholds().catch(err => {
        logger.error('Background flush failed', { error: err })
      })
    }

    return NextResponse.json({ ok: true, usage })
  } catch (error) {
    if (error instanceof ApiAuthzError) {
      return NextResponse.json(
        { ok: false, reason: error.code, message: error.message },
        { status: error.status }
      )
    }
    logger.error('Error tracking usage', { error })
    return NextResponse.json(
      { ok: false, reason: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// GET: Get usage info from SQLite buffer (single read source)
// ─────────────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const { scope } = await requireRequestAccess({
      req,
      requiredKeys: ['org.billing.usage.view'],
      requireActiveSubscription: false, // Allow viewing even without active subscription
    })

    const agencyId = scope.kind === 'agency' ? scope.agencyId : scope.agencyId
    const subAccountId = scope.kind === 'subaccount' ? scope.subAccountId : null
    const meteringScope: MeteringScope = scope.kind === 'subaccount' ? 'SUBACCOUNT' : 'AGENCY'

    const { searchParams } = req.nextUrl
    const featureKey = searchParams.get('featureKey')

    // Single feature usage info
    if (featureKey) {
      if (!isValidFeatureKey(featureKey)) {
        return NextResponse.json(
          { ok: false, reason: 'INVALID_FEATURE_KEY', message: `Feature key '${featureKey}' not found in registry` },
          { status: 400 }
        )
      }

      const usage = trackingBuffer.getUsage(meteringScope, agencyId, subAccountId, featureKey)
      return NextResponse.json({ ok: true, usage })
    }

    // All usage info for the agency
    const usages = trackingBuffer.getAllUsage(agencyId)
    return NextResponse.json({ ok: true, usages })
  } catch (error) {
    if (error instanceof ApiAuthzError) {
      return NextResponse.json(
        { ok: false, reason: error.code, message: error.message },
        { status: error.status }
      )
    }
    logger.error('Error getting usage', { error })
    return NextResponse.json(
      { ok: false, reason: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}
