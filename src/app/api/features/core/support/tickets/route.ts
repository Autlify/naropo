import { NextResponse } from 'next/server'
import { requireRequestAccess } from '@/lib/features/iam/authz/require'
import { createSupportTicket, listSupportTickets, type SupportScope } from '@/lib/features/org/support/service'

// Minimal access: membership scope + baseline read permission.
const hasBaselineRead = (pks: string[], scopeKind: 'agency' | 'subaccount') => {
  if (scopeKind === 'agency') return pks.includes('org.agency.account.read')
  return pks.includes('org.subaccount.account.read')
}

function toSupportScope(resolved: { kind: 'agency'; agencyId: string } | { kind: 'subaccount'; agencyId: string; subAccountId: string }): SupportScope {
  if (resolved.kind === 'agency') return { kind: 'agency', agencyId: resolved.agencyId }
  return { kind: 'subaccount', agencyId: resolved.agencyId, subAccountId: resolved.subAccountId }
}

export async function GET(req: Request) {
  try {
    const ctx = await requireRequestAccess({ req, requiredKeys: [] })
    if (!hasBaselineRead(ctx.principal.permissionKeys, ctx.scope.kind)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const url = new URL(req.url)
    const limit = Number(url.searchParams.get('limit') || '50')
    const tickets = await listSupportTickets(toSupportScope(ctx.scope as any), {
      limit: Number.isFinite(limit) ? limit : 50,
    })

    return NextResponse.json({ tickets })
  } catch (e: any) {
    if (e instanceof Response) return e
    console.error(e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const ctx = await requireRequestAccess({ req, requiredKeys: [] })
    if (!hasBaselineRead(ctx.principal.permissionKeys, ctx.scope.kind)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json().catch(() => ({}))
    const category = String(body?.category || 'OTHER')
    const title = String(body?.title || 'Support ticket')
    const description = body?.description ? String(body.description) : null
    const diagnostics = body?.diagnostics ?? null

    const createdByUserId = ctx.principal.kind === 'user' ? ctx.principal.userId : ctx.principal.ownerUserId

    const ticket = await createSupportTicket(toSupportScope(ctx.scope as any), {
      category,
      title,
      description,
      diagnostics,
      createdByUserId,
    })

    return NextResponse.json({ ticket })
  } catch (e: any) {
    if (e instanceof Response) return e
    console.error(e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
