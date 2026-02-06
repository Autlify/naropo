/**
 * Pricing Types (SSoT)
 *
 * Guidelines:
 * - Centralize unions by deriving them from `as const` tuples (single source of truth).
 * - Reduce Stripe mapping friction by separating: billing_scheme vs tiers_mode vs interval.
 * - Enable validation + inference by expressing allowed combinations as a typed union.
 * - Provide IFRS-oriented accounting metadata for a pricing engine schema.
 */

import { BillingIntervalType, PricingTax } from '@/types/billing'

// ------------------------------
// Pillar: Catalog / Product
// ------------------------------

export const PRODUCT_KINDS = ['physical', 'digital', 'service', 'subscription'] as const
export type ProductKind = (typeof PRODUCT_KINDS)[number]

export const FULFILLMENT_METHODS = ['ship', 'pickup', 'download', 'access', 'appointment'] as const
export type FulfillmentMethod = (typeof FULFILLMENT_METHODS)[number]

// ------------------------------
// Pillar: Pricing
// ------------------------------

export const PRICING_MODELS = ['one_time', 'recurring', 'usage_based', 'hybrid'] as const
export type PricingModel = (typeof PRICING_MODELS)[number]

/**
 * Stripe-aligned billing scheme:
 * - per_unit: unit_amount (and optional quantity)
 * - tiered: tiers (with tiers_mode)
 * - flat: legacy convenience for “fixed price regardless of quantity”; maps to per_unit with quantity=1.
 */
export const BILLING_SCHEMES = ['per_unit', 'tiered', 'flat'] as const
export type BillingScheme = (typeof BILLING_SCHEMES)[number]

/** Stripe-aligned tiers mode (only applies when billing_scheme = 'tiered'). */
export const TIERS_MODES = ['graduated', 'volume'] as const
export type TiersMode = (typeof TIERS_MODES)[number]

/**
 * Standard name used across engine + Stripe mapping.
 * (Legacy mappings: `pricing_schema`, `billing_schema`, `pricing_type` -> `billingScheme`)
 */
// export type BillingScheme = ... (defined above)

// ------------------------------
// Pillar: Billing / Collection
// ------------------------------

export const BILLING_TYPES = ['prepaid', 'postpaid', 'milestone', 'installment'] as const
export type BillingType = (typeof BILLING_TYPES)[number]

export const BILLING_METHODS = ['automatic', 'manual', 'invoiced'] as const
export type BillingMethod = (typeof BILLING_METHODS)[number]

/**
 * Intervals are engine-level (more expressive than Stripe’s day/week/month/year).
 * Stripe mapping can be handled via `StripeRecurringInterval` helpers.
 */
export const INTERVALS = [
  'daily',
  'weekly',
  'bi_weekly',
  'monthly',
  'quarterly',
  'semi_annually',
  'annually',
  'biennially',
  'triennially',
] as const
export type Interval = (typeof INTERVALS)[number]

export type StripeRecurringInterval = 'day' | 'week' | 'month' | 'year'

// ------------------------------
// Pillar: Discounts / Promotions
// ------------------------------

/**
 * Discount primitives (engine-level).
 * - Keep these Stripe-friendly while still supporting non-Stripe pricing engines.
 * - Amounts are always in minor units (cents/sen).
 */
export const DISCOUNT_KINDS = ['percentage', 'fixed_amount'] as const
export type DiscountKind = (typeof DISCOUNT_KINDS)[number]

export type DiscountValue =
  | {
      kind: 'percentage'
      /** 0-100 */
      percentOff: number
    }
  | {
      kind: 'fixed_amount'
      /** Minor units in the price currency. */
      amountOffMinor: number
    }

export const DISCOUNT_DURATIONS = ['once', 'repeating', 'forever'] as const
export type DiscountDurationKind = (typeof DISCOUNT_DURATIONS)[number]

export type DiscountDuration =
  | {
      duration: 'once'
    }
  | {
      duration: 'repeating'
      /** Number of billing cycles the discount repeats for. */
      cycles: number
    }
  | {
      duration: 'forever'
    }

/** Where a discount applies. Useful for UI + validation + mapping. */
export const DISCOUNT_SCOPES = ['invoice', 'plan', 'component'] as const
export type DiscountScope = (typeof DISCOUNT_SCOPES)[number]

/**
 * Coupon/Promo config (Stripe-aligned naming, but engine-agnostic).
 * - `code` is what a user enters.
 * - `promotionId` can be used to store Stripe Promotion Code ID or internal id.
 */
export type CouponConfig = {
  code: string
  active: boolean
  scope?: DiscountScope
  discount: DiscountValue
  duration: DiscountDuration
  /** ISO 8601 timestamps (optional). */
  startsAt?: string
  expiresAt?: string
  maxRedemptions?: number
  metadata?: Record<string, string>
  /** Optional connector IDs (e.g., Stripe coupon/promo IDs). */
  stripeCouponId?: string
  stripePromotionCodeId?: string
}

/** A discount that has been selected/applied to a quote/checkout. */
export type AppliedDiscountInput = {
  code?: string
  /** Useful for internal/Stripe mapping. */
  promotionId?: string
  discount: DiscountValue
}

// ------------------------------
// Pillar: Usage / Metering
// ------------------------------

export const USAGE_TYPES = ['licensed', 'metered'] as const
export type UsageType = (typeof USAGE_TYPES)[number]

export const USAGE_SCHEMAS = ['per_unit', 'tiered'] as const
export type UsageSchema = (typeof USAGE_SCHEMAS)[number]

export const AGGREGATE_USAGES = ['sum', 'last_during_period', 'last_ever', 'max'] as const
export type AggregateUsage = (typeof AGGREGATE_USAGES)[number]

// ------------------------------
// Pillar: Features / Entitlements
// ------------------------------

/**
 * Feature keys should be owned by the product domain.
 * Keep this list small and stable; add new keys as your catalog evolves.
 */
export const FEATURE_KEYS = [
  'seats',
  'projects',
  'api_calls',
  'storage_gb',
  'sso',
  'audit_logs',
] as const

export type FeatureKey = (typeof FEATURE_KEYS)[number]

/** Window in which a usage limit applies. */
export type UsageLimitWindow =
  | {
    window: 'per_interval'
    interval: Interval
    intervalCount?: number
  }
  | {
    window: 'lifetime'
  }

/**
 * A limit is an enforcement hint for an entitlement system.
 * - Use `window: 'per_interval'` for monthly quotas, weekly limits, etc.
 * - Use `window: 'lifetime'` for fixed packs/credits.
 */
export type UsageLimit = {
  quantity: number
  /** Optional unit for display and validation (e.g., "seat", "GB", "request"). */
  unit?: string
  window: UsageLimitWindow
  /** If true, exceeding the limit is allowed and should be billed (overage). */
  overageAllowed?: boolean
}

export type FeatureEntitlementValue = {
  entitled: boolean
  /** Optional limit for the feature (only meaningful when entitled=true). */
  usageLimit?: UsageLimit
  /** Optional meter key used to track usage for this feature (defaults to the feature key). */
  meter?: string
}

/**
 * Feature entitlements attached to a plan.
 * Using a map keeps lookups simple and supports partial overrides.
 */
export type FeatureEntitlements<K extends string = FeatureKey> = Partial<Record<K, FeatureEntitlementValue>>

export function isFeatureEntitled<K extends string>(
  entitlements: FeatureEntitlements<K> | undefined,
  key: K,
): boolean {
  return Boolean(entitlements?.[key]?.entitled)
}

export function getFeatureUsageLimit<K extends string>(
  entitlements: FeatureEntitlements<K> | undefined,
  key: K,
): UsageLimit | undefined {
  return entitlements?.[key]?.usageLimit
}

export function getFeatureMeterKey<K extends string>(
  entitlements: FeatureEntitlements<K> | undefined,
  key: K,
): string {
  return entitlements?.[key]?.meter ?? String(key)
}

// ------------------------------
// Pillar: Money / Tax (engine-level)
// ------------------------------

export type CurrencyCode = string

export type Money = {
  /** Minor units (e.g., cents). (Legacy mapping: `amount` -> `amountMinor`) */
  amountMinor: number
  currency: CurrencyCode
}

/** Stripe-aligned tax behavior. */
export type TaxBehavior = 'inclusive' | 'exclusive' | 'unspecified'

export type TaxConfig = {
  behavior: TaxBehavior
  /** Internal/Stripe tax code (if used). */
  taxCode?: string
}

// ------------------------------
// Pillar: eInvoice (bridge-ready, optional)
// ------------------------------

/**
 * Minimal bridge-ready eInvoice configuration.
 * Keep it optional and connector-agnostic; detailed schemas belong in the eInvoice module.
 */
export const EINVOICE_CONNECTORS = ['none', 'stripe', 'peppol', 'myinvois', 'zatca', 'custom'] as const
export type EInvoiceConnector = (typeof EINVOICE_CONNECTORS)[number]

export type EInvoiceBridgeRequirements = {
  /** Whether buyer reference/PO is required by jurisdiction/profile. */
  buyerReference?: boolean
  /** Whether tax IDs are required for supplier/buyer. */
  supplierTaxId?: boolean
  buyerTaxId?: boolean
  /** Whether address details are required beyond country code. */
  postalAddress?: boolean
  /** Whether line-level tax category/classification is required. */
  lineTaxCategory?: boolean
}

export type EInvoiceBridgeConfig = {
  enabled?: boolean
  connector?: EInvoiceConnector
  /** Connector-specific format/profile identifiers (e.g., UBL/Peppol profile IDs). */
  format?: string
  profileId?: string
  customizationId?: string
  requirements?: EInvoiceBridgeRequirements
  /** Connector routing keys / external IDs. */
  connectorAccountId?: string
  connectorCustomerId?: string
  metadata?: Record<string, string>
}

// ------------------------------
// Pillar: Accounting / IFRS (IFRS 15 oriented)
// ------------------------------

export type RevenueRecognitionTiming = 'point_in_time' | 'over_time'

export type RevenueRecognition =
  | {
    timing: 'point_in_time'
    /** Common triggers for satisfaction of a performance obligation. */
    trigger: 'delivery' | 'shipment' | 'download' | 'customer_acceptance' | 'service_completion'
  }
  | {
    timing: 'over_time'
    /** Straight-line is common for subscriptions; usage/milestone for certain services. */
    pattern: 'straight_line' | 'usage' | 'milestone'
    /** Optional service period if timing is over time (engine can compute from interval/term). */
    servicePeriodDays?: number
  }

export type PerformanceObligation = {
  /** Stable identifier for allocation and contract modifications. */
  code: string
  description?: string
  fulfillment: FulfillmentMethod
  revenueRecognition: RevenueRecognition
}

export type RefundPolicy = {
  /** Whether consideration can be refunded; used for variable consideration constraints. */
  refundable: boolean
  /** Refund window in days (if applicable). */
  windowDays?: number
}

export type CancellationPolicy = {
  /** Whether customers can cancel; impacts contract term and proration. */
  cancellable: boolean
  /** Whether cancellation is immediate or end-of-period (common for subscriptions). */
  effective: 'immediate' | 'end_of_period'
}

export type ContractTerm = {
  /** Minimum commitment (e.g., 12 months) for IFRS disclosures / billing enforcement. */
  minimumInterval?: Interval
  /** Number of intervals in the minimum term (e.g., 12 for monthly). */
  minimumIntervalCount?: number
}

// ------------------------------
// Pricing Engine Schema (composable + Stripe-friendly)
// ------------------------------

export type QuantityTransform = {
  /** Display/metric unit name (e.g., "seat", "GB", "api_call"). */
  unit: string
  /** Multiplier from usage units to billed units (e.g., bytes -> GB). */
  divideBy?: number
}

export type Tier = {
  /** Inclusive upper bound for the tier (Stripe: up_to). Null/undefined means “inf”. */
  upTo?: number
  /** Unit amount for this tier (minor units). (Legacy mapping: `unitAmount` -> `unitAmountMinor`) */
  unitAmountMinor: number
  /** Optional flat amount for the tier (minor units). (Legacy mapping: `flatAmount` -> `flatAmountMinor`) */
  flatAmountMinor?: number
}

export type OneTimePriceComponent = {
  component: 'one_time'
  billingScheme: BillingScheme
  tiersMode?: TiersMode
  tiers?: Tier[]
  unitAmount?: Money
  quantityTransform?: QuantityTransform
  tax?: TaxConfig
}

export type RecurringPriceComponent = {
  component: 'recurring'
  billingScheme: BillingScheme
  tiersMode?: TiersMode
  tiers?: Tier[]
  unitAmount?: Money
  interval: Interval
  intervalCount?: number
  /** Trial support (Stripe mapping). */
  trialPeriodDays?: number
  /** If true, prorate on changes; maps to Stripe proration_behavior as needed. */
  proration?: boolean
  tax?: TaxConfig
}

export type UsagePriceComponent = {
  component: 'usage'
  usageType: UsageType
  usageSchema: UsageSchema
  aggregateUsage?: AggregateUsage
  /** Engine metric key for meter events (e.g., "api_calls"). */
  meter: string
  billingScheme: Exclude<BillingScheme, 'flat'>
  tiersMode?: TiersMode
  tiers?: Tier[]
  unitAmount?: Money
  quantityTransform?: QuantityTransform
  tax?: TaxConfig
}

export type PriceComponent = OneTimePriceComponent | RecurringPriceComponent | UsagePriceComponent

export type PricingEngineProduct = {
  kind: ProductKind
  /** Optional fulfillment hints for validation/accounting defaults. */
  fulfillment?: FulfillmentMethod
}

export type PricingEngineBilling = {
  type: BillingType
  method: BillingMethod
  /** Invoiced flows may include net terms; keep generic. */
  netTermsDays?: number
  /** Optional eInvoice bridge configuration (connector-ready). */
  eInvoice?: EInvoiceBridgeConfig
}

export type PricingEngineAccounting = {
  /** Performance obligations are required for robust IFRS 15 modeling. */
  obligations: PerformanceObligation[]
  refundPolicy?: RefundPolicy
  cancellationPolicy?: CancellationPolicy
  contractTerm?: ContractTerm
}

export type StripeMappingHints = {
  /** Optional Stripe IDs/keys to minimize mapping glue in app code. */
  productId?: string
  priceId?: string
  lookupKey?: string
}

export type PricingEnginePlan = {
  /** Stable identifier for external references and contract migrations. */
  code?: string
  /** User-facing name (e.g., “Pro”, “Enterprise”). */
  displayName?: string
  /** Optional user-facing description. */
  description?: string
  product: PricingEngineProduct
  pricingModel: PricingModel
  billing?: PricingEngineBilling
  components: PriceComponent[]
  /** Feature entitlements + limits for gating and quota enforcement. */
  features?: FeatureEntitlements
  accounting: PricingEngineAccounting
  stripe?: StripeMappingHints
  /** Optional promotions/coupons available for this plan (UI + mapping). */
  promotions?: readonly CouponConfig[]
}
 

/**
 * Product config that supports *one product* with *multiple prices* (intervals/cycles).
 * - Use this when the same product is offered monthly/annual, etc.
 * - Each price option can have its own Stripe `priceId`, lookup key, and promotions.
 */
export type PricingEnginePriceCycle = {
  interval: Interval
  intervalCount?: number
}

export type PricingEnginePriceOption = {
  /** Stable identifier for the price option (e.g., PRO_MONTHLY, PRO_YEARLY). */
  code?: string
  displayName?: string
  description?: string
  /** Primary cycle for selection/display; should match recurring component where applicable. */
  cycle?: PricingEnginePriceCycle
  pricingModel: PricingModel
  billing?: PricingEngineBilling
  components: PriceComponent[]
  features?: FeatureEntitlements
  accounting: PricingEngineAccounting
  stripe?: StripeMappingHints
  promotions?: readonly CouponConfig[]
}

export type PricingEngineProductWithPrices = {
  /** Shared product identity. */
  product: PricingEngineProduct
  /** Shared Stripe product mapping (price-level IDs live on options). */
  stripe?: Pick<StripeMappingHints, 'productId' | 'lookupKey'> & {
    lookupKeyPrefix?: string
  }
  /** Optional defaults to reduce duplication; option-level values override defaults. */
  defaults?: {
    billing?: PricingEngineBilling
    features?: FeatureEntitlements
    accounting?: PricingEngineAccounting
  }
  prices: readonly PricingEnginePriceOption[]
}

// ------------------------------
// Combination Rules (validation + inference)
// ------------------------------

export type PricingCombination = {
  /** Legacy mapping: `product_kind` -> `productKind` */
  productKind: ProductKind
  /** Legacy mapping: `pricing_model` -> `pricingModel` */
  pricingModel: PricingModel
  /** Optional, because some offerings can be “priced” without collection configured yet. */
  /** Legacy mapping: `billing_type` -> `billingType` */
  billingType?: BillingType
  /** Legacy mapping: `billing_method` -> `billingMethod` */
  billingMethod?: BillingMethod
  interval?: Interval
  /** Legacy mapping: `billing_scheme` / `pricing_schema` / `billing_schema` -> `billingScheme` */
  billingScheme?: BillingScheme
  /** Legacy mapping: `tiers_mode` -> `tiersMode` */
  tiersMode?: TiersMode
  /** Legacy mapping: `usage_type` -> `usageType` */
  usageType?: UsageType
  /** Legacy mapping: `usage_schema` -> `usageSchema` */
  usageSchema?: UsageSchema
}

/**
 * Allowed combinations (extend over time).
 * This union can be used to strongly type UI controls, API inputs, and validators.
 */
export const PRICING_ALLOWED_COMBINATIONS = [
  // Physical goods: typically one-time; can be installment/invoiced.
  {
    productKind: 'physical',
    pricingModel: 'one_time',
    billingType: 'prepaid',
    billingMethod: 'automatic',
    billingScheme: 'per_unit',
  },
  {
    productKind: 'physical',
    pricingModel: 'one_time',
    billingType: 'installment',
    billingMethod: 'invoiced',
    billingScheme: 'per_unit',
  },

  // Digital: one-time or subscription; usage-based for credits/API is allowed.
  {
    productKind: 'digital',
    pricingModel: 'one_time',
    billingType: 'prepaid',
    billingMethod: 'automatic',
    billingScheme: 'flat',
  },
  {
    productKind: 'digital',
    pricingModel: 'usage_based',
    billingType: 'postpaid',
    billingMethod: 'automatic',
    usageType: 'metered',
    usageSchema: 'per_unit',
    billingScheme: 'per_unit',
  },

  // Service: one-time, recurring, or usage-based.
  {
    productKind: 'service',
    pricingModel: 'one_time',
    billingType: 'milestone',
    billingMethod: 'invoiced',
    billingScheme: 'flat',
  },
  {
    productKind: 'service',
    pricingModel: 'recurring',
    billingType: 'prepaid',
    billingMethod: 'automatic',
    interval: 'monthly',
    billingScheme: 'per_unit',
  },
  {
    productKind: 'service',
    pricingModel: 'usage_based',
    billingType: 'postpaid',
    billingMethod: 'invoiced',
    usageType: 'metered',
    usageSchema: 'tiered',
    billingScheme: 'tiered',
    tiersMode: 'graduated',
  },

  // Subscription: recurring (and optionally hybrid with overages).
  {
    productKind: 'subscription',
    pricingModel: 'recurring',
    billingType: 'prepaid',
    billingMethod: 'automatic',
    interval: 'monthly',
    billingScheme: 'per_unit',
  },
  {
    productKind: 'subscription',
    pricingModel: 'hybrid',
    billingType: 'prepaid',
    billingMethod: 'automatic',
    interval: 'monthly',
    billingScheme: 'per_unit',
    usageType: 'metered',
    usageSchema: 'per_unit',
  },
] as const satisfies readonly PricingCombination[]

export type AllowedPricingCombination = (typeof PRICING_ALLOWED_COMBINATIONS)[number]

export const isAllowedPricingCombination = (c: PricingCombination): c is AllowedPricingCombination => {
  return PRICING_ALLOWED_COMBINATIONS.some((allowed) => {
    // `allowed` is a union of narrower object literals, so index access with a generic
    // `keyof PricingCombination` isn't safe. Treat it as a partial combination for comparison.
    const allowedPartial = allowed as Readonly<Partial<PricingCombination>>
    for (const k of Object.keys(allowedPartial) as (keyof PricingCombination)[]) {
      if (allowedPartial[k] !== c[k]) return false
    }
    return true
  })
}


// ------------------------------
// Centralized Config Dictionaries (SSoT + inference)
// ------------------------------

export const PRICING_CONFIG_DICTIONARY = {
  /** Legacy mapping: `product_kind` -> `productKind` */
  productKind: PRODUCT_KINDS,
  /** Legacy mapping: `pricing_model` -> `pricingModel` */
  pricingModel: PRICING_MODELS,
  /** Legacy mapping: `billing_type` -> `billingType` */
  billingType: BILLING_TYPES,
  /** Legacy mapping: `billing_method` -> `billingMethod` */
  billingMethod: BILLING_METHODS,
  /** Legacy mapping: `pricing_schema` / `billing_schema` / `pricing_type` -> `billingScheme` */
  billingScheme: BILLING_SCHEMES,
  interval: INTERVALS,
  /** Legacy mapping: `usage_type` -> `usageType` */
  usageType: USAGE_TYPES,
  /** Legacy mapping: `usage_schema` -> `usageSchema` */
  usageSchema: USAGE_SCHEMAS,
  /** Legacy mapping: `tiers_mode` -> `tiersMode` */
  tiersMode: TIERS_MODES,
} as const

export type PricingConfigKeyType = keyof typeof PRICING_CONFIG_DICTIONARY

export type PricingConfigItem<K extends PricingConfigKeyType = PricingConfigKeyType> =
  (typeof PRICING_CONFIG_DICTIONARY)[K][number]

export type PricingConfigRecord = {
  [K in PricingConfigKeyType]: {
    key: K
    values: readonly PricingConfigItem<K>[]
  }
}

export const PRICING_CONFIG = {
  productKind: { key: 'productKind', values: PRODUCT_KINDS },
  pricingModel: { key: 'pricingModel', values: PRICING_MODELS },
  billingType: { key: 'billingType', values: BILLING_TYPES },
  billingMethod: { key: 'billingMethod', values: BILLING_METHODS },
  billingScheme: { key: 'billingScheme', values: BILLING_SCHEMES },
  interval: { key: 'interval', values: INTERVALS },
  usageType: { key: 'usageType', values: USAGE_TYPES },
  usageSchema: { key: 'usageSchema', values: USAGE_SCHEMAS },
  tiersMode: { key: 'tiersMode', values: TIERS_MODES },
} as const satisfies PricingConfigRecord

/**
  * Price Quote Input (Stripe-aligned)
  */
export type PriceQuoteInput = {
  /** Legacy mapping: `pricing_schema` / `billing_schema` / `pricing_type` -> `billingScheme` */
  billingScheme: BillingScheme
  /** Required when billingScheme = 'tiered'. (Legacy mapping: `tiers_mode` -> `tiersMode`) */
  tiersMode?: TiersMode
  quantity: number
  /** Minor units (e.g., cents). Required for `per_unit` and `flat`. */
  unitAmountMinor?: number
  tiers?: Tier[]
  /** Optional discounts/coupons (applied after tier calculation). */
  discounts?: readonly AppliedDiscountInput[]
}

/**
  * Price Quote Result
  */
export type PriceQuoteResult = {
  totalAmountMinor: number
}

/**
  * Calculate price based on pricing config
  * @remarks
  * This is the ONLY function that calculates amounts - Stripe tier semantics are supported.
  */
export function calculatePrice(input: PriceQuoteInput): PriceQuoteResult {
  const quantity = Number.isFinite(input.quantity) ? Math.max(0, input.quantity) : 0

  const tiersSorted = (input.tiers ?? [])
    .slice()
    .sort((a, b) => (a.upTo ?? Number.POSITIVE_INFINITY) - (b.upTo ?? Number.POSITIVE_INFINITY))

  const requireUnitAmountMinor = (): number => {
    if (!Number.isFinite(input.unitAmountMinor)) {
      throw new Error('unitAmountMinor is required for billingScheme="per_unit" or "flat"')
    }
    return input.unitAmountMinor as number
  }

  const applyDiscounts = (amountMinor: number): number => {
    const discounts = input.discounts ?? []
    if (discounts.length === 0) return amountMinor

    let current = amountMinor

    for (const d of discounts) {
      if (current <= 0) break
      const discount = d.discount

      if (discount.kind === 'percentage') {
        const percent = Number.isFinite(discount.percentOff) ? Math.min(100, Math.max(0, discount.percentOff)) : 0
        const off = Math.round((current * percent) / 100)
        current = Math.max(0, current - off)
        continue
      }

      // fixed_amount
      const off = Number.isFinite(discount.amountOffMinor) ? Math.max(0, discount.amountOffMinor) : 0
      current = Math.max(0, current - off)
    }

    return current
  }

  if (input.billingScheme === 'flat') {
    // Stripe mapping: treat as per_unit with quantity=1.
    return { totalAmountMinor: applyDiscounts(requireUnitAmountMinor()) }
  }

  if (input.billingScheme === 'per_unit') {
    return { totalAmountMinor: applyDiscounts(quantity * requireUnitAmountMinor()) }
  }

  // tiered
  if (tiersSorted.length === 0) {
    throw new Error('tiers are required for billingScheme="tiered"')
  }

  const tiersMode: TiersMode = input.tiersMode ?? 'graduated'

  if (tiersMode === 'volume') {
    const applicableTier =
      tiersSorted.find((t) => (t.upTo ?? Number.POSITIVE_INFINITY) >= quantity) ?? tiersSorted[tiersSorted.length - 1]
    const flat = applicableTier.flatAmountMinor ?? 0
    return { totalAmountMinor: applyDiscounts(quantity * applicableTier.unitAmountMinor + flat) }
  }

  // graduated
  let totalAmountMinor = 0
  let previousUpTo = 0

  for (const tier of tiersSorted) {
    const currentUpTo = tier.upTo ?? Number.POSITIVE_INFINITY
    const qtyInTier = Math.max(0, Math.min(quantity, currentUpTo) - previousUpTo)

    if (qtyInTier > 0) {
      totalAmountMinor += qtyInTier * tier.unitAmountMinor
      if (tier.flatAmountMinor) totalAmountMinor += tier.flatAmountMinor
    }

    previousUpTo = currentUpTo
    if (quantity <= currentUpTo) break
  }

  return { totalAmountMinor: applyDiscounts(totalAmountMinor) }
}

// ------------------------------
// Sample Usage
// ------------------------------
// Example: Configure a subscription plan with recurring tiers pricing
export const sampleServicePlans: PricingEnginePlan[] = [
  {
    product: {
      kind: 'subscription',
      fulfillment: 'access',
    },
    pricingModel: 'recurring',
    features: {
      // Feature-gated + limited examples
      seats: {
        entitled: true,
        usageLimit: { quantity: 10, unit: 'seat', window: { window: 'lifetime' } },
      },
      sso: { entitled: true },
      api_calls: {
        entitled: true,
        meter: 'api_calls',
        usageLimit: {
          quantity: 100_000,
          unit: 'request',
          window: { window: 'per_interval', interval: 'monthly' },
          overageAllowed: true,
        },
      },
    },
    components: [
      {
        component: 'recurring',
        billingScheme: 'tiered',
        tiersMode: 'graduated',
        tiers: [
          { upTo: 10, unitAmountMinor: 1000 }, // $10.00 for first 10 units
          { upTo: 50, unitAmountMinor: 800 },  // $8.00 for next 40 units
          { unitAmountMinor: 500 },             // $5.00 for any additional units
        ],
        interval: 'monthly',
      },
    ],
    accounting: {
      obligations: [
        {
          code: 'SUBSCRIPTION_ACCESS',
          fulfillment: 'access',
          revenueRecognition: {
            timing: 'over_time',
            pattern: 'straight_line',
            servicePeriodDays: 30,
          },
        },
      ],
      refundPolicy: {
        refundable: true,
        windowDays: 14,
      },
      cancellationPolicy: {
        cancellable: true,
        effective: 'end_of_period',
      },
      contractTerm: {
        minimumInterval: 'monthly',
        minimumIntervalCount: 1,
      },
    },
    stripe: {
      productId: 'prod_ABC123',
      priceId: 'price_XYZ789',
    },
  },
  {
    product: {
      kind: 'service',
      fulfillment: 'appointment',
    },
    pricingModel: 'one_time',
    features: {
      projects: { entitled: true, usageLimit: { quantity: 1, unit: 'project', window: { window: 'lifetime' } } },
      audit_logs: { entitled: false },
    },
    components: [
      {
        component: 'one_time',
        billingScheme: 'per_unit',
        unitAmount: { amountMinor: 5000, currency: 'USD' }, // $50.00 one-time fee
      },
    ],
    accounting: {
      obligations: [
        {
          code: 'SERVICE_APPOINTMENT',
          fulfillment: 'appointment',
          revenueRecognition: {
            timing: 'point_in_time',
            trigger: 'service_completion',
          },
        },
      ],
      refundPolicy: {
        refundable: false,
      },
      cancellationPolicy: {
        cancellable: true,
        effective: 'immediate',
      },
    },
    stripe: {
      productId: 'prod_SERVICE123',
      priceId: 'price_SERVICE456',
    },
  },
]

// Example: Configure a plan with combinations of subscriptions, add-ons, usage-based, overages and credits topup
export const sampleServicePlanWithCombinations: PricingEnginePlan = {
  product: {
    kind: 'subscription',
    fulfillment: 'access',
  },
  pricingModel: 'hybrid',
  features: {
    storage_gb: {
      entitled: true,
      meter: 'storage_gb',
      usageLimit: {
        quantity: 100,
        unit: 'GB',
        window: { window: 'per_interval', interval: 'monthly' },
        overageAllowed: true,
      },
    },
    audit_logs: { entitled: true },
  },
  components: [
    // Recurring subscription component
    {
      component: 'recurring',
      billingScheme: 'per_unit',
      unitAmount: { amountMinor: 2000, currency: 'USD' }, // $20.00 monthly fee
      interval: 'monthly',
    },
    // Usage-based overage component
    {
      component: 'usage',
      usageType: 'metered',
      usageSchema: 'per_unit',
      meter: 'api_calls',
      billingScheme: 'per_unit',
      unitAmount: { amountMinor: 10, currency: 'USD' }, // $0.10 per API call overage
    },
  ],
  accounting: {
    obligations: [
      {
        code: 'SUBSCRIPTION_ACCESS',
        fulfillment: 'access',
        revenueRecognition: {
          timing: 'over_time',
          pattern: 'straight_line',
          servicePeriodDays: 30,
        },
      },
      {
        code: 'USAGE_OVERAGE',
        fulfillment: 'access',
        revenueRecognition: {
          timing: 'point_in_time',
          trigger: 'service_completion',
        },
      },
    ],
    refundPolicy: {
      refundable: true,
      windowDays: 14,
    },
    cancellationPolicy: {
      cancellable: true,
      effective: 'end_of_period',
    },
    contractTerm: {
      minimumInterval: 'monthly',
      minimumIntervalCount: 1,
    },
  },
  stripe: {
    productId: 'prod_HYBRID123',
    priceId: 'price_HYBRID456',
  },
}

// Example: One product with multiple price options (monthly/yearly) + optional promotions
export const sampleProductWithMultiplePrices: PricingEngineProductWithPrices = {
  product: {
    kind: 'subscription',
    fulfillment: 'access',
  },
  stripe: {
    productId: 'prod_MULTI123',
    lookupKeyPrefix: 'sub_pro',
  },
  defaults: {
    billing: {
      type: 'prepaid',
      method: 'automatic',
    },
  },
  prices: [
    {
      code: 'PRO_MONTHLY',
      displayName: 'Pro (Monthly)',
      pricingModel: 'recurring',
      cycle: { interval: 'monthly', intervalCount: 1 },
      components: [
        {
          component: 'recurring',
          billingScheme: 'per_unit',
          unitAmount: { amountMinor: 2000, currency: 'USD' },
          interval: 'monthly',
        },
      ],
      accounting: {
        obligations: [
          {
            code: 'SUBSCRIPTION_ACCESS',
            fulfillment: 'access',
            revenueRecognition: { timing: 'over_time', pattern: 'straight_line', servicePeriodDays: 30 },
          },
        ],
      },
      stripe: {
        priceId: 'price_PRO_MONTHLY',
        lookupKey: 'sub_pro_monthly',
      },
      promotions: [
        {
          code: 'PRO10',
          active: true,
          scope: 'plan',
          discount: { kind: 'percentage', percentOff: 10 },
          duration: { duration: 'once' },
        },
      ],
    },
    {
      code: 'PRO_YEARLY',
      displayName: 'Pro (Yearly)',
      pricingModel: 'recurring',
      cycle: { interval: 'annually', intervalCount: 1 },
      components: [
        {
          component: 'recurring',
          billingScheme: 'per_unit',
          unitAmount: { amountMinor: 20_000, currency: 'USD' },
          interval: 'annually',
        },
      ],
      accounting: {
        obligations: [
          {
            code: 'SUBSCRIPTION_ACCESS',
            fulfillment: 'access',
            revenueRecognition: { timing: 'over_time', pattern: 'straight_line', servicePeriodDays: 365 },
          },
        ],
      },
      stripe: {
        priceId: 'price_PRO_YEARLY',
        lookupKey: 'sub_pro_yearly',
      },
    },
  ],
}

// (No runtime sample execution in this types module)
// Example (graduated tiers):
// calculatePrice({
//   billingScheme: 'tiered',
//   tiersMode: 'graduated',
//   quantity: 60,
//   tiers: [
//     { upTo: 10, unitAmountMinor: 1000 },
//     { upTo: 50, unitAmountMinor: 800 },
//     { unitAmountMinor: 500 },
//   ],
// })