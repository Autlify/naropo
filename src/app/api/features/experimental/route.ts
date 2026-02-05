import { NextResponse } from 'next/server'
import { requireRequestAccess, ApiAuthzError } from '@/lib/features/iam/authz/require'
import { logger } from '@/lib/logger'
import { db } from '@/lib/db'
import { resolveEffectiveEntitlements, inferScopeFromIds } from '@/lib/features/core/billing/entitlements/resolve'

/**
 * POST /api/features/toggle
 * Toggle a feature for the authenticated user
 * 
 * Headers Required:
 * - x-autlify-agency: <agencyId>
 * - x-autlify-subaccount: <subAccountId> (optional)
 * 
 * Permissions: core.experimental.flag.toggle
 */
export async function POST(request: Request) {
  try {
    const { scope, principal } = await requireRequestAccess({
      req: request,
      requiredKeys: ['core.experimental.flag.toggle'],
      requireActiveSubscription: true,
    })

    const userId = principal.kind === 'user' 
      ? principal.userId 
      : principal.ownerUserId
    const agencyId = scope.kind === 'agency' ? scope.agencyId : scope.agencyId
    const subAccountId = scope.kind === 'subaccount' ? scope.subAccountId : null
    const meteringScope = inferScopeFromIds(subAccountId)

    const { featureKey, enabled } = await request.json()
    
    if (!featureKey || typeof enabled !== 'boolean') {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      )
    }

    // Check if feature is toggleable
    const feature = await db.entitlementFeature.findUnique({
      where: { key: featureKey },
    })
    
    if (!feature) {
      return NextResponse.json(
        { error: 'Feature not found' },
        { status: 404 }
      )
    }
    
    if (!feature.isToggleable) {
      return NextResponse.json(
        { error: 'Feature cannot be toggled by users' },
        { status: 403 }
      )
    }
    
    // Check if feature is enabled by admin/plan
    const entitlements = await resolveEffectiveEntitlements({
      agencyId,
      subAccountId,
      scope: meteringScope,
    })
    
    const ent = entitlements[featureKey]
    if (!ent || !ent.isEnabled) {
      return NextResponse.json(
        { error: 'Feature not available in current plan' },
        { status: 403 }
      )
    }
    
    // Upsert user preference
    await db.featurePreference.upsert({
      where: {
        userId_scope_agencyId_subAccountId_featureKey: {
          userId,
          scope: meteringScope,
          agencyId,
          subAccountId: subAccountId ?? '',
          featureKey,
        },
      },
      update: { isEnabled: enabled },
      create: {
        userId,
        scope: meteringScope,
        agencyId,
        subAccountId: subAccountId ?? '',
        featureKey,
        isEnabled: enabled,
      },
    })

    logger.info('Feature toggled', { featureKey, enabled, userId, agencyId })
    
    return NextResponse.json({ success: true })
    
  } catch (error) {
    if (error instanceof ApiAuthzError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      )
    }
    logger.error('Error toggling feature', { error })
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
