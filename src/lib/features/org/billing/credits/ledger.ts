import type {
  CreditLedgerType,
  FeatureCreditLedger,
  MeteringScope,
  Prisma,
} from '@/generated/prisma/client'

export type CreditLedgerWrite = {
  scope: MeteringScope
  agencyId: string
  subAccountId: string | null
  featureKey: string
  type: CreditLedgerType
  delta: any
  reason?: string | null
  periodStart?: Date | null
  periodEnd?: Date | null
  stripePaymentIntentId?: string | null
  stripeInvoiceId?: string | null
  idempotencyKey: string
}

export async function getCreditLedgerByIdempotency(
  tx: Prisma.TransactionClient,
  idempotencyKey: string
): Promise<FeatureCreditLedger | null> {
  return tx.featureCreditLedger.findUnique({ where: { idempotencyKey } })
}

export async function createCreditLedger(
  tx: Prisma.TransactionClient,
  args: CreditLedgerWrite
): Promise<FeatureCreditLedger> {
  const existing = await getCreditLedgerByIdempotency(tx, args.idempotencyKey)
  if (existing) return existing

  return tx.featureCreditLedger.create({
    data: {
      scope: args.scope,
      agencyId: args.agencyId,
      subAccountId: args.subAccountId,
      featureKey: args.featureKey,
      type: args.type,
      delta: args.delta,
      reason: args.reason ?? null,
      periodStart: args.periodStart ?? null,
      periodEnd: args.periodEnd ?? null,
      stripePaymentIntentId: args.stripePaymentIntentId ?? null,
      stripeInvoiceId: args.stripeInvoiceId ?? null,
      idempotencyKey: args.idempotencyKey,
    },
  })
}
