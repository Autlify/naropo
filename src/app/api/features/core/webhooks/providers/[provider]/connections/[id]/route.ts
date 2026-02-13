import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireIntegrationAuth } from '@/lib/features/org/integrations/guards'
import { getConnectionById } from '@/lib/features/org/integrations/store'
import { deleteConnection, updateConnectionById } from '@/lib/features/org/integrations/store'
import { KEYS } from '@/lib/registry/keys/permissions'

const PatchSchema = z.object({
  status: z.string().optional(),
  config: z.any().optional(),
  credentials: z.any().optional(),
})

type Props = { params: Promise<{ provider: string; id: string }> }

export async function GET(req: Request, props: Props) {
  try {
    const { scope } = await requireIntegrationAuth(req, { requiredKeys: [KEYS.org.apps.webhooks.view] })
    const { id } = await props.params
    const conn = await getConnectionById(id)
    if (!connectionInScope(conn, scope)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    return NextResponse.json({ connection: conn })
  } catch (e: any) {
    if (e instanceof Response) return e
    console.error(e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(req: Request, props: Props) {
  try {
    const { scope } = await requireIntegrationAuth(req, { requireWrite: true, requiredKeys: [KEYS.org.apps.webhooks.manage] })
    const { id } = await props.params
    const conn = await getConnectionById(id)
    if (!connectionInScope(conn, scope)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    const body = await req.json()
    const parsed = PatchSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    await updateConnectionById(id, parsed.data)
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    if (e instanceof Response) return e
    console.error(e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(req: Request, props: Props) {
  try {
    const { scope } = await requireIntegrationAuth(req, { requireWrite: true, requiredKeys: [KEYS.org.apps.webhooks.manage] })
    const { id } = await props.params
    const conn = await getConnectionById(id)
    if (!connectionInScope(conn, scope)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    await deleteConnection(id)
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    if (e instanceof Response) return e
    console.error(e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


function connectionInScope(conn: any, scope: any) {
  if (!conn) return false
  if (scope.type === 'AGENCY') return conn.agencyId === scope.agencyId && conn.subAccountId === null
  if (scope.type === 'SUBACCOUNT') return conn.subAccountId === scope.subAccountId
  return false
}