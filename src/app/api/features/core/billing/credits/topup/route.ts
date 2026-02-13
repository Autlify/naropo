import { NextResponse } from 'next/server'

import { hasPermission } from '@/lib/features/iam/authz/permissions'
import { topupCredits } from '@/lib/features/org/billing/credits/grant'
import { withErrorHandler, requireAuth, guardMembership } from '@/lib/api'
import type { MeteringScope } from '@/generated/prisma/client'

export const POST = withErrorHandler(async (req: Request) => {
  const session = await requireAuth()
  const userId = session.user.id

  const body = await req.json().catch(() => ({}))
  const agencyId = String(body.agencyId || '')
  const featureKey = String(body.featureKey || '')
  const credits = Number(body.credits || 0)
  const subAccountId = body.subAccountId ? String(body.subAccountId) : null
  const scope: MeteringScope = (body.scope as MeteringScope) ?? (subAccountId ? 'SUBACCOUNT' : 'AGENCY')
  const idempotencyKey = String(body.idempotencyKey || `manual-topup:${agencyId}:${subAccountId ?? 'null'}:${featureKey}:${Date.now()}`)

  if (!agencyId || !featureKey || credits <= 0) {
    return NextResponse.json({ ok: false, error: 'agencyId, featureKey and credits are required' }, { status: 400 })
  }

  // Guard: billing manage
  const canBilling =
    (await hasPermission('org.billing.account.view')) ||
    (await hasPermission('org.billing.account.manage')) ||
    (await hasPermission('org.billing.account.manage'))
  if (!canBilling) return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 })

  // Membership guard
  await guardMembership(userId, scope, agencyId, subAccountId ?? undefined)

  await topupCredits({
    scope,
    agencyId,
    subAccountId,
    featureKey,
    credits,
    idempotencyKey,
  })

  return NextResponse.json({ ok: true })
})
