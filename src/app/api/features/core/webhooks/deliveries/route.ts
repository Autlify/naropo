import { NextResponse } from 'next/server'
import { requireIntegrationAuth } from '@/lib/features/org/integrations/guards'
import { listDeliveries } from '@/lib/features/org/integrations/store'
import { KEYS } from '@/lib/registry/keys/permissions'

export async function GET(req: Request) {
  try {
    const { scope } = await requireIntegrationAuth(req, { requiredKeys: [KEYS.org.apps.webhooks.view] })
    const url = new URL(req.url)
    const limit = Number(url.searchParams.get('limit') || '50')
    const deliveries = await listDeliveries(scope, { limit: Number.isFinite(limit) ? limit : 50 })
    return NextResponse.json({ deliveries })
  } catch (e: any) {
    if (e instanceof Response) return e
    console.error(e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}