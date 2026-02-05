/**
 * GL Reconciliation Server Actions
 * FI-GL Module - Account and bank reconciliation
 */

'use server'

import { db } from '@/lib/db'
import { auth } from '@/auth'
import { revalidatePath } from 'next/cache'
import { hasAgencyPermission, hasSubAccountPermission } from '@/lib/features/iam/authz/permissions'
import { logGLAudit } from './audit'
import { emitEvent } from './fanout'
import { EVENT_KEYS } from '@/lib/registry/events/trigger'
import { Decimal } from 'decimal.js'
import { ReconciliationStatus, ReconciliationItemStatus } from '@/generated/prisma/client'
import { ReconciliationInput, reconciliationSchema, MatchTransactionsInput, matchTransactionsSchema } from '../../../../schemas/fi/general-ledger/reconciliation'
import { ActionKey } from '@/lib/registry'

// ========== Types ==========

type ActionResult<T> = {
  success: boolean
  data?: T
  error?: string
}

type ReconciliationContext = {
  agencyId?: string
  subAccountId?: string
  userId: string
}

// ========== Helper Functions ==========

const getContext = async (): Promise<ReconciliationContext | null> => {
  const session = await auth()
  if (!session?.user?.id) return null

  const dbSession = await db.session.findFirst({
    where: { userId: session.user.id },
    select: { activeAgencyId: true, activeSubAccountId: true },
  })

  return {
    userId: session.user.id,
    agencyId: dbSession?.activeAgencyId ?? undefined,
    subAccountId: dbSession?.activeSubAccountId ?? undefined,
  }
}

const checkPermission = async (
  context: ReconciliationContext,
  permissionKey: ActionKey
): Promise<boolean> => {
  if (context.subAccountId) {
    return hasSubAccountPermission(context.subAccountId, permissionKey)
  }
  if (context.agencyId) {
    return hasAgencyPermission(context.agencyId, permissionKey)
  }
  return false
}

// ========== CRUD Actions ==========

/**
 * Get a reconciliation by ID
 */
export const getReconciliation = async (
  id: string
): Promise<ActionResult<any>> => {
  try {
    const context = await getContext()
    if (!context) {
      return { success: false, error: 'Unauthorized: No session found' }
    }

    const hasPermission = await checkPermission(context, 'fi.general_ledger.reconciliation.view')
    if (!hasPermission) {
      return { success: false, error: 'Unauthorized: Missing permission' }
    }

    const reconciliation = await db.reconciliation.findUnique({
      where: { id },
      include: {
        Account: { select: { id: true, code: true, name: true } },
        Period: { select: { id: true, name: true, startDate: true, endDate: true } },
        Items: {
          orderBy: { transactionDate: 'desc' },
        },
      },
    })

    if (!reconciliation) {
      return { success: false, error: 'Reconciliation not found' }
    }

    // Verify ownership
    const isOwned = context.subAccountId
      ? reconciliation.subAccountId === context.subAccountId
      : reconciliation.agencyId === context.agencyId

    if (!isOwned) {
      return { success: false, error: 'Unauthorized: Access denied' }
    }

    return { success: true, data: reconciliation }
  } catch (error) {
    console.error('Error fetching reconciliation:', error)
    return { success: false, error: 'Failed to fetch reconciliation' }
  }
}

/**
 * List reconciliations
 */
export const listReconciliations = async (options?: {
  accountId?: string
  periodId?: string
  status?: 'DRAFT' | 'IN_PROGRESS' | 'COMPLETED' | 'APPROVED'
  page?: number
  pageSize?: number
}): Promise<ActionResult<{ reconciliations: any[]; total: number }>> => {
  try {
    const context = await getContext()
    if (!context) {
      return { success: false, error: 'Unauthorized: No session found' }
    }

    const hasPermission = await checkPermission(context, 'fi.general_ledger.reconciliation.view')
    if (!hasPermission) {
      return { success: false, error: 'Unauthorized: Missing permission' }
    }

    const page = options?.page ?? 1
    const pageSize = options?.pageSize ?? 20
    const skip = (page - 1) * pageSize

    const whereClause: any = context.subAccountId
      ? { subAccountId: context.subAccountId }
      : { agencyId: context.agencyId, subAccountId: null }

    if (options?.accountId) {
      whereClause.accountId = options.accountId
    }

    if (options?.periodId) {
      whereClause.periodId = options.periodId
    }

    if (options?.status) {
      whereClause.status = options.status
    }

    const [reconciliations, total] = await Promise.all([
      db.reconciliation.findMany({
        where: whereClause,
        include: {
          Account: { select: { id: true, code: true, name: true } },
          Period: { select: { id: true, name: true } },
          _count: { select: { Items: true } },
        },
        orderBy: { Period: { startDate: 'desc' } }, // TO CLARIFY: I replaced order by to "Period" because no "statementDate" field from initial coded.
        skip,
        take: pageSize,
      }),
      db.reconciliation.count({ where: whereClause }),
    ])

    return { success: true, data: { reconciliations, total } }
  } catch (error) {
    console.error('Error listing reconciliations:', error)
    return { success: false, error: 'Failed to list reconciliations' }
  }
}

/**
 * Create a new reconciliation
 */
export const createReconciliation = async (
  input: ReconciliationInput
): Promise<ActionResult<any>> => {
  try {
    const context = await getContext()
    if (!context) {
      return { success: false, error: 'Unauthorized: No session found' }
    }

    const hasPermission = await checkPermission(context, 'fi.general_ledger.reconciliation.manage')
    if (!hasPermission) {
      return { success: false, error: 'Unauthorized: Missing permission' }
    }

    const parsed = reconciliationSchema.safeParse(input)
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' }
    }

    // Generate reconciliation number
    const count = await db.reconciliation.count({
      where: context.subAccountId
        ? { subAccountId: context.subAccountId }
        : { agencyId: context.agencyId },
    })
    const year = new Date().getFullYear()
    const reconciliationNumber = `REC-${year}-${String(count + 1).padStart(6, '0')}`

    const reconciliation = await db.reconciliation.create({
      data: {
        reconciliationNumber,
        accountId: parsed.data.accountId,
        periodId: parsed.data.periodId,
        description: parsed.data.description,
        statementBalance: new Decimal(parsed.data.statementBalance),
        statementDate: parsed.data.statementDate,
        bookBalance: new Decimal(parsed.data.bookBalance),
        adjustedBookBalance: new Decimal(parsed.data.bookBalance),
        difference: new Decimal(parsed.data.statementBalance - parsed.data.bookBalance),
        notes: parsed.data.notes,
        agencyId: context.agencyId ?? null,
        subAccountId: context.subAccountId ?? null,
        status: ReconciliationStatus.IN_PROGRESS,
        createdBy: context.userId,
      },
      include: {
        Account: { select: { id: true, code: true, name: true } },
      },
    })

    await logGLAudit({
      action: 'CREATE',
      entityType: 'Reconciliation',
      entityId: reconciliation.id,
      agencyId: context.agencyId,
      subAccountId: context.subAccountId,
      description: `Created reconciliation for account: ${reconciliation.accountId}`,
    })

    // Emit reconciliation started event
    await emitEvent(
      'fi.general_ledger',
      EVENT_KEYS.fi.general_ledger.reconciliation.started,
      { type: 'Reconciliation', id: reconciliation.id },
      { 
        amount: parsed.data.statementBalance,
        reference: reconciliation.Account.code,
        description: 'Reconciliation started',
        accountId: reconciliation.accountId,
      }
    )

    revalidatePath(`/agency/${context.agencyId}/fi/general-ledger/reconciliation`)

    return { success: true, data: reconciliation }
  } catch (error) {
    console.error('Error creating reconciliation:', error)
    return { success: false, error: 'Failed to create reconciliation' }
  }
}

/**
 * Import uncleared transactions for reconciliation
 */
export const importUnclearedTransactions = async (
  reconciliationId: string
): Promise<ActionResult<{ imported: number }>> => {
  try {
    const context = await getContext()
    if (!context) {
      return { success: false, error: 'Unauthorized: No session found' }
    }

    const hasPermission = await checkPermission(context, 'fi.general_ledger.reconciliation.manage')
    if (!hasPermission) {
      return { success: false, error: 'Unauthorized: Missing permission' }
    }

    const reconciliation = await db.reconciliation.findUnique({
      where: { id: reconciliationId },
      include: { Account: true },
    })

    if (!reconciliation) {
      return { success: false, error: 'Reconciliation not found' }
    }

    // Get existing reconciliation item IDs to exclude
    const existingItems = await db.reconciliationItem.findMany({
      where: { reconciliationId },
      select: { reference: true },
    })
    const existingRefs = new Set(existingItems.map(i => i.reference).filter(Boolean))

    // Get journal entry lines for this account
    const journalLines = await db.journalEntryLine.findMany({
      where: {
        accountId: reconciliation.accountId,
        JournalEntry: {
          status: 'POSTED',
          ...(context.subAccountId
            ? { subAccountId: context.subAccountId }
            : { agencyId: context.agencyId, subAccountId: null }),
        },
      },
      include: {
        JournalEntry: { select: { entryNumber: true, entryDate: true, description: true } },
      },
    })

    // Filter out already imported lines
    const unclearedLines = journalLines.filter(
      line => !existingRefs.has(line.JournalEntry.entryNumber)
    )

    const items = await db.reconciliationItem.createMany({
      data: unclearedLines.map(line => ({
        reconciliationId,
        itemType: 'BOOK' as const,
        transactionDate: line.JournalEntry.entryDate,
        description: line.description ?? line.JournalEntry.description ?? '',
        amount: new Decimal(line.debitAmount).minus(new Decimal(line.creditAmount)),
        referenceNumber: line.JournalEntry.entryNumber,
        status: ReconciliationItemStatus.UNMATCHED,
      })),
    })

    return { success: true, data: { imported: items.count } }
  } catch (error) {
    console.error('Error importing transactions:', error)
    return { success: false, error: 'Failed to import transactions' }
  }
}

/**
 * Match and clear transactions
 */
export const matchTransactions = async (
  input: MatchTransactionsInput
): Promise<ActionResult<{ matched: number }>> => {
  try {
    const context = await getContext()
    if (!context) {
      return { success: false, error: 'Unauthorized: No session found' }
    }

    const hasPermission = await checkPermission(context, 'fi.general_ledger.reconciliation.manage')
    if (!hasPermission) {
      return { success: false, error: 'Unauthorized: Missing permission' }
    }

    const parsed = matchTransactionsSchema.safeParse(input)
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' }
    }

    let matched = 0

    await db.$transaction(async (tx) => {
      for (const txn of parsed.data.transactions) {
        await tx.reconciliationItem.update({
          where: { id: txn.itemId },
          data: {
            status: txn.status as ReconciliationItemStatus,
            matchedItemId: txn.matchedItemId ?? null,
          },
        })
        if (txn.status === 'MATCHED') matched++
      }
    })

    revalidatePath(`/agency/${context.agencyId}/fi/general-ledger/reconciliation`)

    return { success: true, data: { matched } }
  } catch (error) {
    console.error('Error matching transactions:', error)
    return { success: false, error: 'Failed to match transactions' }
  }
}

/**
 * Complete reconciliation
 */
export const completeReconciliation = async (
  id: string
): Promise<ActionResult<any>> => {
  try {
    const context = await getContext()
    if (!context) {
      return { success: false, error: 'Unauthorized: No session found' }
    }

    const hasPermission = await checkPermission(context, 'fi.general_ledger.reconciliation.manage')
    if (!hasPermission) {
      return { success: false, error: 'Unauthorized: Missing permission' }
    }

    const reconciliation = await db.reconciliation.findUnique({
      where: { id },
      include: {
        Account: true,
        Items: true,
      },
    })

    if (!reconciliation) {
      return { success: false, error: 'Reconciliation not found' }
    }

    // Calculate reconciled balance
    const clearedAmount = reconciliation.Items
      .filter(i => i.status === ReconciliationItemStatus.MATCHED)
      .reduce((sum, i) => sum.plus(new Decimal(i.amount)), new Decimal(0))

    const unclearedAmount = reconciliation.Items
      .filter(i => i.status === ReconciliationItemStatus.UNMATCHED)
      .reduce((sum, i) => sum.plus(new Decimal(i.amount)), new Decimal(0))

    const adjustedBookBalance = clearedAmount.plus(unclearedAmount)
    const difference = new Decimal(reconciliation.statementBalance).minus(adjustedBookBalance)

    const updated = await db.reconciliation.update({
      where: { id },
      data: {
        status: ReconciliationStatus.CLOSED,
        adjustedBookBalance,
        difference,
        closedAt: new Date(),
        closedBy: context.userId,
      },
    })

    await logGLAudit({
      action: 'UPDATE',
      entityType: 'Reconciliation',
      entityId: id,
      agencyId: context.agencyId,
      subAccountId: context.subAccountId,
      description: `Completed reconciliation: ${reconciliation.Account?.code}`, 
    })

    // Emit reconciliation completed event
    await emitEvent(
      'fi.general_ledger',
      EVENT_KEYS.fi.general_ledger.reconciliation.completed,
      { type: 'Reconciliation', id },
      { 
        amount: difference.toNumber(),
        reference: reconciliation.Account?.code || 'Unknown',
        description: 'Reconciliation completed',
        accountId: reconciliation.accountId,
      }
    )

    revalidatePath(`/agency/${context.agencyId}/fi/general-ledger/reconciliation`)

    return { success: true, data: updated }
  } catch (error) {
    console.error('Error completing reconciliation:', error)
    return { success: false, error: 'Failed to complete reconciliation' }
  }
}

/**
 * Get reconciliation summary for an account
 */
export const getReconciliationSummary = async (
  accountId: string
): Promise<ActionResult<{
  lastReconciled: Date | null
  lastBalance: number
  unreconciledItems: number
  unreconciledAmount: number
}>> => {
  try {
    const context = await getContext()
    if (!context) {
      return { success: false, error: 'Unauthorized: No session found' }
    }

    const hasPermission = await checkPermission(context, 'fi.general_ledger.reconciliation.view')
    if (!hasPermission) {
      return { success: false, error: 'Unauthorized: Missing permission' }
    }

    const whereClause: any = context.subAccountId
      ? { subAccountId: context.subAccountId, accountId }
      : { agencyId: context.agencyId, subAccountId: null, accountId }

    // Get last completed reconciliation
    const lastRecon = await db.reconciliation.findFirst({
      where: { ...whereClause, status: ReconciliationStatus.CLOSED },
      orderBy: { closedAt: 'desc' },
    })

    // Get unreconciled items
    const unreconciledItems = await db.reconciliationItem.findMany({
      where: {
        Reconciliation: whereClause,
        status: ReconciliationItemStatus.UNMATCHED,
      },
    })

    const unreconciledAmount = unreconciledItems
      .reduce((sum, i) => sum.plus(new Decimal(i.amount)), new Decimal(0))
      .toNumber()

    return {
      success: true,
      data: {
        lastReconciled: lastRecon?.closedAt ?? null,
        lastBalance: lastRecon?.adjustedBookBalance?.toNumber() ?? 0,
        unreconciledItems: unreconciledItems.length,
        unreconciledAmount,
      },
    }
  } catch (error) {
    console.error('Error fetching reconciliation summary:', error)
    return { success: false, error: 'Failed to fetch reconciliation summary' }
  }
}

/**
 * Auto-match transactions by amount and date
 */
export const autoMatchTransactions = async (
  reconciliationId: string,
  options?: {
    tolerance?: number // Amount tolerance for matching
    dateTolerance?: number // Days tolerance for date matching
  }
): Promise<ActionResult<{ matched: number }>> => {
  try {
    const context = await getContext()
    if (!context) {
      return { success: false, error: 'Unauthorized: No session found' }
    }

    const hasPermission = await checkPermission(context, 'fi.general_ledger.reconciliation.manage')
    if (!hasPermission) {
      return { success: false, error: 'Unauthorized: Missing permission' }
    }

    const tolerance = options?.tolerance ?? 0.01
    const dateTolerance = options?.dateTolerance ?? 3

    // Get uncleared items
    const items = await db.reconciliationItem.findMany({
      where: { reconciliationId, status: ReconciliationItemStatus.UNMATCHED },
      orderBy: { transactionDate: 'asc' },
    })

    const matched: string[] = []

    // Simple matching: find pairs with opposite amounts
    for (let i = 0; i < items.length; i++) {
      if (matched.includes(items[i].id)) continue

      for (let j = i + 1; j < items.length; j++) {
        if (matched.includes(items[j].id)) continue

        const amountDiff = Math.abs(
          new Decimal(items[i].amount).plus(new Decimal(items[j].amount)).toNumber()
        )

        const daysDiff = Math.abs(
          (items[i].transactionDate.getTime() - items[j].transactionDate.getTime()) /
            (1000 * 60 * 60 * 24)
        )

        if (amountDiff <= tolerance && daysDiff <= dateTolerance) {
          matched.push(items[i].id, items[j].id)

          await db.reconciliationItem.updateMany({
            where: { id: { in: [items[i].id, items[j].id] } },
            data: {
              status: ReconciliationItemStatus.MATCHED,
              matchedItemId: items[j].id, // Cross-reference
            },
          })
        }
      }
    }

    revalidatePath(`/agency/${context.agencyId}/fi/general-ledger/reconciliation`)

    return { success: true, data: { matched: matched.length / 2 } }
  } catch (error) {
    console.error('Error auto-matching transactions:', error)
    return { success: false, error: 'Failed to auto-match transactions' }
  }
}


/**
 * Update existing reconciliation
 */
export const updateReconciliation = async (
  id: string,
  input: Partial<ReconciliationInput>
): Promise<ActionResult<any>> => {
  try {
    const context = await getContext()
    if (!context) {
      return { success: false, error: 'Unauthorized: No session found' }
    }

    const hasPermission = await checkPermission(context, 'fi.general_ledger.reconciliation.manage')
    if (!hasPermission) {
      return { success: false, error: 'Unauthorized: Missing permission' }
    }

    const parsed = reconciliationSchema.partial().safeParse(input)
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' }
    }

    const updateData: ReconciliationInput = {
      accountId: parsed.data.accountId || '',
      periodId: parsed.data.periodId || '',
      statementBalance: parsed.data.statementBalance || 0,
      bookBalance: parsed.data.bookBalance || 0,
      statementDate: parsed.data.statementDate || new Date(),
    }
    if (parsed.data.description !== undefined) updateData.description = parsed.data.description
    if (parsed.data.statementBalance !== undefined)
      updateData.statementBalance = new Decimal(parsed.data.statementBalance).toNumber()
    if (parsed.data.bookBalance !== undefined)
      updateData.bookBalance = new Decimal(parsed.data.bookBalance).toNumber()
    if (parsed.data.notes !== undefined) updateData.notes = parsed.data.notes

    const updated = await db.reconciliation.update({
      where: { id },
      data: updateData,
    })

    await logGLAudit({
      action: 'UPDATE',
      entityType: 'Reconciliation',
      entityId: id,
      agencyId: context.agencyId,
      subAccountId: context.subAccountId,
      description: `Updated reconciliation: ${id}`,
    })

    revalidatePath(`/agency/${context.agencyId}/fi/general-ledger/reconciliation`)

    return { success: true, data: updated }
  } catch (error) {
    console.error('Error updating reconciliation:', error)
    return { success: false, error: 'Failed to update reconciliation' }
  }
}