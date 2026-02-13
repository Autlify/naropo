import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

import { auth } from '@/auth'
import { db } from '@/lib/db'
import type { MeteringScope, UsagePeriod } from '@/generated/prisma/client'
import { resolveEffectiveEntitlements } from '@/lib/features/org/billing/entitlements/resolve'
import { getUsageWindowWithOffset } from '@/lib/features/org/billing/usage/period'

const n = (v: any): number => {
  if (v == null) return 0
  const num = Number(v.toString?.() ?? v)
  return Number.isFinite(num) ? num : 0
}

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
  if (scope === 'SUBACCOUNT' && !subAccountId) {
    return NextResponse.json({ ok: false, error: 'subAccountId is required' }, { status: 400 })
  }

  // Membership guard - check both in parallel, then validate based on scope
  const [agencyMembership, subAccountMembership] = await Promise.all([
    db.agencyMembership.findFirst({ 
      where: { userId, agencyId, isActive: true }, 
      select: { id: true } 
    }),
    scope === 'SUBACCOUNT' && subAccountId
      ? db.subAccountMembership.findFirst({ 
          where: { userId, subAccountId, isActive: true }, 
          select: { id: true } 
        })
      : Promise.resolve(null),
  ])

  if (scope === 'SUBACCOUNT' && !subAccountMembership) {
    return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 })
  }
  if (scope === 'AGENCY' && !agencyMembership) {
    return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 })
  }

  const window = getUsageWindowWithOffset(period, periodsBack)

  const entitlements = await resolveEffectiveEntitlements({
    scope,
    agencyId,
    subAccountId: subAccountId ?? null,
  })

  const rows = await db.usageTracking.findMany({
    where: {
      scope,
      agencyId,
      subAccountId: subAccountId ?? '',
      period,
      periodStart: window.periodStart,
      ...(featureKey ? { featureKey } : {}),
    },
    select: {
      featureKey: true,
      currentUsage: true,
      period: true,
    },
    orderBy: { featureKey: 'asc' },
  })

  const mapped = rows.map((r) => {
    const ent = (entitlements as any)?.[r.featureKey]
    const maxAllowed = ent?.isUnlimited
      ? null
      : ent?.maxInt != null
        ? String(ent.maxInt)
        : ent?.maxDec != null
          ? String(ent.maxDec)
          : null

    return {
      featureKey: r.featureKey,
      currentUsage: String(r.currentUsage),
      isUnlimited: Boolean(ent?.isUnlimited),
      maxAllowed,
      period: r.period,
    }
  })

  return NextResponse.json({
    ok: true,
    scope,
    agencyId,
    subAccountId: subAccountId ?? null,
    period,
    periodsBack,
    window: { periodStart: window.periodStart.toISOString(), periodEnd: window.periodEnd.toISOString() },
    rows: mapped,
  })
}
