/**
 * @abstraction Plan Entitlements Registry
 * @description Static plan entitlements mapping. These get seeded to PlanFeature table.
 * 
 * Plan Structure (matches pricing cards):
 * - Starter (price_1SpVOXJglUPlULDQt9Ejhunb): RM 79/mo - 3 sub-accounts, 2 team members, unlimited pipelines
 * - Basic (price_1SpVOYJglUPlULDQhsRkA5YV): RM 149/mo - Unlimited sub-accounts & team members
 * - Advanced (price_1SpVOZJglUPlULDQoFq3iPES): RM 399/mo - Everything + Rebilling + 24/7 support
 * 
 * @namespace Autlify.Lib.Registry.Plans.PlanEntitlements
 * @module REGISTRY
 * @author Autlify Team
 * @created 2026-01-29
 */

import type { LimitEnforcement, OverageMode } from '@/generated/prisma/client'
import type { FeatureKey } from '@/lib/registry/keys/features'

/** Plan IDs (Stripe Price IDs) */
export const PLAN_IDS = {
  STARTER: 'price_1SpVOXJglUPlULDQt9Ejhunb',
  BASIC: 'price_1SpVOYJglUPlULDQhsRkA5YV',
  ADVANCED: 'price_1SpVOZJglUPlULDQoFq3iPES',

  // Add-ons
  PRIORITY_SUPPORT: 'price_1SpVObJglUPlULDQRfhLJNEo',

  // TODO: Replace with actual Stripe price ID when ready
  FI_GL: 'price_fi_gl_placeholder', // General Ledger
  FI_AR: 'price_fi_ar_placeholder', // Accounts Receivable
  FI_AP: 'price_fi_ap_placeholder', // Accounts Payable
  FI_BL: 'price_fi_bl_placeholder', // Bank Ledgers
  FI_FS: 'price_fi_fs_placeholder', // Financial Statements aka Advanced Reports

  // CO - Controlling Add-ons (separate module)
  CO_CCA: 'price_co_cca_placeholder', // Cost Center Accounting
  CO_PCA: 'price_co_pca_placeholder', // Profit Center Accounting
  CO_PA: 'price_co_pa_placeholder', // Profitability Analysis
  CO_BUDGET: 'price_co_budget_placeholder', // Budgeting

  // MM - Materials Management (future)
  // MM_PUR: 'price_mm_pur_placeholder', // Purchasing
  // MM_IM: 'price_mm_im_placeholder', // Inventory Management
  // MM_IV: 'price_mm_iv_placeholder', // Invoice Verification
} as const

export type PlanId = typeof PLAN_IDS[keyof typeof PLAN_IDS]

/** Plan entitlement seed for database seeding */
export type PlanEntitlementSeed = {
  planId: typeof PLAN_IDS[keyof typeof PLAN_IDS] // Stripe recurring priceId
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
 * Master plan entitlements configuration.
 * Use this to seed the PlanFeature table.
 */
export const PLAN_ENTITLEMENTS: PlanEntitlementSeed[] = [
  // ─────────────────────────────────────────────────────────
  // STARTER PLAN (RM 79/mo)
  // ─────────────────────────────────────────────────────────
  {
    planId: PLAN_IDS.STARTER,
    featureKey: 'core.agency.subaccounts',
    isEnabled: true,
    maxInt: 3,
    enforcement: 'HARD',
  },
  {
    planId: PLAN_IDS.STARTER,
    featureKey: 'core.agency.team_member',
    isEnabled: true,
    maxInt: 2,
    enforcement: 'HARD',
  },
  {
    planId: PLAN_IDS.STARTER,
    featureKey: 'core.agency.storage',
    isEnabled: true,
    maxDec: '5.0', // 5 GB
    enforcement: 'SOFT',
  },
  {
    planId: PLAN_IDS.STARTER,
    featureKey: 'crm.funnels.content',
    isEnabled: true,
    maxInt: 5,
    enforcement: 'HARD',
  },
  {
    planId: PLAN_IDS.STARTER,
    featureKey: 'crm.pipelines.lane',
    isEnabled: true,
    isUnlimited: true,
  },
  {
    planId: PLAN_IDS.STARTER,
    featureKey: 'crm.customers.contact',
    isEnabled: true,
    maxInt: 500,
    enforcement: 'SOFT',
  },
  {
    planId: PLAN_IDS.STARTER,
    featureKey: 'crm.media.file',
    isEnabled: true,
    maxInt: 100,
    enforcement: 'SOFT',
  },
  {
    planId: PLAN_IDS.STARTER,
    featureKey: 'crm.customers.billing',
    isEnabled: false,
  },
  {
    planId: PLAN_IDS.STARTER,
    featureKey: 'core.billing.priority_support',
    isEnabled: false,
  },
  {
    planId: PLAN_IDS.STARTER,
    featureKey: 'core.apps.api_keys',
    isEnabled: true,
    maxInt: 3,
    enforcement: 'HARD',
  },
  {
    planId: PLAN_IDS.STARTER,
    featureKey: 'core.apps.webhooks',
    isEnabled: true,
    maxInt: 5,
    enforcement: 'HARD',
  },

  // ─────────────────────────────────────────────────────────
  // BASIC PLAN (RM 149/mo)
  // ─────────────────────────────────────────────────────────
  {
    planId: PLAN_IDS.BASIC,
    featureKey: 'core.agency.subaccounts',
    isEnabled: true,
    isUnlimited: true,
  },
  {
    planId: PLAN_IDS.BASIC,
    featureKey: 'core.agency.team_member',
    isEnabled: true,
    isUnlimited: true,
  },
  {
    planId: PLAN_IDS.BASIC,
    featureKey: 'core.agency.storage',
    isEnabled: true,
    maxDec: '25.0', // 25 GB
    enforcement: 'SOFT',
  },
  {
    planId: PLAN_IDS.BASIC,
    featureKey: 'crm.funnels.content',
    isEnabled: true,
    maxInt: 25,
    enforcement: 'SOFT',
  },
  {
    planId: PLAN_IDS.BASIC,
    featureKey: 'crm.pipelines.lane',
    isEnabled: true,
    isUnlimited: true,
  },
  {
    planId: PLAN_IDS.BASIC,
    featureKey: 'crm.customers.contact',
    isEnabled: true,
    maxInt: 5000,
    enforcement: 'SOFT',
  },
  {
    planId: PLAN_IDS.BASIC,
    featureKey: 'crm.media.file',
    isEnabled: true,
    maxInt: 500,
    enforcement: 'SOFT',
  },
  {
    planId: PLAN_IDS.BASIC,
    featureKey: 'crm.customers.billing',
    isEnabled: false,
  },
  {
    planId: PLAN_IDS.BASIC,
    featureKey: 'core.billing.priority_support',
    isEnabled: false,
  },
  {
    planId: PLAN_IDS.BASIC,
    featureKey: 'core.apps.api_keys',
    isEnabled: true,
    maxInt: 10,
    enforcement: 'HARD',
  },
  {
    planId: PLAN_IDS.BASIC,
    featureKey: 'core.apps.webhooks',
    isEnabled: true,
    maxInt: 25,
    enforcement: 'HARD',
  },

  // ─────────────────────────────────────────────────────────
  // ADVANCED PLAN (RM 399/mo)
  // ─────────────────────────────────────────────────────────
  {
    planId: PLAN_IDS.ADVANCED,
    featureKey: 'core.agency.subaccounts',
    isEnabled: true,
    isUnlimited: true,
  },
  {
    planId: PLAN_IDS.ADVANCED,
    featureKey: 'core.agency.team_member',
    isEnabled: true,
    isUnlimited: true,
  },
  {
    planId: PLAN_IDS.ADVANCED,
    featureKey: 'core.agency.storage',
    isEnabled: true,
    maxDec: '100.0', // 100 GB
    enforcement: 'SOFT',
  },
  {
    planId: PLAN_IDS.ADVANCED,
    featureKey: 'crm.funnels.content',
    isEnabled: true,
    isUnlimited: true,
  },
  {
    planId: PLAN_IDS.ADVANCED,
    featureKey: 'crm.pipelines.lane',
    isEnabled: true,
    isUnlimited: true,
  },
  {
    planId: PLAN_IDS.ADVANCED,
    featureKey: 'crm.customers.contact',
    isEnabled: true,
    isUnlimited: true,
  },
  {
    planId: PLAN_IDS.ADVANCED,
    featureKey: 'crm.media.file',
    isEnabled: true,
    isUnlimited: true,
  },
  {
    planId: PLAN_IDS.ADVANCED,
    featureKey: 'crm.customers.billing',
    isEnabled: true, // Rebilling enabled for Advanced
  },
  {
    planId: PLAN_IDS.ADVANCED,
    featureKey: 'core.billing.priority_support',
    isEnabled: true, // 24/7 support enabled for Advanced
  },
  {
    planId: PLAN_IDS.ADVANCED,
    featureKey: 'core.apps.api_keys',
    isEnabled: true,
    isUnlimited: true,
  },
  {
    planId: PLAN_IDS.ADVANCED,
    featureKey: 'core.apps.webhooks',
    isEnabled: true,
    isUnlimited: true,
  },

  // ─────────────────────────────────────────────────────────
  // PRIORITY SUPPORT ADD-ON (RM 99/mo)
  // ─────────────────────────────────────────────────────────
  {
    planId: PLAN_IDS.PRIORITY_SUPPORT,
    featureKey: 'core.billing.priority_support',
    isEnabled: true,
  },
  // FI-GL: General Ledger Add-on
  {
    planId: PLAN_IDS.FI_GL,
    featureKey: 'fi.general_ledger.settings',
    isEnabled: true,
  },
  {
    planId: PLAN_IDS.FI_GL,
    featureKey: 'fi.general_ledger.journal_entries',
    isEnabled: true,
  },
  {
    planId: PLAN_IDS.FI_GL,
    featureKey: 'fi.general_ledger.reports',
    isEnabled: true,
  },
  {
    planId: PLAN_IDS.FI_GL,
    featureKey: 'fi.general_ledger.reconciliation',
    isEnabled: true,
  },
  // FI-GL Configuration (bundled with FI_GL)
  {
    planId: PLAN_IDS.FI_GL,
    featureKey: 'fi.master_data.accounts',
    isEnabled: true,
  },
  {
    planId: PLAN_IDS.FI_GL,
    featureKey: 'fi.configuration.fiscal_years',
    isEnabled: true,
  },
  {
    planId: PLAN_IDS.FI_GL,
    featureKey: 'fi.configuration.currencies',
    isEnabled: true,
  },
  {
    planId: PLAN_IDS.FI_GL,
    featureKey: 'fi.configuration.tax_settings',
    isEnabled: true,
  },
  {
    planId: PLAN_IDS.FI_GL,
    featureKey: 'fi.configuration.number_ranges',
    isEnabled: true,
  },
  {
    planId: PLAN_IDS.FI_GL,
    featureKey: 'fi.configuration.posting_rules',
    isEnabled: true,
  },
  // FI-GL Master Data (bundled with FI_GL)
  {
    planId: PLAN_IDS.FI_GL,
    featureKey: 'fi.master_data.accounts',
    isEnabled: true,
  },
  {
    planId: PLAN_IDS.FI_AR,
    featureKey: 'fi.accounts_receivable.subledgers',
    isEnabled: true,
  },
    {
    planId: PLAN_IDS.FI_AP,
    featureKey: 'fi.accounts_payable.subledgers',
    isEnabled: true,
  },
    {
    planId: PLAN_IDS.FI_BL,
    featureKey: 'fi.bank_ledger.bank_accounts',
    isEnabled: true,
  },
    {
    planId: PLAN_IDS.FI_BL,
    featureKey: 'fi.bank_ledger.subledgers',
    isEnabled: true,
  },
  {
    planId: PLAN_IDS.FI_FS,
    featureKey: 'fi.advanced_reporting.financial_statements',
    isEnabled: true,
  },
  // ─────────────────────────────────────────────────────────
  // CO - CONTROLLING ADD-ONS (Separate Module)
  // ─────────────────────────────────────────────────────────
  // CO-CCA: Cost Center Accounting
  {
    planId: PLAN_IDS.CO_CCA,
    featureKey: 'co.cost_centers.master_data',
    isEnabled: true,
  },
  {
    planId: PLAN_IDS.CO_CCA,
    featureKey: 'co.cost_centers.hierarchy',
    isEnabled: true,
  },
  {
    planId: PLAN_IDS.CO_CCA,
    featureKey: 'co.cost_centers.allocations',
    isEnabled: true,
  },
  {
    planId: PLAN_IDS.CO_CCA,
    featureKey: 'co.cost_centers.reports',
    isEnabled: true,
  },
  // CO-PCA: Profit Center Accounting
  {
    planId: PLAN_IDS.CO_PCA,
    featureKey: 'co.profit_centers.master_data',
    isEnabled: true,
  },
  {
    planId: PLAN_IDS.CO_PCA,
    featureKey: 'co.profit_centers.hierarchy',
    isEnabled: true,
  },
  {
    planId: PLAN_IDS.CO_PCA,
    featureKey: 'co.profit_centers.reports',
    isEnabled: true,
  },
  // CO-PA: Profitability Analysis
  {
    planId: PLAN_IDS.CO_PA,
    featureKey: 'co.profitability.segments',
    isEnabled: true,
  },
  {
    planId: PLAN_IDS.CO_PA,
    featureKey: 'co.profitability.reports',
    isEnabled: true,
  },
  // CO Budgets
  {
    planId: PLAN_IDS.CO_BUDGET,
    featureKey: 'co.budgets.planning',
    isEnabled: true,
  },
  {
    planId: PLAN_IDS.CO_BUDGET,
    featureKey: 'co.budgets.monitoring',
    isEnabled: true,
  },
  // Legacy: Keep fi.controlling for backward compatibility (maps to CO_CCA)
  {
    planId: PLAN_IDS.CO_CCA,
    featureKey: 'fi.controlling.cost_centers',
    isEnabled: true,
  },
]

/** Get entitlements for a specific plan */
export function getPlanEntitlements(planId: string): PlanEntitlementSeed[] {
  return PLAN_ENTITLEMENTS.filter(e => e.planId === planId)
}

/** Get a specific entitlement for a plan + feature */
export function getPlanEntitlement(planId: string, featureKey: string): PlanEntitlementSeed | undefined {
  return PLAN_ENTITLEMENTS.find(e => e.planId === planId && e.featureKey === featureKey)
}

/** Plan metadata for UI display */
export const PLAN_METADATA = {
  [PLAN_IDS.STARTER]: {
    name: 'Starter',
    description: 'Perfect for trying out autlify',
    price: 'RM 79',
    trialDays: 14,
    highlight: 'Key features',
  },
  [PLAN_IDS.BASIC]: {
    name: 'Basic',
    description: 'For serious agency owners',
    price: 'RM 149',
    trialDays: 14,
    highlight: 'Everything in Starter, plus',
  },
  [PLAN_IDS.ADVANCED]: {
    name: 'Advanced',
    description: 'The ultimate agency kit',
    price: 'RM 399',
    trialDays: 0,
    highlight: 'Everything unlimited',
  },
} as const

