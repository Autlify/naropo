import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireIntegrationAuth } from '@/lib/features/org/integrations/guards'
import { db } from '@/lib/db'
import { Prisma } from '@/generated/prisma/client'
import { deleteSubscription, updateSubscription, getSubscriptionWithScope, updateSubscriptionSecret } from '@/lib/features/org/integrations/store'
import { randomToken, sha256Hex, encryptStringGcm, decryptStringGcm } from '@/lib/features/org/integrations/crypto'
import { sendWebhookAttempt } from '@/lib/features/org/integrations/delivery'
import { KEYS } from '@/lib/registry/keys/permissions'
import { withErrorHandler, validateRequest } from '@/lib/api'

const PatchSchema = z.object({
  url: z.string().url().optional(),
  events: z.array(z.string().min(1)).optional(),
  isActive: z.boolean().optional(),
})

type Props = { params: Promise<{ id: string }> }

export const GET = withErrorHandler(async (req: Request, props: Props) => {
  const { scope } = await requireIntegrationAuth(req, { requiredKeys: [KEYS.org.apps.webhooks.view] })
  const { id } = await props.params
  const ok = await subscriptionInScope(id, scope)
  if (!ok) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const subscription = await db.integrationWebhookSubscription.findUnique({
    where: { id },
    select: {
      id: true,
      connectionId: true,
      url: true,
      events: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
  })

  if (!subscription) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ subscription })
})

export const PATCH = withErrorHandler(async (req: Request, props: Props) => {
  const { scope } = await requireIntegrationAuth(req, { requireWrite: true, requiredKeys: [KEYS.org.apps.webhooks.manage] })
  const { id } = await props.params
  
  const result = await validateRequest(req, PatchSchema)
  if ('error' in result) return result.error
  
  const ok = await subscriptionInScope(id, scope)
  if (!ok) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  await updateSubscription(id, result.data)
  return NextResponse.json({ ok: true })
})

export const DELETE = withErrorHandler(async (req: Request, props: Props) => {
  const { scope } = await requireIntegrationAuth(req, { requireWrite: true, requiredKeys: [KEYS.org.apps.webhooks.manage] })
  const { id } = await props.params
  const ok = await subscriptionInScope(id, scope)
  if (!ok) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  await deleteSubscription(id)
  return NextResponse.json({ ok: true })
})

// POST handles actions: test, rotate
export const POST = withErrorHandler(async (req: Request, props: Props) => {
  const url = new URL(req.url)
  const action = url.searchParams.get('action')

  if (action === 'test') {
    return handleTest(req, props)
  } else if (action === 'rotate') {
    return handleRotate(req, props)
  }

  return NextResponse.json({ error: 'Invalid action. Use ?action=test or ?action=rotate' }, { status: 400 })
})

async function handleTest(req: Request, props: Props) {
  const { scope } = await requireIntegrationAuth(req, { requireWrite: true, requiredKeys: [KEYS.org.apps.webhooks.manage] })
  const { id } = await props.params
  const sub = await getSubscriptionWithScope(id)
  if (!sub) return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 })

  if (scope.type === 'AGENCY') {
    if (sub.agencyId !== scope.agencyId || sub.subAccountId) return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 })
  } else {
    if (sub.subAccountId !== scope.subAccountId) return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 })
  }

  const secret = sub.secretEnc ? decryptStringGcm(sub.secretEnc) : null

  const attempt = await sendWebhookAttempt({
    url: sub.url,
    secret,
    body: {
      event: 'autlify.webhook.test',
      subscriptionId: sub.id,
      sentAt: new Date().toISOString(),
    },
  })

  return NextResponse.json({ ok: attempt.ok, status: attempt.status, durationMs: attempt.durationMs, error: attempt.ok ? null : attempt.error ?? attempt.body }, { status: 200 })
}

async function handleRotate(req: Request, props: Props) {
  const { scope } = await requireIntegrationAuth(req, { requireWrite: true, requiredKeys: [KEYS.org.apps.webhooks.manage] })
  const { id } = await props.params
  const sub = await getSubscriptionWithScope(id)
  if (!sub) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (scope.type === 'AGENCY') {
    if (sub.agencyId !== scope.agencyId || sub.subAccountId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  } else {
    if (sub.subAccountId !== scope.subAccountId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const secret = randomToken(24)
  const secretHash = sha256Hex(secret)
  const secretEnc = encryptStringGcm(secret)

  await updateSubscriptionSecret({ subscriptionId: id, secretHash, secretEnc })

  return NextResponse.json({ subscriptionId: id, secret }, { status: 200 })
}


async function subscriptionInScope(subscriptionId: string, scope: any) {
  const rows = (await db.$queryRaw(
    Prisma.sql`SELECT c."agencyId", c."subAccountId"
              FROM "IntegrationWebhookSubscription" s
              JOIN "IntegrationConnection" c ON c."id" = s."connectionId"
              WHERE s."id" = ${subscriptionId}
              LIMIT 1`
  )) as any[]
  const row = rows?.[0]
  if (!row) return false

  if (scope.type === 'AGENCY') {
    return row.agencyId === scope.agencyId && row.subAccountId === null
  }
  if (scope.type === 'SUBACCOUNT') {
    return row.subAccountId === scope.subAccountId
  }
  return false
}
