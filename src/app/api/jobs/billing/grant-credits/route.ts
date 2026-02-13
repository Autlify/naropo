import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

import { db } from '@/lib/db'
import { grantRecurringCreditsForAgency } from '@/lib/features/org/billing/credits/grant'

import { assertJobSecret, getSystemJobActor } from '@/lib/core/system/job-auth'

export async function POST(req: NextRequest) {
  try {
    assertJobSecret(req)
  } catch {
    return NextResponse.json({ ok: false, reason: 'UNAUTHORIZED' }, { status: 401 })
  }

  // Ensure system actor exists (for audit attribution in downstream logic).
  // Even if a particular flow doesn’t currently write audit logs, this guarantees a stable actor identity.
  const actor = await getSystemJobActor()

  const now = new Date()

  const subs = await db.subscription.findMany({
    where: {
      status: { in: ['ACTIVE', 'TRIALING'] },
      currentPeriodEndDate: { gt: now },
    },
    select: { agencyId: true, priceId: true },
  })

  let processed = 0
  for (const s of subs) {
    await grantRecurringCreditsForAgency({ agencyId: s.agencyId || '', planId: s.priceId, now })
    processed += 1
  }

  return NextResponse.json({ ok: true, processed, actor })
}

// Allow GET for quick manual runs.
export async function GET(req: NextRequest) {
  return POST(req)
}
