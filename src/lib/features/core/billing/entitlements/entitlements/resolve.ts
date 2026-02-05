import 'server-only'

import { db } from '@/lib/db'
import type { EntitlementFeature, PlanFeature } from '@/generated/prisma/client'
import type { MeteringScope } from '@/generated/prisma/client'
import type { EffectiveEntitlement, ResolveEntitlementsArgs } from '@/lib/features/core/billing/entitlements/types'
import { normalizeEntitlement } from '@/lib/features/core/billing/entitlements/normalize'

const ACTIVE_STATUSES = new Set(['ACTIVE', 'TRIALING'] as const)


const ENV_INHERIT_AGENCY = process.env.ENTITLEMENTS_SUBACCOUNT_INHERIT_AGENCY !== 'false'

async function resolveInheritAgencyEntitlements(args: ResolveEntitlementsArgs): Promise<boolean> {
  if (args.scope !== ('SUBACCOUNT' as any)) return false
  if (args.inheritAgencyEntitlements != null) return !!args.inheritAgencyEntitlements

  // Optional per-subaccount override
  if (args.subAccountId) {
    const sub = await db.subAccountSettings.findUnique({
      where: { subAccountId: args.subAccountId },
      select: { entitlementsInheritFromAgency: true },
    })
    if (sub?.entitlementsInheritFromAgency != null) return !!sub.entitlementsInheritFromAgency
  }

  const agency = await db.agencySettings.findUnique({
    where: { agencyId: args.agencyId },
    select: { entitlementsInheritToSubaccounts: true },
  })
  return agency?.entitlementsInheritToSubaccounts ?? ENV_INHERIT_AGENCY
}

export async function resolvePlanIdForAgency(agencyId: string, now: Date = new Date()): Promise<string | null> {
  const sub = await db.subscription.findFirst({
    where: {
      agencyId,
      status: { in: Array.from(ACTIVE_STATUSES) as any },
      currentPeriodEndDate: { gt: now },
    },
    select: { priceId: true },
  })
  return sub?.priceId ?? null
}

/**
 * Resolve all active plan IDs for an agency.
 * - base subscription (Stripe recurring priceId)
 * - active add-ons (stored in AddOns table)
 */
export async function resolvePlanIdsForAgency(agencyId: string, now: Date = new Date()): Promise<string[]> {
  const base = await resolvePlanIdForAgency(agencyId, now)
  const addons = await db.addOns.findMany({
    where: { agencyId, active: true },
    select: { priceId: true },
  })

  const planIds = [base, ...addons.map((a) => a.priceId)].filter(Boolean) as string[]
  // Deduplicate while preserving order
  return Array.from(new Set(planIds))
}

type PlanFeatureWithMeta = PlanFeature & { EntitlementFeature: EntitlementFeature }

function sumInt(a: number | null | undefined, b: number | null | undefined): number | null {
  const x = a ?? null
  const y = b ?? null
  if (x == null && y == null) return null
  return (x ?? 0) + (y ?? 0)
}

function sumDec(a: any, b: any): any {
  if (a == null && b == null) return null
  if (a == null) return b
  if (b == null) return a
  // Prisma Decimal supports plus()
  return (a as any).plus?.(b) ?? a
}

/**
 * Merge multiple PlanFeature rows for the same featureKey across base plan + add-ons.
 * Goal: represent the *effective* plan limit before EntitlementOverride is applied.
 */
function mergePlanFeatures(features: PlanFeatureWithMeta[]): PlanFeatureWithMeta {
  const first = features[0]
  if (!first) {
    throw new Error('mergePlanFeatures called with empty list')
  }

  const merged: PlanFeatureWithMeta = {
    ...first,
    // Merge enablement / limits
    isEnabled: features.some((f) => f.isEnabled),
    isUnlimited: features.some((f) => f.isUnlimited),
    includedInt: features.reduce((acc, f) => sumInt(acc, f.includedInt), null as number | null),
    maxInt: features.reduce((acc, f) => sumInt(acc, f.maxInt), null as number | null),
    includedDec: features.reduce((acc, f) => sumDec(acc, f.includedDec), null as any),
    maxDec: features.reduce((acc, f) => sumDec(acc, f.maxDec), null as any),

    // Merge credits/topups (conservative defaults)
    recurringCreditGrantInt: features.reduce((acc, f) => sumInt(acc, f.recurringCreditGrantInt), null as number | null),
    recurringCreditGrantDec: features.reduce((acc, f) => sumDec(acc, f.recurringCreditGrantDec), null as any),
    rolloverCredits: features.some((f) => f.rolloverCredits),
    topUpEnabled: features.some((f) => f.topUpEnabled),
    topUpPriceId: features.find((f) => f.topUpPriceId)?.topUpPriceId ?? first.topUpPriceId,

    // Enforcement/overage: keep the most restrictive shape if they differ.
    enforcement: features.some((f) => f.enforcement === 'HARD') ? ('HARD' as any) : first.enforcement,
    overageMode: first.overageMode,
    overageFee: first.overageFee,
    stripeOveragePriceId: first.stripeOveragePriceId,
  }

  return merged
}

export async function resolveEffectiveEntitlements(args: ResolveEntitlementsArgs): Promise<Record<string, EffectiveEntitlement>> {
  const now = args.now ?? new Date()
  const overridePlanId = (args.planId as any) as string | null | undefined
  const planIds = overridePlanId ? [overridePlanId] : await resolvePlanIdsForAgency(args.agencyId, now)
  if (!planIds.length) return {}

  const planFeaturesRaw = await db.planFeature.findMany({
    where: { planId: { in: planIds } },
    include: { EntitlementFeature: true },
  })

  // Merge plan features across planIds by featureKey (base + add-ons)
  const byKey = new Map<string, PlanFeatureWithMeta[]>()
  for (const pf of planFeaturesRaw) {
    const arr = byKey.get(pf.featureKey) ?? []
    arr.push(pf)
    byKey.set(pf.featureKey, arr)
  }
  const planFeatures: PlanFeatureWithMeta[] = []
  for (const [, list] of byKey) {
    planFeatures.push(list.length === 1 ? list[0] : mergePlanFeatures(list))
  }


const inheritAgency = await resolveInheritAgencyEntitlements(args)

// Fetch overrides: optionally include agency-level overrides when resolving in subaccount scope.
const overridesAgency = inheritAgency
  ? await db.entitlementOverride.findMany({
      where: {
        scope: 'AGENCY' as any,
        agencyId: args.agencyId,
        subAccountId: null,
        startsAt: { lte: now },
        OR: [{ endsAt: null }, { endsAt: { gte: now } }],
      },
    })
  : []

const overridesSub = await db.entitlementOverride.findMany({
  where: {
    scope: args.scope,
    agencyId: args.agencyId,
    subAccountId: args.subAccountId || null,
    startsAt: { lte: now },
    OR: [{ endsAt: null }, { endsAt: { gte: now } }],
  },
})

const overrides = [...overridesAgency, ...overridesSub]
const overrideMap = new Map<string, typeof overrides[number]>()
// Agency overrides first, then subaccount overrides (subaccount wins)
for (const o of overridesAgency) overrideMap.set(o.featureKey, o)
for (const o of overridesSub) overrideMap.set(o.featureKey, o)

  const out: Record<string, EffectiveEntitlement> = {}
  for (const pf of planFeatures) {
    out[pf.featureKey as string] = normalizeEntitlement(pf, overrideMap.get(pf.featureKey) || null)
  }

  // Overrides can exist for keys not present in the plan. Keep them visible (disabled by default).
  for (const o of overrides) {
    if (out[o.featureKey]) continue
    const f = await db.entitlementFeature.findUnique({ where: { key: o.featureKey } })
    if (!f) continue
    out[o.featureKey] = {
      featureKey: f.key,
      name: f.name,
      category: f.category,
      description: f.description,
      valueType: f.valueType,
      unit: f.unit,
      metering: f.metering,
      aggregation: f.aggregation,
      scope: f.scope,
      period: f.period,
      isEnabled: o.isEnabled ?? false,
      isUnlimited: o.isUnlimited ?? false,
      includedInt: 0,
      maxInt: o.maxOverrideInt ?? o.maxDeltaInt ?? null,
      includedDec: '0',
      maxDec: o.maxOverrideDec ? o.maxOverrideDec.toString() : o.maxDeltaDec ? o.maxDeltaDec.toString() : null,
      enforcement: 'HARD' as any,
      overageMode: 'NONE' as any,
      creditEnabled: f.creditEnabled,
      creditUnit: f.creditUnit ?? null,
      creditExpires: f.creditExpires,
      creditPriority: f.creditPriority,
      recurringCreditGrantInt: null,
      recurringCreditGrantDec: null,
      rolloverCredits: false,
      topUpEnabled: false,
      topUpPriceId: null,
    }
  }

  return out
}

export function inferScopeFromIds(subAccountId?: string | null): MeteringScope {
  return subAccountId ? ('SUBACCOUNT' as any) : ('AGENCY' as any)
}
