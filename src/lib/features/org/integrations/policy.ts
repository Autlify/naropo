import 'server-only'

import { db } from '@/lib/db'
import { Prisma } from '@/generated/prisma/client'
import type { IntegrationScope } from './guards'

export type EffectiveConnection = {
  id: string
  provider: string
  status: string
  agencyId: string | null
  subAccountId: string | null
  config: any | null
  credentials: any | null
  isInherited: boolean
  createdAt: string
  updatedAt: string
}

/**
 * Agency -> Subaccount inheritance (read):
 * - In SUBACCOUNT scope, include:
 *   - subAccount-specific connections
 *   - agency-level connections (agencyId = parent agencyId, subAccountId IS NULL)
 *
 * Write is always to the current scope only (no writing inherited records).
 */
export async function listEffectiveConnections(scope: IntegrationScope) {
  if (scope.type === 'AGENCY') {
    const rows = (await db.$queryRaw(
      Prisma.sql`SELECT "id","provider","status","agencyId","subAccountId","config","credentials","createdAt","updatedAt"
                FROM "IntegrationConnection"
                WHERE "deletedAt" IS NULL AND "agencyId" = ${scope.agencyId}
                ORDER BY "provider" ASC`
    )) as any[]
    return rows.map((r) => ({ ...r, isInherited: false })) as EffectiveConnection[]
  }

  const sub = await db.subAccount.findUnique({
    where: { id: scope.subAccountId },
    select: { agencyId: true },
  })
  if (!sub?.agencyId) return [] as EffectiveConnection[]

  const rows = (await db.$queryRaw(
    Prisma.sql`SELECT "id","provider","status","agencyId","subAccountId","config","credentials","createdAt","updatedAt"
              FROM "IntegrationConnection"
              WHERE "deletedAt" IS NULL
                AND (
                  "subAccountId" = ${scope.subAccountId}
                  OR ("agencyId" = ${sub.agencyId} AND "subAccountId" IS NULL)
                )
              ORDER BY "provider" ASC`
  )) as any[]

  return rows.map((r) => ({
    ...r,
    isInherited: r.subAccountId === null && r.agencyId === sub.agencyId,
  })) as EffectiveConnection[]
}

export async function getConnectionByProvider(scope: IntegrationScope, provider: string) {
  if (scope.type === 'AGENCY') {
    const rows = (await db.$queryRaw(
      Prisma.sql`SELECT "id","provider","status","agencyId","subAccountId","config","credentials","createdAt","updatedAt"
                FROM "IntegrationConnection"
                WHERE "deletedAt" IS NULL AND "provider" = ${provider} AND "agencyId" = ${scope.agencyId} AND "subAccountId" IS NULL
                LIMIT 1`
    )) as any[]
    return rows?.[0] ?? null
  }

  const rows = (await db.$queryRaw(
    Prisma.sql`SELECT "id","provider","status","agencyId","subAccountId","config","credentials","createdAt","updatedAt"
              FROM "IntegrationConnection"
              WHERE "deletedAt" IS NULL AND "provider" = ${provider} AND "subAccountId" = ${scope.subAccountId}
              LIMIT 1`
  )) as any[]
  return rows?.[0] ?? null
}
