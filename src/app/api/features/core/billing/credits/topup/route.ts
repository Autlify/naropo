import { NextResponse } from 'next/server'

import { auth } from '@/auth'
import { db } from '@/lib/db'
import type { MeteringScope } from '@/generated/prisma/client'
import { hasPermission } from '@/lib/features/iam/authz/permissions'
import { topupCredits } from '@/lib/features/org/billing/credits/grant'

export async function POST(req: Request) {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return NextResponse.json({ ok: false, error: 'Unauthenticated' }, { status: 401 })

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
  if (scope === 'SUBACCOUNT') {
    if (!subAccountId) return NextResponse.json({ ok: false, error: 'subAccountId is required' }, { status: 400 })
    const m = await db.subAccountMembership.findFirst({ where: { userId, subAccountId, isActive: true }, select: { id: true } })
    if (!m) return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 })
  } else {
    const m = await db.agencyMembership.findFirst({ where: { userId, agencyId, isActive: true }, select: { id: true } })
    if (!m) return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 })
  }

  await topupCredits({
    scope,
    agencyId,
    subAccountId,
    featureKey,
    credits,
    idempotencyKey,
  })

  return NextResponse.json({ ok: true })
}
