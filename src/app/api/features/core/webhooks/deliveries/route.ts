import { NextResponse } from 'next/server'
import { requireIntegrationAuth } from '@/lib/features/org/integrations/guards'
import { listDeliveries } from '@/lib/features/org/integrations/store'
import { KEYS } from '@/lib/registry/keys/permissions'
import { withErrorHandler } from '@/lib/api'

export const GET = withErrorHandler(async (req: Request) => {
  const { scope } = await requireIntegrationAuth(req, { requiredKeys: [KEYS.org.apps.webhooks.view] })
  const url = new URL(req.url)
  const limit = Number(url.searchParams.get('limit') || '50')
  const deliveries = await listDeliveries(scope, { limit: Number.isFinite(limit) ? limit : 50 })
  return NextResponse.json({ deliveries })
})