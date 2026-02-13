import 'server-only'

import { Prisma } from '@/generated/prisma/client'
import type {
  MeteringScope,
  UsagePeriod,
} from '@/generated/prisma/client'
import { db } from '@/lib/db'
import { getUsageWindow } from '../usage/period'
import { getOrCreateCreditBalance } from './balance'
import { createCreditLedger } from './ledger'

type GrantCreditArgs = {
  scope: MeteringScope
  agencyId: string
  subAccountId: string | null
  featureKey: string
  amount: number
  type: 'GRANT' | 'TOPUP'
  idempotencyKey: string
  reason?: string
  periodStart?: Date
  periodEnd?: Date
  expiresAt?: Date | null
}

async function applyCreditDelta(
  tx: Prisma.TransactionClient,
  args: GrantCreditArgs
): Promise<void> {
  const amt = Math.max(0, Number(args.amount) || 0)
  if (amt === 0) return

  const existing = await tx.featureCreditLedger.findUnique({
    where: { idempotencyKey: args.idempotencyKey },
  })
  if (existing) return

  const bal = await getOrCreateCreditBalance(tx, {
    scope: args.scope,
    agencyId: args.agencyId,
    subAccountId: args.subAccountId,
    featureKey: args.featureKey,
  })

  await createCreditLedger(tx, {
    scope: args.scope,
    agencyId: args.agencyId,
    subAccountId: args.subAccountId,
    featureKey: args.featureKey,
    type: args.type,
    delta: new Prisma.Decimal(amt),
    reason: args.reason,
    periodStart: args.periodStart,
    periodEnd: args.periodEnd,
    idempotencyKey: args.idempotencyKey,
  })

  await tx.featureCreditBalance.update({
    where: { id: bal.id },
    data: {
      balance: new Prisma.Decimal(Number(bal.balance.toString()) + amt),
      expiresAt: args.expiresAt ?? bal.expiresAt,
    },
  })
}

export async function grantRecurringCreditsForAgency(args: {
  agencyId: string
  planId: string
  now?: Date
}): Promise<void> {
  const now = args.now ?? new Date()

  await db.$transaction(async (tx) => {
    const planFeatures = await tx.planFeature.findMany({
      where: {
        planId: args.planId,
        isEnabled: true,
        OR: [
          { recurringCreditGrantInt: { not: null } },
          { recurringCreditGrantDec: { not: null } },
        ],
      },
      include: { EntitlementFeature: true },
    })

    if (planFeatures.length === 0) return

    const subAccounts = await tx.subAccount.findMany({
      where: { agencyId: args.agencyId },
      select: { id: true },
    })

    for (const pf of planFeatures) {
      const ef = pf.EntitlementFeature
      if (!ef.creditEnabled) continue

      const grantInt = pf.recurringCreditGrantInt ?? null
      const grantDec = pf.recurringCreditGrantDec ?? null
      const amount = grantInt ?? (grantDec ? Number(grantDec.toString()) : 0)
      if (amount <= 0) continue

      const period = (ef.period as UsagePeriod | null) ?? 'MONTHLY'
      const { periodStart, periodEnd } = getUsageWindow(period, now)

      const targets: Array<{ scope: MeteringScope; subAccountId: string | null }> =
        ef.scope === 'SUBACCOUNT'
          ? subAccounts.map((s) => ({ scope: 'SUBACCOUNT' as const, subAccountId: s.id }))
          : [{ scope: 'AGENCY' as const, subAccountId: null }]

      for (const t of targets) {
        const idem = `grant:${t.scope}:${args.agencyId}:${t.subAccountId ?? 'null'}:${ef.key}:${periodStart.toISOString()}`
        const expiresAt = ef.creditExpires ? periodEnd : null

        await applyCreditDelta(tx, {
          scope: t.scope,
          agencyId: args.agencyId,
          subAccountId: t.subAccountId,
          featureKey: ef.key,
          amount,
          type: 'GRANT',
          reason: 'Recurring credit grant',
          periodStart,
          periodEnd,
          expiresAt,
          idempotencyKey: idem,
        })
      }
    }
  })
}

export async function applyTopUpCreditsFromCheckout(args: {
  scope: MeteringScope
  agencyId: string
  subAccountId: string | null
  featureKey: string
  credits: number
  stripeCheckoutSessionId: string
}): Promise<void> {
  await db.$transaction(async (tx) => {
    const ef = await tx.entitlementFeature.findUnique({
      where: { key: args.featureKey },
      select: { period: true, creditExpires: true },
    })

    const period = (ef?.period as UsagePeriod | null) ?? 'MONTHLY'
    const { periodStart, periodEnd } = getUsageWindow(period, new Date())
    const expiresAt = ef?.creditExpires ? periodEnd : null

    const idem = `topup:${args.stripeCheckoutSessionId}`
    await applyCreditDelta(tx, {
      scope: args.scope,
      agencyId: args.agencyId,
      subAccountId: args.subAccountId,
      featureKey: args.featureKey,
      amount: args.credits,
      type: 'TOPUP',
      reason: 'Credit top-up',
      periodStart,
      periodEnd,
      expiresAt,
      idempotencyKey: idem,
    })
  })
}

/**
 * Manual top-up path (non-Stripe) – intended for internal/admin flows.
 * Use Stripe checkout in production for paid top-ups.
 */
export async function topupCredits(args: {
  scope: MeteringScope
  agencyId: string
  subAccountId: string | null
  featureKey: string
  credits: number
  idempotencyKey: string
  reason?: string
}): Promise<void> {
  await db.$transaction(async (tx) => {
    const ef = await tx.entitlementFeature.findUnique({
      where: { key: args.featureKey },
      select: { period: true, creditExpires: true },
    })

    const period = (ef?.period as UsagePeriod | null) ?? 'MONTHLY'
    const { periodStart, periodEnd } = getUsageWindow(period, new Date())
    const expiresAt = ef?.creditExpires ? periodEnd : null

    await applyCreditDelta(tx, {
      scope: args.scope,
      agencyId: args.agencyId,
      subAccountId: args.subAccountId,
      featureKey: args.featureKey,
      amount: args.credits,
      type: 'TOPUP',
      reason: args.reason ?? 'Manual credit top-up',
      periodStart,
      periodEnd,
      expiresAt,
      idempotencyKey: args.idempotencyKey,
    })
  })
}
