import { NextResponse } from 'next/server'
import { requireRequestAccess } from '@/lib/features/iam/authz/require'
import { getAgencySubscriptionState } from '@/lib/features/iam/authz/resolver'

const hasBaselineRead = (pks: string[], scopeKind: 'agency' | 'subaccount') => {
  if (scopeKind === 'agency') return pks.includes('org.agency.account.read')
  return pks.includes('org.subaccount.account.read')
}

export async function GET(req: Request) {
  try {
    const ctx = await requireRequestAccess({ req, requiredKeys: [] })
    if (!hasBaselineRead(ctx.principal.permissionKeys, ctx.scope.kind)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const state = await getAgencySubscriptionState(ctx.scope.agencyId)
    const canManageBilling = ctx.principal.permissionKeys.includes('org.billing.account.view')

    return NextResponse.json({
      scope: ctx.scope,
      subscriptionState: state,
      canManageBilling,
    })
  } catch (e: any) {
    if (e instanceof Response) return e
    console.error(e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
