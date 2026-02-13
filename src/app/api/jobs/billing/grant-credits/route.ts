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

  // Process all subscriptions in parallel for better performance
  const results = await Promise.allSettled(
    subs.map((s) =>
      grantRecurringCreditsForAgency({ agencyId: s.agencyId || '', planId: s.priceId, now })
    )
  )

  const processed = results.filter((r) => r.status === 'fulfilled').length
  const failed = results.filter((r) => r.status === 'rejected').length

  if (failed > 0) {
    console.error(`Grant credits job completed with ${failed} failures out of ${subs.length} subscriptions`)
  }

  return NextResponse.json({ ok: true, processed, failed, total: subs.length, actor })
}

// Allow GET for quick manual runs.
export async function GET(req: NextRequest) {
  return POST(req)
}
