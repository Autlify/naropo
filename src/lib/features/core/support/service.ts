import 'server-only'

import type { MeteringScope } from '@/generated/prisma/client'
import { db } from '@/lib/db'

export type SupportScope =
  | { kind: 'agency'; agencyId: string }
  | { kind: 'subaccount'; agencyId: string; subAccountId: string }

export type CreateSupportTicketInput = {
  category: string
  title: string
  description?: string | null
  diagnostics?: any
  createdByUserId?: string | null
}

export async function createSupportTicket(scope: SupportScope, input: CreateSupportTicketInput) {
  const common = {
    category: input.category,
    title: input.title,
    description: input.description ?? null,
    diagnostics: input.diagnostics ?? null,
    createdByUserId: input.createdByUserId ?? null,
  }

  if (scope.kind === 'agency') {
    return db.supportTicket.create({
      data: {
        ...common,
        scope: 'AGENCY' as MeteringScope,
        agencyId: scope.agencyId,
        subAccountId: null,
      },
    })
  }

  return db.supportTicket.create({
    data: {
      ...common,
      scope: 'SUBACCOUNT' as MeteringScope,
      agencyId: scope.agencyId,
      subAccountId: scope.subAccountId,
    },
  })
}

export async function listSupportTickets(scope: SupportScope, opts?: { limit?: number }) {
  const limit = Math.min(Math.max(opts?.limit ?? 50, 1), 200)
  if (scope.kind === 'agency') {
    return db.supportTicket.findMany({
      where: { scope: 'AGENCY' as MeteringScope, agencyId: scope.agencyId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })
  }

  return db.supportTicket.findMany({
    where: { scope: 'SUBACCOUNT' as MeteringScope, subAccountId: scope.subAccountId },
    orderBy: { createdAt: 'desc' },
    take: limit,
  })
}
