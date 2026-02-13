import { NextResponse } from 'next/server'
import { requireIntegrationAuth } from '@/lib/features/org/integrations/guards'
import { getDeliveryDetail, createAttempt, incrementDeliveryAttempt } from '@/lib/features/org/integrations/store'
import { sendWebhookAttempt } from '@/lib/features/org/integrations/delivery'
import { db } from '@/lib/db'
import { Prisma } from '@/generated/prisma/client'
import { KEYS } from '@/lib/registry/keys/permissions'

type Props = { params: Promise<{ id: string }> }

export async function GET(req: Request, props: Props) {
  try {
    const { scope } = await requireIntegrationAuth(req, { requiredKeys: [KEYS.org.apps.webhooks.view] })
    const { id } = await props.params
    const detail = await getDeliveryDetail(id, scope)
    if (!detail) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(detail)
  } catch (e: any) {
    if (e instanceof Response) return e
    console.error(e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST handles actions: replay
export async function POST(req: Request, props: Props) {
  try {
    const url = new URL(req.url)
    const action = url.searchParams.get('action')

    if (action === 'replay') {
      return handleReplay(req, props)
    }

    return NextResponse.json({ error: 'Invalid action. Use ?action=replay' }, { status: 400 })
  } catch (e: any) {
    if (e instanceof Response) return e
    console.error(e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function handleReplay(req: Request, props: Props) {
  const { scope } = await requireIntegrationAuth(req, { requireWrite: true, requiredKeys: [KEYS.org.apps.webhooks.manage] })
  const { id } = await props.params
  const detail = await getDeliveryDetail(id, scope)
  if (!detail) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Load subscription secretHash (we store secretHash, but replay cannot recover secret; use unsigned replay)
  const subs = (await db.$queryRaw(
    Prisma.sql`SELECT s."url", s."secretHash", c."provider"
              FROM "IntegrationWebhookSubscription" s
              JOIN "IntegrationConnection" c ON c."id" = s."connectionId"
              WHERE s."id" = ${detail.delivery.subscriptionId}
              LIMIT 1`
  )) as any[]
  const sub = subs?.[0]
  if (!sub) return NextResponse.json({ error: 'Subscription not found' }, { status: 404 })

  const payload = {
    type: 'webhook.replay',
    provider: sub.provider,
    deliveryId: id,
    occurredAt: new Date().toISOString(),
  }

  const result = await sendWebhookAttempt({
    url: sub.url,
    secret: sub.secretHash ?? null, // derived secret (sha256(userSecret))
    body: payload,
  })

  await createAttempt({
    deliveryId: id,
    statusCode: result.status ?? null,
    responseBody: result.body ?? null,
    error: (result as any).error ?? null,
    durationMs: result.durationMs ?? null,
  })
  await incrementDeliveryAttempt(id, result.ok ? 'SUCCESS' : 'FAILED')

  return NextResponse.json({ ok: true, result })
}
