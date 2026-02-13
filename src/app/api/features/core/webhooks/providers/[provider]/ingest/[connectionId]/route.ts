import { NextResponse } from 'next/server'
import { verifyGitHubSignature256, verifySlackSignature } from '@/lib/features/org/integrations/signatures'
import { getConnectionById } from '@/lib/features/org/integrations/store'
import { createAttempt, createDelivery, createProviderEventIdempotent, incrementDeliveryAttempt } from '@/lib/features/org/integrations/store'
import { sendWebhookAttempt } from '@/lib/features/org/integrations/delivery'
import { db } from '@/lib/db'
import { Prisma } from '@/generated/prisma/client'
import { sha256Hex } from '@/lib/features/org/integrations/crypto'

type Props = { params: Promise<{ provider: string; connectionId: string }> }

/**
 * Provider -> Autlify inbound webhook.
 * Path binding uses connectionId for tenant resolution.
 */
export async function POST(req: Request, props: Props) {
  try {
    const { provider, connectionId } = await props.params
    const rawBody = await req.text()
    const headersObj = Object.fromEntries(req.headers.entries())

    const connection = await getConnectionById(connectionId)
    if (!connection || connection.deletedAt) {
      return NextResponse.json({ error: 'Connection not found' }, { status: 404 })
    }
    if (connection.provider !== provider) {
      return NextResponse.json({ error: 'Provider mismatch' }, { status: 400 })
    }

    // Verify signature when secret present
    if (provider === 'github') {
      const secret = connection.config?.webhookSecret as string | undefined
      if (secret) {
        const ok = verifyGitHubSignature256({
          webhookSecret: secret,
          rawBody,
          signatureHeader: req.headers.get('x-hub-signature-256'),
        })
        if (!ok) return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
      }
    }

    if (provider === 'slack') {
      const signingSecret = connection.config?.signingSecret as string | undefined
      if (signingSecret) {
        const ok = verifySlackSignature({
          signingSecret,
          rawBody,
          timestampHeader: req.headers.get('x-slack-request-timestamp'),
          signatureHeader: req.headers.get('x-slack-signature'),
        })
        if (!ok) return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
      }
    }

    let payload: any = null
    try {
      payload = rawBody ? JSON.parse(rawBody) : null
    } catch {
      payload = { raw: rawBody }
    }

    if (provider === 'slack' && payload?.type === 'url_verification' && payload?.challenge) {
      return NextResponse.json({ challenge: payload.challenge })
    }

    const externalEventId =
      req.headers.get('x-github-delivery') ||
      payload?.event_id ||
      payload?.id ||
      sha256Hex(rawBody)

    const providerEvent = await createProviderEventIdempotent({
      provider,
      connectionId,
      externalEventId,
      headers: headersObj,
      payload,
    })

    // Determine event keys for matching
    const eventKeys = getEventKeys(provider, req.headers, payload)

    // Load subscriptions including secretHash
    const subscriptions = (await db.$queryRaw(
      Prisma.sql`SELECT "id","url","events","isActive","secretHash"
                FROM "IntegrationWebhookSubscription"
                WHERE "connectionId" = ${connectionId} AND "isActive" = true`
    )) as any[]

    const matched = subscriptions.filter((s) =>
      matchesSubscriptionEvents(s.events ?? [], eventKeys, provider)
    )

    const results: any[] = []
    for (const sub of matched) {
      const deliveryId = await createDelivery({
        subscriptionId: sub.id,
        providerEventId: providerEvent?.id ?? null,
      })

      const outboundPayload = {
        provider,
        connectionId,
        event: eventKeys[0] ?? provider,
        receivedAt: new Date().toISOString(),
        data: payload,
      }

      const attempt = await sendWebhookAttempt({
        url: sub.url,
        secret: sub.secretHash ?? null, // derived secret (sha256(userSecret))
        body: outboundPayload,
        headers: {
          'x-autlify-provider': provider,
          'x-autlify-connection-id': connectionId,
          'x-autlify-event': eventKeys[0] ?? provider,
        },
      })

      await createAttempt({
        deliveryId,
        statusCode: attempt.status ?? null,
        responseBody: attempt.body ?? null,
        error: (attempt as any).error ?? null,
        durationMs: attempt.durationMs ?? null,
      })
      await incrementDeliveryAttempt(deliveryId, attempt.ok ? 'SUCCESS' : 'FAILED')

      results.push({ deliveryId, ok: attempt.ok, status: attempt.status })
    }

    return NextResponse.json({
      ok: true,
      providerEventId: providerEvent?.id ?? null,
      matchedSubscriptions: matched.length,
      deliveries: results,
    })
  } catch (e: any) {
    if (e instanceof Response) return e
    console.error(e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function getEventKeys(provider: string, headers: Headers, payload: any): string[] {
  if (provider === 'github') {
    const evt = headers.get('x-github-event') || 'github'
    const action = payload?.action
    return action ? [evt, `${evt}.${action}`] : [evt]
  }

  if (provider === 'slack') {
    const top = payload?.type || 'slack'
    const inner = payload?.event?.type
    const keys = [top]
    if (inner) keys.unshift(inner)
    if (payload?.event_id) keys.push(`event.${payload.event_id}`)
    return keys
  }

  return [provider]
}

function matchesSubscriptionEvents(subEvents: string[], eventKeys: string[], provider: string) {
  const set = new Set(subEvents)
  if (set.has('*') || set.has(`${provider}.*`)) return true
  return eventKeys.some((k) => set.has(k))
}
