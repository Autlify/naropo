export type IntegrationCategory =
  | 'Automation'
  | 'Messaging'
  | 'CRM'
  | 'Data'
  | 'Analytics'
  | 'Support'
  | 'Engineering'

export type IntegrationCatalogItem = {
  id: string
  name: string
  category: IntegrationCategory
  description: string
  badges?: string[]
  docsLabel?: string
  icon?: 'zap' | 'make' | 'slack' | 'sheets' | 'webhook' | 'key'
  status?: 'available' | 'coming_soon'
}

/**
 * MVP catalog (no third-party SDK dependency). Treat these as marketing + IA placeholders.
 * Real integrations are enabled through webhooks/API + automation platforms (Zapier/Make).
 */
export const INTEGRATION_CATALOG: IntegrationCatalogItem[] = [
  {
    id: 'zapier',
    name: 'Zapier',
    category: 'Automation',
    description: 'Connect Autlify to 6,000+ apps using triggers & actions.',
    badges: ['Recommended', 'Low effort'],
    docsLabel: 'Triggers & actions',
    icon: 'zap',
    status: 'available',
  },
  {
    id: 'make',
    name: 'Make (Integromat)',
    category: 'Automation',
    description: 'Advanced automation workflows with visual scenario builder.',
    badges: ['Power users'],
    docsLabel: 'Webhooks + API',
    icon: 'make',
    status: 'available',
  },
  {
    id: 'slack',
    name: 'Slack',
    category: 'Messaging',
    description: 'Post notifications for leads, deals, payments, and thresholds.',
    badges: ['High impact'],
    docsLabel: 'Incoming webhook',
    icon: 'slack',
    status: 'coming_soon',
  },
  {
    id: 'google-sheets',
    name: 'Google Sheets',
    category: 'Data',
    description: 'Export and sync operational data into spreadsheets.',
    badges: ['Business friendly'],
    docsLabel: 'CSV/Sync',
    icon: 'sheets',
    status: 'coming_soon',
  },
]
