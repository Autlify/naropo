import { NextResponse } from 'next/server'
import { requireIntegrationAuth } from '@/lib/features/org/integrations/guards'
import { revokeApiKey } from '@/lib/features/org/integrations/store'
import { db } from '@/lib/db'
import { Prisma } from '@/generated/prisma/client'
import { KEYS } from '@/lib/registry/keys/permissions'

type Props = { params: Promise<{ id: string }> }

export async function DELETE(req: Request, props: Props) {
  try {
    const { scope } = await requireIntegrationAuth(req, { requireWrite: true, requiredKeys: [KEYS.org.apps.webhooks.manage] })
    const { id } = await props.params
    const ok = await apiKeyInScope(id, scope)
    if (!ok) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    await revokeApiKey(id)
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    if (e instanceof Response) return e
    console.error(e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


async function apiKeyInScope(apiKeyId: string, scope: any) {
  const rows = (await db.$queryRaw(
    Prisma.sql`SELECT "agencyId","subAccountId" FROM "IntegrationApiKey" WHERE "id" = ${apiKeyId} LIMIT 1`
  )) as any[]
  const row = rows?.[0]
  if (!row) return false
  if (scope.type === 'AGENCY') return row.agencyId === scope.agencyId && row.subAccountId === null
  if (scope.type === 'SUBACCOUNT') return row.subAccountId === scope.subAccountId
  return false
}