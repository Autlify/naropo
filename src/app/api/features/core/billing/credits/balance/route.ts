import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

import { requireRequestAccess, ApiAuthzError } from '@/lib/features/iam/authz/require'
import { logger } from '@/lib/logger'
import { db } from '@/lib/db'
import type { MeteringScope } from '@/generated/prisma/client'

/**
 * GET /api/features/core/billing/credits/balance
 * Get credit balances for features
 * 
 * Context headers (preferred):
 * - x-autlify-agency-id: <agencyId>
 * - x-autlify-subaccount-id: <subAccountId> (optional)
 *
 * Legacy aliases also accepted:
 * - x-autlify-agency
 * - x-autlify-subaccount
 * 
 * Query Parameters:
 * - featureKey (optional): Filter by specific feature
 * 
 * Permissions: core.billing.credits.view
 */
export async function GET(req: NextRequest) {
  try {
    const { scope } = await requireRequestAccess({
      req,
      requiredKeys: ['org.billing.credits.view'],
      requireActiveSubscription: false, // Can check credits even without active subscription
    })

    const agencyId = scope.kind === 'agency' ? scope.agencyId : scope.agencyId
    const subAccountId = scope.kind === 'subaccount' ? scope.subAccountId : null
    const meteringScope: MeteringScope = scope.kind === 'subaccount' ? 'SUBACCOUNT' : 'AGENCY'

    const url = new URL(req.url)
    const featureKey = url.searchParams.get('featureKey')

    const where = {
      scope: meteringScope,
      agencyId,
      subAccountId: subAccountId ?? null,
      ...(featureKey ? { featureKey } : {}),
    }

    const rows = await db.featureCreditBalance.findMany({
      where,
      orderBy: { featureKey: 'asc' },
    })

    // Filter out expired balances
    const now = new Date()
    const balances = rows
      .filter((b) => !b.expiresAt || b.expiresAt > now)
      .map((b) => ({
        ...b,
        balance: b.balance.toString(),
      }))

    return NextResponse.json({ ok: true, balances })
  } catch (error) {
    if (error instanceof ApiAuthzError) {
      return NextResponse.json(
        { ok: false, reason: error.code, message: error.message },
        { status: error.status }
      )
    }
    logger.error('Error fetching credit balances', { error })
    return NextResponse.json(
      { ok: false, reason: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}
