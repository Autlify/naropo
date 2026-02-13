import type { MeteringScope, Prisma, UsagePeriod, UsageTracking } from '@/generated/prisma/client'

export type UsageTrackingKey = {
  scope: MeteringScope
  agencyId: string
  subAccountId: string | null
  featureKey: string
  periodStart: Date
}

const normSubAccountId = (subAccountId: string | null | undefined) => {
  // Prisma composite unique constraints do not enforce uniqueness when a component is NULL.
  // We persist a sentinel empty-string for agency-scope rows so findUnique/@@unique behave deterministically.
  return subAccountId ?? ''
}

export async function getOrCreateUsageTracking(
  tx: Prisma.TransactionClient,
  key: UsageTrackingKey,
  window: { periodStart: Date; periodEnd: Date },
  period: UsagePeriod
): Promise<UsageTracking> {
  const subAccountId = normSubAccountId(key.subAccountId)

  const existing = await tx.usageTracking.findUnique({
    where: {
      scope_agencyId_subAccountId_featureKey_periodStart: {
        scope: key.scope,
        agencyId: key.agencyId,
        subAccountId,
        featureKey: key.featureKey,
        periodStart: key.periodStart,
      },
    },
  })
  if (existing) return existing

  return tx.usageTracking.create({
    data: {
      scope: key.scope,
      agencyId: key.agencyId,
      subAccountId,
      featureKey: key.featureKey,
      currentUsage: '0' as any,
      period,
      periodStart: window.periodStart,
      periodEnd: window.periodEnd,
    },
  })
}
