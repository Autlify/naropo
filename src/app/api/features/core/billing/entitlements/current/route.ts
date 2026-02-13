import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

import { requireRequestAccess, ApiAuthzError } from '@/lib/features/iam/authz/require'
import { logger } from '@/lib/logger'
import type { MeteringScope } from '@/generated/prisma/client'
import { getAgencySubscriptionState } from '@/lib/features/iam/authz/resolver'
import { resolveEffectiveEntitlements } from '@/lib/features/org/billing/entitlements/resolve'

/**
 * GET /api/features/core/billing/entitlements/current
 * Get current effective entitlements for the context
 * 
 * Context headers (preferred):
 * - x-autlify-agency-id: <agencyId>
 * - x-autlify-subaccount-id: <subAccountId> (optional)
 *
 * Legacy aliases also accepted:
 * - x-autlify-agency
 * - x-autlify-subaccount
 * 
 * Permissions: core.billing.entitlements.view
 */
export async function GET(req: NextRequest) {
  try {
    const { scope } = await requireRequestAccess({
      req,
      requiredKeys: ['org.billing.entitlements.view'],
      requireActiveSubscription: true,
    })

    const agencyId = scope.kind === 'agency' ? scope.agencyId : scope.agencyId
    const subAccountId = scope.kind === 'subaccount' ? scope.subAccountId : null
    const meteringScope: MeteringScope = scope.kind === 'subaccount' ? 'SUBACCOUNT' : 'AGENCY'

    const subscriptionState = await getAgencySubscriptionState(agencyId)
    const entitlements = await resolveEffectiveEntitlements({
      scope: meteringScope,
      agencyId,
      subAccountId,
    })

    return NextResponse.json({
      scope: meteringScope,
      agencyId,
      subAccountId,
      subscription: subscriptionState,
      entitlements,
    })
  } catch (error) {
    if (error instanceof ApiAuthzError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      )
    }
    logger.error('Error fetching entitlements', { error })
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
