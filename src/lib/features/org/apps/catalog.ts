import 'server-only'

export type AppScopeKind = 'AGENCY' | 'SUBACCOUNT'

export type AppCatalogItem = {
  key: string
  label: string
  description?: string
  // Whether this is a core module (always available) vs add-on.
  isCore?: boolean
  // Optional feature keys used for entitlement gating (billing entitlements).
  requiredFeatureKeys?: string[]
}

export const APPS_CATALOG: AppCatalogItem[] = [
  {
    key: 'support',
    label: 'Support Center',
    description: 'Guided troubleshooting, diagnostics, and support tickets.',
    isCore: true,
  },
  {
    key: 'integrations',
    label: 'Integrations',
    description: 'Connect providers, manage API keys, and configure outbound webhooks.',
    isCore: true,
  },
  {
    key: 'webhooks',
    label: 'Webhooks',
    description: 'Outbound webhook subscriptions, deliveries, and replay tooling.',
    isCore: true,
  },

  // // Future FI add-ons (placeholders)
  // { key: 'fi-gl', label: 'FI – General Ledger', description: 'Accounting: chart of accounts, journals, close.', requiredFeatureKeys: ['fi.gl.read', 'fi.gl.manage'] },
  // { key: 'fi-ar', label: 'FI – Accounts Receivable', description: 'Accounting: invoicing, receivables, collections.', requiredFeatureKeys: ['fi.ar.read', 'fi.ar.manage'] },
  // { key: 'fi-ap', label: 'FI – Accounts Payable', description: 'Accounting: vendor bills, approvals, payments.', requiredFeatureKeys: ['fi.ap.read', 'fi.ap.manage'] },
  // { key: 'fi-bl', label: 'FI – Bank Ledger', description: 'Accounting: bank sync, reconciliation, cash.', requiredFeatureKeys: ['fi.bl.read', 'fi.bl.manage'] },
  // { key: 'fi-co', label: 'FI – Controlling', description: 'Accounting: cost centers, allocations, profitability.', requiredFeatureKeys: ['fi.co.read', 'fi.co.manage'] },
]
