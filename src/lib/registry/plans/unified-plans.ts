/**
 * @abstraction Unified Plan & Entitlements Registry
 * @description Single source of truth for plans, features, and entitlements.
 * Combines feature definitions with plan limits in a simplified pattern.
 *
 * @namespace Autlify.Lib.Registry.Plans
 * @module REGISTRY
 * @author Autlify Team
 * @created 2026-01-30
 */

// ============================================================================
// Plan Definitions
// ============================================================================

export const PLANS = {
  STARTER: {
    id: 'price_1SpVOXJglUPlULDQt9Ejhunb',
    name: 'Starter',
    price: 79,
    currency: 'MYR',
    interval: 'month',
    description: 'Perfect for trying out autlify',
    trialDays: 14,
    tier: 1,
  },
  BASIC: {
    id: 'price_1SpVOYJglUPlULDQhsRkA5YV',
    name: 'Basic',
    price: 149,
    currency: 'MYR',
    interval: 'month',
    description: 'For serious agency owners',
    trialDays: 14,
    tier: 2,
  },
  ADVANCED: {
    id: 'price_1SpVOZJglUPlULDQoFq3iPES',
    name: 'Advanced',
    price: 399,
    currency: 'MYR',
    interval: 'month',
    description: 'The ultimate agency kit',
    trialDays: 0,
    tier: 3,
  },
} as const

export const ADDONS = {
  PRIORITY_SUPPORT: {
    id: 'price_1SpVObJglUPlULDQRfhLJNEo',
    name: 'Priority Support',
    price: 99,
    currency: 'MYR',
    interval: 'month',
    description: '24/7 priority support',
  },
  FI_GL: {
    id: 'price_fi_gl_placeholder', // Replace with actual Stripe price
    name: 'General Ledger',
    price: 49,
    currency: 'MYR',
    interval: 'month',
    description: 'Financial accounting module',
  },
} as const

export type PlanKey = keyof typeof PLANS
export type AddonKey = keyof typeof ADDONS
export type PlanId = typeof PLANS[PlanKey]['id']
export type AddonId = typeof ADDONS[AddonKey]['id']

// ============================================================================
// Feature Definitions (with defaults)
// ============================================================================

type FeatureType = 'boolean' | 'count' | 'usage'
type Scope = 'agency' | 'subaccount'

interface FeatureDef {
  name: string
  type: FeatureType
  scope: Scope
  unit?: string
  icon?: string
  category: 'core' | 'crm' | 'billing' | 'apps' | 'fi'
  description?: string
}

export const FEATURES = {
  // Core
  'core.subaccounts': { name: 'Sub-Accounts', type: 'count', scope: 'agency', unit: 'subaccounts', icon: 'users', category: 'core' },
  'core.team_members': { name: 'Team Members', type: 'count', scope: 'agency', unit: 'members', icon: 'user-group', category: 'core' },
  'core.storage_gb': { name: 'Storage', type: 'usage', scope: 'agency', unit: 'GB', icon: 'database', category: 'core' },
  
  // CRM
  'crm.funnels': { name: 'Funnels', type: 'count', scope: 'subaccount', unit: 'funnels', icon: 'filter', category: 'crm' },
  'crm.pipelines': { name: 'Pipelines', type: 'count', scope: 'agency', unit: 'pipelines', icon: 'git-branch', category: 'crm' },
  'crm.contacts': { name: 'Contacts', type: 'count', scope: 'subaccount', unit: 'contacts', icon: 'address-book', category: 'crm' },
  
  // Billing
  'billing.rebilling': { name: 'Customer Rebilling', type: 'boolean', scope: 'agency', icon: 'credit-card', category: 'billing' },
  'billing.priority_support': { name: '24/7 Support', type: 'boolean', scope: 'agency', icon: 'headphones', category: 'billing' },
  
  // Apps
  'apps.api_keys': { name: 'API Keys', type: 'count', scope: 'agency', unit: 'keys', icon: 'key', category: 'apps' },
  'apps.webhooks': { name: 'Webhook Subscriptions', type: 'count', scope: 'agency', unit: 'subscriptions', icon: 'webhook', category: 'apps' },
  'apps.webhook_deliveries': { name: 'Monthly Deliveries', type: 'usage', scope: 'agency', unit: 'deliveries/mo', icon: 'send', category: 'apps' },
  
  // Finance
  'fi.gl_access': { name: 'General Ledger', type: 'boolean', scope: 'agency', icon: 'book-open', category: 'fi' },
  'fi.gl_accounts': { name: 'GL Accounts', type: 'count', scope: 'agency', unit: 'accounts', icon: 'list', category: 'fi' },
  'fi.gl_journals': { name: 'Monthly Journals', type: 'usage', scope: 'agency', unit: 'entries/mo', icon: 'file-text', category: 'fi' },
  'fi.ar_access': { name: 'Accounts Receivable', type: 'boolean', scope: 'agency', icon: 'invoice', category: 'fi' },
  'fi.ap_access': { name: 'Accounts Payable', type: 'boolean', scope: 'agency', icon: 'receipt', category: 'fi' },
} as const satisfies Record<string, FeatureDef>

export type UnifiedFeatureKey = keyof typeof FEATURES

// ============================================================================
// Plan Limits (∞ = unlimited, number = limit, false = disabled)
// ============================================================================

type Limit = number | '∞' | boolean

/** Plan limits matrix - simple flat structure */
export const PLAN_LIMITS: Record<PlanKey, Record<UnifiedFeatureKey, Limit>> = {
  STARTER: {
    'core.subaccounts': 3,
    'core.team_members': 2,
    'core.storage_gb': 5,
    'crm.funnels': 5,
    'crm.pipelines': '∞',
    'crm.contacts': 500,
    'billing.rebilling': false,
    'billing.priority_support': false,
    'apps.api_keys': 3,
    'apps.webhooks': 5,
    'apps.webhook_deliveries': 1000,
    'fi.gl_access': false,
    'fi.gl_accounts': 0,
    'fi.gl_journals': 0,
    'fi.ar_access': false,
    'fi.ap_access': false,
  },
  BASIC: {
    'core.subaccounts': '∞',
    'core.team_members': '∞',
    'core.storage_gb': 25,
    'crm.funnels': 25,
    'crm.pipelines': '∞',
    'crm.contacts': 5000,
    'billing.rebilling': false,
    'billing.priority_support': false,
    'apps.api_keys': 10,
    'apps.webhooks': 25,
    'apps.webhook_deliveries': 10000,
    'fi.gl_access': false,
    'fi.gl_accounts': 0,
    'fi.gl_journals': 0,
    'fi.ar_access': false,
    'fi.ap_access': false,
  },
  ADVANCED: {
    'core.subaccounts': '∞',
    'core.team_members': '∞',
    'core.storage_gb': 100,
    'crm.funnels': '∞',
    'crm.pipelines': '∞',
    'crm.contacts': '∞',
    'billing.rebilling': true,
    'billing.priority_support': true,
    'apps.api_keys': '∞',
    'apps.webhooks': '∞',
    'apps.webhook_deliveries': '∞',
    'fi.gl_access': false, // Still an add-on
    'fi.gl_accounts': 0,
    'fi.gl_journals': 0,
    'fi.ar_access': false,
    'fi.ap_access': false,
  },
}

// ============================================================================
// Addon Grants (what addons provide)
// ============================================================================

export const ADDON_GRANTS: Record<AddonKey, Partial<Record<UnifiedFeatureKey, Limit>>> = {
  PRIORITY_SUPPORT: {
    'billing.priority_support': true,
  },
  FI_GL: {
    'fi.gl_access': true,
    'fi.gl_accounts': '∞',
    'fi.gl_journals': '∞',
  },
}

// ============================================================================
// Helper Functions
// ============================================================================

/** Get effective limit for a plan + addons */
export function getEffectiveLimit(
  planKey: PlanKey,
  featureKey: UnifiedFeatureKey,
  activeAddons: AddonKey[] = []
): Limit {
  // Start with plan limit
  let limit = PLAN_LIMITS[planKey][featureKey]
  
  // Apply addon overrides (addons can only increase, not decrease)
  for (const addon of activeAddons) {
    const grant = ADDON_GRANTS[addon]?.[featureKey]
    if (grant !== undefined) {
      if (grant === '∞' || grant === true) {
        return grant
      }
      if (typeof grant === 'number' && typeof limit === 'number') {
        limit = Math.max(limit, grant)
      }
    }
  }
  
  return limit
}

/** Check if a feature is enabled */
export function isFeatureEnabled(limit: Limit): boolean {
  if (limit === false) return false
  if (limit === 0) return false
  return true
}

/** Check if a feature is unlimited */
export function isUnlimited(limit: Limit): boolean {
  return limit === '∞'
}

/** Get numeric limit (0 if unlimited or disabled) */
export function getNumericLimit(limit: Limit): number {
  if (typeof limit === 'number') return limit
  return 0
}

/** Format limit for display */
export function formatLimit(limit: Limit): string {
  if (limit === '∞') return 'Unlimited'
  if (limit === true) return 'Included'
  if (limit === false) return 'Not included'
  return limit.toString()
}

/** Get feature by key */
export function getFeature(key: UnifiedFeatureKey) {
  return FEATURES[key]
}

/** Get plan by ID */
export function getPlanByPriceId(priceId: string) {
  return Object.values(PLANS).find(p => p.id === priceId)
}

/** Get plan key by ID */
export function getPlanKeyByPriceId(priceId: string): PlanKey | undefined {
  const entry = Object.entries(PLANS).find(([, p]) => p.id === priceId)
  return entry?.[0] as PlanKey | undefined
}

// ============================================================================
// Database Seed Helpers
// ============================================================================

export interface PlanFeatureSeed {
  planId: string
  featureKey: string
  isEnabled: boolean
  isUnlimited: boolean
  maxInt?: number
  maxDec?: string
}

/** Generate seed data for database */
export function generatePlanFeatureSeeds(): PlanFeatureSeed[] {
  const seeds: PlanFeatureSeed[] = []
  
  for (const [planKey, limits] of Object.entries(PLAN_LIMITS)) {
    const plan = PLANS[planKey as PlanKey]
    
    for (const [featureKey, limit] of Object.entries(limits)) {
      const feature = FEATURES[featureKey as UnifiedFeatureKey]
      
      seeds.push({
        planId: plan.id,
        featureKey,
        isEnabled: isFeatureEnabled(limit),
        isUnlimited: isUnlimited(limit),
        maxInt: feature.type === 'count' || feature.type === 'usage' 
          ? getNumericLimit(limit) 
          : undefined,
        maxDec: undefined,
      })
    }
  }
  
  return seeds
}
