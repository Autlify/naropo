import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

import { resolveEffectiveEntitlements } from '@/lib/features/org/billing/entitlements/resolve'
import { getUsageWindowWithOffset } from '@/lib/features/org/billing/usage/period'
import { db } from '@/lib/db'
import { withErrorHandler, requireAuth, guardMembership, parseBillingParams } from '@/lib/api'

const n = (v: any): number => {
  if (v == null) return 0
  const num = Number(v.toString?.() ?? v)
  return Number.isFinite(num) ? num : 0
}

export const GET = withErrorHandler(async (req: NextRequest) => {
  const session = await requireAuth()
  const userId = session.user.id

  const params = parseBillingParams(req)
  const url = new URL(req.url)
  const periodsBack = Math.max(0, Math.floor(Number(url.searchParams.get('periodsBack') || 0)))
  const period = (params.period ?? 'MONTHLY') as any

  if (!params.agencyId) {
    return NextResponse.json({ ok: false, error: 'agencyId is required' }, { status: 400 })
  }

  // Membership guard
  await guardMembership(userId, params.scope, params.agencyId, params.subAccountId ?? undefined)

  const window = getUsageWindowWithOffset(period, periodsBack)

  const entitlements = await resolveEffectiveEntitlements({
    scope: params.scope,
    agencyId: params.agencyId,
    subAccountId: params.subAccountId ?? null,
  })

  const rows = await db.usageTracking.findMany({
    where: {
      scope: params.scope,
      agencyId: params.agencyId,
      subAccountId: params.subAccountId ?? '',
      period,
      periodStart: window.periodStart,
      ...(params.featureKey ? { featureKey: params.featureKey } : {}),
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
    scope: params.scope,
    agencyId: params.agencyId,
    subAccountId: params.subAccountId ?? null,
    period,
    periodsBack,
    window: { periodStart: window.periodStart.toISOString(), periodEnd: window.periodEnd.toISOString() },
    rows: mapped,
  })
})
