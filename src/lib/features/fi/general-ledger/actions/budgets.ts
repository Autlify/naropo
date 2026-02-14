/**
 * Budget Server Actions
 *
 * Budget management with version control, approval workflow, and variance analysis.
 */

'use server'

import { db } from '@/lib/db'
import { auth } from '@/auth'
import { revalidatePath } from 'next/cache'
import { hasAgencyPermission, hasSubAccountPermission } from '@/lib/features/iam/authz/permissions'
import { KEYS } from '@/lib/registry/keys/permissions'
import { z } from 'zod'
import Decimal from 'decimal.js'
import type { ActionResult } from '@/lib/common/result'

type FiContext = {
  userId: string
  agencyId: string
  subAccountId?: string
}

const getContext = async (): Promise<FiContext | null> => {
  const session = await auth()
  if (!session?.user?.id) return null
  const dbSession = await db.session.findFirst({
    where: { userId: session.user.id },
    select: { activeAgencyId: true, activeSubAccountId: true },
  })
  if (!dbSession?.activeAgencyId) return null
  return {
    userId: session.user.id,
    agencyId: dbSession.activeAgencyId,
    subAccountId: dbSession.activeSubAccountId ?? undefined,
  }
}

const checkPermission = async (ctx: FiContext, key: string) => {
  if (ctx.subAccountId) return hasSubAccountPermission(ctx.subAccountId, key as any)
  return hasAgencyPermission(ctx.agencyId, key as any)
}

const scopeWhere = (ctx: FiContext) =>
  ctx.subAccountId
    ? { agencyId: ctx.agencyId, subAccountId: ctx.subAccountId }
    : { agencyId: ctx.agencyId, subAccountId: null }

const ensureScope = (ctx: FiContext, row: { agencyId: string; subAccountId: string | null }) => {
  if (row.agencyId !== ctx.agencyId) return false
  if (ctx.subAccountId) return row.subAccountId === ctx.subAccountId
  return row.subAccountId === null
}

const PERM_READ = KEYS.fi.general_ledger.budgets.read
const PERM_CREATE = KEYS.fi.general_ledger.budgets.create
const PERM_UPDATE = KEYS.fi.general_ledger.budgets.update
const PERM_DELETE = KEYS.fi.general_ledger.budgets.delete
const PERM_APPROVE = KEYS.fi.general_ledger.budgets.approve
const PERM_LOCK = KEYS.fi.general_ledger.budgets.lock

const lineItemSchema = z.object({
  accountId: z.string().uuid(),
  costCenterId: z.string().uuid().optional(),
  profitCenterId: z.string().uuid().optional(),
  period1: z.number().default(0),
  period2: z.number().default(0),
  period3: z.number().default(0),
  period4: z.number().default(0),
  period5: z.number().default(0),
  period6: z.number().default(0),
  period7: z.number().default(0),
  period8: z.number().default(0),
  period9: z.number().default(0),
  period10: z.number().default(0),
  period11: z.number().default(0),
  period12: z.number().default(0),
  notes: z.string().optional(),
})

const createSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  budgetType: z.enum(['OPERATING', 'CAPITAL', 'CASH_FLOW', 'PROJECT']).default('OPERATING'),
  fiscalYear: z.number().int().min(2020).max(2100),
  version: z.number().int().min(1).default(1),
  currency: z.string().length(3).default('USD'),
  periodType: z.enum(['MONTHLY', 'QUARTERLY']).default('MONTHLY'),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  lineItems: z.array(lineItemSchema).optional(),
})

const updateSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  lineItems: z.array(lineItemSchema).optional(),
})

const listFilterSchema = z.object({
  budgetType: z.enum(['OPERATING', 'CAPITAL', 'CASH_FLOW', 'PROJECT']).optional(),
  fiscalYear: z.number().int().optional(),
  status: z.enum(['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'LOCKED', 'ARCHIVED']).optional(),
  search: z.string().optional(),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(25),
}).optional()

export const listBudgets = async (
  filter?: z.infer<typeof listFilterSchema>
): Promise<ActionResult<any[]>> => {
  try {
    const ctx = await getContext()
    if (!ctx) return { success: false, error: 'Unauthorized' }
    const ok = await checkPermission(ctx, PERM_READ)
    if (!ok) return { success: false, error: 'Missing permission' }

    const f = listFilterSchema.parse(filter ?? {})
    const where: any = { ...scopeWhere(ctx) }
    if (f?.budgetType) where.budgetType = f.budgetType
    if (f?.fiscalYear) where.fiscalYear = f.fiscalYear
    if (f?.status) where.status = f.status
    if (f?.search) {
      where.OR = [
        { name: { contains: f.search, mode: 'insensitive' } },
        { description: { contains: f.search, mode: 'insensitive' } },
      ]
    }

    const rows = await db.budget.findMany({
      where,
      orderBy: [{ fiscalYear: 'desc' }, { version: 'desc' }, { name: 'asc' }],
      take: f?.pageSize ?? 25,
      skip: ((f?.page ?? 1) - 1) * (f?.pageSize ?? 25),
    })
    return { success: true, data: rows }
  } catch (e) {
    console.error('listBudgets error', e)
    return { success: false, error: 'Failed to list budgets' }
  }
}

export const getBudget = async (id: string): Promise<ActionResult<any>> => {
  try {
    const ctx = await getContext()
    if (!ctx) return { success: false, error: 'Unauthorized' }
    const ok = await checkPermission(ctx, PERM_READ)
    if (!ok) return { success: false, error: 'Missing permission' }

    const row = await db.budget.findUnique({
      where: { id },
      include: {
        lineItems: {
          include: {
            Account: { select: { id: true, code: true, name: true } },
            CostCenter: { select: { id: true, code: true, name: true } },
            ProfitCenter: { select: { id: true, code: true, name: true } },
          },
          orderBy: { lineNumber: 'asc' },
        },
      },
    })
    if (!row) return { success: false, error: 'Budget not found' }
    if (!ensureScope(ctx, row)) return { success: false, error: 'Not allowed' }
    return { success: true, data: row }
  } catch (e) {
    console.error('getBudget error', e)
    return { success: false, error: 'Failed to fetch budget' }
  }
}

export const createBudget = async (
  input: z.infer<typeof createSchema>
): Promise<ActionResult<any>> => {
  try {
    const ctx = await getContext()
    if (!ctx) return { success: false, error: 'Unauthorized' }
    const ok = await checkPermission(ctx, PERM_CREATE)
    if (!ok) return { success: false, error: 'Missing permission' }

    const data = createSchema.parse(input)

    // Check for existing budget with same name/year/version
    const existing = await db.budget.findFirst({
      where: {
        ...scopeWhere(ctx),
        name: data.name,
        fiscalYear: data.fiscalYear,
        version: data.version,
      },
    })
    if (existing) {
      return { success: false, error: 'Budget with same name, year and version already exists' }
    }

    // Calculate totals from line items
    let totalBudgetAmount = new Decimal(0)
    if (data.lineItems) {
      for (const item of data.lineItems) {
        const lineTotal = new Decimal(item.period1 ?? 0)
          .add(item.period2 ?? 0)
          .add(item.period3 ?? 0)
          .add(item.period4 ?? 0)
          .add(item.period5 ?? 0)
          .add(item.period6 ?? 0)
          .add(item.period7 ?? 0)
          .add(item.period8 ?? 0)
          .add(item.period9 ?? 0)
          .add(item.period10 ?? 0)
          .add(item.period11 ?? 0)
          .add(item.period12 ?? 0)
        totalBudgetAmount = totalBudgetAmount.add(lineTotal)
      }
    }

    const { lineItems, ...rest } = data
    const row = await db.budget.create({
      data: {
        ...rest,
        totalBudgetAmount: totalBudgetAmount.toNumber(),
        status: 'DRAFT',
        agencyId: ctx.agencyId,
        subAccountId: ctx.subAccountId ?? null,
        createdBy: ctx.userId,
        lineItems: lineItems
          ? {
              create: lineItems.map((item, idx) => ({
                lineNumber: idx + 1,
                accountId: item.accountId,
                costCenterId: item.costCenterId ?? null,
                profitCenterId: item.profitCenterId ?? null,
                period1: item.period1 ?? 0,
                period2: item.period2 ?? 0,
                period3: item.period3 ?? 0,
                period4: item.period4 ?? 0,
                period5: item.period5 ?? 0,
                period6: item.period6 ?? 0,
                period7: item.period7 ?? 0,
                period8: item.period8 ?? 0,
                period9: item.period9 ?? 0,
                period10: item.period10 ?? 0,
                period11: item.period11 ?? 0,
                period12: item.period12 ?? 0,
                totalAmount: new Decimal(item.period1 ?? 0)
                  .add(item.period2 ?? 0)
                  .add(item.period3 ?? 0)
                  .add(item.period4 ?? 0)
                  .add(item.period5 ?? 0)
                  .add(item.period6 ?? 0)
                  .add(item.period7 ?? 0)
                  .add(item.period8 ?? 0)
                  .add(item.period9 ?? 0)
                  .add(item.period10 ?? 0)
                  .add(item.period11 ?? 0)
                  .add(item.period12 ?? 0)
                  .toNumber(),
                notes: item.notes ?? null,
              })),
            }
          : undefined,
      } as any,
      include: { lineItems: true },
    })

    revalidatePath('/fi/gl')
    return { success: true, data: row }
  } catch (e: any) {
    console.error('createBudget error', e)
    return { success: false, error: e?.message ?? 'Failed to create budget' }
  }
}

export const updateBudget = async (
  input: z.infer<typeof updateSchema>
): Promise<ActionResult<any>> => {
  try {
    const ctx = await getContext()
    if (!ctx) return { success: false, error: 'Unauthorized' }
    const ok = await checkPermission(ctx, PERM_UPDATE)
    if (!ok) return { success: false, error: 'Missing permission' }

    const { id, lineItems, ...rest } = updateSchema.parse(input)
    const row = await db.budget.findUnique({ where: { id } })
    if (!row) return { success: false, error: 'Budget not found' }
    if (!ensureScope(ctx, row)) return { success: false, error: 'Not allowed' }
    if (['LOCKED', 'ARCHIVED'].includes(row.status!)) {
      return { success: false, error: 'Cannot update locked or archived budget' }
    }

    let totalBudgetAmount = new Decimal(row.totalBudgetAmount ?? 0)

    if (lineItems) {
      // Delete existing and recreate
      await db.budgetLineItem.deleteMany({ where: { budgetId: id } })

      totalBudgetAmount = new Decimal(0)
      for (const item of lineItems) {
        const lineTotal = new Decimal(item.period1 ?? 0)
          .add(item.period2 ?? 0)
          .add(item.period3 ?? 0)
          .add(item.period4 ?? 0)
          .add(item.period5 ?? 0)
          .add(item.period6 ?? 0)
          .add(item.period7 ?? 0)
          .add(item.period8 ?? 0)
          .add(item.period9 ?? 0)
          .add(item.period10 ?? 0)
          .add(item.period11 ?? 0)
          .add(item.period12 ?? 0)
        totalBudgetAmount = totalBudgetAmount.add(lineTotal)
      }

      await db.budgetLineItem.createMany({
        data: lineItems.map((item, idx) => ({
          budgetId: id,
          lineNumber: idx + 1,
          accountId: item.accountId,
          costCenterId: item.costCenterId ?? null,
          profitCenterId: item.profitCenterId ?? null,
          period1: item.period1 ?? 0,
          period2: item.period2 ?? 0,
          period3: item.period3 ?? 0,
          period4: item.period4 ?? 0,
          period5: item.period5 ?? 0,
          period6: item.period6 ?? 0,
          period7: item.period7 ?? 0,
          period8: item.period8 ?? 0,
          period9: item.period9 ?? 0,
          period10: item.period10 ?? 0,
          period11: item.period11 ?? 0,
          period12: item.period12 ?? 0,
          totalAmount: new Decimal(item.period1 ?? 0)
            .add(item.period2 ?? 0)
            .add(item.period3 ?? 0)
            .add(item.period4 ?? 0)
            .add(item.period5 ?? 0)
            .add(item.period6 ?? 0)
            .add(item.period7 ?? 0)
            .add(item.period8 ?? 0)
            .add(item.period9 ?? 0)
            .add(item.period10 ?? 0)
            .add(item.period11 ?? 0)
            .add(item.period12 ?? 0)
            .toNumber(),
          notes: item.notes ?? null,
        })),
      })
    }

    const updated = await db.budget.update({
      where: { id },
      data: { ...rest, totalBudgetAmount: totalBudgetAmount.toNumber(), updatedBy: ctx.userId },
      include: { lineItems: true },
    })
    revalidatePath('/fi/gl')
    return { success: true, data: updated }
  } catch (e: any) {
    console.error('updateBudget error', e)
    return { success: false, error: e?.message ?? 'Failed to update budget' }
  }
}

const idSchema = z.object({ id: z.string().uuid() })

export const submitBudget = async (input: z.infer<typeof idSchema>): Promise<ActionResult<any>> => {
  try {
    const ctx = await getContext()
    if (!ctx) return { success: false, error: 'Unauthorized' }
    const ok = await checkPermission(ctx, PERM_UPDATE)
    if (!ok) return { success: false, error: 'Missing permission' }

    const { id } = idSchema.parse(input)
    const row = await db.budget.findUnique({
      where: { id },
      include: { _count: { select: { lineItems: true } } },
    })
    if (!row) return { success: false, error: 'Budget not found' }
    if (!ensureScope(ctx, row)) return { success: false, error: 'Not allowed' }
    if (row.status !== 'DRAFT') return { success: false, error: 'Can only submit draft budgets' }
    if ((row._count?.lineItems ?? 0) === 0) return { success: false, error: 'Budget has no line items' }

    const updated = await db.budget.update({
      where: { id },
      data: { status: 'PENDING_APPROVAL', submittedAt: new Date(), submittedBy: ctx.userId, updatedBy: ctx.userId },
    })
    revalidatePath('/fi/gl')
    return { success: true, data: updated }
  } catch (e) {
    console.error('submitBudget error', e)
    return { success: false, error: 'Failed to submit budget' }
  }
}

export const approveBudget = async (input: z.infer<typeof idSchema>): Promise<ActionResult<any>> => {
  try {
    const ctx = await getContext()
    if (!ctx) return { success: false, error: 'Unauthorized' }
    const ok = await checkPermission(ctx, PERM_APPROVE)
    if (!ok) return { success: false, error: 'Missing permission' }

    const { id } = idSchema.parse(input)
    const row = await db.budget.findUnique({ where: { id } })
    if (!row) return { success: false, error: 'Budget not found' }
    if (!ensureScope(ctx, row)) return { success: false, error: 'Not allowed' }
    if (row.status !== 'PENDING_APPROVAL') return { success: false, error: 'Not pending approval' }

    const updated = await db.budget.update({
      where: { id },
      data: { status: 'APPROVED', approvedAt: new Date(), approvedBy: ctx.userId, updatedBy: ctx.userId },
    })
    revalidatePath('/fi/gl')
    return { success: true, data: updated }
  } catch (e) {
    console.error('approveBudget error', e)
    return { success: false, error: 'Failed to approve budget' }
  }
}

export const rejectBudget = async (
  input: z.infer<typeof idSchema> & { reason?: string }
): Promise<ActionResult<any>> => {
  try {
    const ctx = await getContext()
    if (!ctx) return { success: false, error: 'Unauthorized' }
    const ok = await checkPermission(ctx, PERM_APPROVE)
    if (!ok) return { success: false, error: 'Missing permission' }

    const { id, reason } = input
    const row = await db.budget.findUnique({ where: { id } })
    if (!row) return { success: false, error: 'Budget not found' }
    if (!ensureScope(ctx, row)) return { success: false, error: 'Not allowed' }
    if (row.status !== 'PENDING_APPROVAL') return { success: false, error: 'Not pending approval' }

    const updated = await db.budget.update({
      where: { id },
      data: {
        status: 'DRAFT',
        rejectedAt: new Date(),
        rejectedBy: ctx.userId,
        rejectionReason: reason ?? null,
        updatedBy: ctx.userId,
      },
    })
    revalidatePath('/fi/gl')
    return { success: true, data: updated }
  } catch (e) {
    console.error('rejectBudget error', e)
    return { success: false, error: 'Failed to reject budget' }
  }
}

export const lockBudget = async (input: z.infer<typeof idSchema>): Promise<ActionResult<any>> => {
  try {
    const ctx = await getContext()
    if (!ctx) return { success: false, error: 'Unauthorized' }
    const ok = await checkPermission(ctx, PERM_LOCK)
    if (!ok) return { success: false, error: 'Missing permission' }

    const { id } = idSchema.parse(input)
    const row = await db.budget.findUnique({ where: { id } })
    if (!row) return { success: false, error: 'Budget not found' }
    if (!ensureScope(ctx, row)) return { success: false, error: 'Not allowed' }
    if (row.status !== 'APPROVED') return { success: false, error: 'Can only lock approved budgets' }

    const updated = await db.budget.update({
      where: { id },
      data: { status: 'LOCKED', lockedAt: new Date(), lockedBy: ctx.userId, updatedBy: ctx.userId },
    })
    revalidatePath('/fi/gl')
    return { success: true, data: updated }
  } catch (e) {
    console.error('lockBudget error', e)
    return { success: false, error: 'Failed to lock budget' }
  }
}

export const unlockBudget = async (input: z.infer<typeof idSchema>): Promise<ActionResult<any>> => {
  try {
    const ctx = await getContext()
    if (!ctx) return { success: false, error: 'Unauthorized' }
    const ok = await checkPermission(ctx, PERM_LOCK)
    if (!ok) return { success: false, error: 'Missing permission' }

    const { id } = idSchema.parse(input)
    const row = await db.budget.findUnique({ where: { id } })
    if (!row) return { success: false, error: 'Budget not found' }
    if (!ensureScope(ctx, row)) return { success: false, error: 'Not allowed' }
    if (row.status !== 'LOCKED') return { success: false, error: 'Budget is not locked' }

    const updated = await db.budget.update({
      where: { id },
      data: { status: 'APPROVED', lockedAt: null, lockedBy: null, updatedBy: ctx.userId },
    })
    revalidatePath('/fi/gl')
    return { success: true, data: updated }
  } catch (e) {
    console.error('unlockBudget error', e)
    return { success: false, error: 'Failed to unlock budget' }
  }
}

export const copyBudget = async (
  input: z.infer<typeof idSchema> & { newVersion?: number; newFiscalYear?: number; newName?: string }
): Promise<ActionResult<any>> => {
  try {
    const ctx = await getContext()
    if (!ctx) return { success: false, error: 'Unauthorized' }
    const ok = await checkPermission(ctx, PERM_CREATE)
    if (!ok) return { success: false, error: 'Missing permission' }

    const { id, newVersion, newFiscalYear, newName } = input
    const source = await db.budget.findUnique({
      where: { id },
      include: { lineItems: true },
    })
    if (!source) return { success: false, error: 'Source budget not found' }
    if (!ensureScope(ctx, source)) return { success: false, error: 'Not allowed' }

    const targetVersion = newVersion ?? (source.version ?? 0) + 1
    const targetYear = newFiscalYear ?? source.fiscalYear
    const targetName = newName ?? source.name

    // Check for conflicts
    const existing = await db.budget.findFirst({
      where: {
        ...scopeWhere(ctx),
        name: targetName,
        fiscalYear: targetYear,
        version: targetVersion,
      },
    })
    if (existing) {
      return { success: false, error: 'Budget with same name, year and version already exists' }
    }

    const copy = await db.budget.create({
      data: {
        name: targetName,
        description: source.description,
        budgetType: source.budgetType,
        fiscalYear: targetYear,
        version: targetVersion,
        currency: source.currency,
        periodType: source.periodType,
        startDate: source.startDate,
        endDate: source.endDate,
        totalBudgetAmount: source.totalBudgetAmount,
        status: 'DRAFT',
        agencyId: ctx.agencyId,
        subAccountId: ctx.subAccountId ?? null,
        createdBy: ctx.userId,
        lineItems: {
          create: (source.lineItems ?? []).map((item: any, idx: number) => ({
            lineNumber: idx + 1,
            accountId: item.accountId,
            costCenterId: item.costCenterId ?? null,
            profitCenterId: item.profitCenterId ?? null,
            period1: item.period1,
            period2: item.period2,
            period3: item.period3,
            period4: item.period4,
            period5: item.period5,
            period6: item.period6,
            period7: item.period7,
            period8: item.period8,
            period9: item.period9,
            period10: item.period10,
            period11: item.period11,
            period12: item.period12,
            totalAmount: item.totalAmount,
            notes: item.notes,
          })),
        },
      } as any,
      include: { lineItems: true },
    })

    revalidatePath('/fi/gl')
    return { success: true, data: copy }
  } catch (e: any) {
    console.error('copyBudget error', e)
    return { success: false, error: e?.message ?? 'Failed to copy budget' }
  }
}

export const deleteBudget = async (input: z.infer<typeof idSchema>): Promise<ActionResult<any>> => {
  try {
    const ctx = await getContext()
    if (!ctx) return { success: false, error: 'Unauthorized' }
    const ok = await checkPermission(ctx, PERM_DELETE)
    if (!ok) return { success: false, error: 'Missing permission' }

    const { id } = idSchema.parse(input)
    const row = await db.budget.findUnique({ where: { id } })
    if (!row) return { success: false, error: 'Budget not found' }
    if (!ensureScope(ctx, row)) return { success: false, error: 'Not allowed' }
    if (row.status === 'LOCKED') return { success: false, error: 'Cannot delete locked budget' }

    // Soft delete - archive instead of hard delete
    const updated = await db.budget.update({
      where: { id },
      data: { status: 'ARCHIVED', deletedAt: new Date(), deletedBy: ctx.userId, updatedBy: ctx.userId },
    })
    revalidatePath('/fi/gl')
    return { success: true, data: updated }
  } catch (e) {
    console.error('deleteBudget error', e)
    return { success: false, error: 'Failed to delete budget' }
  }
}

// Budget variance analysis
const varianceSchema = z.object({
  budgetId: z.string().uuid(),
  asOfDate: z.coerce.date().optional(),
})

export const getBudgetVariance = async (
  input: z.infer<typeof varianceSchema>
): Promise<ActionResult<any>> => {
  try {
    const ctx = await getContext()
    if (!ctx) return { success: false, error: 'Unauthorized' }
    const ok = await checkPermission(ctx, PERM_READ)
    if (!ok) return { success: false, error: 'Missing permission' }

    const { budgetId, asOfDate } = varianceSchema.parse(input)

    const budget = await db.budget.findUnique({
      where: { id: budgetId },
      include: {
        lineItems: {
          include: {
            Account: { select: { id: true, code: true, name: true } },
          },
        },
      },
    })
    if (!budget) return { success: false, error: 'Budget not found' }
    if (!ensureScope(ctx, budget)) return { success: false, error: 'Not allowed' }

    const endDate = asOfDate ?? new Date()
    const currentPeriod = endDate.getMonth() + 1 // 1-12

    // Get actual amounts from journal entries
    const actuals = await db.journalEntryLine.groupBy({
      by: ['accountId'],
      where: {
        JournalEntry: {
          agencyId: ctx.agencyId,
          subAccountId: ctx.subAccountId ?? null,
          status: 'POSTED' as const,
          entryDate: {
            gte: budget.startDate!,
            lte: endDate,
          },
        },
      },
      _sum: {
        debitAmount: true,
        creditAmount: true,
      },
    })

    const actualsMap = new Map<string, { debit: number; credit: number }>()
    for (const actual of actuals) {
      const sum = actual._sum ?? { debitAmount: null, creditAmount: null }
      actualsMap.set(actual.accountId, {
        debit: (sum.debitAmount as any)?.toNumber?.() ?? sum.debitAmount ?? 0,
        credit: (sum.creditAmount as any)?.toNumber?.() ?? sum.creditAmount ?? 0,
      })
    }

    // Calculate variance for each line item
    const varianceItems = (budget.lineItems ?? []).map((item: any) => {
      // Sum budget amounts up to current period
      let budgetYTD = new Decimal(0)
      for (let p = 1; p <= currentPeriod; p++) {
        const periodKey = `period${p}` as keyof typeof item
        const val = item[periodKey] as any
        budgetYTD = budgetYTD.add(val?.toNumber?.() ?? val ?? 0)
      }

      const actual = actualsMap.get(item.accountId) ?? { debit: 0, credit: 0 }
      const actualAmount = actual.debit - actual.credit // Net for expense accounts

      const variance = actualAmount - budgetYTD.toNumber()
      const variancePercent = budgetYTD.isZero() ? 0 : (variance / budgetYTD.toNumber()) * 100

      return {
        accountId: item.accountId,
        code: item.Account?.code,
        name: item.Account?.name,
        budgetYTD: budgetYTD.toNumber(),
        budgetFull: (item.totalAmount as any)?.toNumber?.() ?? item.totalAmount ?? 0,
        actualYTD: actualAmount,
        variance,
        variancePercent: Math.round(variancePercent * 100) / 100,
        status: variance > 0 ? 'OVER_BUDGET' : variance < 0 ? 'UNDER_BUDGET' : 'ON_BUDGET',
      }
    })

    // Calculate totals
    const totals = {
      budgetYTD: varianceItems.reduce((s: number, i: any) => s + i.budgetYTD, 0),
      budgetFull: varianceItems.reduce((s: number, i: any) => s + i.budgetFull, 0),
      actualYTD: varianceItems.reduce((s: number, i: any) => s + i.actualYTD, 0),
      variance: varianceItems.reduce((s: number, i: any) => s + i.variance, 0),
      variancePercent: 0,
    }
    totals.variancePercent = totals.budgetYTD === 0 ? 0 : Math.round((totals.variance / totals.budgetYTD) * 10000) / 100

    return {
      success: true,
      data: {
        budget: {
          id: budget.id,
          name: budget.name,
          fiscalYear: budget.fiscalYear,
          version: budget.version,
          status: budget.status,
        },
        asOfDate: endDate,
        currentPeriod,
        items: varianceItems,
        totals,
      },
    }
  } catch (e: any) {
    console.error('getBudgetVariance error', e)
    return { success: false, error: e?.message ?? 'Failed to get budget variance' }
  }
}
