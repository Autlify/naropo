/**
 * GL Account Balances Server Actions
 * FI-GL Module - Account balance calculations and management
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
import { ActionKey } from '@/lib/registry'

// ========== Types ==========

type ActionResult<T> = {
    success: boolean
    data?: T
    error?: string
}

type BalanceContext = {
    agencyId?: string
    subAccountId?: string
    userId: string
}

interface AccountBalanceData {
    accountId: string
    accountCode: string
    accountName: string
    accountType: string
    openingBalance: number
    debitMovement: number
    creditMovement: number
    closingBalance: number
    openingBalanceBase?: number
    closingBalanceBase?: number
    currencyCode: string
}

interface PeriodBalanceSummary {
    periodId: string
    periodName: string
    totalAssets: number
    totalLiabilities: number
    totalEquity: number
    totalRevenue: number
    totalExpenses: number
    netIncome: number
}

// ========== Helper Functions ==========

const getContext = async (): Promise<BalanceContext | null> => {
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
    context: BalanceContext,
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

// ========== Balance Queries ==========

/**
 * Get account balance for a specific period
 */
export const getAccountBalance = async (
    accountId: string,
    periodId: string
): Promise<ActionResult<AccountBalanceData>> => {
    try {
        const context = await getContext()
        if (!context) {
            return { success: false, error: 'Unauthorized: No session found' }
        }

        const hasPermission = await checkPermission(context, 'fi.general_ledger.balances.view')
        if (!hasPermission) {
            return { success: false, error: 'Unauthorized: Missing permission' }
        }

        const balance = await db.accountBalance.findFirst({
            where: {
                accountId,
                periodId,
            },
            include: {
                Account: {
                    select: { code: true, name: true, accountType: true },
                },
            },
        })

        if (!balance) {
            // Return zero balance if not found
            const account = await db.chartOfAccount.findUnique({
                where: { id: accountId },
                select: { code: true, name: true, accountType: true, currencyCode: true },
            })

            if (!account) {
                return { success: false, error: 'Account not found' }
            }

            return {
                success: true,
                data: {
                    accountId,
                    accountCode: account.code,
                    accountName: account.name,
                    accountType: account.accountType,
                    openingBalance: 0,
                    debitMovement: 0,
                    creditMovement: 0,
                    closingBalance: 0,
                    currencyCode: account.currencyCode ?? 'USD',
                },
            }
        }

        return {
            success: true,
            data: {
                accountId,
                accountCode: balance.Account.code,
                accountName: balance.Account.name,
                accountType: balance.Account.accountType,
                openingBalance: balance.openingBalance.toNumber(),
                debitMovement: balance.debitMovement.toNumber(),
                creditMovement: balance.creditMovement.toNumber(),
                closingBalance: balance.closingBalance.toNumber(),
                openingBalanceBase: balance.openingBalanceBase?.toNumber(),
                closingBalanceBase: balance.closingBalanceBase?.toNumber(),
                currencyCode: balance.currencyCode,
            },
        }
    } catch (error) {
        console.error('Error fetching account balance:', error)
        return { success: false, error: 'Failed to fetch account balance' }
    }
}

/**
 * Get all account balances for a period
 */
export const listAccountBalances = async (options: {
    periodId: string
    accountType?: string
    includeZeroBalances?: boolean
    page?: number
    pageSize?: number
}): Promise<ActionResult<{ balances: AccountBalanceData[]; total: number }>> => {
    try {
        const context = await getContext()
        if (!context) {
            return { success: false, error: 'Unauthorized: No session found' }
        }

        const hasPermission = await checkPermission(context, 'fi.general_ledger.balances.view')
        if (!hasPermission) {
            return { success: false, error: 'Unauthorized: Missing permission' }
        }

        const page = options.page ?? 1
        const pageSize = options.pageSize ?? 100
        const skip = (page - 1) * pageSize

        const whereClause: any = context.subAccountId
            ? { Account: { subAccountId: context.subAccountId }, periodId: options.periodId }
            : { Account: { agencyId: context.agencyId, subAccountId: null }, periodId: options.periodId }

        if (options.accountType) {
            whereClause.Account.accountType = options.accountType
        }

        if (!options.includeZeroBalances) {
            whereClause.OR = [
                { openingBalance: { not: 0 } },
                { debitMovement: { not: 0 } },
                { creditMovement: { not: 0 } },
                { closingBalance: { not: 0 } },
            ]
        }

        const [balances, total] = await Promise.all([
            db.accountBalance.findMany({
                where: whereClause,
                include: {
                    Account: { select: { code: true, name: true, accountType: true } },
                },
                orderBy: { Account: { code: 'asc' } },
                skip,
                take: pageSize,
            }),
            db.accountBalance.count({ where: whereClause }),
        ])

        const data: AccountBalanceData[] = balances.map((b) => ({
            accountId: b.accountId,
            accountCode: b.Account.code,
            accountName: b.Account.name,
            accountType: b.Account.accountType,
            openingBalance: b.openingBalance.toNumber(),
            debitMovement: b.debitMovement.toNumber(),
            creditMovement: b.creditMovement.toNumber(),
            closingBalance: b.closingBalance.toNumber(),
            openingBalanceBase: b.openingBalanceBase?.toNumber(),
            closingBalanceBase: b.closingBalanceBase?.toNumber(),
            currencyCode: b.currencyCode,
        }))

        return { success: true, data: { balances: data, total } }
    } catch (error) {
        console.error('Error listing account balances:', error)
        return { success: false, error: 'Failed to list account balances' }
    }
}

/**
 * Get period balance summary
 */
export const getPeriodBalanceSummary = async (
    periodId: string
): Promise<ActionResult<PeriodBalanceSummary>> => {
    try {
        const context = await getContext()
        if (!context) {
            return { success: false, error: 'Unauthorized: No session found' }
        }

        const hasPermission = await checkPermission(context, 'fi.general_ledger.balances.view')
        if (!hasPermission) {
            return { success: false, error: 'Unauthorized: Missing permission' }
        }

        const period = await db.financialPeriod.findUnique({
            where: { id: periodId },
            select: { name: true },
        })

        if (!period) {
            return { success: false, error: 'Period not found' }
        }

        const whereClause: any = context.subAccountId
            ? { Account: { subAccountId: context.subAccountId }, periodId }
            : { Account: { agencyId: context.agencyId, subAccountId: null }, periodId }

        // Get balances grouped by account type
        const balances = await db.accountBalance.findMany({
            where: whereClause,
            include: {
                Account: { select: { accountType: true } },
            },
        })

        let totalAssets = new Decimal(0)
        let totalLiabilities = new Decimal(0)
        let totalEquity = new Decimal(0)
        let totalRevenue = new Decimal(0)
        let totalExpenses = new Decimal(0)

        for (const balance of balances) {
            const closingBalance = new Decimal(balance.closingBalance)

            switch (balance.Account.accountType) {
                case 'ASSET':
                    totalAssets = totalAssets.plus(closingBalance)
                    break
                case 'LIABILITY':
                    totalLiabilities = totalLiabilities.plus(closingBalance)
                    break
                case 'EQUITY':
                    totalEquity = totalEquity.plus(closingBalance)
                    break
                case 'REVENUE':
                    totalRevenue = totalRevenue.plus(closingBalance)
                    break
                case 'EXPENSE':
                    totalExpenses = totalExpenses.plus(closingBalance)
                    break
            }
        }

        const netIncome = totalRevenue.minus(totalExpenses)

        return {
            success: true,
            data: {
                periodId,
                periodName: period.name,
                totalAssets: totalAssets.toNumber(),
                totalLiabilities: totalLiabilities.toNumber(),
                totalEquity: totalEquity.toNumber(),
                totalRevenue: totalRevenue.toNumber(),
                totalExpenses: totalExpenses.toNumber(),
                netIncome: netIncome.toNumber(),
            },
        }
    } catch (error) {
        console.error('Error fetching period balance summary:', error)
        return { success: false, error: 'Failed to fetch period balance summary' }
    }
}

// ========== Balance Calculations ==========

/**
 * Recalculate balances for a period
 */
export const recalculateBalances = async (
    periodId: string
): Promise<ActionResult<{ accountsUpdated: number }>> => {
    try {
        const context = await getContext()
        if (!context) {
            return { success: false, error: 'Unauthorized: No session found' }
        }

        const hasPermission = await checkPermission(context, 'fi.general_ledger.balances.view')
        if (!hasPermission) {
            return { success: false, error: 'Unauthorized: Missing permission' }
        }

        const whereClause: any = context.subAccountId
            ? { subAccountId: context.subAccountId }
            : { agencyId: context.agencyId, subAccountId: null }

        const period = await db.financialPeriod.findUnique({
            where: { id: periodId },
        })

        if (!period) {
            return { success: false, error: 'Period not found' }
        }

        // Get all accounts
        const accounts = await db.chartOfAccount.findMany({
            where: { ...whereClause, isActive: true },
            select: { id: true, currencyCode: true },
        })

        let accountsUpdated = 0

        for (const account of accounts) {
            // Get previous period balance for opening balance
            const previousPeriod = await db.financialPeriod.findFirst({
                where: {
                    ...whereClause,
                    endDate: { lt: period.startDate },
                },
                orderBy: { endDate: 'desc' },
            })

            let openingBalance = new Decimal(0)
            let openingBalanceBase = new Decimal(0)

            if (previousPeriod) {
                const prevBalance = await db.accountBalance.findFirst({
                    where: { accountId: account.id, periodId: previousPeriod.id },
                })
                if (prevBalance) {
                    openingBalance = new Decimal(prevBalance.closingBalance)
                    openingBalanceBase = new Decimal(prevBalance.closingBalanceBase ?? prevBalance.closingBalance)
                }
            }

            // Calculate movements from journal entries
            const movements = await db.journalEntryLine.aggregate({
                where: {
                    accountId: account.id,
                    JournalEntry:{
                        status: 'POSTED',
                        entryDate: {
                            gte: period.startDate,
                            lte: period.endDate,
                        },
                    },
                },
                _sum: {
                    debitAmount: true,
                    creditAmount: true,
                    debitAmountBase: true,
                    creditAmountBase: true,
                },
            })

            const debitMovement = new Decimal(movements._sum.debitAmount ?? 0)
            const creditMovement = new Decimal(movements._sum.creditAmount ?? 0)
            const debitMovementBase = new Decimal(movements._sum.debitAmountBase ?? movements._sum.debitAmount ?? 0)
            const creditMovementBase = new Decimal(movements._sum.creditAmountBase ?? movements._sum.creditAmount ?? 0)

            const closingBalance = openingBalance.plus(debitMovement).minus(creditMovement)
            const closingBalanceBase = openingBalanceBase.plus(debitMovementBase).minus(creditMovementBase)

            // Upsert balance record
            await db.accountBalance.upsert({
                where: {
                    accountId_periodId_currencyCode: {
                        accountId: account.id,
                        periodId,
                        currencyCode: account.currencyCode ?? 'USD',
                    },
                },
                update: {
                    openingBalance,
                    debitMovement,
                    creditMovement,
                    closingBalance,
                    openingBalanceBase,
                    debitMovementBase,
                    creditMovementBase,
                    closingBalanceBase,
                    updatedAt: new Date(),
                },
                create: {
                    accountId: account.id,
                    periodId,
                    currencyCode: account.currencyCode ?? 'USD',
                    openingBalance,
                    debitMovement,
                    creditMovement,
                    closingBalance,
                    openingBalanceBase,
                    debitMovementBase,
                    creditMovementBase,
                    closingBalanceBase,
                },
            })

            accountsUpdated++
        }

        await logGLAudit({
            action: 'UPDATE',
            entityType: 'AccountBalance',
            entityId: periodId,
            agencyId: context.agencyId,
            subAccountId: context.subAccountId,
            description: `Recalculated balances for period:${period.name}`,
        })

        // Emit balance recalculated event
        await emitEvent(
            'fi.general_ledger',
            EVENT_KEYS.fi.general_ledger.balances.recalculated,
            { type: 'FinancialPeriod', id: periodId },
            { 
                amount: accountsUpdated,
                reference: period.name || periodId,
                description: 'Balances recalculated',
            }
        )

        revalidatePath(`/agency/${context.agencyId}/fi/general-ledger/reports`)

        return { success: true, data: { accountsUpdated } }
    } catch (error) {
        console.error('Error recalculating balances:', error)
        return { success: false, error: 'Failed to recalculate balances' }
    }
}

/**
 * Roll forward balances to new period
 */
export const rollForwardBalances = async (
    fromPeriodId: string,
    toPeriodId: string
): Promise<ActionResult<{ accountsRolled: number }>> => {
    try {
        const context = await getContext()
        if (!context) {
            return { success: false, error: 'Unauthorized: No session found' }
        }

        const hasPermission = await checkPermission(context, 'fi.general_ledger.balances.rollforward')
        if (!hasPermission) {
            return { success: false, error: 'Unauthorized: Missing permission' }
        }

        const whereClause: any = context.subAccountId
            ? { Account: { subAccountId: context.subAccountId } }
            : { Account: { agencyId: context.agencyId, subAccountId: null } }

        // Get closing balances from source period
        const sourceBalances = await db.accountBalance.findMany({
            where: { ...whereClause, periodId: fromPeriodId },
            include: { Account: { select: { currencyCode: true } } },
        })

        let accountsRolled = 0

        for (const balance of sourceBalances) {
            // Create opening balance in target period
            await db.accountBalance.upsert({
                where: {
                    accountId_periodId_currencyCode: {
                        accountId: balance.accountId,
                        periodId: toPeriodId,
                        currencyCode: balance.currencyCode,
                    },
                },
                update: {
                    openingBalance: balance.closingBalance,
                    openingBalanceBase: balance.closingBalanceBase,
                },
                create: {
                    accountId: balance.accountId,
                    periodId: toPeriodId,
                    currencyCode: balance.currencyCode,
                    openingBalance: balance.closingBalance,
                    openingBalanceBase: balance.closingBalanceBase ?? balance.closingBalance,
                    debitMovement: 0,
                    creditMovement: 0,
                    closingBalance: balance.closingBalance,
                    closingBalanceBase: balance.closingBalanceBase ?? balance.closingBalance,
                },
            })

            accountsRolled++
        }

        await logGLAudit({
            action: 'CREATE',
            entityType: 'AccountBalance',
            entityId: toPeriodId,
            agencyId: context.agencyId,
            subAccountId: context.subAccountId,
            description: `Rolled forward ${accountsRolled} balances from period ${fromPeriodId}`,
        })

        // Emit carry forward event
        await emitEvent(
            'fi.general_ledger',
            EVENT_KEYS.fi.general_ledger.carry_forward.processed,
            { type: 'FinancialPeriod', id: toPeriodId },
            { 
                amount: accountsRolled,
                reference: `${fromPeriodId} -> ${toPeriodId}`,
                description: 'Balances carried forward',
            }
        )

        revalidatePath(`/agency/${context.agencyId}/fi/general-ledger/reports`)

        return { success: true, data: { accountsRolled } }
    } catch (error) {
        console.error('Error rolling forward balances:', error)
        return { success: false, error: 'Failed to roll forward balances' }
    }
}

/**
 * Get balance history for an account across periods
 */
export const getAccountBalanceHistory = async (
    accountId: string,
    options?: {
        fromDate?: Date
        toDate?: Date
        limit?: number
    }
): Promise<ActionResult<AccountBalanceData[]>> => {
    try {
        const context = await getContext()
        if (!context) {
            return { success: false, error: 'Unauthorized: No session found' }
        }

        const hasPermission = await checkPermission(context, 'fi.general_ledger.balances.view')
        if (!hasPermission) {
            return { success: false, error: 'Unauthorized: Missing permission' }
        }

        const periodWhereClause: any = {}
        if (options?.fromDate) {
            periodWhereClause.startDate = { gte: options.fromDate }
        }
        if (options?.toDate) {
            periodWhereClause.endDate = { lte: options.toDate }
        }

        const balances = await db.accountBalance.findMany({
            where: {
                accountId,
                Period:periodWhereClause,
            },
            include: {
                Account: { select: { code: true, name: true, accountType: true } },
                Period:{ select: { name: true, startDate: true, endDate: true } },
            },
            orderBy: { Period:{ startDate: 'desc' } },
            take: options?.limit ?? 24,
        })

        const data: AccountBalanceData[] = balances.map((b) => ({
            accountId: b.accountId,
            accountCode: b.Account.code,
            accountName: b.Account.name,
            accountType: b.Account.accountType,
            openingBalance: b.openingBalance.toNumber(),
            debitMovement: b.debitMovement.toNumber(),
            creditMovement: b.creditMovement.toNumber(),
            closingBalance: b.closingBalance.toNumber(),
            openingBalanceBase: b.openingBalanceBase?.toNumber(),
            closingBalanceBase: b.closingBalanceBase?.toNumber(),
            currencyCode: b.currencyCode,
        }))

        return { success: true, data }
    } catch (error) {
        console.error('Error fetching account balance history:', error)
        return { success: false, error: 'Failed to fetch account balance history' }
    }
}

/**
 * Get real-time balance (includes unposted entries)
 */
export const getRealTimeBalance = async (
    accountId: string,
    asOfDate?: Date
): Promise<ActionResult<{
    postedBalance: number
    pendingDebits: number
    pendingCredits: number
    projectedBalance: number
}>> => {
    try {
        const context = await getContext()
        if (!context) {
            return { success: false, error: 'Unauthorized: No session found' }
        }

        const hasPermission = await checkPermission(context, 'fi.general_ledger.balances.view')
        if (!hasPermission) {
            return { success: false, error: 'Unauthorized: Missing permission' }
        }

        const date = asOfDate ?? new Date()

        // Get current period
        const whereClause: any = context.subAccountId
            ? { subAccountId: context.subAccountId }
            : { agencyId: context.agencyId, subAccountId: null }

        const currentPeriod = await db.financialPeriod.findFirst({
            where: {
                ...whereClause,
                startDate: { lte: date },
                endDate: { gte: date },
            },
        })

        // Get posted balance
        let postedBalance = new Decimal(0)
        if (currentPeriod) {
            const balance = await db.accountBalance.findFirst({
                where: { accountId, periodId: currentPeriod.id },
            })
            if (balance) {
                postedBalance = new Decimal(balance.closingBalance)
            }
        }

        // Get pending entries
        const pendingEntries = await db.journalEntryLine.aggregate({
            where: {
                accountId,
                JournalEntry:{
                    status: { in: ['DRAFT', 'PENDING_APPROVAL', 'APPROVED'] },
                    entryDate: { lte: date },
                },
            },
            _sum: {
                debitAmount: true,
                creditAmount: true,
            },
        })

        const pendingDebits = new Decimal(pendingEntries._sum.debitAmount ?? 0)
        const pendingCredits = new Decimal(pendingEntries._sum.creditAmount ?? 0)
        const projectedBalance = postedBalance.plus(pendingDebits).minus(pendingCredits)

        return {
            success: true,
            data: {
                postedBalance: postedBalance.toNumber(),
                pendingDebits: pendingDebits.toNumber(),
                pendingCredits: pendingCredits.toNumber(),
                projectedBalance: projectedBalance.toNumber(),
            },
        }
    } catch (error) {
        console.error('Error fetching real-time balance:', error)
        return { success: false, error: 'Failed to fetch real-time balance' }
    }
}

/**
 * Clear income/expense accounts to retained earnings (year-end close)
 */
export const closeIncomeExpenseAccounts = async (
    periodId: string,
    retainedEarningsAccountId: string
): Promise<ActionResult<{ journalEntryId: string; netIncome: number }>> => {
    try {
        const context = await getContext()
        if (!context) {
            return { success: false, error: 'Unauthorized: No session found' }
        }

        const hasPermission = await checkPermission(context, 'fi.configuration.fiscal_years.manage')
        if (!hasPermission) {
            return { success: false, error: 'Unauthorized: Missing permission' }
        }

        const whereClause: any = context.subAccountId
            ? { subAccountId: context.subAccountId }
            : { agencyId: context.agencyId, subAccountId: null }

        // Get all income/expense balances for the period
        const balances = await db.accountBalance.findMany({
            where: {
                periodId,
                Account: {
                    ...whereClause,
                    accountType: { in: ['REVENUE', 'EXPENSE'] },
                },
            },
            include: {
                Account: { select: { id: true, code: true, name: true, accountType: true } },
            },
        })

        if (balances.length === 0) {
            return { success: false, error: 'No income/expense accounts to close' }
        }

        const lines: {
            accountId: string
            debitAmount: Decimal
            creditAmount: Decimal
            description: string
        }[] = []

        let netIncome = new Decimal(0)

        for (const balance of balances) {
            const closingBalance = new Decimal(balance.closingBalance)

            if (closingBalance.isZero()) continue

            if (balance.Account.accountType === 'REVENUE') {
                // Debit revenue accounts to close
                lines.push({
                    accountId: balance.accountId,
                    debitAmount: closingBalance,
                    creditAmount: new Decimal(0),
                    description: `Close ${balance.Account.code} to Retained Earnings`,
                })
                netIncome = netIncome.plus(closingBalance)
            } else {
                // Credit expense accounts to close
                lines.push({
                    accountId: balance.accountId,
                    debitAmount: new Decimal(0),
                    creditAmount: closingBalance,
                    description: `Close ${balance.Account.code} to Retained Earnings`,
                })
                netIncome = netIncome.minus(closingBalance)
            }
        }

        // Add retained earnings line
        lines.push({
            accountId: retainedEarningsAccountId,
            debitAmount: netIncome.lessThan(0) ? netIncome.abs() : new Decimal(0),
            creditAmount: netIncome.greaterThan(0) ? netIncome : new Decimal(0),
            description: 'Net income for period',
        })

        // Generate entry number
        const count = await db.journalEntry.count({ where: whereClause })
        const year = new Date().getFullYear()
        const entryNumber = `JE-${year}-${String(count + 1).padStart(6, '0')}`

        // Create closing journal entry
        const journalEntry = await db.journalEntry.create({
            data: {
                agencyId: context.agencyId ?? null,
                subAccountId: context.subAccountId ?? null,
                periodId,
                entryNumber,
                entryDate: new Date(),
                description: 'Year-end closing entry',
                reference: `CLOSE-${periodId}`,
                status: 'POSTED',
                entryType: 'CLOSING',
                createdBy: context.userId,
                postedBy: context.userId,
                postedAt: new Date(),
                Lines: {
                    create: lines.map((line, index) => ({
                        lineNumber: index + 1,
                        accountId: line.accountId,
                        debitAmount: line.debitAmount,
                        creditAmount: line.creditAmount,
                        description: line.description,
                    })),
                },
            },

        })

        await logGLAudit({
            action: 'CREATE',
            entityType: 'JournalEntry',
            entityId: journalEntry.id,
            agencyId: context.agencyId,
            subAccountId: context.subAccountId,
            description: `Year-end closing entry: Net income ${netIncome.toFixed(2)}`,
        })

        revalidatePath(`/agency/${context.agencyId}/fi/general-ledger/journal-entries`)

        return {
            success: true,
            data: {
                journalEntryId: journalEntry.id,
                netIncome: netIncome.toNumber(),
            },
        }
    } catch (error) {
        console.error('Error closing income/expense accounts:', error)
        return { success: false, error: 'Failed to close income/expense accounts' }
    }
}
