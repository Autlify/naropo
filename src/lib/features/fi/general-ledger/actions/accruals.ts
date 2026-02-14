/**
 * Accruals & Deferrals Server Actions
 *
 * Period-end accruals and deferrals with automated recognition schedules.
 */

'use server'

import { db } from '@/lib/db'
import { auth } from '@/auth'
import { revalidatePath } from 'next/cache'
import { hasAgencyPermission, hasSubAccountPermission } from '@/lib/features/iam/authz/permissions'
import { KEYS } from '@/lib/registry/keys/permissions'
import { reserveDocumentNumber } from '@/lib/features/fi/general-ledger/utils/number-ranges'
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

const PERM_READ = KEYS.fi.general_ledger.accruals.read
const PERM_CREATE = KEYS.fi.general_ledger.accruals.create
const PERM_UPDATE = KEYS.fi.general_ledger.accruals.update
const PERM_RECOGNIZE = KEYS.fi.general_ledger.accruals.recognize
const PERM_DELETE = KEYS.fi.general_ledger.accruals.delete

const createSchema = z.object({
  accrualType: z.enum(['ACCRUED_EXPENSE', 'ACCRUED_REVENUE', 'PREPAID_EXPENSE', 'DEFERRED_REVENUE']),
  description: z.string().min(1).max(500),
  originalAmount: z.number().positive(),
  currency: z.string().length(3).default('USD'),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  recognitionMethod: z.enum(['STRAIGHT_LINE', 'FRONT_LOADED', 'BACK_LOADED', 'CUSTOM']).default('STRAIGHT_LINE'),
  periods: z.number().int().min(1).max(120),
  accrualAccountId: z.string().uuid(),
  expenseRevenueAccountId: z.string().uuid(),
  costCenterId: z.string().uuid().optional(),
  profitCenterId: z.string().uuid().optional(),
  reference: z.string().optional(),
  vendorId: z.string().uuid().optional(),
  customerId: z.string().uuid().optional(),
})

const updateSchema = z.object({
  id: z.string().uuid(),
  description: z.string().min(1).max(500).optional(),
  endDate: z.coerce.date().optional(),
  periods: z.number().int().min(1).max(120).optional(),
})

const listFilterSchema = z.object({
  accrualType: z.enum(['ACCRUED_EXPENSE', 'ACCRUED_REVENUE', 'PREPAID_EXPENSE', 'DEFERRED_REVENUE']).optional(),
  status: z.enum(['ACTIVE', 'FULLY_RECOGNIZED', 'VOID']).optional(),
  search: z.string().optional(),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(25),
}).optional()

const generateAccrualNumber = async (ctx: FiContext) => {
  const cfg = await db.gLConfiguration.findFirst({
    where: { agencyId: ctx.agencyId },
    orderBy: { updatedAt: 'desc' },
    select: { documentNumberResetRule: true },
  })
  const scope = ctx.subAccountId
    ? { kind: 'subaccount' as const, subAccountId: ctx.subAccountId }
    : { kind: 'agency' as const, agencyId: ctx.agencyId }
  const { docNumber } = await reserveDocumentNumber(scope, {
    rangeKey: 'gl.accrual',
    format: 'ACC-{YYYY}-{######}',
    prefixFallback: 'ACC',
    reset: (cfg?.documentNumberResetRule as any) ?? 'YEARLY',
    date: new Date(),
  })
  return docNumber
}

export const listAccruals = async (
  filter?: z.infer<typeof listFilterSchema>
): Promise<ActionResult<any[]>> => {
  try {
    const ctx = await getContext()
    if (!ctx) return { success: false, error: 'Unauthorized' }
    const ok = await checkPermission(ctx, PERM_READ)
    if (!ok) return { success: false, error: 'Missing permission' }

    const f = listFilterSchema.parse(filter ?? {})
    const where: any = { ...scopeWhere(ctx) }
    if (f?.accrualType) where.accrualType = f.accrualType
    if (f?.status) where.status = f.status
    if (f?.search) {
      where.OR = [
        { accrualNumber: { contains: f.search, mode: 'insensitive' } },
        { description: { contains: f.search, mode: 'insensitive' } },
        { reference: { contains: f.search, mode: 'insensitive' } },
      ]
    }

    const rows = await db.accrual.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }],
      take: f?.pageSize ?? 25,
      skip: ((f?.page ?? 1) - 1) * (f?.pageSize ?? 25),
      include: {
        
        
      },
    })
    return { success: true, data: rows }
  } catch (e) {
    console.error('listAccruals error', e)
    return { success: false, error: 'Failed to list accruals' }
  }
}

export const getAccrual = async (id: string): Promise<ActionResult<any>> => {
  try {
    const ctx = await getContext()
    if (!ctx) return { success: false, error: 'Unauthorized' }
    const ok = await checkPermission(ctx, PERM_READ)
    if (!ok) return { success: false, error: 'Missing permission' }

    const row = await db.accrual.findUnique({
      where: { id },
      include: {
        
        
        
        
        Vendor: { select: { id: true, name: true, code: true } },
        Customer: { select: { id: true, name: true, code: true } },
        schedule: {
          orderBy: { periodNumber: 'asc' },
          include: {
            
          },
        },
      },
    })
    if (!row) return { success: false, error: 'Accrual not found' }
    if (!ensureScope(ctx, row)) return { success: false, error: 'Not allowed' }
    return { success: true, data: row }
  } catch (e) {
    console.error('getAccrual error', e)
    return { success: false, error: 'Failed to fetch accrual' }
  }
}

export const createAccrual = async (
  input: z.infer<typeof createSchema>
): Promise<ActionResult<any>> => {
  try {
    const ctx = await getContext()
    if (!ctx) return { success: false, error: 'Unauthorized' }
    const ok = await checkPermission(ctx, PERM_CREATE)
    if (!ok) return { success: false, error: 'Missing permission' }

    const data = createSchema.parse(input)

    if (data.endDate <= data.startDate) {
      return { success: false, error: 'End date must be after start date' }
    }

    const accrualNumber = await generateAccrualNumber(ctx)

    // Generate recognition schedule
    const schedule = generateRecognitionSchedule(
      data.originalAmount,
      data.periods,
      data.startDate,
      data.recognitionMethod
    )

    const row = await db.accrual.create({
      data: {
        accrualNumber,
        accrualType: data.accrualType,
        description: data.description,
        originalAmount: data.originalAmount,
        remainingAmount: data.originalAmount,
        recognizedAmount: 0,
        currency: data.currency,
        startDate: data.startDate,
        endDate: data.endDate,
        recognitionMethod: data.recognitionMethod,
        totalPeriods: data.periods,
        recognizedPeriods: 0,
        accrualAccountId: data.accrualAccountId,
        expenseRevenueAccountId: data.expenseRevenueAccountId,
        costCenterId: data.costCenterId ?? null,
        profitCenterId: data.profitCenterId ?? null,
        reference: data.reference ?? null,
        vendorId: data.vendorId ?? null,
        customerId: data.customerId ?? null,
        status: 'ACTIVE',
        agencyId: ctx.agencyId,
        subAccountId: ctx.subAccountId ?? null,
        createdBy: ctx.userId,
        schedule: {
          create: schedule.map((item, idx) => ({
            periodNumber: idx + 1,
            periodDate: item.date,
            scheduledAmount: item.amount,
            recognizedAmount: 0,
            status: 'PENDING',
          })),
        },
      } as any,
      include: { schedule: true },
    })

    revalidatePath('/fi/gl')
    return { success: true, data: row }
  } catch (e: any) {
    console.error('createAccrual error', e)
    return { success: false, error: e?.message ?? 'Failed to create accrual' }
  }
}

export const updateAccrual = async (
  input: z.infer<typeof updateSchema>
): Promise<ActionResult<any>> => {
  try {
    const ctx = await getContext()
    if (!ctx) return { success: false, error: 'Unauthorized' }
    const ok = await checkPermission(ctx, PERM_UPDATE)
    if (!ok) return { success: false, error: 'Missing permission' }

    const { id, ...rest } = updateSchema.parse(input)
    const row = await db.accrual.findUnique({ where: { id } })
    if (!row) return { success: false, error: 'Accrual not found' }
    if (!ensureScope(ctx, row)) return { success: false, error: 'Not allowed' }
    if (row.status !== 'ACTIVE') return { success: false, error: 'Can only update active accruals' }

    const updated = await db.accrual.update({
      where: { id },
      data: { ...rest, updatedBy: ctx.userId },
    })
    revalidatePath('/fi/gl')
    return { success: true, data: updated }
  } catch (e: any) {
    console.error('updateAccrual error', e)
    return { success: false, error: e?.message ?? 'Failed to update accrual' }
  }
}

const recognizeSchema = z.object({
  id: z.string().uuid(),
  periodNumber: z.number().int().min(1).optional(),
  postingDate: z.coerce.date().optional(),
  amount: z.number().positive().optional(),
})

export const recognizeAccrual = async (
  input: z.infer<typeof recognizeSchema>
): Promise<ActionResult<any>> => {
  try {
    const ctx = await getContext()
    if (!ctx) return { success: false, error: 'Unauthorized' }
    const ok = await checkPermission(ctx, PERM_RECOGNIZE)
    if (!ok) return { success: false, error: 'Missing permission' }

    const { id, periodNumber, postingDate, amount: customAmount } = recognizeSchema.parse(input)

    const row = await db.accrual.findUnique({
      where: { id },
      include: { schedule: { orderBy: { periodNumber: 'asc' } } },
    })
    if (!row) return { success: false, error: 'Accrual not found' }
    if (!ensureScope(ctx, row)) return { success: false, error: 'Not allowed' }
    if (row.status !== 'ACTIVE') return { success: false, error: 'Accrual is not active' }

    // Find the period to recognize
    const pendingPeriods = (row.schedule ?? []).filter((s: { status: string }) => s.status === 'PENDING')
    if (pendingPeriods.length === 0) {
      return { success: false, error: 'No pending periods to recognize' }
    }

    const targetPeriod = periodNumber
      ? (row.schedule ?? []).find((s: { periodNumber: number; status: string }) => s.periodNumber === periodNumber && s.status === 'PENDING')
      : pendingPeriods[0]

    if (!targetPeriod) {
      return { success: false, error: 'Specified period not found or already recognized' }
    }

    const recognitionAmount = customAmount ?? (targetPeriod.scheduledAmount as any)?.toNumber?.() ?? targetPeriod.scheduledAmount
    const docDate = postingDate ?? new Date()

    // Generate journal entry
    const cfg = await db.gLConfiguration.findFirst({
      where: { agencyId: ctx.agencyId },
      orderBy: { updatedAt: 'desc' },
      select: { documentNumberResetRule: true },
    })
    const scope = ctx.subAccountId
      ? { kind: 'subaccount' as const, subAccountId: ctx.subAccountId }
      : { kind: 'agency' as const, agencyId: ctx.agencyId }
    const { docNumber } = await reserveDocumentNumber(scope, {
      rangeKey: 'gl.journal_entry',
      format: 'JE-{YYYY}-{######}',
      prefixFallback: 'JE',
      reset: (cfg?.documentNumberResetRule as any) ?? 'YEARLY',
      date: docDate,
    })

    // Determine debit/credit based on accrual type
    const isExpense = ['ACCRUED_EXPENSE', 'PREPAID_EXPENSE'].includes(row.accrualType!)
    const lineItems = isExpense
      ? [
          { accountId: row.expenseRevenueAccountId, debitAmount: recognitionAmount, creditAmount: 0 },
          { accountId: row.accrualAccountId, debitAmount: 0, creditAmount: recognitionAmount },
        ]
      : [
          { accountId: row.accrualAccountId, debitAmount: recognitionAmount, creditAmount: 0 },
          { accountId: row.expenseRevenueAccountId, debitAmount: 0, creditAmount: recognitionAmount },
        ]

    const je = await db.journalEntry.create({
      data: {
        documentNumber: docNumber,
        documentDate: docDate,
        postingDate: docDate,
        description: `${row.description} - Period ${targetPeriod.periodNumber}`,
        entryType: 'ACCRUAL',
        currency: row.currency ?? 'USD',
        status: 'POSTED',
        agencyId: ctx.agencyId,
        subAccountId: ctx.subAccountId ?? null,
        totalDebit: recognitionAmount,
        totalCredit: recognitionAmount,
        createdBy: ctx.userId,
        postedAt: new Date(),
        postedBy: ctx.userId,
        lineItems: {
          create: lineItems.map((item, idx) => ({
            lineNumber: idx + 1,
            accountId: item.accountId,
            costCenterId: row.costCenterId ?? null,
            profitCenterId: row.profitCenterId ?? null,
            description: null,
            debitAmount: item.debitAmount,
            creditAmount: item.creditAmount,
          })),
        },
      } as any,
    })

    // Update schedule item
    await db.accrualScheduleItem.update({
      where: { id: targetPeriod.id },
      data: {
        recognizedAmount: recognitionAmount,
        journalEntryId: je.id,
        recognizedAt: new Date(),
        recognizedBy: ctx.userId,
        status: 'RECOGNIZED',
      },
    })

    // Update accrual totals
    const newRecognizedAmount = new Decimal(row.recognizedAmount ?? 0).add(recognitionAmount).toNumber()
    const newRemainingAmount = new Decimal(row.originalAmount ?? 0).sub(newRecognizedAmount).toNumber()
    const newRecognizedPeriods = (row.recognizedPeriods ?? 0) + 1

    const isFullyRecognized = newRemainingAmount <= 0.01 || newRecognizedPeriods >= (row.totalPeriods ?? 0)

    await db.accrual.update({
      where: { id },
      data: {
        recognizedAmount: newRecognizedAmount,
        remainingAmount: Math.max(0, newRemainingAmount),
        recognizedPeriods: newRecognizedPeriods,
        status: isFullyRecognized ? 'FULLY_RECOGNIZED' : 'ACTIVE',
        updatedBy: ctx.userId,
      },
    })

    revalidatePath('/fi/gl')
    return { success: true, data: { accrual: row, journalEntry: je, recognizedAmount: recognitionAmount } }
  } catch (e: any) {
    console.error('recognizeAccrual error', e)
    return { success: false, error: e?.message ?? 'Failed to recognize accrual' }
  }
}

const idSchema = z.object({ id: z.string().uuid() })

export const voidAccrual = async (input: z.infer<typeof idSchema>): Promise<ActionResult<any>> => {
  try {
    const ctx = await getContext()
    if (!ctx) return { success: false, error: 'Unauthorized' }
    const ok = await checkPermission(ctx, PERM_DELETE)
    if (!ok) return { success: false, error: 'Missing permission' }

    const { id } = idSchema.parse(input)
    const row = await db.accrual.findUnique({
      where: { id },
      include: { schedule: true },
    })
    if (!row) return { success: false, error: 'Accrual not found' }
    if (!ensureScope(ctx, row)) return { success: false, error: 'Not allowed' }
    if (row.status !== 'ACTIVE') return { success: false, error: 'Can only void active accruals' }

    // Check if any periods have been recognized
    const recognizedCount = (row.schedule ?? []).filter((s: { status: string }) => s.status === 'RECOGNIZED').length
    if (recognizedCount > 0) {
      return { success: false, error: 'Cannot void accrual with recognized periods. Reverse journal entries first.' }
    }

    // Update all pending schedule items to void
    await db.accrualScheduleItem.updateMany({
      where: { accrualId: id, status: 'PENDING' },
      data: { status: 'VOID' },
    })

    const updated = await db.accrual.update({
      where: { id },
      data: { status: 'VOID', voidedAt: new Date(), voidedBy: ctx.userId, updatedBy: ctx.userId },
    })
    revalidatePath('/fi/gl')
    return { success: true, data: updated }
  } catch (e) {
    console.error('voidAccrual error', e)
    return { success: false, error: 'Failed to void accrual' }
  }
}

// Helper function to generate recognition schedule
function generateRecognitionSchedule(
  totalAmount: number,
  periods: number,
  startDate: Date,
  method: 'STRAIGHT_LINE' | 'FRONT_LOADED' | 'BACK_LOADED' | 'CUSTOM'
): Array<{ date: Date; amount: number }> {
  const schedule: Array<{ date: Date; amount: number }> = []
  const total = new Decimal(totalAmount)

  switch (method) {
    case 'STRAIGHT_LINE': {
      const perPeriod = total.div(periods).toDecimalPlaces(2)
      let remaining = total
      for (let i = 0; i < periods; i++) {
        const date = new Date(startDate)
        date.setMonth(date.getMonth() + i)
        const amount = i === periods - 1 ? remaining.toNumber() : perPeriod.toNumber()
        schedule.push({ date, amount })
        remaining = remaining.sub(perPeriod)
      }
      break
    }
    case 'FRONT_LOADED': {
      // Higher amounts early, decreasing over time
      let remaining = total
      for (let i = 0; i < periods; i++) {
        const date = new Date(startDate)
        date.setMonth(date.getMonth() + i)
        const weight = periods - i
        const totalWeight = (periods * (periods + 1)) / 2
        const amount = i === periods - 1
          ? remaining.toNumber()
          : total.mul(weight).div(totalWeight).toDecimalPlaces(2).toNumber()
        schedule.push({ date, amount })
        remaining = remaining.sub(amount)
      }
      break
    }
    case 'BACK_LOADED': {
      // Lower amounts early, increasing over time
      let remaining = total
      for (let i = 0; i < periods; i++) {
        const date = new Date(startDate)
        date.setMonth(date.getMonth() + i)
        const weight = i + 1
        const totalWeight = (periods * (periods + 1)) / 2
        const amount = i === periods - 1
          ? remaining.toNumber()
          : total.mul(weight).div(totalWeight).toDecimalPlaces(2).toNumber()
        schedule.push({ date, amount })
        remaining = remaining.sub(amount)
      }
      break
    }
    case 'CUSTOM':
    default: {
      // Default to straight-line for custom (schedule can be modified later)
      const perPeriod = total.div(periods).toDecimalPlaces(2)
      let remaining = total
      for (let i = 0; i < periods; i++) {
        const date = new Date(startDate)
        date.setMonth(date.getMonth() + i)
        const amount = i === periods - 1 ? remaining.toNumber() : perPeriod.toNumber()
        schedule.push({ date, amount })
        remaining = remaining.sub(perPeriod)
      }
      break
    }
  }

  return schedule
}
