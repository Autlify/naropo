/**
 * Tracking API Route (DEPRECATED)
 * 
 * This endpoint is deprecated. Use /api/features/core/billing/usage/track instead.
 * 
 * POST /api/track → POST /api/features/core/billing/usage/track
 * GET /api/track → GET /api/features/core/billing/usage/track
 * 
 * This route remains for backward compatibility and will proxy to the new location.
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { trackingBuffer, checkAndFlushThresholds, parseScopeKey } from '@/lib/core/tracking'
import { isValidFeatureKey } from '@/lib/core/tracking/flush-config'

// ─────────────────────────────────────────────────────────────────────────────
// POST: Track usage event (DEPRECATED - use /api/features/core/billing/usage/track)
// ─────────────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { scopeKey, featureKey, delta = 1, metadata } = body

    if (!scopeKey || !featureKey) {
      return NextResponse.json(
        { error: 'Missing scopeKey or featureKey' },
        { status: 400 }
      )
    }

    // Validate feature key against registry SSoT
    if (!isValidFeatureKey(featureKey)) {
      return NextResponse.json(
        { error: `Invalid featureKey: '${featureKey}' not found in registry` },
        { status: 400 }
      )
    }

    // Parse scopeKey and use new track() method
    const { scope, agencyId, subAccountId } = parseScopeKey(scopeKey)
    const usage = trackingBuffer.track({
      scope,
      agencyId,
      subAccountId,
      featureKey,
      quantity: delta,
      metadata,
    })

    // Check if threshold flush needed (async, don't block response)
    if (usage.needsFlush) {
      checkAndFlushThresholds().catch(console.error)
    }

    return NextResponse.json({
      success: true,
      usage,
    })
  } catch (error) {
    console.error('[track] Error tracking usage:', error)
    return NextResponse.json(
      { error: 'Failed to track usage' },
      { status: 500 }
    )
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// GET: Get usage info (DEPRECATED - use /api/features/core/billing/usage/track)
// ─────────────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = req.nextUrl
  const scopeKey = searchParams.get('scopeKey')
  const featureKey = searchParams.get('featureKey')

  if (!scopeKey) {
    return NextResponse.json(
      { error: 'Missing scopeKey' },
      { status: 400 }
    )
  }

  try {
    // Parse scopeKey
    const { scope, agencyId, subAccountId } = parseScopeKey(scopeKey)

    // Single feature usage info
    if (featureKey) {
      if (!isValidFeatureKey(featureKey)) {
        return NextResponse.json(
          { error: `Invalid featureKey: '${featureKey}' not found in registry` },
          { status: 400 }
        )
      }
      
      const usage = trackingBuffer.getUsage(scope, agencyId, subAccountId, featureKey)
      return NextResponse.json({ usage })
    }

    // All usage info for agency
    const usages = trackingBuffer.getAllUsage(agencyId)
    return NextResponse.json({ usages })
  } catch (error) {
    console.error('[track] Error getting usage:', error)
    return NextResponse.json(
      { error: 'Failed to get usage' },
      { status: 500 }
    )
  }
}
