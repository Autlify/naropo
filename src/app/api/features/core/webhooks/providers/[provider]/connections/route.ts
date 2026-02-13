import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireIntegrationAuth } from '@/lib/features/org/integrations/guards'
import { listEffectiveConnections } from '@/lib/features/org/integrations/policy'
import { upsertConnection } from '@/lib/features/org/integrations/store'
import { KEYS } from '@/lib/registry/keys/permissions'

const CreateSchema = z.object({
  provider: z.string().min(1),
  status: z.string().optional(),
  config: z.any().optional(),
  credentials: z.any().optional(),
})

export async function GET(req: Request) {
  try {
    const { scope } = await requireIntegrationAuth(req, { requiredKeys: [KEYS.org.apps.webhooks.view] })
    const connections = await listEffectiveConnections(scope)
    return NextResponse.json({ connections })
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
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    const created = await upsertConnection({
      scope,
      provider: parsed.data.provider,
      status: parsed.data.status,
      config: parsed.data.config,
      credentials: parsed.data.credentials,
    })

    return NextResponse.json({ connection: created }, { status: 201 })
  } catch (e: any) {
    if (e instanceof Response) return e
    console.error(e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}