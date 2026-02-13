import 'server-only'

import { auth } from '@/auth'
import { db } from '@/lib/db'
import { Prisma } from '@/generated/prisma/client'
import { verifyIntegrationApiKey } from './apiKeys'
import { requirePermission } from '@/lib/features/iam/authz/require'
import { resolveAgencyContextForUser, resolveSubAccountContextForUser, getAgencySubscriptionState } from '@/lib/features/iam/authz/resolver'
import { ActionKey } from '@/lib/registry'

export type IntegrationScope =
  | { type: 'AGENCY'; agencyId: string }
  | { type: 'SUBACCOUNT'; subAccountId: string; agencyId?: string }

export type IntegrationActor =
  | { kind: 'session'; userId: string }
  | { kind: 'apiKey'; apiKeyId: string }

export type IntegrationAuthResult = {
  actor: IntegrationActor
  scope: IntegrationScope
}

/**
 * Header-based guard (API Key) + session fallback (UI).
 *
 * Headers supported:
 * - x-autlify-api-key: {prefix}.{secret}
 * - authorization: Bearer {prefix}.{secret}
 * - x-autlify-agency-id / x-autlify-subaccount-id (optional scope hint)
 *
 * Query params supported (session fallback):
 * - ?agencyId=... or ?subAccountId=...
 */
export async function requireIntegrationAuth(
  req: Request,
  opts?: { requiredKeys?: ActionKey[]; requireActiveSubscription?: boolean; requireWrite?: boolean }
): Promise<IntegrationAuthResult> {
  const apiKey = getApiKeyFromRequest(req)
  if (apiKey) {
    const hintedAgencyId = req.headers.get('x-autlify-agency-id') || undefined
    const hintedSubAccountId =
      req.headers.get('x-autlify-subaccount-id') || undefined
    return requireApiKeyAuth(apiKey, { hintedAgencyId, hintedSubAccountId, requireActiveSubscription: opts?.requireActiveSubscription })
  }

  return requireSessionAuth(req, opts)
}

function getApiKeyFromRequest(req: Request) {
  const h = req.headers.get('x-autlify-api-key')
  if (h) return h.trim()

  const authz = req.headers.get('authorization') || ''
  if (authz.toLowerCase().startsWith('bearer ')) {
    return authz.slice('bearer '.length).trim()
  }

  return null
}

async function requireApiKeyAuth(
  apiKey: string,
  hints: { hintedAgencyId?: string; hintedSubAccountId?: string; requireActiveSubscription?: boolean }
): Promise<IntegrationAuthResult> {
  const [prefix] = apiKey.split('.', 2)
  if (!prefix) throw new Response('Unauthorized', { status: 401 })

  // Lookup active key by prefix
  const rows = (await db.$queryRaw(
    Prisma.sql`SELECT "id","keyPrefix","keyHash","agencyId","subAccountId","revokedAt"
              FROM "IntegrationApiKey"
              WHERE "keyPrefix" = ${prefix}
              LIMIT 1`
  )) as any[]

  const row = rows?.[0]
  if (!row || row.revokedAt) throw new Response('Unauthorized', { status: 401 })

  const ok = verifyIntegrationApiKey({
    apiKey,
    storedHash: row.keyHash,
    storedPrefix: row.keyPrefix,
  })
  if (!ok) throw new Response('Unauthorized', { status: 401 })

  // Optional scope hint validation
  if (row.agencyId && hints.hintedAgencyId && hints.hintedAgencyId !== row.agencyId) {
    throw new Response('Forbidden', { status: 403 })
  }
  if (row.subAccountId && hints.hintedSubAccountId && hints.hintedSubAccountId !== row.subAccountId) {
    throw new Response('Forbidden', { status: 403 })
  }

  // Touch lastUsedAt
  await db.$executeRaw(
    Prisma.sql`UPDATE "IntegrationApiKey" SET "lastUsedAt" = now() WHERE "id" = ${row.id}`
  )

  // Subscription enforcement (API key access is a license boundary)
  const requireActive = hints.requireActiveSubscription ?? true
  if (requireActive) {
    // agencyId may be null for subaccount-scoped keys; resolve if needed
    let agencyId = row.agencyId as string | null
    if (!agencyId && row.subAccountId) {
      const sa = await db.subAccount.findUnique({
        where: { id: row.subAccountId },
        select: { agencyId: true },
      })
      agencyId = sa?.agencyId ?? null
    }
    if (!agencyId) throw new Response('Forbidden', { status: 403 })
    const subscriptionState = await getAgencySubscriptionState(agencyId)
    if (!subscriptionState || (subscriptionState !== 'ACTIVE' && subscriptionState !== 'TRIAL')) {
      throw new Response('Payment Required', { status: 402 })
    }
  }

  const scope: IntegrationScope = row.subAccountId
    ? { type: 'SUBACCOUNT', subAccountId: row.subAccountId, agencyId: row.agencyId ?? undefined }
    : { type: 'AGENCY', agencyId: row.agencyId }

  return { actor: { kind: 'apiKey', apiKeyId: row.id }, scope }
}

async function requireSessionAuth(
  req: Request,
  opts?: { requiredKeys?: ActionKey[]; requireActiveSubscription?: boolean; requireWrite?: boolean }
): Promise<IntegrationAuthResult> {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) throw new Response('Unauthorized', { status: 401 })

  const url = new URL(req.url)

  // Prefer scope headers (SDK-style), but allow query params as UI fallback.
  const agencyId =
    req.headers.get('x-autlify-agency-id') ||
    url.searchParams.get('agencyId') ||
    undefined

  const subAccountId =
    req.headers.get('x-autlify-subaccount-id') ||
    url.searchParams.get('subAccountId') ||
    undefined

  const requiredKeys = opts?.requiredKeys  ?? []
  const requireActive = opts?.requireActiveSubscription ?? true

  if (subAccountId) {
    const membership = await resolveSubAccountContextForUser({ userId, subAccountId })
    if (!membership) throw new Response('Forbidden', { status: 403 })

    // RBAC for session actor
    await requirePermission({
      permissionKeys: membership.permissionKeys,
      requiredKeys,
      failMode: 'throw',
      redirectTo: '/',
    })

    if (requireActive) {
      const subscriptionState = await getAgencySubscriptionState(membership.agencyId)
      if (!subscriptionState || (subscriptionState !== 'ACTIVE' && subscriptionState !== 'TRIAL')) {
        throw new Response('Payment Required', { status: 402 })
      }
    }

    return {
      actor: { kind: 'session', userId },
      scope: { type: 'SUBACCOUNT', subAccountId, agencyId: membership.agencyId },
    }
  }

  if (agencyId) {
    const membership = await resolveAgencyContextForUser({ userId, agencyId })
    if (!membership) throw new Response('Forbidden', { status: 403 })

    await requirePermission({
      permissionKeys: membership.permissionKeys,
      requiredKeys,
      failMode: 'throw',
      redirectTo: '/',
    })

    if (requireActive && (membership.subscriptionState !== 'ACTIVE' && membership.subscriptionState !== 'TRIAL')) {
      throw new Response('Payment Required', { status: 402 })
    }

    return { actor: { kind: 'session', userId }, scope: { type: 'AGENCY', agencyId } }
  }

  // If no explicit scope in request, deny (avoid accidental cross-tenant operations)
  throw new Response('Bad Request: missing agencyId/subAccountId', { status: 400 })
}

