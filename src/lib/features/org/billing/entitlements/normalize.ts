import type {
  EntitlementFeature,
  EntitlementOverride,
  PlanFeature,
} from '@/generated/prisma/client'
import type { EffectiveEntitlement } from '@/lib/features/org/billing/entitlements/types'

type PlanFeatureWithMeta = PlanFeature & { EntitlementFeature: EntitlementFeature }

function decToString(v: any): string | null {
  if (v == null) return null
  return typeof v === 'string' ? v : v.toString()
}

export function normalizeEntitlement(
  plan: PlanFeatureWithMeta,
  override?: EntitlementOverride | null
): EffectiveEntitlement {
  const f = plan.EntitlementFeature

  // Enablement
  const isEnabled = (override?.isEnabled ?? true) && plan.isEnabled
  const isUnlimited = override?.isUnlimited ?? plan.isUnlimited

  // Max overrides (delta-first, with optional absolute override)
  const maxIntBase = plan.maxInt ?? null
  const maxInt =
    override?.maxOverrideInt != null
      ? override.maxOverrideInt
      : maxIntBase != null
        ? maxIntBase + (override?.maxDeltaInt ?? 0)
        : null

  const maxDecBase = plan.maxDec != null ? decToString(plan.maxDec) : null
  const maxDec =
    override?.maxOverrideDec != null
      ? decToString(override.maxOverrideDec)
      : maxDecBase != null
        ? decToString((plan.maxDec as any).plus?.(override?.maxDeltaDec ?? 0) ?? plan.maxDec)
        : null

  return {
    featureKey: plan.featureKey,
    name: f.name,
    category: f.category,
    description: f.description,
    valueType: f.valueType,
    unit: f.unit,

    metering: f.metering,
    aggregation: f.aggregation,
    scope: f.scope,
    period: f.period,

    isEnabled,
    isUnlimited,

    includedInt: plan.includedInt ?? null,
    maxInt,

    includedDec: plan.includedDec != null ? decToString(plan.includedDec) : null,
    maxDec,

    enforcement: plan.enforcement,
    overageMode: plan.overageMode,

    creditEnabled: f.creditEnabled,
    creditUnit: f.creditUnit ?? null,
    creditExpires: f.creditExpires,
    creditPriority: f.creditPriority,

    recurringCreditGrantInt: plan.recurringCreditGrantInt ?? null,
    recurringCreditGrantDec:
      plan.recurringCreditGrantDec != null
        ? decToString(plan.recurringCreditGrantDec)
        : null,
    rolloverCredits: plan.rolloverCredits,

    topUpEnabled: plan.topUpEnabled,
    topUpPriceId: plan.topUpPriceId ?? null,
  }
}
