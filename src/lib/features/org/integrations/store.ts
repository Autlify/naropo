import 'server-only'

import { db } from '@/lib/db'
import { Prisma } from '@/generated/prisma/client'
import type { IntegrationScope } from './guards'
import { generateIntegrationApiKey } from './apiKeys'

export async function listApiKeys(scope: IntegrationScope) {
  if (scope.type === 'AGENCY') {
    return (await db.$queryRaw(
      Prisma.sql`SELECT "id","name","keyPrefix","createdAt","revokedAt","lastUsedAt"
                FROM "IntegrationApiKey"
                WHERE "agencyId" = ${scope.agencyId} AND "subAccountId" IS NULL
                ORDER BY "createdAt" DESC`
    )) as any[]
  }

  return (await db.$queryRaw(
    Prisma.sql`SELECT "id","name","keyPrefix","createdAt","revokedAt","lastUsedAt"
              FROM "IntegrationApiKey"
              WHERE "subAccountId" = ${scope.subAccountId}
              ORDER BY "createdAt" DESC`
  )) as any[]
}

export async function createApiKey(opts: {
  scope: IntegrationScope
  name: string
  createdByUserId?: string
}) {
  const { apiKey, keyPrefix, keyHash } = generateIntegrationApiKey()
  const id = cryptoRandomUuid()

  const agencyId = opts.scope.type === 'AGENCY' ? opts.scope.agencyId : null
  const subAccountId =
    opts.scope.type === 'SUBACCOUNT' ? opts.scope.subAccountId : null

  await db.$executeRaw(
    Prisma.sql`INSERT INTO "IntegrationApiKey"
      ("id","name","keyPrefix","keyHash","agencyId","subAccountId","createdByUserId","createdAt")
      VALUES
      (${id}, ${opts.name}, ${keyPrefix}, ${keyHash}, ${agencyId}, ${subAccountId}, ${opts.createdByUserId ?? null}, now())`
  )

  // return secret once
  return { id, name: opts.name, keyPrefix, apiKey }
}

export async function revokeApiKey(id: string) {
  await db.$executeRaw(
    Prisma.sql`UPDATE "IntegrationApiKey" SET "revokedAt" = now() WHERE "id" = ${id}`
  )
}

export async function listSubscriptions(connectionId: string) {
  return (await db.$queryRaw(
    Prisma.sql`SELECT "id","connectionId","url","events","isActive","createdAt","updatedAt"
              FROM "IntegrationWebhookSubscription"
              WHERE "connectionId" = ${connectionId}
              ORDER BY "createdAt" DESC`
  )) as any[]
}

export async function createSubscription(opts: {
  connectionId: string
  url: string
  events: string[]
  secretHash?: string | null
  secretEnc?: string | null
}) {
  const id = cryptoRandomUuid()
  await db.$executeRaw(
    Prisma.sql`INSERT INTO "IntegrationWebhookSubscription"
      ("id","connectionId","url","secretHash","secretEnc","events","isActive","createdAt","updatedAt")
      VALUES
      (${id}, ${opts.connectionId}, ${opts.url}, ${opts.secretHash ?? null}, ${opts.secretEnc ?? null}, ${opts.events}, true, now(), now())`
  )
  return id
}

export async function updateSubscription(subscriptionId: string, patch: any) {
  // limited patch
  const url = patch.url ?? null
  const events = patch.events ?? null
  const isActive = patch.isActive ?? null

  await db.$executeRaw(
    Prisma.sql`UPDATE "IntegrationWebhookSubscription"
      SET
        "url" = COALESCE(${url}, "url"),
        "events" = COALESCE(${events}, "events"),
        "isActive" = COALESCE(${isActive}, "isActive"),
        "updatedAt" = now()
      WHERE "id" = ${subscriptionId}`
  )
}

export async function deleteSubscription(subscriptionId: string) {
  await db.$executeRaw(
    Prisma.sql`DELETE FROM "IntegrationWebhookSubscription" WHERE "id" = ${subscriptionId}`
  )
}

export async function upsertConnection(opts: {
  scope: IntegrationScope
  provider: string
  status?: string
  config?: any
  credentials?: any
}) {
  const agencyId = opts.scope.type === 'AGENCY' ? opts.scope.agencyId : null
  const subAccountId =
    opts.scope.type === 'SUBACCOUNT' ? opts.scope.subAccountId : null

  // Avoid relying on NULL semantics in composite unique indexes.
  const existing = (await db.$queryRaw(
    Prisma.sql`SELECT "id"
              FROM "IntegrationConnection"
              WHERE "deletedAt" IS NULL
                AND "provider" = ${opts.provider}
                AND "agencyId" IS NOT DISTINCT FROM ${agencyId}
                AND "subAccountId" IS NOT DISTINCT FROM ${subAccountId}
              LIMIT 1`
  )) as any[]

  const existingId = existing?.[0]?.id as string | undefined
  if (existingId) {
    await db.$executeRaw(
      Prisma.sql`UPDATE "IntegrationConnection"
        SET
          "status" = COALESCE(${opts.status ?? null}, "status"),
          "config" = COALESCE(${opts.config ?? null}, "config"),
          "credentials" = COALESCE(${opts.credentials ?? null}, "credentials"),
          "updatedAt" = now()
        WHERE "id" = ${existingId}`
    )
    const rows = (await db.$queryRaw(
      Prisma.sql`SELECT "id","provider","status","agencyId","subAccountId","config","credentials","createdAt","updatedAt"
                FROM "IntegrationConnection"
                WHERE "id" = ${existingId}
                LIMIT 1`
    )) as any[]
    return rows?.[0] ?? null
  }

  const id = cryptoRandomUuid()
  await db.$executeRaw(
    Prisma.sql`INSERT INTO "IntegrationConnection"
      ("id","provider","status","agencyId","subAccountId","config","credentials","createdAt","updatedAt")
      VALUES
      (${id}, ${opts.provider}, ${opts.status ?? 'DISCONNECTED'}, ${agencyId}, ${subAccountId}, ${opts.config ?? null}, ${opts.credentials ?? null}, now(), now())`
  )

  const rows = (await db.$queryRaw(
    Prisma.sql`SELECT "id","provider","status","agencyId","subAccountId","config","credentials","createdAt","updatedAt"
              FROM "IntegrationConnection"
              WHERE "id" = ${id}
              LIMIT 1`
  )) as any[]

  return rows?.[0] ?? null
}


export async function updateConnectionById(connectionId: string, patch: any) {
  const status = patch.status ?? null
  const config = patch.config ?? null
  const credentials = patch.credentials ?? null

  await db.$executeRaw(
    Prisma.sql`UPDATE "IntegrationConnection"
      SET
        "status" = COALESCE(${status}, "status"),
        "config" = COALESCE(${config}, "config"),
        "credentials" = COALESCE(${credentials}, "credentials"),
        "updatedAt" = now()
      WHERE "id" = ${connectionId} AND "deletedAt" IS NULL`
  )
}

export async function deleteConnection(connectionId: string) {
  await db.$executeRaw(
    Prisma.sql`UPDATE "IntegrationConnection" SET "deletedAt" = now(), "updatedAt" = now() WHERE "id" = ${connectionId}`
  )
}

export async function createProviderEventIdempotent(opts: {
  provider: string
  connectionId: string
  externalEventId: string | null
  headers: any
  payload: any
}) {
  const id = cryptoRandomUuid()
  await db.$executeRaw(
    Prisma.sql`INSERT INTO "IntegrationProviderEvent"
      ("id","provider","connectionId","externalEventId","headers","payload","receivedAt")
      VALUES
      (${id}, ${opts.provider}, ${opts.connectionId}, ${opts.externalEventId}, ${opts.headers ?? null}, ${opts.payload ?? null}, now())
      ON CONFLICT ("connectionId","externalEventId") DO NOTHING`
  )

  const rows = (await db.$queryRaw(
    Prisma.sql`SELECT "id","provider","connectionId","externalEventId","headers","payload","receivedAt","processedAt"
              FROM "IntegrationProviderEvent"
              WHERE "connectionId" = ${opts.connectionId}
                AND "externalEventId" IS NOT DISTINCT FROM ${opts.externalEventId}
              ORDER BY "receivedAt" DESC
              LIMIT 1`
  )) as any[]

  return rows?.[0] ?? null
}

export async function createDelivery(opts: {
  subscriptionId: string
  providerEventId?: string | null
}) {
  const id = cryptoRandomUuid()
  await db.$executeRaw(
    Prisma.sql`INSERT INTO "IntegrationWebhookDelivery"
      ("id","subscriptionId","providerEventId","status","attemptCount","createdAt","updatedAt")
      VALUES
      (${id}, ${opts.subscriptionId}, ${opts.providerEventId ?? null}, 'PENDING', 0, now(), now())`
  )
  return id
}

export async function createAttempt(opts: {
  deliveryId: string
  statusCode?: number | null
  responseBody?: string | null
  error?: string | null
  durationMs?: number | null
}) {
  const id = cryptoRandomUuid()
  await db.$executeRaw(
    Prisma.sql`INSERT INTO "IntegrationWebhookDeliveryAttempt"
      ("id","deliveryId","statusCode","responseBody","error","durationMs","attemptedAt")
      VALUES
      (${id}, ${opts.deliveryId}, ${opts.statusCode ?? null}, ${opts.responseBody ?? null}, ${opts.error ?? null}, ${opts.durationMs ?? null}, now())`
  )
  return id
}

export async function incrementDeliveryAttempt(deliveryId: string, status: 'SUCCESS' | 'FAILED') {
  await db.$executeRaw(
    Prisma.sql`UPDATE "IntegrationWebhookDelivery"
      SET "attemptCount" = "attemptCount" + 1,
          "status" = ${status},
          "updatedAt" = now()
      WHERE "id" = ${deliveryId}`
  )
}

export async function listDeliveries(scope: IntegrationScope, opts?: { limit?: number }) {
  const limit = opts?.limit ?? 50
  if (scope.type === 'AGENCY') {
    return (await db.$queryRaw(
      Prisma.sql`SELECT d."id", d."status", d."attemptCount", d."createdAt", s."url", c."provider", d."subscriptionId"
                FROM "IntegrationWebhookDelivery" d
                JOIN "IntegrationWebhookSubscription" s ON s."id" = d."subscriptionId"
                JOIN "IntegrationConnection" c ON c."id" = s."connectionId"
                WHERE c."agencyId" = ${scope.agencyId} AND c."subAccountId" IS NULL AND c."deletedAt" IS NULL
                ORDER BY d."createdAt" DESC
                LIMIT ${limit}`
    )) as any[]
  }

  const sub = await db.subAccount.findUnique({
    where: { id: scope.subAccountId },
    select: { agencyId: true },
  })

  return (await db.$queryRaw(
    Prisma.sql`SELECT d."id", d."status", d."attemptCount", d."createdAt", s."url", c."provider", d."subscriptionId"
              FROM "IntegrationWebhookDelivery" d
              JOIN "IntegrationWebhookSubscription" s ON s."id" = d."subscriptionId"
              JOIN "IntegrationConnection" c ON c."id" = s."connectionId"
              WHERE c."deletedAt" IS NULL
                AND (
                  c."subAccountId" = ${scope.subAccountId}
                  OR (c."agencyId" = ${sub?.agencyId ?? null} AND c."subAccountId" IS NULL)
                )
              ORDER BY d."createdAt" DESC
              LIMIT ${limit}`
  )) as any[]
}


export async function getDeliveryDetail(deliveryId: string, scope?: IntegrationScope) {
  let scopeWhere = Prisma.sql``

  if (scope?.type === 'AGENCY') {
    scopeWhere = Prisma.sql` AND c."agencyId" = ${scope.agencyId} AND c."subAccountId" IS NULL`
  } else if (scope?.type === 'SUBACCOUNT') {
    const sub = await db.subAccount.findUnique({
      where: { id: scope.subAccountId },
      select: { agencyId: true },
    })
    scopeWhere = Prisma.sql` AND (
      c."subAccountId" = ${scope.subAccountId}
      OR (c."agencyId" = ${sub?.agencyId ?? null} AND c."subAccountId" IS NULL)
    )`
  }

  const deliveries = (await db.$queryRaw(
    Prisma.sql`SELECT d.*, s."url" as "subscriptionUrl", c."provider" as "provider"
              FROM "IntegrationWebhookDelivery" d
              JOIN "IntegrationWebhookSubscription" s ON s."id" = d."subscriptionId"
              JOIN "IntegrationConnection" c ON c."id" = s."connectionId"
              WHERE d."id" = ${deliveryId}${scopeWhere}
              LIMIT 1`
  )) as any[]
  const delivery = deliveries?.[0] ?? null
  if (!delivery) return null

  const attempts = (await db.$queryRaw(
    Prisma.sql`SELECT "id","statusCode","responseBody","error","durationMs","attemptedAt"
              FROM "IntegrationWebhookDeliveryAttempt"
              WHERE "deliveryId" = ${deliveryId}
              ORDER BY "attemptedAt" DESC`
  )) as any[]

  return { delivery, attempts }
}


function cryptoRandomUuid() {
  // Prefer crypto.randomUUID when available (Node 18+), fall back to a lightweight v4 generator.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const g: any = globalThis as any
  if (g?.crypto?.randomUUID) {
    return g.crypto.randomUUID()
  }
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const nodeCrypto = require('crypto')
    if (nodeCrypto?.randomUUID) return nodeCrypto.randomUUID()
  } catch {}
  const s: string[] = []
  const hex = '0123456789abcdef'
  for (let i = 0; i < 36; i++) s[i] = hex[Math.floor(Math.random() * 16)]
  s[14] = '4'
  // eslint-disable-next-line no-bitwise
  s[19] = hex[(parseInt(s[19], 16) & 0x3) | 0x8]
  s[8] = s[13] = s[18] = s[23] = '-'
  return s.join('')
}



export async function getSubscriptionWithScope(subscriptionId: string) {
  const rows = (await db.$queryRaw(
    Prisma.sql`SELECT s."id", s."connectionId", s."url", s."events", s."isActive", s."secretHash", s."secretEnc",
                     c."agencyId", c."subAccountId"
              FROM "IntegrationWebhookSubscription" s
              JOIN "IntegrationConnection" c ON c."id" = s."connectionId"
              WHERE s."id" = ${subscriptionId}
              LIMIT 1`
  )) as any[]
  return rows?.[0] ?? null
}

export async function updateSubscriptionSecret(opts: {
  subscriptionId: string
  secretHash: string | null
  secretEnc: string | null
}) {
  await db.$executeRaw(
    Prisma.sql`UPDATE "IntegrationWebhookSubscription"
              SET "secretHash" = ${opts.secretHash}, "secretEnc" = ${opts.secretEnc}, "updatedAt" = now()
              WHERE "id" = ${opts.subscriptionId}`
  )
}


export async function getConnectionById(connectionId: string) {
  const rows = (await db.$queryRaw(
    Prisma.sql`SELECT "id","provider","status","agencyId","subAccountId","credentials","config","createdAt","updatedAt","deletedAt"
              FROM "IntegrationConnection"
              WHERE "id" = ${connectionId} AND "deletedAt" IS NULL
              LIMIT 1`
  )) as any[]
  return rows?.[0] ?? null
}
