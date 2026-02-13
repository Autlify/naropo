import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireIntegrationAuth } from '@/lib/features/org/integrations/guards'
import { createSubscription, listSubscriptions } from '@/lib/features/org/integrations/store'
import { listEffectiveConnections } from '@/lib/features/org/integrations/policy'
import { sha256Hex } from '@/lib/features/org/integrations/crypto'
import { KEYS } from '@/lib/registry/keys/permissions'

const CreateSchema = z.object({
  connectionId: z.string().min(1),
  url: z.string().url(),
  events: z.array(z.string().min(1)).min(1),
  secret: z.string().min(8).optional(),
})

export async function GET(req: Request) {
  try {
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
  } catch (e: any) {
    if (e instanceof Response) return e
    console.error(e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const { scope } = await requireIntegrationAuth(req, { requireWrite: true, requiredKeys: [KEYS.org.apps.webhooks.manage] })
    const body = await req.json()
    const parsed = CreateSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })

    const effective = await listEffectiveConnections(scope)
    if (!effective.some((c) => c.id === parsed.data.connectionId)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const secretHash = parsed.data.secret ? sha256Hex(parsed.data.secret) : null
    const id = await createSubscription({
      connectionId: parsed.data.connectionId,
      url: parsed.data.url,
      events: parsed.data.events,
      secretHash,
    })

    return NextResponse.json({ subscriptionId: id }, { status: 201 })
  } catch (e: any) {
    if (e instanceof Response) return e
    console.error(e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}