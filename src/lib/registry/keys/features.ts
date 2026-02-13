/**
 * @abstraction Platform Feature Keys
 * @description Type-safe feature key derivations from the KEYS registry.
 * Runtime entitlements should come from DB (EntitlementFeature/PlanFeature).
 * 
 * @namespace Autlify.Lib.Registry.Keys.Features
 * @module REGISTRY
 * @author Autlify Team
 * @created 2026-01-29
 */

import type { ModuleCode, SubModuleOf, ResourceOf, KEYS, RegistryDisplayInfo } from '@/lib/registry/keys/permissions'
 

/** Resource codes (e.g., 'account', 'subaccounts', 'team_member') */
export type FeatureCode = {
  [M in ModuleCode]: { 
    [S in SubModuleOf<M>]: ResourceOf<M, S> 
  }[SubModuleOf<M>]
}[ModuleCode];

/** Full resource keys (e.g., 'org.agency.account', 'org.billing.subscription') */
export type FeatureKey = {
  [M in ModuleCode]: {
    [S in SubModuleOf<M>]: `${M}.${S}.${ResourceOf<M, S>}`
  }[SubModuleOf<M>]
}[ModuleCode];

/** Resource types (uppercase, e.g., 'ACCOUNT', 'SUBACCOUNTS') */
export type FeatureType = Uppercase<FeatureCode>;

/** Feature value types for entitlements */
export type EntitlementValueType = 'BOOLEAN' | 'INTEGER' | 'DECIMAL' | 'STRING'


/** Feature scope for metering */
export type FeatureScope = 'AGENCY' | 'SUBACCOUNT'

/** 
 * Entitlement feature access helper.
 * Use to check if a feature is enabled for a given scope.
 */
export interface FeatureAccess {
  featureKey: FeatureKey
  isEnabled: boolean
  isUnlimited: boolean
  currentUsage?: number
  maxAllowed?: number
  remainingAllowance?: number
}

/**
 * Helper to format feature display name from key.
 * e.g., 'org.agency.subaccounts' -> 'Sub-Accounts'
 */
export function formatFeatureDisplayName(key: FeatureKey): string {
  const parts = key.split('.')
  const resource = parts[parts.length - 1]
  return resource
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}


export const FEATURE_INFO: Record<FeatureCode, RegistryDisplayInfo> = {
  billing: { abbreviation: 'BILL', displayName: 'Billing' },
  master_data: { abbreviation: 'MD', displayName: 'Master Data' },
  customers: { abbreviation: 'CUST', displayName: 'Customers' },
  cost_centers: { abbreviation: 'CC', displayName: 'Cost Centers' },
  profile: { abbreviation: 'PROF', displayName: 'Profile' },
  security: { abbreviation: 'SEC', displayName: 'Security' },
  integrations: { abbreviation: 'INT', displayName: 'Integrations' },
  automation: { abbreviation: 'AUTO', displayName: 'Automation' },

  account: { abbreviation: 'ACCT', displayName: 'Account' },
  subaccounts: { abbreviation: 'SUB', displayName: 'Sub-Accounts' },
  team_member: { abbreviation: 'TEAM', displayName: 'Team Members' },
  settings: { abbreviation: 'SET', displayName: 'Settings' },

  storage: { abbreviation: 'STOR', displayName: 'Storage' },
  payment_methods: { abbreviation: 'PAY', displayName: 'Payment Methods' },
  subscription: { abbreviation: 'SUBS', displayName: 'Subscription' },
  features: { abbreviation: 'FEAT', displayName: 'Features' },
  usage: { abbreviation: 'USG', displayName: 'Usage' },
  entitlements: { abbreviation: 'ENT', displayName: 'Entitlements' },
  credits: { abbreviation: 'CR', displayName: 'Credits' },
  rebilling: { abbreviation: 'REB', displayName: 'Rebilling' },
  priority_support: { abbreviation: 'SUP', displayName: 'Priority Support' },

  flag: { abbreviation: 'FLAG', displayName: 'Flag' },
  app: { abbreviation: 'APP', displayName: 'App' },
  webhooks: { abbreviation: 'WH', displayName: 'Webhooks' },
  api_keys: { abbreviation: 'API', displayName: 'API Keys' },
  tickets: { abbreviation: 'TKT', displayName: 'Tickets' },
  diagnostics: { abbreviation: 'DIAG', displayName: 'Diagnostics' },
  roles: { abbreviation: 'ROLE', displayName: 'Roles' },
  permissions: { abbreviation: 'PERM', displayName: 'Permissions' },
  members: { abbreviation: 'MEM', displayName: 'Members' },

  fiscal_years: { abbreviation: 'FY', displayName: 'Fiscal Years' },
  currencies: { abbreviation: 'CUR', displayName: 'Currencies' },
  invoice_templates: { abbreviation: 'INV', displayName: 'Invoice Templates' },
  tax_settings: { abbreviation: 'TAX', displayName: 'Tax Settings' },
  tolerances: { abbreviation: 'TOL', displayName: 'Tolerances' },
  number_ranges: { abbreviation: 'NR', displayName: 'Number Ranges' },
  posting_rules: { abbreviation: 'PR', displayName: 'Posting Rules' },
  accounts: { abbreviation: 'ACCTS', displayName: 'Accounts' },
  vendors: { abbreviation: 'VEND', displayName: 'Vendors' },
  banks: { abbreviation: 'BANK', displayName: 'Banks' },
  subledgers: { abbreviation: 'SUBL', displayName: 'Subledgers' },
  balances: { abbreviation: 'BAL', displayName: 'Balances' },
  journal_entries: { abbreviation: 'JE', displayName: 'Journal Entries' },
  reports: { abbreviation: 'RPT', displayName: 'Reports' },
  consolidation: { abbreviation: 'CONS', displayName: 'Consolidation' },
  year_end: { abbreviation: 'YE', displayName: 'Year End' },
  reconciliation: { abbreviation: 'REC', displayName: 'Reconciliation' },
  bank_accounts: { abbreviation: 'BA', displayName: 'Bank Accounts' },
  financial_statements: { abbreviation: 'FS', displayName: 'Financial Statements' },
  custom_reports: { abbreviation: 'CRPT', displayName: 'Custom Reports' },

  contact: { abbreviation: 'CONT', displayName: 'Contact' },
  file: { abbreviation: 'FILE', displayName: 'File' },
  content: { abbreviation: 'CNT', displayName: 'Content' },
  lane: { abbreviation: 'LANE', displayName: 'Lane' },
  ticket: { abbreviation: 'TICK', displayName: 'Ticket' },
  tag: { abbreviation: 'TAG', displayName: 'Tag' },
  hierarchy: { abbreviation: 'HIER', displayName: 'Hierarchy' },
  allocations: { abbreviation: 'ALLOC', displayName: 'Allocations' },
  settlement: { abbreviation: 'SETL', displayName: 'Settlement' },
  segments: { abbreviation: 'SEGM', displayName: 'Segments' },
  planning: { abbreviation: 'PLAN', displayName: 'Planning' },
  monitoring: { abbreviation: 'MON', displayName: 'Monitoring' }
}