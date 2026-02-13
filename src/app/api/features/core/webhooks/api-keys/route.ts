import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireIntegrationAuth } from '@/lib/features/org/integrations/guards'
import { createApiKey, listApiKeys } from '@/lib/features/org/integrations/store'
import { KEYS } from '@/lib/registry/keys/permissions'

const CreateSchema = z.object({
  name: z.string().min(1).max(80),
})

export async function GET(req: Request) {
  try {
    const { scope } = await requireIntegrationAuth(req, { requiredKeys: [KEYS.org.apps.webhooks.view] })
    const keys = await listApiKeys(scope)
    return NextResponse.json({ apiKeys: keys })
  } catch (e: any) {
    if (e instanceof Response) return e
    console.error(e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const auth = await requireIntegrationAuth(req, { requireWrite: true, requiredKeys: [KEYS.org.apps.webhooks.manage] })
    const body = await req.json()
    const parsed = CreateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    const createdByUserId = auth.actor.kind === 'session' ? auth.actor.userId : undefined
    const created = await createApiKey({
      scope: auth.scope,
      name: parsed.data.name,
      createdByUserId,
    })

    return NextResponse.json({ apiKey: created }, { status: 201 })
  } catch (e: any) {
    if (e instanceof Response) return e
    console.error(e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}