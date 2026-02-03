/**
 * GL Bank Ledger Server Actions
 * FI-GL Module - Bank account and reconciliation management
 */

'use server'

import { db } from '@/lib/db'
import { auth } from '@/auth'
import { revalidatePath } from 'next/cache'
import { hasAgencyPermission, hasSubAccountPermission } from '@/lib/features/iam/authz/permissions'
import { ActionKey } from '@/lib/registry'
import { AccountType } from '@/generated/prisma/client'

// ========== Types ==========

type ActionResult<T> = {
  success: boolean
  data?: T
  error?: string
}

type BankContext = {
  agencyId?: string
  subAccountId?: string
  userId: string
}

export type BankAccountSummary = {
  id: string
  code: string
  name: string
  currency: string
  currentBalance: number
  reconciledBalance: number
  unreconciledCount: number
}

export type BankTransaction = {
  id: string
  accountId: string
  entryNumber: string
  entryDate: Date
  description: string
  debitAmount: number
  creditAmount: number
  isReconciled: boolean
  journalEntryId: string
}

// ========== Helper Functions ==========

const getContext = async (): Promise<BankContext | null> => {
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
  context: BankContext,
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

// ========== Bank Account Actions ==========

/**
 * List bank accounts (Chart of Accounts with controlAccountType = BANK)
 */
export const listBankAccounts = async (): Promise<ActionResult<BankAccountSummary[]>> => {
  try {
    const context = await getContext()
    if (!context) {
      return { success: false, error: 'Unauthorized: No session found' }
    }

    const hasPermission = await checkPermission(context, 'fi.general_ledger.settings.view')
    if (!hasPermission) {
      return { success: false, error: 'Unauthorized: Missing permission' }
    }

    const whereClause: any = context.subAccountId
      ? { subAccountId: context.subAccountId }
      : { agencyId: context.agencyId, subAccountId: null }
    
    whereClause.controlAccountType = 'BANK'
    whereClause.isActive = true

    const accounts = await db.chartOfAccount.findMany({
      where: whereClause,
      select: {
        id: true,
        code: true,
        name: true,
      },
      orderBy: { code: 'asc' },
    })

    // Get balance and reconciliation info for each account
    const summaries: BankAccountSummary[] = await Promise.all(
      accounts.map(async (account) => {
        // Get current period balance
        const balance = await db.accountBalance.findFirst({
          where: { accountId: account.id },
          orderBy: { createdAt: 'desc' },
          select: { closingBalance: true },
        })

        // Count unreconciled open items
        const unreconciledCount = await db.openItem.count({
          where: {
            accountId: account.id,
            status: 'OPEN',
          },
        })

        // Calculate reconciled balance (closed items)
        const reconciledItems = await db.openItem.aggregate({
          where: {
            accountId: account.id,
            status: 'CLEARED',
          },
          _sum: { localAmount: true },
        })

        return {
          id: account.id,
          code: account.code,
          name: account.name,
          currency: 'USD', // Default currency, can be extended
          currentBalance: balance?.closingBalance?.toNumber() ?? 0,
          reconciledBalance: reconciledItems._sum?.localAmount?.toNumber() ?? 0,
          unreconciledCount,
        }
      })
    )

    return { success: true, data: summaries }
  } catch (error) {
    console.error('Error listing bank accounts:', error)
    return { success: false, error: 'Failed to list bank accounts' }
  }
}

/**
 * Get bank account transactions
 */
export const getBankTransactions = async (
  accountId: string,
  filters?: {
    startDate?: Date
    endDate?: Date
    reconciledOnly?: boolean
    page?: number
    pageSize?: number
  }
): Promise<ActionResult<{ transactions: BankTransaction[]; total: number }>> => {
  try {
    const context = await getContext()
    if (!context) {
      return { success: false, error: 'Unauthorized: No session found' }
    }

    const hasPermission = await checkPermission(context, 'fi.general_ledger.settings.view')
    if (!hasPermission) {
      return { success: false, error: 'Unauthorized: Missing permission' }
    }

    const page = filters?.page ?? 1
    const pageSize = filters?.pageSize ?? 50
    const skip = (page - 1) * pageSize

    // Query journal entry lines for this bank account
    const whereClause: any = {
      accountId,
      JournalEntry: { status: 'POSTED' },
    }

    if (filters?.startDate || filters?.endDate) {
      whereClause.JournalEntry = {
        ...whereClause.JournalEntry,
        entryDate: {},
      }
      if (filters.startDate) whereClause.JournalEntry.entryDate.gte = filters.startDate
      if (filters.endDate) whereClause.JournalEntry.entryDate.lte = filters.endDate
    }

    const [lines, total] = await Promise.all([
      db.journalEntryLine.findMany({
        where: whereClause,
        include: {
          JournalEntry: {
            select: {
              id: true,
              entryNumber: true,
              entryDate: true,
              description: true,
            },
          },
        },
        orderBy: { JournalEntry: { entryDate: 'desc' } },
        skip,
        take: pageSize,
      }),
      db.journalEntryLine.count({ where: whereClause }),
    ])

    // Check reconciliation status for each line
    const transactions: BankTransaction[] = await Promise.all(
      lines.map(async (line) => {
        // Check if there's a cleared open item for this transaction
        const openItem = await db.openItem.findFirst({
          where: {
            journalEntryId: line.journalEntryId,
            accountId,
          },
          select: { status: true },
        })

        return {
          id: line.id,
          accountId,
          entryNumber: line.JournalEntry?.entryNumber ?? '',
          entryDate: line.JournalEntry?.entryDate ?? new Date(),
          description: line.description ?? line.JournalEntry?.description ?? '',
          debitAmount: line.debitAmount.toNumber(),
          creditAmount: line.creditAmount.toNumber(),
          isReconciled: openItem?.status === 'CLEARED',
          journalEntryId: line.journalEntryId,
        }
      })
    )

    // Filter by reconciled status if specified
    let result = transactions
    if (filters?.reconciledOnly !== undefined) {
      result = transactions.filter((t) => t.isReconciled === filters.reconciledOnly)
    }

    return { success: true, data: { transactions: result, total } }
  } catch (error) {
    console.error('Error getting bank transactions:', error)
    return { success: false, error: 'Failed to get bank transactions' }
  }
}

/**
 * Mark transactions as reconciled
 */
export const reconcileTransactions = async (
  accountId: string,
  journalEntryIds: string[],
  reconciliationDate: Date
): Promise<ActionResult<{ reconciled: number }>> => {
  try {
    const context = await getContext()
    if (!context) {
      return { success: false, error: 'Unauthorized: No session found' }
    }

    const hasPermission = await checkPermission(context, 'fi.general_ledger.settings.manage')
    if (!hasPermission) {
      return { success: false, error: 'Unauthorized: Missing permission' }
    }

    let reconciled = 0

    for (const journalEntryId of journalEntryIds) {
      // Update open items to CLEARED status
      const result = await db.openItem.updateMany({
        where: {
          journalEntryId,
          accountId,
          status: 'OPEN',
        },
        data: {
          status: 'CLEARED',
          clearingDate: reconciliationDate,
          clearedBy: context.userId,
        },
      })
      reconciled += result.count
    }

    const agencyPath = context.subAccountId
      ? `/sub-account/${context.subAccountId}`
      : `/agency/${context.agencyId}`
    revalidatePath(`${agencyPath}/fi/general-ledger/bank-ledger`)

    return { success: true, data: { reconciled } }
  } catch (error) {
    console.error('Error reconciling transactions:', error)
    return { success: false, error: 'Failed to reconcile transactions' }
  }
}

/**
 * Undo reconciliation for transactions
 */
export const unreconciledTransactions = async (
  accountId: string,
  journalEntryIds: string[]
): Promise<ActionResult<{ unreconciledCount: number }>> => {
  try {
    const context = await getContext()
    if (!context) {
      return { success: false, error: 'Unauthorized: No session found' }
    }

    const hasPermission = await checkPermission(context, 'fi.general_ledger.settings.manage')
    if (!hasPermission) {
      return { success: false, error: 'Unauthorized: Missing permission' }
    }

    let unreconciledCount = 0

    for (const journalEntryId of journalEntryIds) {
      const result = await db.openItem.updateMany({
        where: {
          journalEntryId,
          accountId,
          status: 'CLEARED',
        },
        data: {
          status: 'OPEN',
          clearingDate: null,
          clearedBy: null,
          clearingDocumentId: null,
        },
      })
      unreconciledCount += result.count
    }

    const agencyPath = context.subAccountId
      ? `/sub-account/${context.subAccountId}`
      : `/agency/${context.agencyId}`
    revalidatePath(`${agencyPath}/fi/general-ledger/bank-ledger`)

    return { success: true, data: { unreconciledCount } }
  } catch (error) {
    console.error('Error unreconciling transactions:', error)
    return { success: false, error: 'Failed to unreconcile transactions' }
  }
}
