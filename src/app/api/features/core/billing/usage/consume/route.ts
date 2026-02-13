import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

import { requireRequestAccess, ApiAuthzError } from '@/lib/features/iam/authz/require'
import { logger } from '@/lib/logger'
import type { MeteringScope } from '@/generated/prisma/client'
import { consumeUsage } from '@/lib/features/org/billing/usage/consume'

/**
 * POST /api/features/core/billing/usage/consume
 * Consume usage for a feature
 * 
 * Context headers (preferred):
 * - x-autlify-agency-id: <agencyId>
 * - x-autlify-subaccount-id: <subAccountId> (optional)
 *
 * Legacy aliases also accepted:
 * - x-autlify-agency
 * - x-autlify-subaccount
 * 
 * Permissions: core.billing.usage.consume
 */
export async function POST(req: NextRequest) {
  try {
    const { scope } = await requireRequestAccess({
      req,
      requiredKeys: ['org.billing.usage.consume'],
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
    const idempotencyKey: string | undefined = body.idempotencyKey
    const actionKey: string | null = body.actionKey ?? null

    if (!idempotencyKey) {
      return NextResponse.json({ ok: false, reason: 'MISSING_IDEMPOTENCY_KEY' }, { status: 400 })
    }
    if (!Number.isFinite(quantity) || quantity <= 0) {
      return NextResponse.json({ ok: false, reason: 'INVALID_QUANTITY' }, { status: 400 })
    }

    const result = await consumeUsage({
      scope: meteringScope,
      agencyId,
      subAccountId,
      featureKey,
      quantity,
      actionKey,
      idempotencyKey,
    })

    return NextResponse.json({ ok: true, result })
  } catch (error) {
    if (error instanceof ApiAuthzError) {
      return NextResponse.json(
        { ok: false, reason: error.code, message: error.message },
        { status: error.status }
      )
    }
    logger.error('Error consuming usage', { error })
    return NextResponse.json(
      { ok: false, reason: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}
