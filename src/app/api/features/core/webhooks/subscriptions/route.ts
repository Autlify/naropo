import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireIntegrationAuth } from '@/lib/features/org/integrations/guards'
import { createSubscription, listSubscriptions } from '@/lib/features/org/integrations/store'
import { listEffectiveConnections } from '@/lib/features/org/integrations/policy'
import { sha256Hex } from '@/lib/features/org/integrations/crypto'
import { KEYS } from '@/lib/registry/keys/permissions'
import { withErrorHandler, validateRequest } from '@/lib/api'

const CreateSchema = z.object({
  connectionId: z.string().min(1),
  url: z.string().url(),
  events: z.array(z.string().min(1)).min(1),
  secret: z.string().min(8).optional(),
})

export const GET = withErrorHandler(async (req: Request) => {
  const { scope } = await requireIntegrationAuth(req, { requiredKeys: [KEYS.org.apps.webhooks.view] })
  const url = new URL(req.url)
  const connectionId = url.searchParams.get('connectionId')
  if (!connectionId) {
    return NextResponse.json({ error: 'Missing connectionId' }, { status: 400 })
  }
  const effective = await listEffectiveConnections(scope)
  if (!effective.some((c) => c.id === connectionId)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const subs = await listSubscriptions(connectionId)
  return NextResponse.json({ subscriptions: subs })
})

export const POST = withErrorHandler(async (req: Request) => {
  const { scope } = await requireIntegrationAuth(req, { requireWrite: true, requiredKeys: [KEYS.org.apps.webhooks.manage] })
  
  const result = await validateRequest(req, CreateSchema)
  if ('error' in result) return result.error

  const effective = await listEffectiveConnections(scope)
  if (!effective.some((c) => c.id === result.data.connectionId)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const secretHash = result.data.secret ? sha256Hex(result.data.secret) : null
  const id = await createSubscription({
    connectionId: result.data.connectionId,
    url: result.data.url,
    events: result.data.events,
    secretHash,
  })

  return NextResponse.json({ subscriptionId: id }, { status: 201 })
})