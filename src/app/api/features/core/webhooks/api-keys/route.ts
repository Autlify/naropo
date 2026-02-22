import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireIntegrationAuth } from '@/lib/features/org/integrations/guards'
import { createApiKey, listApiKeys } from '@/lib/features/org/integrations/store'
import { KEYS } from '@/lib/registry/keys/permissions'
import { withErrorHandler, validateRequest } from '@/lib/api'

const CreateSchema = z.object({
  name: z.string().min(1).max(80),
})

export const GET = withErrorHandler(async (req: Request) => {
  const { scope } = await requireIntegrationAuth(req, { requiredKeys: [KEYS.org.apps.webhooks.view] })
  const keys = await listApiKeys(scope)
  return NextResponse.json({ apiKeys: keys })
})

export const POST = withErrorHandler(async (req: Request) => {
  const auth = await requireIntegrationAuth(req, { requireWrite: true, requiredKeys: [KEYS.org.apps.webhooks.manage] })
  
  const result = await validateRequest(req, CreateSchema)
  if ('error' in result) return result.error

  const createdByUserId = auth.actor.kind === 'session' ? auth.actor.userId : undefined
  const created = await createApiKey({
    scope: auth.scope,
    name: result.data.name,
    createdByUserId,
  })

  return NextResponse.json({ apiKey: created }, { status: 201 })
})