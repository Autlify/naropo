import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireIntegrationAuth } from '@/lib/features/org/integrations/guards'
import { listEffectiveConnections } from '@/lib/features/org/integrations/policy'
import { upsertConnection } from '@/lib/features/org/integrations/store'
import { KEYS } from '@/lib/registry/keys/permissions'
import { withErrorHandler, validateRequest } from '@/lib/api'

const CreateSchema = z.object({
  provider: z.string().min(1),
  status: z.string().optional(),
  config: z.any().optional(),
  credentials: z.any().optional(),
})

/**
 * GET /api/features/core/webhooks/connections
 * List all connections for the current tenant (agency or subaccount)
 */
export const GET = withErrorHandler(async (req: Request) => {
  const { scope } = await requireIntegrationAuth(req, { requiredKeys: [KEYS.org.apps.webhooks.view] })
  const connections = await listEffectiveConnections(scope)
  return NextResponse.json({ connections })
})

/**
 * POST /api/features/core/webhooks/connections
 * Create a new connection (provider specified in body)
 */
export const POST = withErrorHandler(async (req: Request) => {
  const { scope } = await requireIntegrationAuth(req, { requireWrite: true, requiredKeys: [KEYS.org.apps.webhooks.manage] })
  
  const result = await validateRequest(req, CreateSchema)
  if ('error' in result) return result.error

  const created = await upsertConnection({
    scope,
    provider: result.data.provider,
    status: result.data.status,
    config: result.data.config,
    credentials: result.data.credentials,
  })

  return NextResponse.json({ connection: created }, { status: 201 })
})
