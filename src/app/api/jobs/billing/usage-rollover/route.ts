import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

import { Prisma } from '@/generated/prisma/client'
import { db } from '@/lib/db'
import { createCreditLedger } from '@/lib/features/core/billing/credits/ledger'

import { assertJobSecret, getSystemJobActor } from '@/lib/features/system/job-auth'

export async function POST(req: NextRequest) {
  try {
    assertJobSecret(req)
  } catch (e: any) {
    return NextResponse.json({ ok: false, reason: 'UNAUTHORIZED' }, { status: 401 })
  }

  const actor = await getSystemJobActor()

  const now = new Date()

  const expired = await db.featureCreditBalance.findMany({
    where: {
      expiresAt: { not: null, lte: now },
      balance: { gt: new Prisma.Decimal(0) },
    },
  })

  const results = await db.$transaction(async (tx) => {
    let expiredCount = 0
    for (const row of expired) {
      const idempotencyKey = `expire:${row.id}:${row.expiresAt?.toISOString()}`
      await createCreditLedger(tx, {
        scope: row.scope,
        agencyId: row.agencyId,
        subAccountId: row.subAccountId ?? null,
        featureKey: row.featureKey,
        type: 'EXPIRE',
        delta: (row.balance as any).neg?.() ?? new Prisma.Decimal(0).minus(row.balance as any),
        reason: 'Credit expiry',
        idempotencyKey,
      })

      await tx.featureCreditBalance.update({
        where: {
          scope_agencyId_subAccountId_featureKey: {
            scope: row.scope,
            agencyId: row.agencyId,
            subAccountId: row.subAccountId  || '',
            featureKey: row.featureKey,
          },
        },
        data: { balance: new Prisma.Decimal(0), expiresAt: null },
      })
      expiredCount += 1
    }
    return { expiredCount }
  })

  return NextResponse.json({ ok: true, now: now.toISOString(), actor, ...results })
}
