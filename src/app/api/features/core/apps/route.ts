import { NextResponse } from 'next/server'
import { KEYS } from '@/lib/registry/keys/permissions'
import { requireRequestAccess } from '@/lib/features/iam/authz/require'
import { listAppsWithState } from '@/lib/features/org/apps/service'
import type { MeteringScope } from '@/generated/prisma/client'

function meteringScopeFromResolved(scope: { kind: 'agency' | 'subaccount' }): MeteringScope {
  return scope.kind === 'agency' ? 'AGENCY' : 'SUBACCOUNT'
}

export async function GET(req: Request) {
  try {
    const ctx = await requireRequestAccess({
      req,
      requiredKeys: [KEYS.org.apps.app.view],
      requireActiveSubscription: true,
    })

    const apps = await listAppsWithState({
      agencyId: ctx.scope.agencyId,
      subAccountId: ctx.scope.kind === 'subaccount' ? ctx.scope.subAccountId : null,
      meteringScope: meteringScopeFromResolved(ctx.scope),
    })

    return NextResponse.json({ apps })
  } catch (e: any) {
    if (e?.status) return NextResponse.json({ error: e.message, code: e.code }, { status: e.status })
    console.error(e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
