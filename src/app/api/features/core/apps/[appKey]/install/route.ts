import { NextResponse } from 'next/server'
import { z } from 'zod'
import { KEYS } from '@/lib/registry/keys/permissions'
import { requireRequestAccess } from '@/lib/features/iam/authz/require'
import { installApp } from '@/lib/features/org/apps/service'

const BodySchema = z.object({})

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

    // Validate body even if empty (future-proof)
    const body = await req.json().catch(() => ({}))
    const parsed = BodySchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })

    const res = await installApp({
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
