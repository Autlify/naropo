import { z } from 'zod'

export const IntegrationScopeSchema = z.object({
  kind: z.enum(['agency', 'subaccount']),
  agencyId: z.string().min(1),
  subAccountId: z.string().min(1).optional(),
})

export const IntegrationProviderSchema = z.object({
  key: z.string().min(1),
  name: z.string().min(1),
  category: z.string().optional(),
  authType: z.enum(['API_KEY', 'OAUTH', 'WEBHOOK', 'NONE']).optional(),
  description: z.string().optional(),
})

export const IntegrationConnectionSchema = z.object({
  id: z.string().min(1),
  provider: z.string().min(1),
  status: z.string().min(1),
  agencyId: z.string().nullable().optional(),
  subAccountId: z.string().nullable().optional(),
  config: z.any().optional(),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
  // Presentation fields
  ownership: z.enum(['OWNED', 'INHERITED']).optional(),
})

export const ApiKeySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  keyPrefix: z.string().min(1),
  createdAt: z.string().datetime().optional(),
  revokedAt: z.string().datetime().nullable().optional(),
  lastUsedAt: z.string().datetime().nullable().optional(),
})

export const ApiKeyCreateRequestSchema = z.object({
  name: z.string().min(1),
})

export const ApiKeyCreateResponseSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  keyPrefix: z.string().min(1),
  apiKey: z.string().min(1), // returned once
})

export const WebhookSubscriptionSchema = z.object({
  id: z.string().min(1),
  connectionId: z.string().min(1),
  url: z.string().url(),
  events: z.array(z.string()),
  isActive: z.boolean(),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
})

export const WebhookCreateRequestSchema = z.object({
  connectionId: z.string().min(1),
  url: z.string().url(),
  events: z.array(z.string().min(1)).min(1),
})

export const WebhookRotateSecretResponseSchema = z.object({
  subscriptionId: z.string().min(1),
  secret: z.string().min(1), // returned once
})

export const WebhookTestResponseSchema = z.object({
  ok: z.boolean(),
  status: z.number().nullable(),
  durationMs: z.number().optional(),
  error: z.string().nullable().optional(),
})

export const DeliverySchema = z.object({
  id: z.string().min(1),
  subscriptionId: z.string().min(1),
  status: z.string().min(1),
  attemptCount: z.number().int(),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
})

export const ProvidersListResponseSchema = z.object({ providers: z.array(IntegrationProviderSchema) })
export const ConnectionsListResponseSchema = z.object({ connections: z.array(IntegrationConnectionSchema) })
export const ApiKeysListResponseSchema = z.object({ apiKeys: z.array(ApiKeySchema) })
export const WebhooksListResponseSchema = z.object({ subscriptions: z.array(WebhookSubscriptionSchema) })
export const DeliveriesListResponseSchema = z.object({ deliveries: z.array(DeliverySchema) })

// ---- Endpoint envelopes & request/response contracts (Apps Hub / SDK) ----

export const OkResponseSchema = z.object({ ok: z.boolean() })

export const ConnectionUpsertRequestSchema = z.object({
  provider: z.string().min(1),
  status: z.string().optional(),
  config: z.any().optional(),
  credentials: z.any().optional(),
})

export const ConnectionPatchRequestSchema = z.object({
  status: z.string().optional(),
  config: z.any().optional(),
  credentials: z.any().optional(),
})

export const ConnectionEnvelopeSchema = z.object({ connection: IntegrationConnectionSchema })

// Uses the same shape as webhook test responses
export const ConnectionTestResponseSchema = WebhookTestResponseSchema

export const ApiKeyCreateEnvelopeSchema = z.object({ apiKey: ApiKeyCreateResponseSchema })

export const WebhookCreateResponseSchema = z.object({
  subscriptionId: z.string().min(1),
})

export const WebhookPatchRequestSchema = z.object({
  url: z.string().url().optional(),
  events: z.array(z.string().min(1)).optional(),
  isActive: z.boolean().optional(),
})

export const DeliveryAttemptSchema = z.object({
  id: z.string().min(1),
  statusCode: z.number().int().nullable().optional(),
  responseBody: z.any().nullable().optional(),
  error: z.string().nullable().optional(),
  durationMs: z.number().nullable().optional(),
  attemptedAt: z.string().datetime().optional(),
})

export const DeliveryRecordSchema = z.object({
  id: z.string().min(1),
  subscriptionId: z.string().min(1),
  status: z.string().min(1),
  attemptCount: z.number().int().optional(),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
  subscriptionUrl: z.string().url().optional(),
  provider: z.string().optional(),
}).passthrough()

export const DeliveryDetailResponseSchema = z.object({
  delivery: DeliveryRecordSchema,
  attempts: z.array(DeliveryAttemptSchema),
})

export const ReplayResponseSchema = z.object({
  ok: z.boolean(),
  result: z.any(),
})
