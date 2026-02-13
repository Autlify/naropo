/**
 * Settings Registry Keys
 *
 * Goal: provide a stable namespace-aligned key set so we can map:
 * - entitlement -> what settings are configurable
 * - UI forms -> what inputs to render/require
 *
 * Convention:
 * - "core.agency.*" and "core.subaccount.*" for general settings
 * - "fi.*" and other premium modules for module-specific settings
 */

export const SETTINGS_KEYS = {
  // ---------------------------------------------------------------------------
  // Agency (Org) Settings
  // ---------------------------------------------------------------------------
  AGENCY_PROFILE: 'org.agency.settings.profile',
  AGENCY_BRANDING: 'org.agency.settings.branding',
  AGENCY_BILLING: 'org.agency.settings.billing',
  AGENCY_TAX: 'org.agency.settings.tax',
  AGENCY_SECURITY: 'org.agency.settings.security',
  AGENCY_INTEGRATIONS: 'org.agency.settings.integrations',

  // ---------------------------------------------------------------------------
  // SubAccount (Business/Entity) Settings
  // ---------------------------------------------------------------------------
  SUBACCOUNT_PROFILE: 'org.subaccount.settings.profile',
  SUBACCOUNT_LOCALE: 'org.subaccount.settings.locale',
  SUBACCOUNT_TAX: 'org.subaccount.settings.tax',
  SUBACCOUNT_FINANCE: 'org.subaccount.settings.finance',

  // ---------------------------------------------------------------------------
  // Finance - General Ledger (FI-GL)
  // ---------------------------------------------------------------------------
  FI_GL_FISCAL_YEAR: 'fi.general_ledger.settings.fiscal_year',
  FI_GL_NUMBER_RANGES: 'fi.general_ledger.settings.number_ranges',
  FI_GL_POSTING_RULES: 'fi.general_ledger.settings.posting_rules',
  FI_GL_CURRENCIES: 'fi.general_ledger.settings.currencies',
} as const

export type SettingKey = (typeof SETTINGS_KEYS)[keyof typeof SETTINGS_KEYS]
