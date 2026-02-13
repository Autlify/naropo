import 'server-only'

import { db } from '@/lib/db'
import { LEGAL_ACCEPTANCE_VERSION } from '@/lib/core/legal/acceptance'
import type { LegalScope } from '@/lib/core/legal/documents'

export async function hasAcceptedLegalScope(userId: string, scope: LegalScope): Promise<boolean> {
  const acceptance = await db.legalAcceptance.findFirst({
    where: {
      userId,
      scope,
      version: LEGAL_ACCEPTANCE_VERSION,
    },
    select: { id: true },
  })
  return !!acceptance
}

export async function requireLegalAcceptance(
  userId: string,
  scope: LegalScope
): Promise<{ ok: true } | { ok: false; scope: LegalScope }> {
  const ok = await hasAcceptedLegalScope(userId, scope)
  return ok ? { ok: true } : { ok: false, scope }
}
