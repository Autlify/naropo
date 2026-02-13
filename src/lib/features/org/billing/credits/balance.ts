import type { FeatureCreditBalance, MeteringScope, Prisma } from '@/generated/prisma/client'

export type CreditScopeKey = {
  scope: MeteringScope
  agencyId: string
  subAccountId: string | null
  featureKey: string
}

const normSubAccountId = (subAccountId: string | null | undefined) => {
  // Same rationale as UsageTracking: avoid NULL in composite unique keys.
  return subAccountId ?? ''
}

export async function getCreditBalance(
  tx: Prisma.TransactionClient,
  key: CreditScopeKey
): Promise<FeatureCreditBalance | null> {
  return tx.featureCreditBalance.findUnique({
    where: {
      scope_agencyId_subAccountId_featureKey: {
        scope: key.scope,
        agencyId: key.agencyId,
        subAccountId: normSubAccountId(key.subAccountId),
        featureKey: key.featureKey,
      },
    },
  })
}

export async function getOrCreateCreditBalance(
  tx: Prisma.TransactionClient,
  key: CreditScopeKey
): Promise<FeatureCreditBalance> {
  const existing = await getCreditBalance(tx, key)
  if (existing) return existing

  return tx.featureCreditBalance.create({
    data: {
      scope: key.scope,
      agencyId: key.agencyId,
      subAccountId: normSubAccountId(key.subAccountId),
      featureKey: key.featureKey,
      balance: '0' as any,
    },
  })
}

export function balanceAsNumber(balance: FeatureCreditBalance | null, now: Date = new Date()): number {
  if (!balance) return 0
  if (balance.expiresAt && balance.expiresAt <= now) return 0
  return Number(balance.balance)
}
