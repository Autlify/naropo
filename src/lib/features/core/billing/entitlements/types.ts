import type {
  FeatureValueType,
  LimitEnforcement,
  MeterAggregation,
  MeteringScope,
  MeteringType,
  OverageMode,
  Plan,
  UsagePeriod,
} from '@/generated/prisma/client'

export type EffectiveEntitlement = {
  featureKey: string
  name: string
  category: string
  description?: string | null
  valueType: FeatureValueType
  unit?: string | null

  // Metering semantics (read-only from EntitlementFeature)
  metering: MeteringType
  aggregation: MeterAggregation
  scope: MeteringScope
  period?: UsagePeriod | null

  // Plan/override output
  isEnabled: boolean
  isUnlimited: boolean

  includedInt: number | null
  maxInt: number | null

  // Store decimals as string (Prisma Decimal -> string) to avoid floating errors.
  includedDec: string | null
  maxDec: string | null

  enforcement: LimitEnforcement
  overageMode: OverageMode

  // Credits / topups
  creditEnabled: boolean
  creditUnit: string | null
  creditExpires: boolean
  creditPriority: number

  recurringCreditGrantInt: number | null
  recurringCreditGrantDec: string | null
  rolloverCredits: boolean

  topUpEnabled: boolean
  topUpPriceId: string | null
}

export type ResolveEntitlementsArgs = {
  agencyId: string
  subAccountId: string | null
  scope: MeteringScope
  // Optional override: if you already know the planId (Stripe recurring priceId)
  planId?: Plan | string | null
  now?: Date | null
  inheritAgencyEntitlements?: boolean | null
}
