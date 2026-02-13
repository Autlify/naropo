/**
 * 
 * @namespace Billing
 * @description Types and interfaces related to billing, pricing, subscriptions, and invoicing.
 * @see prisma/schema.prisma - Subscription, AddOns, Plan, SubscriptionStatus
 * @see Stripe API types for alignment reference
 * 
 * @packageDocumentation
 * 1. Alignment with Stripe types where applicable for consistency.
 * 2. Clear distinction between plan types, billing schemes, and pricing models.
 * 3. Comprehensive coverage of billing scenarios including tiered pricing and overages.
 * 4. Extensibility for future billing features and models.
 */

import { FeatureKey, PriceKey } from '@/lib/registry'
import { ICountry, IState, ICity } from 'country-state-city'
import Stripe from 'stripe'

// ============================================================================
// GEO TYPES (Derived from country-state-city library)
// ============================================================================

/** Country code (ISO 3166-1 alpha-2) - inferred from ICountry */
export type CountryCodeType = ICountry['isoCode']

/** State/Province code - inferred from IState */
export type StateCodeType = IState['isoCode']

/** Currency code (ISO 4217) - inferred from ICountry */
export type CurrencyCodeType = ICountry['currency']

// ============================================================================
// TYPES
// ============================================================================

/**
 * Account Type Classification (Stripe.V2.Core.Account.Configuration.Type)
 * @see Stripe V2 Core AccountsResource.d.ts: type Type = 'customer' | 'merchant' | 'recipient'
 * 
 * @description
 * - 'customer': Account used to pay for subscriptions/services (eg., Agency ---pay---> Autlify)
 * - 'merchant': Account acting as a connected account and collecting payments (eg., Agency <---collect--- Clients)
 * - 'recipient': Account receiving funds but not acting as the Merchant of Record (eg., SubAccount <---receive--- Agency <--collect--- Clients)
 */

export type StripeAccountType = 'customer' | 'merchant' | 'recipient'
export type StripeCustomerAccount = Stripe.V2.Core.Account.Configuration.Customer
export type StripeMerchantAccount = Stripe.V2.Core.Account.Configuration.Merchant
export type StripeRecipientAccount = Stripe.V2.Core.Account.Configuration.Recipient
export type StripeAccount =
  | { type: 'customer', account: StripeCustomerAccount }
  | { type: 'merchant', account: StripeMerchantAccount }
  | { type: 'recipient', account: StripeRecipientAccount }

/**
 * Product Type Classification (Stripe.Product.Type)
 * @see Stripe Products.d.ts: type Type = 'good' | 'service'
 * 
 * @description
 * - 'good': Eligible for use with Orders and SKUs (revenue at point_in_time)
 * - 'service': Eligible for use with Subscriptions and Plans (revenue over_time)
 */
export type ProductType = 'good' | 'service'



/**
 * Billing Scheme Type (Stripe.Price.BillingScheme)
 * @see Stripe Prices.d.ts: type BillingScheme = 'per_unit' | 'tiered'
 * 
 * Extended for Autlify's additional billing models:
 * - 'per_unit': Standard per-unit pricing
 * - 'tiered': Price varies by quantity tier
 * - 'flat': Fixed price (Autlify extension for simple pricing)
 */
export type StripeBillingSchemeType = 'per_unit' | 'tiered'
export type BillingSchemeType = Stripe.Price.BillingScheme extends infer T ? T 
  | 'flat'
  | 'base_plus_overage'
  | 'tiered_volume'
  | 'tiered_graduated'
  : never

/**
 * Extended Billing Scheme for calculation purposes
 * @description Internal Autlify schemes for complex pricing logic
 */
export type ExtendedBillingSchemeType =
  | BillingSchemeType
  | 'tiered_volume'     // Stripe: tiered with tiers_mode = 'volume'
  | 'tiered_graduated'  // Stripe: tiered with tiers_mode = 'graduated'
  | 'base_plus_overage' // Base fee + per-unit overage beyond included

/**
 * Tiers Mode Type (Stripe.Price.TiersMode)
 * @see Stripe Prices.d.ts: type TiersMode = 'graduated' | 'volume'
 */
export type TiersModeType = 'graduated' | 'volume'

/**
 * Price Type (Stripe.Price.Type)
 * @see Stripe Prices.d.ts: type Type = 'one_time' | 'recurring'
 */
export type PriceType = 'one_time' | 'recurring'

/**
 * Tax Behavior Type (Stripe.Price.TaxBehavior)
 * @see Stripe Prices.d.ts: type TaxBehavior = 'exclusive' | 'inclusive' | 'unspecified'
 */
export type TaxBehaviorType = 'exclusive' | 'inclusive' | 'unspecified'

/**
 * Recurring Interval Type (Stripe.Price.Recurring.Interval)
 * @see Stripe Prices.d.ts: type Interval = 'day' | 'month' | 'week' | 'year'
 */
export type RecurringIntervalType = 'day' | 'week' | 'month' | 'year'

/**
 * Usage Type (Stripe.Price.Recurring.UsageType)
 * @see Stripe Prices.d.ts: type UsageType = 'licensed' | 'metered'
 */
export type UsageType = 'licensed' | 'metered'

/**
 * Transform Quantity Round (Stripe.Price.TransformQuantity.Round)
 * @see Stripe Prices.d.ts: type Round = 'down' | 'up'
 */
export type TransformQuantityRoundType = 'down' | 'up'

// ============================================================================
// AUTLIFY BILLING TYPES (Extends Stripe for business logic)
// ============================================================================

/**
 * Billing Interval Type (Autlify)
 * @description Simplified interval including one_time for addons
 */
export type BillingIntervalType = RecurringIntervalType | 'one_time'

/** 
 * Pricing Unit Type (Autlify)
 * @description What unit the pricing is based on
 */
export type PricingUnitType =
  | 'subaccount'
  | 'team_member'
  | 'storage_gb'
  | 'api_call'
  | 'contact'
  | 'none'  // For flat pricing

/**
 * Subscription Status (aligned with Prisma + Stripe)
 * @see Prisma: SubscriptionStatus enum
 * @see Stripe: subscription.status
 */
export type SubscriptionStatusType =
  | 'ACTIVE'
  | 'PAST_DUE'
  | 'CANCELED'
  | 'TRIALING'
  | 'INCOMPLETE'
  | 'UNPAID'

/** Stripe-format subscription status (lowercase) */
export type StripeSubscriptionStatusType =
  | 'active'
  | 'past_due'
  | 'canceled'
  | 'trialing'
  | 'incomplete'
  | 'incomplete_expired'
  | 'unpaid'
  | 'paused'

// ============================================================================
// PLAN & ADDON KEY TYPES
// SSoT: @/lib/registry/plans/pricing-config.ts → PRICING_CONFIG
// These types MUST be kept in sync with PRICING_CONFIG.
// Runtime values should be imported from pricing-config; these are type-only.
// ============================================================================

/**
 * Plan Key Type (aligned with Prisma enum Plan price IDs)
 * @ssot @/lib/registry/plans/pricing-config.ts → PRICING_CONFIG
 * @description Must match keys in PRICING_CONFIG where type === 'plan'
 */
export type PlanKeyType = 'STARTER' | 'BASIC' | 'ADVANCED' | 'ENTERPRISE'

/**
 * Yearly plan key variants (for annual billing)
 * @ssot @/lib/registry/plans/pricing-config.ts → PRICING_CONFIG
 */
export type YearlyPlanKeyType = 'STARTER_YEARLY' | 'BASIC_YEARLY' | 'ADVANCED_YEARLY'

/**
 * All plan keys including yearly variants
 * @ssot @/lib/registry/plans/pricing-config.ts
 */
export type AllPlanKeyType = PlanKeyType | YearlyPlanKeyType

/**
 * Service Addon Key Type (recurring monthly add-ons)
 * @ssot @/lib/registry/plans/pricing-config.ts → PRICING_CONFIG
 * @description Must match keys in PRICING_CONFIG where type === 'addon' and billingInterval !== 'one_time'
 */
export type ServiceAddonKeyType = 
    | 'PRIORITY_SUPPORT' 
    | 'FI_GL' | 'FI_AR' | 'FI_AP' | 'FI_BL' | 'FI_FS' 
    | 'WHITE_LABEL'

/**
 * Good Addon Key Type (one-time purchases)
 * @ssot @/lib/registry/plans/pricing-config.ts → PRICING_CONFIG
 */
export type GoodAddonKeyType = 'SETUP_FEE' | 'API_CREDITS' | 'DATA_MIGRATION'

/**
 * All Addon Keys
 * @ssot @/lib/registry/plans/pricing-config.ts → PRICING_CONFIG
 */
export type AddonKeyType = ServiceAddonKeyType | GoodAddonKeyType

/**
 * All Config Keys (Plans + Addons + Yearly)
 * @ssot @/lib/registry/plans/pricing-config.ts → PRICING_CONFIG
 */
export type PricingConfigKeyType = AllPlanKeyType | AddonKeyType

// ============================================================================
// STRIPE-ALIGNED TIER TYPES
// ============================================================================

/**
 * Pricing Tier Definition (Stripe-aligned)
 * @see Stripe Prices.d.ts: interface Tier
 * @description For tiered (volume or graduated) pricing
 */
export interface StripeTier {
  /** Price for the entire tier (in smallest currency unit) */
  flat_amount: number | null
  /** Same as flat_amount, but decimal string with at most 12 decimal places */
  flat_amount_decimal: string | null
  /** Per unit price for units relevant to the tier */
  unit_amount: number | null
  /** Same as unit_amount, but decimal string with at most 12 decimal places */
  unit_amount_decimal: string | null
  /** Up to and including this quantity will be in this tier */
  up_to: number | null
}

/**
 * Pricing Tier Definition (Autlify simplified)
 * @description Simplified tier for internal use
 */
export interface PricingTier {
  /** Upper bound (inclusive), 'inf' = unlimited */
  upTo: number | 'inf'
  /** Flat fee for this tier (in cents/smallest unit) */
  flatAmount?: number
  /** Per-unit price for this tier (in cents) */
  unitAmount?: number
}

/**
 * Custom Unit Amount (Stripe-aligned)
 * @see Stripe Prices.d.ts: interface CustomUnitAmount
 */
export interface CustomUnitAmount {
  /** Maximum unit amount the customer can specify */
  maximum: number | null
  /** Minimum unit amount the customer can specify */
  minimum: number | null
  /** Starting unit amount which can be updated by customer */
  preset: number | null
}

/**
 * Recurring Configuration (Stripe-aligned)
 * @see Stripe Prices.d.ts: interface Recurring
 */
export interface RecurringConfig {
  /** Billing interval: day, week, month, year */
  interval: RecurringIntervalType
  /** Number of intervals between billings */
  interval_count: number
  /** Meter tracking usage (for metered prices) */
  meter?: string | null
  /** Default trial days when subscribing with trial_from_plan=true */
  trial_period_days?: number | null
  /** Usage type: licensed or metered */
  usage_type: UsageType
}

/**
 * Transform Quantity (Stripe-aligned)
 * @see Stripe Prices.d.ts: interface TransformQuantity
 */
export interface TransformQuantity {
  /** Divide usage by this number */
  divide_by: number
  /** After division, round 'up' or 'down' */
  round: TransformQuantityRoundType
}

/**
 * Overage Configuration (Autlify)
 * @description For base_plus_overage billing scheme
 */
export interface PricingOverage {
  /** Units included in base price */
  includedUnits: number
  /** Price per unit over included (in cents) */
  unitAmount: number
  /** Optional cap on billable units */
  maxUnits?: number
}

// ============================================================================
// TAX CONFIGURATION TYPES
// ============================================================================

/**
 * Tax Category Type
 * @description Standard tax categories for classification
 */
export type TaxCategoryType = 'standard' | 'reduced' | 'zero' | 'exempt' | 'reverse_charge'

/**
 * Tax Configuration (Autlify + Stripe Tax)
 */
export interface PricingTax {
  /** Tax category for this product */
  taxCategory: TaxCategoryType
  /** Stripe tax code (if using Stripe Tax) */
  stripeTaxCode?: string
  /** Custom tax rate override (percentage) */
  customTaxRate?: number
  /** Whether tax is inclusive in price */
  taxInclusive?: boolean
}

// ============================================================================
// PRICING CONFIG INTERFACE
// ============================================================================

/**
 * Complete Pricing Configuration
 * @description Full configuration for a plan or addon
 */

export interface PricingConfig {
  // Identification
  key: string
  type: 'plan' | 'addon'
  name: string
  description?: string

  // Product Classification (for accounting)
  productType: ProductType
  revenueRecognition: import('./finance').RevenueRecognitionType
  deferredRevenue?: import('./finance').DeferredRevenueConfig
  tax?: PricingTax
  accounting?: import('./finance').AccountingConfig

  // Base Pricing
  baseAmount: number   // In cents
  currency: string
  interval: BillingIntervalType

  // Billing Behavior
  billingScheme: BillingSchemeType
  pricingUnit: PricingUnitType

  // Tiered Pricing
  tiers?: PricingTier[]

  // Overage Pricing
  overage?: PricingOverage

  // Feature Grants
  featureOverrides?: Partial<Record<FeatureKey, number | boolean | '∞'>>

  // Stripe Integration
  stripePriceId?: string
  stripeProductId?: string
  stripeTieredPriceId?: string

  // Metadata
  tier?: number
  trialDays?: number
  isActive?: boolean
  sortOrder?: number
}
// export interface PricingConfig {
//   // Identification
//   key: string
//   type: 'plan' | 'addon'
//   name: string
//   description?: string

//   // Product Classification (for accounting)
//   productType: ProductType
//   revenueRecognition: import('./finance').RevenueRecognitionType
//   deferredRevenue?: import('./finance').DeferredRevenueConfig
//   tax?: PricingTax
//   accounting?: import('./finance').AccountingConfig

//   // Base Pricing
//   baseAmount: number   // In cents
//   currency: string
//   interval: BillingIntervalType

//   // Billing Behavior
//   billingScheme: ExtendedBillingSchemeType
//   pricingUnit: PricingUnitType

//   // Tiered Pricing
//   tiers?: PricingTier[]

//   // Overage Pricing
//   overage?: PricingOverage

//   // Feature Grants
//   featureOverrides?: Record<string, number | boolean | '∞'>

//   // Stripe Integration
//   stripePriceId?: string
//   stripeProductId?: string
//   stripeTieredPriceId?: string

//   // Metadata
//   tier?: number
//   trialDays?: number
//   isActive?: boolean
//   sortOrder?: number
// }

// ============================================================================
// PRICE CALCULATION TYPES
// ============================================================================

/**
 * Price Calculation Input
 */
export interface PriceCalculationInput {
  configKey: PriceKey
  quantity?: number
  previousQuantity?: number
}

/**
 * Price Breakdown Item
 */
export interface PriceBreakdownItem {
  description: string
  quantity: number
  unitAmount: number
  amount: number
}

/**
 * Price Calculation Result
 */
export interface PriceCalculationResult {
  totalAmount: number
  baseAmount: number
  overageAmount: number
  quantity: number
  breakdown: PriceBreakdownItem[]
  displayPrice: string
}

/**
 * Subscription Total Calculation Result
 */
export interface SubscriptionTotalResult {
  planCost: PriceCalculationResult
  addonCosts: Record<string, PriceCalculationResult>
  totalMonthly: number
  displayTotal: string
}

export type BillingScope = "agency" | "subAccount";
export type BillingClientProps = {
  scope: BillingScope
  scopeId: string
  section: string
}

// ============================================================================
// Payment Types
// ============================================================================
export type BankCard = {
  id: string;
  cardNumber: string;
  cardholderName: string;
  expiryMonth: string;
  expiryYear: string;
  variant: "default" | "premium" | "platinum" | "black";
  isDefault?: boolean;
  brand?: string;
};

export interface PaymentMethodsCardProps {
  agencyId: string;
  cards: BankCard[];
  className?: string;
}

export interface Invoice {
  id: string;
  date: string;
  description: string;
  amount: string;
  status: "paid" | "pending" | "failed";
  viewUrl?: string;
  downloadUrl?: string;
}

export interface InvoiceListCardProps {
  invoices: Invoice[];
  className?: string;
}

export interface PaymentClientProps {
  /** Scope type */
  scope: BillingScope;
  /** Agency or SubAccount ID */
  scopeId: string;
  /** Stripe Customer ID (required for fetching data) */
  customerId?: string | null;
  /** Agency/Account name for display */
  name?: string;
  /** Show payment methods section (default: true) */
  showPaymentMethods?: boolean;
  /** Show invoices section (default: true) */
  showInvoices?: boolean;
  /** Show dunning section for overdue invoices (default: false) */
  showDunning?: boolean;
  /** Additional CSS classes */
  className?: string;
}

export interface DunningInvoice {
  id: string;
  number: string;
  status: 'open' | 'uncollectible';
  date: string;
  dueDate: string | null;
  amount: string;
  currency: string;
  hostedUrl: string | null;
}

// ============================================================================
// Usage Types
// ============================================================================
export type UsageRow = {
  featureKey: string;
  currentUsage: string;
  maxAllowed: string | null;
  isUnlimited: boolean;
  period: string;
};

export type UsageEventRow = {
  id: string;
  createdAt: string;
  featureKey: string;
  quantity: string;
  actionKey: string | null;
  idempotencyKey: string;
};

export type SummaryResponse = {
  ok: true;
  scope: "AGENCY" | "SUBACCOUNT";
  agencyId: string;
  subAccountId: string | null;
  period: string;
  periodsBack: number;
  window: { periodStart: string; periodEnd: string };
  rows: UsageRow[];
};

export type EventsResponse = {
  ok: true;
  window: { periodStart: string; periodEnd: string };
  events: UsageEventRow[];
};

export interface UsageResource {
  name: string;
  used: number;
  limit: number;
  percentage?: number;
  unit?: string;
}

export interface UsageDetailsTableProps {
  className?: string;
  title?: string;
  description?: string;
  resources: UsageResource[];
}

export interface AllocationCardProps {
  className?: string;
}

export interface UsageClientProps {
  /** The scope type - either 'agency' or 'subAccount' */
  scope: BillingScope;
  /** The ID of the agency or sub-account */
  scopeId: string;
  /** Optional: Whether to show the cost allocation section */
  showAllocation?: boolean;
  /** Optional: Default period for usage view */
  defaultPeriod?: "MONTHLY" | "WEEKLY" | "DAILY" | "YEARLY";
  /** Additional CSS classes */
  className?: string;
}

// ============================================================================
// Promotional Types
// ============================================================================

export interface PromotionalClientProps {
  /** The scope type - either 'agency' or 'subAccount' */
  scope: BillingScope;
  /** The ID of the agency or sub-account */
  scopeId: string;
  /** Optional: Whether to show the credits section */
  showCredits?: boolean;
  /** Optional: Whether to show the coupons section */
  showCoupons?: boolean;
  /** Additional CSS classes */
  className?: string;
}

export interface Entitlement {
  key: string;
  title?: string;
  creditEnabled?: boolean;
  creditExpires?: boolean;
  period?: string;
  scope?: string;
}

export interface CreditsBalanceRow {
  featureKey: string;
  balance: string;
  expiresAt: string | null;
}

export interface Coupon {
  id: string;
  percent_off: number | null;
  amount_off: number | null;
  currency: string | null;
  duration: string;
  duration_in_months: number | null;
}


export interface CouponCardProps {
  className?: string;
}

// ============================================================================
// CREDITS CARD - Credit Balances & Top-Up
// ============================================================================

export interface CreditsCardProps {
  agencyId: string;
  subAccountId?: string | null;
  className?: string;
}


export interface CreditBalance {
  total: number
  used: number
  remaining: number
  expiresAt?: Date
  currency: string
}

export interface CreditBalanceCardProps {
  balance: CreditBalance
  onPurchaseCredits?: () => void
  className?: string
}


// ============================================================================
// SUBSCRIPTION MANAGEMENT TYPES
// ============================================================================

export interface Plan {
  id: string;
  title: string;
  description: string;
  highlight?: boolean;
  type?: "monthly" | "yearly";
  currency?: string;
  monthlyPrice: number | string;
  yearlyPrice: number | string;
  buttonText: string;
  badge?: string;
  features: {
    name: string;
    icon: string;
    iconColor?: string;
  }[];
}

export interface CurrentPlan {
  plan: Plan;
  type: "monthly" | "yearly" | "custom";
  price: string;
  nextBillingDate: string;
  paymentMethod: string;
  status: "active" | "inactive" | "past_due" | "cancelled";
}

export interface TrialExpiryCardProps {
  trialEndDate?: Date | string | number;
  daysRemaining?: number;
  onUpgrade?: () => void | Promise<void>;  
  cancelTrial: CancelSubscriptionDialogProps
  className?: string;
  title?: string;
  description?: string;
  upgradeButtonText?: string; 
  features?: string[];
}

export interface TrialTimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export interface CancelSubscriptionDialogProps {
  title: string;
  description: string;
  plan: Plan;
  triggerButtonText?: string;
  leftPanelImageUrl?: string;
  warningTitle?: string;
  warningText?: string;
  keepButtonText?: string;
  continueButtonText?: string;
  finalTitle?: string;
  finalSubtitle?: string;
  finalWarningText?: string;
  goBackButtonText?: string;
  confirmButtonText?: string;
  open?: boolean;
  onCancel: (planId: string) => Promise<void> | void;
  onKeepSubscription?: (planId: string) => Promise<void> | void;
  onDialogClose?: () => void;
  className?: string;
}

export interface UpdatePlanDialogProps {
  currentPlan: Plan;
  plans: Plan[];
  triggerText: string;
  onPlanChange: (planId: string) => void;
  className?: string;
  title?: string;
}


export interface SubscriptionManagementProps {
  className?: string;
  currentPlan: CurrentPlan;
  cancelSubscription: CancelSubscriptionDialogProps;
  updatePlan: UpdatePlanDialogProps;
}

export interface SubscriptionClientProps {
  scope: BillingScope
  scopeId: string
}

// ============================================================================
// E-INVOICE INTERNATIONAL STANDARDS (UBL 2.1, Peppol, EN16931)
// ============================================================================

/**
 * E-Invoice Format Type
 * @description International e-Invoice formats/standards
 * @see UBL 2.1: http://docs.oasis-open.org/ubl/UBL-2.1.html
 * @see Peppol BIS: https://docs.peppol.eu/poacc/billing/3.0/
 * @see EN16931: European semantic standard for e-invoicing
 * 
 * IMPORTANT: Do not hardcode format-specific values. Use external lookup
 * for country-specific requirements and validation rules.
 */
export type EInvoiceFormatType =
  | 'UBL_2_1'           // OASIS Universal Business Language 2.1
  | 'CII_D16B'          // UN/CEFACT Cross Industry Invoice D16B
  | 'PEPPOL_BIS_3'      // Peppol Business Interoperability Specification 3.0
  | 'EN16931'           // European semantic standard
  | 'MYINVOIS'          // Malaysia LHDN MyInvois
  | 'ZATCA_FATOORA'     // Saudi Arabia ZATCA Fatoora
  | 'SGP_INVOICENOW'    // Singapore InvoiceNow (Peppol-based)
  | 'FACTUR_X'          // France/Germany hybrid PDF/XML
  | 'XRECHNUNG'         // German e-Invoice standard (EN16931 CIUS)
  | 'FatturaPA'         // Italy electronic invoice
  | 'GST_EINVOICE'      // India GST e-Invoice

/**
 * E-Invoice Status Type
 * @description Lifecycle status of an e-Invoice submission
 */
export type EInvoiceStatusType =
  | 'draft'             // Not yet validated or submitted
  | 'pending_validation'// Awaiting format/schema validation
  | 'validated'         // Passed validation, ready to submit
  | 'submitted'         // Sent to tax authority/recipient
  | 'accepted'          // Accepted by tax authority
  | 'rejected'          // Rejected with errors
  | 'cancelled'         // Cancelled after acceptance
  | 'expired'           // Past submission deadline

/**
 * E-Invoice Document Type (UBL codelist)
 * @description Document type codes per UNCL1001
 * @see https://docs.peppol.eu/poacc/billing/3.0/codelist/UNCL1001-inv/
 */
export type EInvoiceDocumentType =
  | '380'   // Commercial invoice
  | '381'   // Credit note
  | '383'   // Debit note
  | '384'   // Corrected invoice
  | '386'   // Prepayment invoice
  | '389'   // Self-billed invoice
  | '751'   // Invoice information for accounting purposes

/**
 * Tax Scheme ID (Peppol/UBL)
 * @description Standard tax scheme identifiers
 */
export type TaxSchemeIdType =
  | 'VAT'       // Value Added Tax
  | 'GST'       // Goods and Services Tax
  | 'SST'       // Sales and Service Tax (Malaysia)
  | 'TIN'       // Tax Identification Number scheme
  | 'ABN'       // Australian Business Number
  | 'GST_MY'    // Malaysia GST (historical, pre-SST)

/**
 * Party Identification Scheme
 * @description Standard party/business identification schemes
 * @see https://docs.peppol.eu/poacc/billing/3.0/codelist/ICD/
 */
export type PartySchemeIdType =
  | '0007'      // Sweden Organization Number
  | '0009'      // French SIRET-CODE
  | '0060'      // DUNS Number
  | '0088'      // EAN Location Code
  | '0106'      // Netherlands KVK-nummer
  | '0135'      // Japanese Corporate Number
  | '0183'      // Accounting and Corporate Regulatory Authority (SG)
  | '0195'      // Singapore Unique Entity Number
  | '0199'      // Legal Entity Identifier (LEI)
  | '0200'      // UK Companies House Company Number
  | '0230'      // Malaysian SSM Registration (MyKad/MyCoID)
  | string      // Other ICD codes from ISO 6523

/**
 * E-Invoice Party (Supplier/Customer)
 * @description Party information per UBL 2.1 / EN16931
 */
export interface EInvoiceParty {
  /** Party name (required) */
  name: string
  /** Trading name (if different from legal name) */
  tradingName?: string
  /** Party identification (registration number, etc.) */
  partyIdentification?: {
    id: string
    schemeId?: PartySchemeIdType
  }[]
  /** Tax registration (VAT/GST number) */
  taxRegistration?: {
    companyId: string
    taxScheme: TaxSchemeIdType
  }[]
  /** Postal address */
  postalAddress?: EInvoiceAddress
  /** Contact information */
  contact?: EInvoiceContact
  /** Legal entity information */
  legalEntity?: {
    registrationName: string
    companyId?: string
    companyIdScheme?: string
  }
}

/**
 * E-Invoice Address (UBL 2.1)
 * @description Address per UBL AddressType
 */
export interface EInvoiceAddress {
  /** Street name and building number */
  streetName?: string
  /** Additional street name */
  additionalStreetName?: string
  /** City name */
  cityName?: string
  /** Postal/ZIP code */
  postalZone?: string
  /** State/region/province */
  countrySubentity?: string
  /** Country code (ISO 3166-1 alpha-2) */
  countryCode: string
}

/**
 * E-Invoice Contact
 * @description Contact information per UBL ContactType
 */
export interface EInvoiceContact {
  name?: string
  telephone?: string
  email?: string
}

/**
 * E-Invoice Line Item (UBL 2.1)
 * @description Invoice line per UBL InvoiceLineType / EN16931 BG-25
 */
export interface EInvoiceLineItem {
  /** Line ID (sequential, starts at 1) */
  id: string
  /** Quantity */
  invoicedQuantity: number
  /** Quantity unit code (UN/ECE rec 20) */
  unitCode: string
  /** Line extension amount (quantity × price, before tax) */
  lineExtensionAmount: number
  /** Currency code (ISO 4217) */
  currencyCode: string
  /** Item/commodity classification */
  item: {
    name: string
    description?: string
    /** Seller's item identification */
    sellersItemId?: string
    /** Standard item identification (e.g., GTIN/EAN) */
    standardItemId?: {
      id: string
      schemeId?: 'GTIN' | 'EAN' | 'UPC' | string
    }
    /** Commodity classification */
    commodityClassification?: {
      itemClassificationCode: string
      /** Classification scheme (SIC, MSIC, ISIC, NACE, UNSPSC, etc.) */
      listId: IndustryClassificationSchemeType
    }[]
    /** Tax category for this item */
    taxCategory?: EInvoiceTaxCategory
  }
  /** Price information */
  price: {
    priceAmount: number
    baseQuantity?: number
  }
  /** Allowances/charges at line level */
  allowanceCharge?: EInvoiceAllowanceCharge[]
  /** Order line reference */
  orderLineReference?: string
}

/**
 * E-Invoice Tax Category (UBL 2.1 / Peppol)
 * @description Tax category per UNCL5305
 * @see https://docs.peppol.eu/poacc/billing/3.0/codelist/UNCL5305/
 */
export interface EInvoiceTaxCategory {
  /** Tax category code (UNCL5305) */
  id: EInvoiceTaxCategoryCode
  /** Tax percentage */
  percent?: number
  /** Tax scheme ID */
  taxScheme: TaxSchemeIdType
  /** Exemption reason code (if applicable) */
  exemptionReasonCode?: string
  /** Exemption reason text */
  exemptionReason?: string
}

/**
 * Tax Category Codes (UNCL5305)
 * @description Duty/tax/fee category codes
 */
export type EInvoiceTaxCategoryCode =
  | 'S'   // Standard rate
  | 'Z'   // Zero rated goods
  | 'E'   // Exempt from tax
  | 'AE'  // VAT Reverse Charge
  | 'K'   // Intra-community supply (VAT exempt)
  | 'G'   // Export outside the EU (exempt)
  | 'O'   // Services outside scope of tax
  | 'L'   // Canary Islands general indirect tax
  | 'M'   // Canary Islands general indirect tax (other)

/**
 * E-Invoice Allowance/Charge
 * @description Allowance or charge per UBL AllowanceChargeType
 */
export interface EInvoiceAllowanceCharge {
  /** true = charge, false = allowance */
  chargeIndicator: boolean
  /** Reason code (e.g., discount, freight) */
  allowanceChargeReasonCode?: string
  /** Reason description */
  allowanceChargeReason?: string
  /** Percentage (if percentage-based) */
  multiplierFactorNumeric?: number
  /** Amount */
  amount: number
  /** Base amount (if percentage-based) */
  baseAmount?: number
  /** Tax category for this allowance/charge */
  taxCategory?: EInvoiceTaxCategory
}

/**
 * E-Invoice Payment Means (UBL 2.1)
 * @description Payment method per UNCL4461
 * @see https://docs.peppol.eu/poacc/billing/3.0/codelist/UNCL4461/
 */
export type EInvoicePaymentMeansCode =
  | '1'   // Instrument not defined
  | '10'  // In cash
  | '20'  // Cheque
  | '30'  // Credit transfer
  | '31'  // Debit transfer
  | '42'  // Payment to bank account
  | '48'  // Bank card
  | '49'  // Direct debit
  | '57'  // Standing agreement
  | '58'  // SEPA credit transfer
  | '59'  // SEPA direct debit
  | 'ZZZ' // Mutually defined

/**
 * E-Invoice Full Document
 * @description Complete e-Invoice structure per UBL 2.1 / EN16931
 */
export interface EInvoiceDocument {
  /** E-Invoice format/standard */
  format: EInvoiceFormatType
  /** Customization ID (identifies the CIUS or profile) */
  customizationId?: string
  /** Profile ID (e.g., Peppol BIS Billing 3.0) */
  profileId?: string
  /** Invoice number (unique within supplier context) */
  id: string
  /** Issue date (ISO 8601) */
  issueDate: string
  /** Due date (ISO 8601) */
  dueDate?: string
  /** Document type code */
  invoiceTypeCode: EInvoiceDocumentType
  /** Document currency code (ISO 4217) */
  documentCurrencyCode: string
  /** Tax currency code (if different from document currency) */
  taxCurrencyCode?: string
  /** Accounting cost reference */
  accountingCost?: string
  /** Buyer reference (e.g., PO number) */
  buyerReference?: string
  /** Invoice period */
  invoicePeriod?: {
    startDate?: string
    endDate?: string
  }
  /** Order reference */
  orderReference?: {
    id: string
    salesOrderId?: string
  }
  /** Contract document reference */
  contractDocumentReference?: {
    id: string
  }
  /** Supplier/seller party */
  accountingSupplierParty: EInvoiceParty
  /** Customer/buyer party */
  accountingCustomerParty: EInvoiceParty
  /** Delivery information */
  delivery?: {
    actualDeliveryDate?: string
    deliveryLocation?: {
      address?: EInvoiceAddress
    }
  }
  /** Payment means */
  paymentMeans?: {
    paymentMeansCode: EInvoicePaymentMeansCode
    paymentId?: string
    payeeFinancialAccount?: {
      id: string
      name?: string
      financialInstitutionId?: string
    }
  }[]
  /** Payment terms */
  paymentTerms?: {
    note?: string
  }
  /** Document-level allowances/charges */
  allowanceCharge?: EInvoiceAllowanceCharge[]
  /** Tax totals */
  taxTotal?: {
    taxAmount: number
    taxSubtotal?: {
      taxableAmount: number
      taxAmount: number
      taxCategory: EInvoiceTaxCategory
    }[]
  }[]
  /** Legal monetary total */
  legalMonetaryTotal: {
    lineExtensionAmount: number
    taxExclusiveAmount: number
    taxInclusiveAmount: number
    allowanceTotalAmount?: number
    chargeTotalAmount?: number
    prepaidAmount?: number
    payableRoundingAmount?: number
    payableAmount: number
  }
  /** Invoice lines */
  invoiceLine: EInvoiceLineItem[]
  /** Submission metadata */
  submissionMetadata?: EInvoiceSubmissionMetadata
}

/**
 * E-Invoice Submission Metadata
 * @description Metadata for e-Invoice submission tracking
 */
export interface EInvoiceSubmissionMetadata {
  /** Submission status */
  status: EInvoiceStatusType
  /** Submission timestamp (ISO 8601) */
  submittedAt?: string
  /** Tax authority response ID */
  authorityResponseId?: string
  /** Tax authority validation ID (e.g., LHDN UUID) */
  validationId?: string
  /** QR code data (for jurisdictions requiring printed QR) */
  qrCodeData?: string
  /** Digital signature */
  digitalSignature?: {
    signedAt: string
    signatureValue: string
    certificateInfo?: string
  }
  /** Validation errors (if rejected) */
  validationErrors?: {
    code: string
    message: string
    path?: string
  }[]
}

// ============================================================================
// INDUSTRY CLASSIFICATION TYPES (SIC, MSIC, ISIC, NACE)
// ============================================================================

/**
 * Industry Classification Scheme Type
 * @description Major industry classification systems
 * 
 * IMPORTANT: Classification codes should be looked up from authoritative
 * sources, not hardcoded. Use API or database lookup for actual codes.
 * 
 * @see MSIC: https://www.dosm.gov.my/v1/index.php?r=column3/msic2008
 * @see ISIC: https://unstats.un.org/unsd/classifications/Econ/isic
 * @see SIC: https://www.osha.gov/data/sic-search
 * @see NACE: https://ec.europa.eu/eurostat/web/nace-rev2
 */
export type IndustryClassificationSchemeType =
  | 'MSIC_2008'        // Malaysian Standard Industrial Classification 2008
  | 'MSIC_2020'        // Malaysian Standard Industrial Classification 2020
  | 'ISIC_REV4'        // International Standard Industrial Classification Rev.4
  | 'SIC_US'           // US Standard Industrial Classification
  | 'NAICS_2022'       // North American Industry Classification System 2022
  | 'NACE_REV2'        // Statistical Classification of Economic Activities in EC
  | 'SSIC_2020'        // Singapore Standard Industrial Classification 2020
  | 'ANZSIC_2006'      // Australian/New Zealand SIC 2006
  | 'UNSPSC'           // United Nations Standard Products and Services Code
  | 'CPV'              // Common Procurement Vocabulary (EU)
  | 'HS_2022'          // Harmonized System 2022 (customs/trade)

/**
 * Industry Classification Entry
 * @description Standard structure for industry/product codes
 */
export interface IndustryClassification {
  /** Classification scheme used */
  scheme: IndustryClassificationSchemeType
  /** Classification code (e.g., "62010" for MSIC software publishing) */
  code: string
  /** Description (should be looked up, not hardcoded) */
  description?: string
  /** Version or revision of the scheme */
  version?: string
  /** Parent code (for hierarchical classifications) */
  parentCode?: string
  /** Level in hierarchy (e.g., section, division, group, class) */
  level?: number
}

/**
 * Business Registration Info
 * @description Business registration with industry classification
 */
export interface BusinessRegistration {
  /** Registration number (e.g., SSM number for Malaysia) */
  registrationNumber: string
  /** Company/business name */
  businessName: string
  /** Trading name (if different) */
  tradingName?: string
  /** Registration type */
  registrationType?: 'company' | 'sole_proprietor' | 'partnership' | 'llp' | 'foreign_company'
  /** Country of registration (ISO 3166-1 alpha-2) */
  countryCode: string
  /** Primary industry classification */
  primaryIndustry?: IndustryClassification
  /** Secondary industry classifications */
  secondaryIndustries?: IndustryClassification[]
  /** Tax identifications */
  taxIdentifications?: TaxIdentification[]
}

/**
 * Tax Identification
 * @description Tax registration/identification number
 */
export interface TaxIdentification {
  /** Tax ID type */
  type: TaxIdentificationType
  /** Tax ID value */
  value: string
  /** Issuing country (ISO 3166-1 alpha-2) */
  countryCode: string
  /** Scheme ID for electronic identification */
  schemeId?: PartySchemeIdType
}

/**
 * Tax Identification Type
 * @description Common tax ID types worldwide
 */
export type TaxIdentificationType =
  | 'VAT'              // VAT registration number
  | 'GST'              // GST registration number
  | 'SST'              // Malaysia SST registration
  | 'TIN'              // Tax identification number (generic)
  | 'BRN'              // Business registration number
  | 'ABN'              // Australian Business Number
  | 'GST_IN'           // India GSTIN
  | 'EORI'             // EU Economic Operators Registration ID
  | 'SIRET'            // France SIRET
  | 'KVK'              // Netherlands KVK
  | 'UEN'              // Singapore Unique Entity Number
  | 'CRN'              // Company Registration Number (generic)

// ============================================================================
// DISCOUNT TYPES (Invoice & Subscription)
// ============================================================================

/**
 * Discount Type
 * @description Types of discounts applicable to invoices/subscriptions
 */
export type DiscountType =
  | 'percentage'        // Percentage off (e.g., 10% off)
  | 'fixed_amount'      // Fixed amount off (e.g., $10 off)
  | 'free_shipping'     // Waive shipping costs (for goods)
  | 'buy_x_get_y'       // Buy X get Y free/discounted
  | 'tiered'            // Discount based on quantity/amount tiers

/**
 * Discount Application Scope
 * @description Where the discount applies
 */
export type DiscountScopeType =
  | 'invoice'           // Entire invoice/order
  | 'line_item'         // Specific line item(s)
  | 'subscription'      // Subscription recurring charges
  | 'shipping'          // Shipping/delivery charges only
  | 'specific_product'  // Specific product(s) only

/**
 * Discount Duration Type (Stripe-aligned)
 * @description How long the discount lasts
 * @see Stripe Coupon: duration
 */
export type DiscountDurationType =
  | 'once'              // Apply once
  | 'repeating'         // Apply for X months (see duration_in_months)
  | 'forever'           // Apply indefinitely

/**
 * Discount Configuration
 * @description Complete discount definition
 */
export interface DiscountConfig {
  /** Unique discount/coupon ID */
  id: string
  /** Display name */
  name: string
  /** Discount type */
  type: DiscountType
  /** Where discount applies */
  scope: DiscountScopeType
  /** Duration type */
  duration: DiscountDurationType
  /** Number of months (for 'repeating' duration) */
  durationInMonths?: number
  /** Percentage off (0-100) - for 'percentage' type */
  percentOff?: number
  /** Fixed amount off (in smallest currency unit) - for 'fixed_amount' type */
  amountOff?: number
  /** Currency for fixed amount discount */
  currency?: CurrencyCodeType
  /** Maximum redemption count (null = unlimited) */
  maxRedemptions?: number | null
  /** Current redemption count */
  timesRedeemed?: number
  /** Valid from date (ISO 8601) */
  validFrom?: string
  /** Expiry date (ISO 8601) */
  expiresAt?: string
  /** Minimum purchase amount to qualify (in smallest currency unit) */
  minimumAmount?: number
  /** Applicable product IDs (for 'specific_product' scope) */
  applicableProducts?: string[]
  /** Applicable plan keys */
  applicablePlans?: PlanKeyType[]
  /** Stripe coupon ID */
  stripeCouponId?: string
  /** Stripe promotion code */
  stripePromoCode?: string
  /** Is active */
  isActive: boolean
  /** Metadata */
  metadata?: Record<string, string>
}

/**
 * Applied Discount
 * @description A discount applied to an invoice/subscription
 */
export interface AppliedDiscount {
  /** Discount configuration */
  discount: DiscountConfig
  /** Calculated discount amount (in smallest currency unit) */
  discountAmount: number
  /** Original amount before discount */
  originalAmount: number
  /** Final amount after discount */
  finalAmount: number
  /** Applied at timestamp (ISO 8601) */
  appliedAt: string
  /** Source (how discount was applied) */
  source: 'coupon' | 'promo_code' | 'automatic' | 'manual'
}

// ============================================================================
// TAX EXEMPTION TYPES (E-Invoice Compliance)
// ============================================================================

/**
 * Tax Exemption Reason Code (UNCL5305 Extension)
 * @description Standard exemption reason codes for e-Invoicing
 * @see https://docs.peppol.eu/poacc/billing/3.0/codelist/vatex/
 */
export type TaxExemptionReasonCode =
  // EU VAT Exemptions
  | 'VATEX-EU-79-C'     // Exempt based on Art. 79c (Intra-community supply)
  | 'VATEX-EU-132'      // Exempt under Art. 132 (specific activities)
  | 'VATEX-EU-143'      // Exempt under Art. 143 (importation)
  | 'VATEX-EU-148'      // Exempt under Art. 148 (international transport)
  | 'VATEX-EU-151'      // Exempt under Art. 151 (diplomatic/consular)
  | 'VATEX-EU-G'        // Export outside EU
  | 'VATEX-EU-O'        // Services outside EU VAT scope
  | 'VATEX-EU-IC'       // Intra-community supply
  | 'VATEX-EU-AE'       // Reverse charge
  // Malaysian SST Exemptions
  | 'EXEMP-MY-SST-A'    // SST Exempt - Schedule A (Essential goods)
  | 'EXEMP-MY-SST-B'    // SST Exempt - Schedule B (Manufacturing)
  | 'EXEMP-MY-SST-C'    // SST Exempt - Schedule C (Export)
  | 'EXEMP-MY-SERVICE'  // Service tax exemption
  // Singapore GST
  | 'EXEMP-SG-ZERO'     // Zero-rated supply
  | 'EXEMP-SG-EXEMPT'   // Exempt supply
  | 'EXEMP-SG-IRAS'     // IRAS approved exemption
  // General
  | 'EXEMP-EXPORT'      // Export exemption (general)
  | 'EXEMP-DIPLOMATIC'  // Diplomatic exemption
  | 'EXEMP-GOVERNMENT'  // Government entity exemption
  | 'EXEMP-NONPROFIT'   // Non-profit organization
  | 'EXEMP-SMALL-BIZ'   // Small business exemption
  | 'EXEMP-MEDICAL'     // Medical/healthcare services
  | 'EXEMP-EDUCATION'   // Educational services
  | 'EXEMP-FINANCIAL'   // Financial services
  | string              // Custom exemption code

/**
 * Tax Exemption Certificate
 * @description Documentation proving tax exemption status
 */
export interface TaxExemptionCertificate {
  /** Certificate ID/number */
  certificateId: string
  /** Exemption type */
  exemptionType: TaxExemptionReasonCode
  /** Issuing authority */
  issuingAuthority: string
  /** Country of issuance */
  countryCode: CountryCodeType
  /** Issue date (ISO 8601) */
  issueDate: string
  /** Expiry date (ISO 8601) - null for permanent */
  expiryDate?: string | null
  /** Tax types covered by exemption */
  coveredTaxTypes: TaxSchemeIdType[]
  /** Percentage exempted (100 = full exemption) */
  exemptionPercentage: number
  /** Document/file URL if uploaded */
  documentUrl?: string
  /** Verification status */
  verificationStatus: 'pending' | 'verified' | 'rejected' | 'expired'
  /** Verified by (authority or system) */
  verifiedBy?: string
  /** Verification date */
  verifiedAt?: string
  /** Additional notes */
  notes?: string
}

/**
 * Tax Exemption Status
 * @description Customer/entity tax exemption status
 */
export interface TaxExemptionStatus {
  /** Is entity tax exempt */
  isExempt: boolean
  /** Exemption type (if exempt) */
  exemptionType?: TaxExemptionReasonCode
  /** Exemption reason text (for e-Invoice) */
  exemptionReason?: string
  /** Exemption certificates on file */
  certificates?: TaxExemptionCertificate[]
  /** Countries where exemption applies */
  exemptCountries?: CountryCodeType[]
  /** Specific tax types exempted */
  exemptTaxTypes?: TaxSchemeIdType[]
  /** Partial exemption percentage (if not fully exempt) */
  exemptionPercentage?: number
  /** Last verified date */
  lastVerifiedAt?: string
}

// ============================================================================
// UNIT, LANGUAGE, AND ADDITIONAL ISO TYPES
// ============================================================================

/**
 * Unit Code Type (UN/ECE Recommendation 20)
 * @description Common unit of measure codes for invoicing
 * @see https://unece.org/trade/uncefact/cl-recommendations
 */
export type UnitCodeType =
  | 'C62'   // One (unit)
  | 'EA'    // Each
  | 'HUR'   // Hour
  | 'DAY'   // Day
  | 'MON'   // Month
  | 'ANN'   // Year
  | 'MTR'   // Metre
  | 'KGM'   // Kilogram
  | 'LTR'   // Litre
  | 'MTK'   // Square metre
  | 'MTQ'   // Cubic metre
  | 'KWH'   // Kilowatt hour
  | 'SET'   // Set
  | 'PR'    // Pair
  | 'PK'    // Pack
  | 'BX'    // Box
  | string  // Allow any UN/ECE rec 20 code

/**
 * Language Code Type (ISO 639-1)
 * @description Two-letter language codes for localization
 */
export type LanguageCodeType =
  | 'en'    // English
  | 'ms'    // Malay
  | 'zh'    // Chinese
  | 'ta'    // Tamil
  | 'ja'    // Japanese
  | 'ko'    // Korean
  | 'id'    // Indonesian
  | 'th'    // Thai
  | 'vi'    // Vietnamese
  | 'de'    // German
  | 'fr'    // French
  | 'es'    // Spanish
  | 'ar'    // Arabic
  | string  // Allow any ISO 639-1 code

// ============================================================================
// STRIPE CATALOG TYPES (For local catalog sync with Stripe)
// ============================================================================

/**
 * Addon Type Classification
 * @description Types of add-on products
 */
export type AddonClassificationType = 'support' | 'branding' | 'finance' | 'integration' | 'feature'

/**
 * Addon Category Classification
 * @description Categories for grouping add-ons (matches module structure)
 */
export type AddonCategoryType = 'org' | 'fi' | 'co' | 'crm' | 'apps' | 'iam'

/**
 * Catalog Product - Local representation of a Stripe Product
 * @description Used for deterministic ID generation and Stripe catalog sync
 * Uses deterministic IDs generated from product attributes
 */
export interface CatalogProduct {
  /** Deterministic product ID (prod_xxxx) - generated locally */
  id: string
  /** Product name displayed to customers */
  name: string
  /** Product description */
  description: string
  /** Product type */
  type: ProductType
  /** Unit label (account, headcount, etc.) */
  unitLabel: string
  /** Whether this is an add-on (vs base plan) */
  isAddon: boolean
  /** Addon category (if addon) - matches module codes */
  category?: AddonCategoryType
  /** Addon type (if addon) */
  addonType?: AddonClassificationType
  /** Module this addon belongs to (e.g., fi-gl) */
  module?: string
  /** Required addon key (dependency) */
  requires?: string
  /** Features this product grants access to (FeatureKey strings) */
  features?: string[]
  /** Marketing features for display */
  marketingFeatures?: string[]
  /** Product images */
  images?: string[]
  /** Active status */
  active: boolean
  /** Additional metadata */
  metadata?: Record<string, string>
}

/**
 * Catalog Price - Local representation of a Stripe Price
 * @description Used for deterministic ID generation and Stripe catalog sync
 * Uses deterministic IDs generated from price attributes
 */
export interface CatalogPrice {
  /** Deterministic price ID (price_xxxx) - generated locally */
  id: string
  /** Reference to product ID */
  productId: string
  /** Price nickname for display */
  nickname: string
  /** Currency code (lowercase) */
  currency: string
  /** Unit amount in smallest currency unit (cents/sen) */
  unitAmount: number | null
  /** Billing scheme */
  billingScheme: StripeBillingSchemeType
  /** Recurring configuration (null for one-time) */
  recurring?: {
    interval: RecurringIntervalType
    intervalCount: number
    trialPeriodDays: number | null
    usageType: UsageType
  }
  /** Tiered pricing configuration */
  tiers?: {
    upTo: number | null
    unitAmount: number | null
    flatAmount: number | null
  }[]
  /** Tiers mode (if tiered) */
  tiersMode?: TiersModeType
  /** Lookup key for easy retrieval */
  lookupKey?: string
  /** Active status */
  active: boolean
  /** Additional metadata */
  metadata?: Record<string, string>
}

/**
 * Plan Definition - Base subscription plan with entitlements
 * @description Used for plan configuration and pricing display
 */
export interface PlanDefinition {
  /** Plan key (STARTER, BASIC, ADVANCED, ENTERPRISE) */
  key: PlanKeyType
  /** Display name */
  name: string
  /** Description */
  description: string
  /** Monthly price in MYR (display only) */
  monthlyPrice: number
  /** Tier level (1-4) for comparison */
  tier: number
  /** Trial days */
  trialDays: number
  /** Whether this is the recommended/popular plan */
  isPopular?: boolean
  /** Product ID reference */
  productId: string
  /** Monthly price ID reference */
  monthlyPriceId: string
  /** Yearly price ID reference */
  yearlyPriceId?: string
  /** Feature limits (maps to FeatureKey strings) */
  limits: Record<string, number | boolean | 'unlimited'>
}

/**
 * Addon Definition - Add-on product with feature grants
 * @description Used for addon configuration and pricing display
 */
export interface AddonDefinition {
  /** Addon key (PRIORITY_SUPPORT, WHITE_LABEL, FI_GL, etc.) */
  key: AddonKeyType
  /** Display name */
  name: string
  /** Description */
  description: string
  /** Monthly price in MYR (display only) */
  monthlyPrice: number
  /** Category for grouping */
  category: AddonCategoryType
  /** Type for classification */
  addonType: AddonClassificationType
  /** Product ID reference */
  productId: string
  /** Monthly price ID reference */
  monthlyPriceId: string
  /** Yearly price ID reference */
  yearlyPriceId?: string
  /** Required addon key (dependency) */
  requires?: AddonKeyType
  /** Features this addon grants (maps to FeatureKey strings) */
  grants: Record<string, number | boolean | 'unlimited'>
}

// ============================================================================
// PRICING UI TYPES
// SSoT: This interface is the canonical type for pricing card display
// @see @/lib/registry/plans/pricing-config.ts for implementation
// ============================================================================

/**
 * Pricing Card Data for UI display
 * @ssot types/billing.ts - This is the canonical type definition
 * @description Used by getPricingCards() in pricing-config.ts
 */
export interface PricingCardData {
  /** Plan/config key (e.g., 'STARTER', 'BASIC', 'ADVANCED') */
  key: string
  /** Display title */
  title: string
  /** Plan description */
  description: string
  /** Formatted price string (e.g., "RM 79.00") */
  price: string
  /** Price amount in cents */
  priceAmount: number
  /** Stripe price ID */
  priceId: string
  /** Billing interval */
  interval: 'month' | 'year'
  /** Feature list for display */
  features: string[]
  /** Whether to highlight this plan (e.g., "Most Popular") */
  highlight: boolean
  /** Whether trial is enabled */
  trialEnabled: boolean
  /** Number of trial days */
  trialDays: number
  /** Whether this uses tiered pricing */
  isTiered: boolean
  /** Savings description for yearly plans */
  savings?: string
}

export type CheckoutFormProps = {
  priceId: string
  planConfig: {
    title: string
    price: string
    duration: string
    features: string[]
    trialEnabled: boolean
    trialPeriodDays: number
  }
  user: {
    id: string
    email: string
    name: string
    firstName: string
    lastName: string
    trialEligible: boolean
  }
  agencyEmail: string
  existingCustomer: {
    id: string
    email: string | null
    name: string | null
    phone: string | null
    address: {
      line1: string | null
      line2: string | null
      city: string | null
      state: string | null
      postal_code: string | null
      country: string | null
    } | null
    metadata: Record<string, string>
  } | null
  existingPaymentMethods: {
    id: string
    card: {
      cardholder_name: string | null
      brand: string
      last4: string
      exp_month: number
      exp_year: number
      isDefault: boolean
    } | null
  }[]
  /** Available addons for upsell during checkout */
  availableAddons?: AddonCardData[]
}

// ============================================================================
// UNIFIED CHECKOUT TYPES
// ============================================================================

/**
 * Checkout Type - What kind of purchase is being made
 */
export type CheckoutType = 'plan' | 'addon' | 'credits'

/**
 * Checkout Mode - How the checkout is displayed
 */
export type CheckoutMode = 'page' | 'modal'

/**
 * Checkout Item - Generic item being purchased
 */
export interface CheckoutItem {
  /** Unique key for the item */
  key: string
  /** Item type */
  type: CheckoutType
  /** Display title */
  title: string
  /** Description */
  description: string
  /** Formatted price string (e.g., "RM 79.00") */
  price: string
  /** Price amount in cents */
  priceAmount: number
  /** Stripe price ID */
  priceId: string
  /** Quantity (for credits) */
  quantity?: number
  /** Billing interval */
  interval: 'month' | 'year' | 'one_time'
  /** Feature list for display */
  features?: string[]
  /** Trial configuration */
  trial?: {
    enabled: boolean
    days: number
  }
}

/**
 * Existing Customer Data for pre-fill
 */
export interface CustomerData
 {
  id: string
  email: string | null
  name: string | null
  phone: string | null
  address: {
    line1: string | null
    line2: string | null
    city: string | null
    state: string | null
    postal_code: string | null
    country: string | null
  } | null
  metadata: Record<string, string>
}

/**
 * Existing Payment Method
 */
export interface PaymentMethod {
  id: string
  card: {
    cardholder_name: string | null
    brand: string
    last4: string
    exp_month: number
    exp_year: number
    isDefault: boolean
  } | null
}

/**
 * Checkout User - User information for checkout
 */
export interface User {
  id: string
  email: string
  name: string
  firstName: string
  lastName: string
  trialEligible?: boolean
}

/**
 * Checkout Context - Agency/account context for the checkout
 */
export interface CheckoutContext {
  /** Existing agency ID (for addon/credits checkout) */
  agencyId?: string
  /** Existing customer ID */
  customerId?: string
  /** Whether this is a new subscription */
  isNewSubscription: boolean
}

/**
 * Unified Checkout Props - Props for the unified checkout component
 */
export interface CheckoutProps {
  /** Checkout mode - page or modal */
  mode: CheckoutMode
  /** Primary item being purchased */
  item: CheckoutItem
  /** Additional items (addons during plan checkout) */
  additionalItems?: CheckoutItem[]
  /** Available addons for upsell */
  availableAddons?: AddonCardData[]
  /** User information */
  user: User
  /** Checkout context (agency, customer) */
  context: CheckoutContext
  /** Existing customer data for pre-fill */
  existingCustomer?: CustomerData | null
  /** Existing payment methods */
  existingPaymentMethods?: PaymentMethod[]
  /** Callback when checkout is complete */
  onComplete?: (result: CheckoutResult) => void
  /** Callback when checkout is cancelled (modal mode) */
  onCancel?: () => void
  /** Custom success redirect URL */
  successUrl?: string
  /** Custom cancel redirect URL */
  cancelUrl?: string
  /** Whether to show back button (page mode) */
  showBackButton?: boolean
  /** Custom back URL */
  backUrl?: string
  /** Additional CSS classes */
  className?: string
}
 
/**
 * Checkout Result - Result of a successful checkout
 */
export interface CheckoutResult {
  /** Whether checkout was successful */
  success: boolean
  /** Checkout type that was completed */
  type: CheckoutType
  /** Created subscription ID (for plan/addon) */
  subscriptionId?: string
  /** Created agency ID (for new plan checkout) */
  agencyId?: string
  /** Stripe session ID (for credits) */
  sessionId?: string
  /** Error message (if failed) */
  error?: string
}

/**
 * Checkout Step - Wizard steps
 */
export type CheckoutStep = 'billing' | 'payment' | 'review'

/**
 * Checkout Step Config
 */
export interface CheckoutStepConfig {
  id: CheckoutStep
  label: string
  description: string
  /** Whether this step is required for this checkout type */
  required: (type: CheckoutType, context: CheckoutContext) => boolean
}

/**
 * Default checkout steps configuration
 */
export const CHECKOUT_STEPS: CheckoutStepConfig[] = [
  {
    id: 'billing',
    label: 'Billing',
    description: 'Billing information',
    required: (type, context) => type === 'plan' && context.isNewSubscription,
  },
  {
    id: 'payment',
    label: 'Payment',
    description: 'Payment method',
    required: () => true, // Always required unless existing payment
  },
  {
    id: 'review',
    label: 'Review',
    description: 'Review & Confirm',
    required: () => true,
  },
]

/**
 * Get active checkout steps based on checkout type and context
 */
export function getActiveCheckoutSteps(
  type: CheckoutType,
  context: CheckoutContext,
  hasExistingPayment: boolean
): CheckoutStepConfig[] {
  return CHECKOUT_STEPS.filter((step) => {
    // Skip billing if not new subscription (addon/credits for existing agency)
    if (step.id === 'billing' && !context.isNewSubscription) return false
    // Skip payment if customer has existing payment method and not new subscription
    if (step.id === 'payment' && hasExistingPayment && !context.isNewSubscription) {
      // Still include payment step but it will show saved cards
      return true
    }
    return step.required(type, context)
  })
}


/**
 * Addon Card Data for UI display
 * @ssot types/billing.ts - This is the canonical type definition
 * @description Used by getAddonCards() in pricing-config.ts
 */
export interface AddonCardData {
  /** Addon config key (e.g., 'PRIORITY_SUPPORT', 'FI_GL') */
  key: string
  /** Display title */
  title: string
  /** Addon description */
  description: string
  /** Formatted price string (e.g., "RM 99.00") */
  price: string
  /** Price amount in cents */
  priceAmount: number
  /** Currency code (e.g., "MYR") */
  currency: string
  /** Stripe price ID */
  priceId: string
  /** Billing interval ('month' for recurring, 'one_time' for goods) */
  interval: 'month' | 'year' | 'one_time'
  /** Feature list for display */
  features: string[]
  /** Addon category for grouping */
  category: AddonCategoryType
  /** Addon type for classification */
  addonType: AddonClassificationType
  /** Whether this is a recommended addon */
  recommended?: boolean
  /** Module this addon belongs to (e.g., 'fi-gl') */
  module?: string
  /** Required addon key (dependency) */
  requires?: string
}
