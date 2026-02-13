import 'server-only'

import { db } from '@/lib/db'
import type { EntitlementFeature, PlanFeature } from '@/generated/prisma/client'
import type { MeteringScope } from '@/generated/prisma/client'
import type { EffectiveEntitlement, ResolveEntitlementsArgs } from '@/lib/features/org/billing/entitlements/types'
import { normalizeEntitlement } from '@/lib/features/org/billing/entitlements/normalize'
import { readEntitlementSnapshot, writeEntitlementSnapshot } from '@/lib/features/org/billing/entitlements/snapshot'

const ACTIVE_STATUSES = new Set(['ACTIVE', 'TRIALING'] as const)
const ENV_INHERIT_AGENCY = process.env.ENTITLEMENTS_SUBACCOUNT_INHERIT_AGENCY !== 'false'

type PlanFeatureWithMeta = PlanFeature & { EntitlementFeature: EntitlementFeature }

const sumInt = (a: number | null | undefined, b: number | null | undefined): number | null => {
  const x = a ?? null
  const y = b ?? null
  if (x == null && y == null) return null
  return (x ?? 0) + (y ?? 0)
}

const sumDec = (a: any, b: any): any => {
  if (a == null && b == null) return null
  if (a == null) return b
  if (b == null) return a
  return (a as any).plus?.(b) ?? a
}

function mergePlanFeatures(features: PlanFeatureWithMeta[]): PlanFeatureWithMeta {
  const first = features[0]
  if (!first) throw new Error('mergePlanFeatures called with empty list')

  return {
    ...first,
    isEnabled: features.some((f) => f.isEnabled),
    isUnlimited: features.some((f) => f.isUnlimited),
    includedInt: features.reduce((acc, f) => sumInt(acc, f.includedInt), null as any),
    maxInt: features.reduce((acc, f) => sumInt(acc, f.maxInt), null as any),
    includedDec: features.reduce((acc, f) => sumDec(acc, f.includedDec), null as any),
    maxDec: features.reduce((acc, f) => sumDec(acc, f.maxDec), null as any),

    recurringCreditGrantInt: features.reduce((acc, f) => sumInt(acc, f.recurringCreditGrantInt), null as any),
    recurringCreditGrantDec: features.reduce((acc, f) => sumDec(acc, f.recurringCreditGrantDec), null as any),
    rolloverCredits: features.some((f) => f.rolloverCredits),
    topUpEnabled: features.some((f) => f.topUpEnabled),
    topUpPriceId: features.find((f) => f.topUpPriceId)?.topUpPriceId ?? first.topUpPriceId,

    enforcement: features.some((f) => f.enforcement === 'HARD') ? ('HARD' as any) : first.enforcement,
    overageMode: first.overageMode,
    overageFee: first.overageFee,
    stripeOveragePriceId: first.stripeOveragePriceId,
  }
}

async function resolveInheritAgencyEntitlements(args: ResolveEntitlementsArgs): Promise<boolean> {
  if (args.scope !== ('SUBACCOUNT' as any)) return false
  if (args.inheritAgencyEntitlements != null) return !!args.inheritAgencyEntitlements

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

export async function resolvePlanIdsForAgency(agencyId: string, now: Date = new Date()): Promise<string[]> {
  const base = await resolvePlanIdForAgency(agencyId, now)
  const addons = await db.addOns.findMany({ where: { agencyId, active: true }, select: { priceId: true } })
  const planIds = [base, ...addons.map((a) => a.priceId)].filter(Boolean) as string[]
  return Array.from(new Set(planIds))
}

export async function resolveEffectiveEntitlementsFromPlanIds(params: {
  scope?: 'AGENCY' | 'SUBACCOUNT',
  agencyId: string,
  subAccountId?: string | null,
  planIds?: string[]
  now?: Date
}): Promise<Record<string, EffectiveEntitlement>> {
  const planIds = Array.from(new Set((params.planIds || []).filter(Boolean)))
  if (!planIds.length) return {}

  const planFeaturesRaw = await db.planFeature.findMany({
    where: { planId: { in: planIds } },
    include: { EntitlementFeature: true },
  })

  const byKey = new Map<string, PlanFeatureWithMeta[]>()
  for (const pf of planFeaturesRaw) {
    const arr = byKey.get(pf.featureKey) ?? []
    arr.push(pf)
    byKey.set(pf.featureKey, arr)
  }

  const merged: PlanFeatureWithMeta[] = []
  for (const list of byKey.values()) merged.push(list.length === 1 ? list[0] : mergePlanFeatures(list))

  const out: Record<string, EffectiveEntitlement> = {}
  for (const pf of merged) out[pf.featureKey] = normalizeEntitlement(pf, null)
  return out
}

export async function resolveEffectiveEntitlements(args: ResolveEntitlementsArgs): Promise<Record<string, EffectiveEntitlement>> {
  const now = args.now ?? new Date()

  // Fast-path: snapshot for base entitlements (plan+addons). Overrides still applied at runtime.
  let base: Record<string, EffectiveEntitlement> | null = null
  const overridePlanId = (args.planId as any) as string | null | undefined
  if (!overridePlanId) {
    base = await readEntitlementSnapshot({
      scope: args.scope as any,
      agencyId: args.agencyId,
      subAccountId: args.subAccountId || null,
    })
  }

  if (!base) {
    const planIds = overridePlanId ? [overridePlanId] : await resolvePlanIdsForAgency(args.agencyId, now)
    if (!planIds.length) return {}

    base = await resolveEffectiveEntitlementsFromPlanIds({ scope: args.scope, agencyId: args.agencyId, subAccountId: args.subAccountId || null, planIds, now })

    if (!overridePlanId) {
      await writeEntitlementSnapshot({
        scope: args.scope as any,
        agencyId: args.agencyId,
        subAccountId: args.subAccountId || null,
        entitlements: base,
        source: 'lazy',
      })
    }
  }

  const inheritAgency = await resolveInheritAgencyEntitlements(args)

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

  const overrideMap = new Map<string, typeof overridesSub[number]>()
  for (const o of overridesAgency) overrideMap.set(o.featureKey, o)
  for (const o of overridesSub) overrideMap.set(o.featureKey, o)

  const out: Record<string, EffectiveEntitlement> = { ...base }

  // Apply overrides for keys present in base
  for (const [k, v] of Object.entries(base)) {
    const ov = overrideMap.get(k)
    if (!ov) continue
    // We can't rehydrate PlanFeature here without a planId; normalizeEntitlement requires PlanFeature.
    // Instead, overlay override fields onto existing entitlement.
    out[k] = {
      ...v,
      isEnabled: ov.isEnabled ?? v.isEnabled,
      isUnlimited: ov.isUnlimited ?? v.isUnlimited,
      maxInt: ov.maxOverrideInt ?? (ov.maxDeltaInt != null ? (v.maxInt ?? 0) + ov.maxDeltaInt : v.maxInt),
      maxDec:
        ov.maxOverrideDec != null
          ? ov.maxOverrideDec.toString()
          : ov.maxDeltaDec != null && v.maxDec != null
            ? (ov.maxDeltaDec as any).plus?.(v.maxDec as any)?.toString?.() ?? v.maxDec
            : v.maxDec,
    } as any
  }

  // Overrides for keys not present in base (batch fetch features)
  const missingKeys = []
  for (const o of [...overridesAgency, ...overridesSub]) {
    if (!out[o.featureKey]) missingKeys.push(o.featureKey)
  }

  if (missingKeys.length) {
    const feats = await db.entitlementFeature.findMany({ where: { key: { in: Array.from(new Set(missingKeys)) } } })
    const featMap = new Map(feats.map((f) => [f.key, f]))
    for (const o of [...overridesAgency, ...overridesSub]) {
      if (out[o.featureKey]) continue
      const f = featMap.get(o.featureKey)
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
      } as any
    }
  }

  return out
}

export function inferScopeFromIds(subAccountId?: string | null): MeteringScope {
  return subAccountId ? ('SUBACCOUNT' as any) : ('AGENCY' as any)
}
