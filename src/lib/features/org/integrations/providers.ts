import type { IntegrationProviderDefinition, IntegrationProviderId } from './types'

export const INTEGRATION_PROVIDERS: IntegrationProviderDefinition[] = [
  {
    id: 'github',
    name: 'GitHub',
    category: 'devtools',
    description: 'OAuth-based connection and webhook ingest for GitHub events.',
    oauthSupported: true,
    webhookSupported: true,
    inboundSignature: 'github-hmac-sha256',
  },
  {
    id: 'slack',
    name: 'Slack',
    category: 'messaging',
    description: 'OAuth-based connection and Events API ingest for Slack.',
    oauthSupported: true,
    webhookSupported: true,
    inboundSignature: 'slack-v0',
  },
  {
    id: 'stripe',
    name: 'Stripe',
    category: 'payments',
    description: 'Webhook-based ingestion for Stripe payment events.',
    oauthSupported: false,
    webhookSupported: true,
    inboundSignature: 'hmac-sha256',
  },
  {
    id: 'webhook',
    name: 'Custom Webhook',
    category: 'webhook',
    description: 'Generic webhook provider for custom integrations.',
    oauthSupported: false,
    webhookSupported: true,
    inboundSignature: 'hmac-sha256',
  },
]

export function getProvider(providerId: IntegrationProviderId) {
  return INTEGRATION_PROVIDERS.find((p) => p.id === providerId) || null
}
