import { NextResponse } from 'next/server'
import { requireRequestAccess } from '@/lib/features/iam/authz/require'
import { listDeliveries } from '@/lib/features/core/integrations/store'
import type { IntegrationScope } from '@/lib/features/core/integrations/guards'

const hasBaselineRead = (pks: string[], scopeKind: 'agency' | 'subaccount') => {
  if (scopeKind === 'agency') return pks.includes('core.agency.account.read')
  return pks.includes('core.subaccount.account.read')
}

const toIntegrationScope = (s: any): IntegrationScope => {
  if (s.kind === 'agency') return { type: 'AGENCY', agencyId: s.agencyId }
  return { type: 'SUBACCOUNT', subAccountId: s.subAccountId, agencyId: s.agencyId }
}

export async function GET(req: Request) {
  try {
    const ctx = await requireRequestAccess({ req, requiredKeys: [] })
    if (!hasBaselineRead(ctx.principal.permissionKeys, ctx.scope.kind)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const deliveries = await listDeliveries(toIntegrationScope(ctx.scope as any), { limit: 25 })
    const total = deliveries.length
    const failed = deliveries.filter((d: any) => String(d.status) === 'FAILED').length
    const success = deliveries.filter((d: any) => String(d.status) === 'SUCCESS').length

    return NextResponse.json({
      scope: ctx.scope,
      summary: {
        total,
        success,
        failed,
      },
      latest: deliveries.slice(0, 10),
    })
  } catch (e: any) {
    if (e instanceof Response) return e
    console.error(e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
