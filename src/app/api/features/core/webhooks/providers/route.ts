import { NextResponse } from 'next/server'
import { requireIntegrationAuth } from '@/lib/features/org/integrations/guards'
import { KEYS } from '@/lib/registry/keys/permissions'
import { INTEGRATION_PROVIDERS } from '@/lib/features/org/integrations/providers'
import { withErrorHandler } from '@/lib/api'

/**
 * GET /api/features/core/webhooks/providers
 * Provider registry for Apps Hub.
 */
export const GET = withErrorHandler(async (req: Request) => {
  await requireIntegrationAuth(req, { requiredKeys: [KEYS.org.apps.webhooks.view] })
  return NextResponse.json({ providers: INTEGRATION_PROVIDERS })
})
