import { NextResponse } from 'next/server'
import { requireIntegrationAuth } from '@/lib/features/org/integrations/guards'
import { KEYS } from '@/lib/registry/keys/permissions'
import { INTEGRATION_PROVIDERS } from '@/lib/features/org/integrations/providers'

/**
 * GET /api/features/core/webhooks/providers
 * Provider registry for Apps Hub.
 */
export async function GET(req: Request) {
  try {
    await requireIntegrationAuth(req, { requiredKeys: [KEYS.org.apps.webhooks.view] })
    return NextResponse.json({ providers: INTEGRATION_PROVIDERS })
  } catch (e: any) {
    if (e instanceof Response) return e
    console.error(e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
