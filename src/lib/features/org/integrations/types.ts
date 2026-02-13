export type IntegrationProviderId =
  | 'github'
  | 'slack'
  | 'stripe'
  | 'webhook'

export type IntegrationProviderCategory =
  | 'devtools'
  | 'messaging'
  | 'payments'
  | 'webhook'

export type WebhookSignatureScheme =
  | 'github-hmac-sha256'
  | 'slack-v0'
  | 'hmac-sha256'
  | 'none'

export interface IntegrationProviderDefinition {
  id: IntegrationProviderId
  name: string
  category: IntegrationProviderCategory
  description: string

  oauthSupported: boolean
  webhookSupported: boolean

  inboundSignature: WebhookSignatureScheme
}
