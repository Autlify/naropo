import type { SettingKey } from '@/lib/registry/keys/settings'

export type SettingScope = 'AGENCY' | 'SUBACCOUNT'

export type SettingDefinition = {
  key: SettingKey
  scope: SettingScope
  title: string
  description?: string
  /** Entitlement feature keys required to unlock this setting group */
  requireAnyEntitlement?: string[]
}

/**
 * Single Source of Truth for settings gating.
 * - Keep keys aligned with @/lib/registry/keys/settings.ts
 * - requireAnyEntitlement should use EntitlementFeature keys (not permission keys)
 */
export const SETTINGS_DEFINITIONS: SettingDefinition[] = [
  // Agency
  {
    key: 'org.agency.settings.profile',
    scope: 'AGENCY',
    title: 'Organization profile',
  },
  {
    key: 'org.agency.settings.branding',
    scope: 'AGENCY',
    title: 'Branding & domains',
    requireAnyEntitlement: ['org.branding.custom_domain', 'org.branding.remove_autlify_branding'],
  },
  {
    key: 'org.agency.settings.billing',
    scope: 'AGENCY',
    title: 'Billing preferences',
    requireAnyEntitlement: ['org.billing.subscriptions'],
  },
  {
    key: 'org.agency.settings.tax',
    scope: 'AGENCY',
    title: 'Tax profile',
  },
  {
    key: 'org.agency.settings.security',
    scope: 'AGENCY',
    title: 'Security',
  },
  {
    key: 'org.agency.settings.integrations',
    scope: 'AGENCY',
    title: 'Integrations',
    requireAnyEntitlement: ['integrations.connections', 'integrations.webhooks'],
  },

  // SubAccount
  {
    key: 'org.subaccount.settings.profile',
    scope: 'SUBACCOUNT',
    title: 'Business profile',
  },
  {
    key: 'org.subaccount.settings.locale',
    scope: 'SUBACCOUNT',
    title: 'Locale & formatting',
  },
  {
    key: 'org.subaccount.settings.tax',
    scope: 'SUBACCOUNT',
    title: 'Tax settings',
  },
  {
    key: 'org.subaccount.settings.finance',
    scope: 'SUBACCOUNT',
    title: 'Finance defaults',
    requireAnyEntitlement: ['fi.general_ledger.accounts'],
  },

  // FI-GL
  {
    key: 'fi.general_ledger.settings.fiscal_year',
    scope: 'AGENCY',
    title: 'Fiscal year',
    requireAnyEntitlement: ['fi.configuration.fiscal_years'],
  },
  {
    key: 'fi.general_ledger.settings.number_ranges',
    scope: 'AGENCY',
    title: 'Number ranges',
    requireAnyEntitlement: ['fi.configuration.number_ranges'],
  },
  {
    key: 'fi.general_ledger.settings.posting_rules',
    scope: 'AGENCY',
    title: 'Posting rules',
    requireAnyEntitlement: ['fi.configuration.posting_rules'],
  },
  {
    key: 'fi.general_ledger.settings.currencies',
    scope: 'AGENCY',
    title: 'Currencies & exchange rates',
    requireAnyEntitlement: ['fi.configuration.currencies'],
  },
]
