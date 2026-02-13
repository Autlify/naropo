import { Prisma } from '@/generated/prisma/client'
import type { MeteringScope, Prisma as PrismaTypes } from '@/generated/prisma/client'

import { getOrCreateCreditBalance } from './balance'
import { createCreditLedger } from './ledger'

export type ConsumeCreditsArgs = {
  scope: MeteringScope
  agencyId: string
  subAccountId: string | null
  featureKey: string
  amount: number
  idempotencyKey: string
  reason?: string
}

export async function consumeCredits(
  tx: PrismaTypes.TransactionClient,
  args: ConsumeCreditsArgs
): Promise<{ consumed: number; remaining: number }> {
  const amt = Math.max(0, Number(args.amount) || 0)
  if (amt === 0) {
    const bal = await getOrCreateCreditBalance(tx, {
      scope: args.scope,
      agencyId: args.agencyId,
      subAccountId: args.subAccountId,
      featureKey: args.featureKey,
    })
    return { consumed: 0, remaining: Number(bal.balance.toString()) }
  }

  const existing = await tx.featureCreditLedger.findUnique({
    where: { idempotencyKey: args.idempotencyKey },
  })
  if (existing) {
    const bal = await getOrCreateCreditBalance(tx, {
      scope: args.scope,
      agencyId: args.agencyId,
      subAccountId: args.subAccountId,
      featureKey: args.featureKey,
    })
    return { consumed: 0, remaining: Number(bal.balance.toString()) }
  }

  const bal = await getOrCreateCreditBalance(tx, {
    scope: args.scope,
    agencyId: args.agencyId,
    subAccountId: args.subAccountId,
    featureKey: args.featureKey,
  })

  const current = Number(bal.balance.toString())
  const remaining = current - amt
  if (remaining < 0) {
    return { consumed: 0, remaining: current }
  }

  await createCreditLedger(tx, {
    scope: args.scope,
    agencyId: args.agencyId,
    subAccountId: args.subAccountId,
    featureKey: args.featureKey,
    type: 'CONSUME',
    delta: new Prisma.Decimal(-amt),
    reason: args.reason ?? 'Usage consume',
    idempotencyKey: args.idempotencyKey,
  })

  const updated = await tx.featureCreditBalance.update({
    where: { id: bal.id },
    data: { balance: new Prisma.Decimal(remaining) },
  })

  return { consumed: amt, remaining: Number(updated.balance.toString()) }
}
