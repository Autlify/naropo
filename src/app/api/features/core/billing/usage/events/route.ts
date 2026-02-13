import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

import { auth } from '@/auth'
import { db } from '@/lib/db'
import type { MeteringScope, UsagePeriod } from '@/generated/prisma/client'
import { getUsageWindowWithOffset } from '@/lib/features/org/billing/usage/period'

export async function GET(req: NextRequest) {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return NextResponse.json({ ok: false, error: 'Unauthenticated' }, { status: 401 })

  const url = new URL(req.url)
  const agencyId = url.searchParams.get('agencyId')
  const subAccountId = url.searchParams.get('subAccountId')
  const featureKey = url.searchParams.get('featureKey')
  const scope: MeteringScope =
    (url.searchParams.get('scope') as MeteringScope) ?? (subAccountId ? 'SUBACCOUNT' : 'AGENCY')
  const period: UsagePeriod = (url.searchParams.get('period') as UsagePeriod) ?? 'MONTHLY'
  const periodsBack = Math.max(0, Math.floor(Number(url.searchParams.get('periodsBack') || 0)))

  if (!agencyId) return NextResponse.json({ ok: false, error: 'agencyId is required' }, { status: 400 })

  // Membership guard
  if (scope === 'SUBACCOUNT') {
    if (!subAccountId) return NextResponse.json({ ok: false, error: 'subAccountId is required' }, { status: 400 })
    const m = await db.subAccountMembership.findFirst({ where: { userId, subAccountId, isActive: true }, select: { id: true } })
    if (!m) return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 })
  } else {
    const m = await db.agencyMembership.findFirst({ where: { userId, agencyId, isActive: true }, select: { id: true } })
    if (!m) return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 })
  }

  const window = getUsageWindowWithOffset(period, periodsBack)

  const events = await db.usageEvent.findMany({
    where: {
      scope,
      agencyId,
      subAccountId: subAccountId ?? '',
      ...(featureKey ? { featureKey } : {}),
      createdAt: {
        gte: window.periodStart,
        lt: window.periodEnd,
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 250,
  })

  return NextResponse.json({
    ok: true,
    window: { periodStart: window.periodStart.toISOString(), periodEnd: window.periodEnd.toISOString() },
    events: events.map((e) => ({
      id: e.id,
      createdAt: e.createdAt.toISOString(),
      featureKey: e.featureKey,
      quantity: String(e.quantity),
      actionKey: e.actionKey,
      idempotencyKey: e.idempotencyKey,
    })),
  })
}
