import type { Prisma, UsageEvent } from '@/generated/prisma/client'

export type UsageEventCreateArgs = Omit<Prisma.UsageEventCreateInput, 'createdAt'>

export async function getUsageEventByIdempotency(
  tx: Prisma.TransactionClient,
  idempotencyKey: string
): Promise<UsageEvent | null> {
  return tx.usageEvent.findUnique({ where: { idempotencyKey } })
}

export async function createUsageEvent(
  tx: Prisma.TransactionClient,
  data: UsageEventCreateArgs
): Promise<UsageEvent> {
  return tx.usageEvent.create({ data })
}
