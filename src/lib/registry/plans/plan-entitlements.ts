/**
 * @abstraction Plan Entitlements Registry
 * @description Static plan entitlements mapping. These get seeded to PlanFeature table.
 * 
 * Plan Structure (matches pricing-config.ts seeded values):
 * - Starter (price_1SwgiBJglUPlULDQpwOoy3zQ): RM 79/mo - 3 sub-accounts, 2 team members, unlimited pipelines
 * - Basic (price_1SwgiCJglUPlULDQ9XByIzXp): RM 199/mo - Unlimited sub-accounts & team members
 * - Advanced (price_1SwgiDJglUPlULDQ0LqXQpip): RM 399/mo - Everything + Rebilling + 24/7 support
 * 
 * @namespace Autlify.Lib.Registry.Plans.PlanEntitlements
 * @module REGISTRY
 * @author Autlify Team
 * @created 2026-01-29
 */

import type { LimitEnforcement, OverageMode } from '@/generated/prisma/client'
import type { FeatureKey } from '@/lib/registry/keys/features'

// ============================================================================
// PRICE_IDS - IMPORTED FROM pricing-config.ts (SSoT)
// ============================================================================
// Re-export PRICE_IDS from pricing-config.ts for backward compatibility
// The SSoT for Stripe price IDs is @/lib/registry/plans/pricing-config.ts
import type { PriceKey, PlanKey, AddonKey } from '@/lib/registry/plans/pricing-config'

// Import for local use in this file
import { PRICING_CONFIG, PRICE_IDS } from '@/lib/registry/plans/pricing-config'

function dedupePlanEntitlements(rows: PlanEntitlementSeed[]): PlanEntitlementSeed[] {
  const seen = new Set<string>()
  const deduped: PlanEntitlementSeed[] = []

  for (const row of rows) {
    const key = `${row.planId}::${row.featureKey}`
    if (seen.has(key)) continue
    seen.add(key)
    deduped.push(row)
  }

  return deduped
}

/** Plan entitlement seed for database seeding */
export type PlanEntitlementSeed = {
  planId: typeof PRICE_IDS[PriceKey | PlanKey | AddonKey]
  featureKey: FeatureKey
  isEnabled?: boolean
  isUnlimited?: boolean
  includedInt?: number
  maxInt?: number
  includedDec?: string
  maxDec?: string
  enforcement?: LimitEnforcement
  overageMode?: OverageMode
  recurringCreditGrantInt?: number
  recurringCreditGrantDec?: string
  rolloverCredits?: boolean
  topUpEnabled?: boolean
  topUpPriceId?: string
}

/**
 * @namespace PlanEntitlements
 * @description Static plan entitlements mapping.
 * @module REGISTRY
 * @author Autlify Team 
 */
const RAW_PLAN_ENTITLEMENTS: PlanEntitlementSeed[] = [
  // ─────────────────────────────────────────────────────────
  // STARTER PLAN (RM 79/mo)
  // ─────────────────────────────────────────────────────────
  {
    planId: PRICE_IDS.STARTER,
    featureKey: 'org.agency.account',
    isEnabled: true,
  },
  {
    planId: PRICE_IDS.STARTER,
    featureKey: 'org.billing.account',
    isEnabled: true,
  },
  {
    planId: PRICE_IDS.STARTER,
    featureKey: 'iam.authZ.roles',
    isEnabled: true,
    maxInt: 2,
    enforcement: 'HARD',
  },
  {
    planId: PRICE_IDS.STARTER,
    featureKey: 'org.agency.subaccounts',
    isEnabled: true,
    maxInt: 3,
    enforcement: 'HARD',
  },
  {
    planId: PRICE_IDS.STARTER,
    featureKey: 'org.agency.team_member',
    isEnabled: true,
    maxInt: 2,
    enforcement: 'HARD',
  },
  {
    planId: PRICE_IDS.STARTER,
    featureKey: 'org.agency.storage',
    isEnabled: true,
    maxDec: '5.0', // 5 GB
    enforcement: 'SOFT',
  },
  {
    planId: PRICE_IDS.STARTER,
    featureKey: 'crm.funnels.content',
    isEnabled: true,
    maxInt: 5,
    enforcement: 'HARD',
  },
  {
    planId: PRICE_IDS.STARTER,
    featureKey: 'crm.pipelines.lane',
    isEnabled: true,
    isUnlimited: true,
  },
  {
    planId: PRICE_IDS.STARTER,
    featureKey: 'crm.customers.contact',
    isEnabled: true,
    maxInt: 500,
    enforcement: 'SOFT',
  },
  {
    planId: PRICE_IDS.STARTER,
    featureKey: 'crm.media.file',
    isEnabled: true,
    maxInt: 100,
    enforcement: 'SOFT',
  },
  {
    planId: PRICE_IDS.STARTER,
    featureKey: 'crm.customers.billing',
    isEnabled: false,
  },
  {
    planId: PRICE_IDS.STARTER,
    featureKey: 'org.billing.priority_support',
    isEnabled: false,
  },
  {
    planId: PRICE_IDS.STARTER,
    featureKey: 'org.apps.api_keys',
    isEnabled: true,
    maxInt: 3,
    enforcement: 'HARD',
  },
  {
    planId: PRICE_IDS.STARTER,
    featureKey: 'org.apps.webhooks',
    isEnabled: true,
    maxInt: 5,
    enforcement: 'HARD',
  },

  // ─────────────────────────────────────────────────────────
  // BASIC PLAN (RM 149/mo)
  // ─────────────────────────────────────────────────────────
  {
    planId: PRICE_IDS.BASIC,
    featureKey: 'org.agency.account',
    isEnabled: true,
  },
  {
    planId: PRICE_IDS.BASIC,
    featureKey: 'org.agency.subaccounts',
    isEnabled: true,
    isUnlimited: true,
  },
    {
    planId: PRICE_IDS.BASIC,
    featureKey: 'org.billing.account',
    isEnabled: true,
  },
  {
    planId: PRICE_IDS.BASIC,
    featureKey: 'iam.authZ.roles',
    isEnabled: true,
    maxInt: 2,
    enforcement: 'HARD',
  },
  {
    planId: PRICE_IDS.BASIC,
    featureKey: 'org.agency.team_member',
    isEnabled: true,
    isUnlimited: true,
  },
  {
    planId: PRICE_IDS.BASIC,
    featureKey: 'org.agency.storage',
    isEnabled: true,
    maxDec: '25.0', // 25 GB
    enforcement: 'SOFT',
  },
  {
    planId: PRICE_IDS.BASIC,
    featureKey: 'crm.funnels.content',
    isEnabled: true,
    maxInt: 25,
    enforcement: 'SOFT',
  },
  {
    planId: PRICE_IDS.BASIC,
    featureKey: 'crm.pipelines.lane',
    isEnabled: true,
    isUnlimited: true,
  },
  {
    planId: PRICE_IDS.BASIC,
    featureKey: 'crm.customers.contact',
    isEnabled: true,
    maxInt: 5000,
    enforcement: 'SOFT',
  },
  {
    planId: PRICE_IDS.BASIC,
    featureKey: 'crm.media.file',
    isEnabled: true,
    maxInt: 500,
    enforcement: 'SOFT',
  },
  {
    planId: PRICE_IDS.BASIC,
    featureKey: 'crm.customers.billing',
    isEnabled: false,
  },
  {
    planId: PRICE_IDS.BASIC,
    featureKey: 'org.billing.priority_support',
    isEnabled: false,
  },
  {
    planId: PRICE_IDS.BASIC,
    featureKey: 'org.apps.api_keys',
    isEnabled: true,
    maxInt: 10,
    enforcement: 'HARD',
  },
  {
    planId: PRICE_IDS.BASIC,
    featureKey: 'org.apps.webhooks',
    isEnabled: true,
    maxInt: 25,
    enforcement: 'HARD',
  },

  // ─────────────────────────────────────────────────────────
  // ADVANCED PLAN (RM 399/mo)
  // ─────────────────────────────────────────────────────────
  {
    planId: PRICE_IDS.ADVANCED,
    featureKey: 'org.agency.account',
    isEnabled: true,
  },
  {
    planId: PRICE_IDS.ADVANCED,
    featureKey: 'org.agency.subaccounts',
    isEnabled: true,
    isUnlimited: true,
  },
    {
    planId: PRICE_IDS.ADVANCED,
    featureKey: 'org.billing.account',
    isEnabled: true,
  },
  {
    planId: PRICE_IDS.ADVANCED,
    featureKey: 'iam.authZ.roles',
    isEnabled: true,
    maxInt: 10,
    enforcement: 'HARD',
  },
  {
    planId: PRICE_IDS.ADVANCED,
    featureKey: 'org.agency.team_member',
    isEnabled: true,
    isUnlimited: true,
  },
  {
    planId: PRICE_IDS.ADVANCED,
    featureKey: 'org.agency.storage',
    isEnabled: true,
    maxDec: '100.0', // 100 GB
    enforcement: 'SOFT',
  },
  {
    planId: PRICE_IDS.ADVANCED,
    featureKey: 'crm.funnels.content',
    isEnabled: true,
    isUnlimited: true,
  },
  {
    planId: PRICE_IDS.ADVANCED,
    featureKey: 'crm.pipelines.lane',
    isEnabled: true,
    isUnlimited: true,
  },
  {
    planId: PRICE_IDS.ADVANCED,
    featureKey: 'crm.customers.contact',
    isEnabled: true,
    isUnlimited: true,
  },
  {
    planId: PRICE_IDS.ADVANCED,
    featureKey: 'crm.media.file',
    isEnabled: true,
    isUnlimited: true,
  },
  {
    planId: PRICE_IDS.ADVANCED,
    featureKey: 'crm.customers.billing',
    isEnabled: true, // Rebilling enabled for Advanced
  },
  {
    planId: PRICE_IDS.ADVANCED,
    featureKey: 'org.billing.priority_support',
    isEnabled: true, // 24/7 support enabled for Advanced
  },
  {
    planId: PRICE_IDS.ADVANCED,
    featureKey: 'org.apps.api_keys',
    isEnabled: true,
    isUnlimited: true,
  },
  {
    planId: PRICE_IDS.ADVANCED,
    featureKey: 'org.apps.webhooks',
    isEnabled: true,
    isUnlimited: true,
  },

  // ─────────────────────────────────────────────────────────
  // PRIORITY SUPPORT ADD-ON (RM 99/mo)
  // ─────────────────────────────────────────────────────────
  {
    planId: PRICE_IDS.PRIORITY_SUPPORT,
    featureKey: 'org.billing.priority_support',
    isEnabled: true,
  },
  // FI-GL: General Ledger Add-on
  {
    planId: PRICE_IDS.FI_GL,
    featureKey: 'fi.general_ledger.settings',
    isEnabled: true,
  },
  {
    planId: PRICE_IDS.FI_GL,
    featureKey: 'fi.general_ledger.journal_entries',
    isEnabled: true,
  },
  {
    planId: PRICE_IDS.FI_GL,
    featureKey: 'fi.general_ledger.reports',
    isEnabled: true,
  },
  {
    planId: PRICE_IDS.FI_GL,
    featureKey: 'fi.general_ledger.reconciliation',
    isEnabled: true,
  },
  // FI-GL Configuration (bundled with FI_GL)
  {
    planId: PRICE_IDS.FI_GL,
    featureKey: 'fi.master_data.accounts',
    isEnabled: true,
  },
  {
    planId: PRICE_IDS.FI_GL,
    featureKey: 'fi.configuration.fiscal_years',
    isEnabled: true,
  },
  {
    planId: PRICE_IDS.FI_GL,
    featureKey: 'fi.configuration.currencies',
    isEnabled: true,
  },
  {
    planId: PRICE_IDS.FI_GL,
    featureKey: 'fi.configuration.tax_settings',
    isEnabled: true,
  },
  {
    planId: PRICE_IDS.FI_GL,
    featureKey: 'fi.configuration.number_ranges',
    isEnabled: true,
  },
  {
    planId: PRICE_IDS.FI_GL,
    featureKey: 'fi.configuration.posting_rules',
    isEnabled: true,
  },
  // FI-GL Master Data (bundled with FI_GL)
  {
    planId: PRICE_IDS.FI_GL,
    featureKey: 'fi.master_data.accounts',
    isEnabled: true,
  },
  {
    planId: PRICE_IDS.FI_AR,
    featureKey: 'fi.accounts_receivable.subledgers',
    isEnabled: true,
  },
    {
    planId: PRICE_IDS.FI_AP,
    featureKey: 'fi.accounts_payable.subledgers',
    isEnabled: true,
  },
    {
    planId: PRICE_IDS.FI_BL,
    featureKey: 'fi.bank_ledger.bank_accounts',
    isEnabled: true,
  },
    {
    planId: PRICE_IDS.FI_BL,
    featureKey: 'fi.bank_ledger.subledgers',
    isEnabled: true,
  },
  {
    planId: PRICE_IDS.FI_FS,
    featureKey: 'fi.advanced_reporting.financial_statements',
    isEnabled: true,
  },
  // ─────────────────────────────────────────────────────────
  // CO - CONTROLLING ADD-ONS (Separate Module)
  // ─────────────────────────────────────────────────────────
  // CO-CCA: Cost Center Accounting
  {
    planId: PRICE_IDS.CO_CCA,
    featureKey: 'co.cost_centers.master_data',
    isEnabled: true,
  },
  {
    planId: PRICE_IDS.CO_CCA,
    featureKey: 'co.cost_centers.hierarchy',
    isEnabled: true,
  },
  {
    planId: PRICE_IDS.CO_CCA,
    featureKey: 'co.cost_centers.allocations',
    isEnabled: true,
  },
  {
    planId: PRICE_IDS.CO_CCA,
    featureKey: 'co.cost_centers.reports',
    isEnabled: true,
  },
  // CO-PCA: Profit Center Accounting
  {
    planId: PRICE_IDS.CO_PCA,
    featureKey: 'co.profit_centers.master_data',
    isEnabled: true,
  },
  {
    planId: PRICE_IDS.CO_PCA,
    featureKey: 'co.profit_centers.hierarchy',
    isEnabled: true,
  },
  {
    planId: PRICE_IDS.CO_PCA,
    featureKey: 'co.profit_centers.reports',
    isEnabled: true,
  },
  // CO-PA: Profitability Analysis
  {
    planId: PRICE_IDS.CO_PA,
    featureKey: 'co.profitability.segments',
    isEnabled: true,
  },
  {
    planId: PRICE_IDS.CO_PA,
    featureKey: 'co.profitability.reports',
    isEnabled: true,
  },
  // CO Budgets
  {
    planId: PRICE_IDS.CO_BUDGET,
    featureKey: 'co.budgets.planning',
    isEnabled: true,
  },
  {
    planId: PRICE_IDS.CO_BUDGET,
    featureKey: 'co.budgets.monitoring',
    isEnabled: true,
  },
  // Legacy: Keep fi.controlling for backward compatibility (maps to CO_CCA)
  {
    planId: PRICE_IDS.CO_CCA,
    featureKey: 'co.cost_centers.master_data',
    isEnabled: true,
  },
]

export const PLAN_ENTITLEMENTS: PlanEntitlementSeed[] = dedupePlanEntitlements(RAW_PLAN_ENTITLEMENTS)

type PricingConfigEntry = (typeof PRICING_CONFIG)[keyof typeof PRICING_CONFIG]

const PLAN_ENTITLEMENTS_BY_PLAN_ID = new Map<string, PlanEntitlementSeed[]>()
const PLAN_ENTITLEMENT_BY_PLAN_AND_FEATURE = new Map<string, PlanEntitlementSeed>()

for (const entitlement of PLAN_ENTITLEMENTS) {
  const list = PLAN_ENTITLEMENTS_BY_PLAN_ID.get(entitlement.planId)
  if (list) {
    list.push(entitlement)
  } else {
    PLAN_ENTITLEMENTS_BY_PLAN_ID.set(entitlement.planId, [entitlement])
  }
  PLAN_ENTITLEMENT_BY_PLAN_AND_FEATURE.set(
    `${entitlement.planId}::${entitlement.featureKey}`,
    entitlement
  )
}

const PLAN_BY_PRICE_ID = new Map<string, PricingConfigEntry>()
const PLAN_KEY_BY_PRICE_ID = new Map<string, string>()

for (const [planKey, planConfig] of Object.entries(PRICING_CONFIG)) {
  PLAN_BY_PRICE_ID.set(planConfig.stripePriceId, planConfig)
  PLAN_KEY_BY_PRICE_ID.set(planConfig.stripePriceId, planKey)
}

/** Get entitlements for a specific plan */
export function getPlanEntitlements(planId: string): PlanEntitlementSeed[] {
  const entitlements = PLAN_ENTITLEMENTS_BY_PLAN_ID.get(planId)
  return entitlements ? [...entitlements] : []
}

/** Get a specific entitlement for a plan + feature */
export function getPlanEntitlement(planId: string, featureKey: string): PlanEntitlementSeed | undefined {
  return PLAN_ENTITLEMENT_BY_PLAN_AND_FEATURE.get(`${planId}::${featureKey}`)
}

/** Get plan by Stripe price ID - uses PRICING_CONFIG as SSoT */
export function getPlanByPriceId(priceId: string) {
  return PLAN_BY_PRICE_ID.get(priceId)
}

/** Get plan key by Stripe price ID - uses PRICING_CONFIG as SSoT */
export function getPlanKeyByPriceId(priceId: string): string | undefined {
  return PLAN_KEY_BY_PRICE_ID.get(priceId)
}
