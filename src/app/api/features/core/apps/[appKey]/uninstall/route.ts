import { NextResponse } from 'next/server'
import { KEYS } from '@/lib/registry/keys/permissions'
import { requireRequestAccess } from '@/lib/features/iam/authz/require'
import { uninstallApp } from '@/lib/features/org/apps/service'

export async function POST(req: Request, ctx: { params: Promise<{ appKey: string }> }) {
  try {
    const access = await requireRequestAccess({
      req,
      requiredKeys: [KEYS.org.apps.app.manage],
      requireActiveSubscription: true,
    })

    const { appKey } = await ctx.params
    if (!appKey) return NextResponse.json({ error: 'Missing appKey' }, { status: 400 })

    // Core modules are always installed; no-op.
    if (appKey === 'integrations' || appKey === 'webhooks') {
      return NextResponse.json({ appKey, status: 'INSTALLED' }, { status: 200 })
    }

    const res = await uninstallApp({
      appKey,
      agencyId: access.scope.agencyId,
      subAccountId: access.scope.kind === 'subaccount' ? access.scope.subAccountId : null,
    })
    return NextResponse.json(res, { status: 200 })
  } catch (e: any) {
    if (e?.status) return NextResponse.json({ error: e.message, code: e.code }, { status: e.status })
    console.error(e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
