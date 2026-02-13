/**
 * GL Currency Server Actions
 * FI-GL Module - Multi-currency and exchange rate management
 */

'use server'

import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { logGLAudit } from './audit'
import {
  createCurrencySchema, 
  createExchangeRateSchema,
  currencyRevaluationSchema,
  type CreateCurrencyInput,
  type UpdateCurrencyInput,
  type CreateExchangeRateInput,
  type CurrencyRevaluationInput,
  updateCurrencySchema,
} from '@/lib/schemas/fi/general-ledger/currency'
import { Decimal } from 'decimal.js'
import { getActionContext, hasContextPermission, type ActionContext } from '@/lib/features/iam/authz/action-context'

// ========== Types ==========

type ActionResult<T> = {
  success: boolean
  data?: T
  error?: string
}

type CurrencyContext = ActionContext

// ========== Helper Functions ==========

const getContext = getActionContext
const checkPermission = hasContextPermission

// ========== Currency CRUD ==========

/**
 * Get a currency by code
 */
export const getCurrency = async (
  code: string
): Promise<ActionResult<any>> => {
  try {
    const context = await getContext()
    if (!context) {
      return { success: false, error: 'Unauthorized: No session found' }
    }

    const hasPermission = await checkPermission(context, 'fi.general_ledger.settings.view')
    if (!hasPermission) {
      return { success: false, error: 'Unauthorized: Missing permission' }
    }

    const currency = await db.currency.findUnique({
      where: { code },
    })

    if (!currency) {
      return { success: false, error: 'Currency not found' }
    }

    return { success: true, data: currency }
  } catch (error) {
    console.error('Error fetching currency:', error)
    return { success: false, error: 'Failed to fetch currency' }
  }
}

/**
 * List all currencies
 */
export const listCurrencies = async (options?: {
  isActive?: boolean
}): Promise<ActionResult<any[]>> => {
  try {
    const context = await getContext()
    if (!context) {
      return { success: false, error: 'Unauthorized: No session found' }
    }

    const hasPermission = await checkPermission(context, 'fi.general_ledger.settings.view')
    if (!hasPermission) {
      return { success: false, error: 'Unauthorized: Missing permission' }
    }

    const whereClause: any = {}
    if (options?.isActive !== undefined) {
      whereClause.isActive = options.isActive
    }

    const currencies = await db.currency.findMany({
      where: whereClause,
      orderBy: [{ isBaseCurrency: 'desc' }, { code: 'asc' }],
    })

    return { success: true, data: currencies }
  } catch (error) {
    console.error('Error listing currencies:', error)
    return { success: false, error: 'Failed to list currencies' }
  }
}

/**
 * Create a new currency
 */
export const createCurrency = async (
  input: CreateCurrencyInput
): Promise<ActionResult<any>> => {
  try {
    const context = await getContext()
    if (!context) {
      return { success: false, error: 'Unauthorized: No session found' }
    }

    const hasPermission = await checkPermission(context, 'fi.general_ledger.settings.manage')
    if (!hasPermission) {
      return { success: false, error: 'Unauthorized: Missing permission' }
    }

    const parsed = createCurrencySchema.safeParse(input)
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' }
    }

    // Check if currency already exists
    const existing = await db.currency.findUnique({
      where: { code: parsed.data.code },
    })

    if (existing) {
      return { success: false, error: 'Currency code already exists' }
    }

    const currency = await db.currency.create({
      data: {
        ...parsed.data,
        isBaseCurrency: false, // Only one base currency allowed
      },
    })

    await logGLAudit({
      action: 'CREATE',
      entityType: 'Currency',
      entityId: currency.code,
      agencyId: context.agencyId,
      subAccountId: context.subAccountId,
      description: `Created currency: ${currency.code} - ${currency.name}`,
    })

    revalidatePath(`/agency/${context.agencyId}/fi/general-ledger/settings`)

    return { success: true, data: currency }
  } catch (error) {
    console.error('Error creating currency:', error)
    return { success: false, error: 'Failed to create currency' }
  }
}

/**
 * Update a currency
 */
export const updateCurrency = async (
  input: UpdateCurrencyInput
): Promise<ActionResult<any>> => {
  try {
    const context = await getContext()
    if (!context) {
      return { success: false, error: 'Unauthorized: No session found' }
    }

    const hasPermission = await checkPermission(context, 'fi.general_ledger.settings.manage')
    if (!hasPermission) {
      return { success: false, error: 'Unauthorized: Missing permission' }
    }

    const parsed = updateCurrencySchema.safeParse(input)
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' }
    }

    const { code, ...updateData } = parsed.data

    const currency = await db.currency.update({
      where: { code },
      data: updateData,
    })

    await logGLAudit({
      action: 'UPDATE',
      entityType: 'Currency',
      entityId: currency.code,
      agencyId: context.agencyId,
      subAccountId: context.subAccountId,
      description: `Updated currency: ${currency.code}`,
    })

    revalidatePath(`/agency/${context.agencyId}/fi/general-ledger/settings`)

    return { success: true, data: currency }
  } catch (error) {
    console.error('Error updating currency:', error)
    return { success: false, error: 'Failed to update currency' }
  }
}

// ========== Exchange Rate Actions ==========

/**
 * Get current exchange rate for a currency pair
 */
export const getCurrentExchangeRate = async (
  fromCurrencyCode: string,
  toCurrencyCode: string
): Promise<ActionResult<{ rate: number; effectiveDate: Date }>> => {
  try {
    const context = await getContext()
    if (!context) {
      return { success: false, error: 'Unauthorized: No session found' }
    }

    const rate = await db.exchangeRate.findFirst({
      where: {
        fromCurrencyCode: fromCurrencyCode,
        toCurrencyCode: toCurrencyCode,
        effectiveDate: { lte: new Date() },
        OR: [
          { expiryDate: null },
          { expiryDate: { gte: new Date() } },
        ],
      },
      orderBy: { effectiveDate: 'desc' },
    })

    if (!rate) {
      // Try inverse rate
      const inverseRate = await db.exchangeRate.findFirst({
        where: {
          fromCurrencyCode: toCurrencyCode,
          toCurrencyCode: fromCurrencyCode,
          effectiveDate: { lte: new Date() },
          OR: [
            { expiryDate: null },
            { expiryDate: { gte: new Date() } },
          ],
        },
        orderBy: { effectiveDate: 'desc' },
      })

      if (inverseRate) {
        return {
          success: true,
          data: {
            rate: new Decimal(1).dividedBy(new Decimal(inverseRate.rate)).toNumber(),
            effectiveDate: inverseRate.effectiveDate,
          },
        }
      }

      return { success: false, error: 'Exchange rate not found' }
    }

    return {
      success: true,
      data: {
        rate: rate.rate.toNumber(),
        effectiveDate: rate.effectiveDate,
      },
    }
  } catch (error) {
    console.error('Error fetching exchange rate:', error)
    return { success: false, error: 'Failed to fetch exchange rate' }
  }
}

/**
 * List exchange rates
 */
export const listExchangeRates = async (options?: {
  fromCurrencyCode?: string
  toCurrencyCode?: string
  effectiveDate?: Date
  page?: number
  pageSize?: number
}): Promise<ActionResult<{ rates: any[]; total: number }>> => {
  try {
    const context = await getContext()
    if (!context) {
      return { success: false, error: 'Unauthorized: No session found' }
    }

    const hasPermission = await checkPermission(context, 'fi.general_ledger.settings.view')
    if (!hasPermission) {
      return { success: false, error: 'Unauthorized: Missing permission' }
    }

    const page = options?.page ?? 1
    const pageSize = options?.pageSize ?? 50
    const skip = (page - 1) * pageSize

    const whereClause: any = {}

    if (options?.fromCurrencyCode) {
      whereClause.fromCurrencyCode = options.fromCurrencyCode
    }

    if (options?.toCurrencyCode) {
      whereClause.toCurrencyCode = options.toCurrencyCode
    }

    if (options?.effectiveDate) {
      whereClause.effectiveDate = { lte: options.effectiveDate }
    }

    const [rates, total] = await Promise.all([
      db.exchangeRate.findMany({
        where: whereClause,
        orderBy: [{ effectiveDate: 'desc' }, { fromCurrencyCode: 'asc' }],
        skip,
        take: pageSize,
      }),
      db.exchangeRate.count({ where: whereClause }),
    ])

    return { success: true, data: { rates, total } }
  } catch (error) {
    console.error('Error listing exchange rates:', error)
    return { success: false, error: 'Failed to list exchange rates' }
  }
}

/**
 * Create or update exchange rate
 */
export const createExchangeRate = async (
  input: CreateExchangeRateInput
): Promise<ActionResult<any>> => {
  try {
    const context = await getContext()
    if (!context) {
      return { success: false, error: 'Unauthorized: No session found' }
    }

    const hasPermission = await checkPermission(context, 'fi.general_ledger.settings.manage')
    if (!hasPermission) {
      return { success: false, error: 'Unauthorized: Missing permission' }
    }

    const parsed = createExchangeRateSchema.safeParse(input)
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' }
    }

    // Expire previous rate if exists
    await db.exchangeRate.updateMany({
      where: {
        fromCurrencyCode: parsed.data.fromCurrencyCode,
        toCurrencyCode: parsed.data.toCurrencyCode,
        expiryDate: null,
      },
      data: {
        expiryDate: new Date(parsed.data.effectiveDate.getTime() - 1),
      },
    })

    if (!context.agencyId) {
      return { success: false, error: 'Agency context required for exchange rates' }
    }

    const rate = await db.exchangeRate.create({
      data: {
        agencyId: context.agencyId,
        fromCurrencyCode: parsed.data.fromCurrencyCode,
        toCurrencyCode: parsed.data.toCurrencyCode,
        effectiveDate: parsed.data.effectiveDate,
        expiryDate: parsed.data.expiryDate,
        rateType: parsed.data.rateType?.toString() ?? 'SPOT',
        source: parsed.data.source,
        inverseRate: new Decimal(1).dividedBy(new Decimal(parsed.data.rate)).toNumber(),
        rate: new Decimal(parsed.data.rate),
        createdBy: context.userId,
      },
    })

    await logGLAudit({
      action: 'CREATE',
      entityType: 'ExchangeRate',
      entityId: rate.id,
      agencyId: context.agencyId,
      subAccountId: context.subAccountId,
      description: `Created exchange rate: ${rate.fromCurrencyCode}/${rate.toCurrencyCode} = ${rate.rate}`,
    })

    revalidatePath(`/agency/${context.agencyId}/fi/general-ledger/currency`)

    return { success: true, data: rate }
  } catch (error) {
    console.error('Error creating exchange rate:', error)
    return { success: false, error: 'Failed to create exchange rate' }
  }
}

/**
 * Bulk import exchange rates
 */
export const importExchangeRates = async (
  rates: CreateExchangeRateInput[]
): Promise<ActionResult<{ imported: number; errors: string[] }>> => {
  try {
    const context = await getContext()
    if (!context) {
      return { success: false, error: 'Unauthorized: No session found' }
    }

    const hasPermission = await checkPermission(context, 'fi.general_ledger.settings.manage')
    if (!hasPermission) {
      return { success: false, error: 'Unauthorized: Missing permission' }
    }

    let imported = 0
    const errors: string[] = []

    for (const rateInput of rates) {
      try {
        const result = await createExchangeRate(rateInput)
        if (result.success) {
          imported++
        } else {
          errors.push(`${rateInput.fromCurrencyCode}/${rateInput.toCurrencyCode}: ${result.error}`)
        }
      } catch (err: any) {
        errors.push(`${rateInput.fromCurrencyCode}/${rateInput.toCurrencyCode}: ${err.message}`)
      }
    }

    return { success: true, data: { imported, errors } }
  } catch (error) {
    console.error('Error importing exchange rates:', error)
    return { success: false, error: 'Failed to import exchange rates' }
  }
}

// ========== Currency Revaluation ==========

/**
 * Run currency revaluation for foreign currency accounts
 */
export const runCurrencyRevaluation = async (
  input: CurrencyRevaluationInput
): Promise<ActionResult<{
  accountsRevalued: number
  totalGainLoss: number
  journalEntryId: string
}>> => {
  try {
    const context = await getContext()
    if (!context) {
      return { success: false, error: 'Unauthorized: No session found' }
    }

    const hasPermission = await checkPermission(context, 'fi.configuration.posting_rules.simulate')
    if (!hasPermission) {
      return { success: false, error: 'Unauthorized: Missing permission' }
    }

    const parsed = currencyRevaluationSchema.safeParse(input)
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' }
    }

    const whereClause: any = context.subAccountId
      ? { subAccountId: context.subAccountId }
      : { agencyId: context.agencyId, subAccountId: null }

    // Get GL config for base currency and revaluation accounts
    const config = await db.gLConfiguration.findFirst({
      where: { agencyId: context.agencyId },
    })

    if (!config) {
      return { success: false, error: 'GL configuration not found' }
    }

    // Get foreign currency account balances
    const foreignBalances = await db.accountBalance.findMany({
      where: {
        ...whereClause,
        currencyCode: { not: config.baseCurrency },
        periodId: parsed.data.periodId,
      },
      include: {
        Account: { select: { id: true, code: true, name: true, currencyCode: true } },
      },
    })

    let totalGainLoss = new Decimal(0)
    const revaluationLines: any[] = []

    for (const balance of foreignBalances) {
      // Get current exchange rate
      const rateResult = await getCurrentExchangeRate(
        balance.currencyCode,
        config.baseCurrency
      )

      if (!rateResult.success || !rateResult.data) continue

      const currentRate = new Decimal(rateResult.data.rate)
      const originalBaseBalance = new Decimal(balance.closingBalanceBase ?? 0)
      const currentBalance = new Decimal(balance.closingBalance)
      const newBaseBalance = currentBalance.times(currentRate)
      const difference = newBaseBalance.minus(originalBaseBalance)

      if (difference.abs().greaterThan(0.01)) {
        totalGainLoss = totalGainLoss.plus(difference)

        // Create revaluation line
        revaluationLines.push({
          accountId: balance.accountId,
          description: `Currency revaluation: ${balance.currencyCode}`,
          debitAmount: difference.greaterThan(0) ? difference : new Decimal(0),
          creditAmount: difference.lessThan(0) ? difference.abs() : new Decimal(0),
        })

        // Update balance with new base amounts
        await db.accountBalance.update({
          where: { id: balance.id },
          data: {
            closingBalanceBase: newBaseBalance,
            lastRecalculatedAt: new Date(),
          },
        })
      }
    }

    if (revaluationLines.length === 0) {
      return {
        success: true,
        data: {
          accountsRevalued: 0,
          totalGainLoss: 0,
          journalEntryId: '',
        },
      }
    }

    // Get the unrealized forex gain/loss account from input
    const gainLossAccountId = parsed.data.gainLossAccountId

    if (!gainLossAccountId) {
      return { success: false, error: 'Unrealized forex gain/loss account not specified' }
    }

    revaluationLines.push({
      accountId: gainLossAccountId,
      description: 'Currency revaluation gain/loss',
      debitAmount: totalGainLoss.lessThan(0) ? totalGainLoss.abs() : new Decimal(0),
      creditAmount: totalGainLoss.greaterThan(0) ? totalGainLoss : new Decimal(0),
    })

    // Get the current period for the journal entry
    const period = await db.financialPeriod.findFirst({
      where: {
        agencyId: context.agencyId,
        startDate: { lte: parsed.data.revaluationDate },
        endDate: { gte: parsed.data.revaluationDate },
      },
    })

    if (!period) {
      return { success: false, error: 'No open period found for revaluation date' }
    }

    // Create revaluation journal entry
    const entryNumber = await generateEntryNumber(context)

    const journalEntry = await db.journalEntry.create({
      data: {
        agencyId: context.agencyId ?? null,
        subAccountId: context.subAccountId ?? null,
        periodId: period.id,
        entryNumber,
        entryDate: parsed.data.revaluationDate,
        description: `Currency revaluation as of ${parsed.data.revaluationDate.toISOString().split('T')[0]}`,
        reference: 'REVAL',
        status: 'POSTED',
        entryType: 'ADJUSTMENT',
        createdBy: context.userId,
        postedBy: context.userId,
        postedAt: new Date(),
        Lines: {
          create: revaluationLines.map((line, idx) => ({
            lineNumber: idx + 1,
            accountId: line.accountId,
            description: line.description,
            debitAmount: line.debitAmount,
            creditAmount: line.creditAmount,
            debitAmountBase: line.debitAmount,
            creditAmountBase: line.creditAmount,
            currencyCode: config.baseCurrency,
          })),
        },
      },
    })

    // Record revaluation
    await db.currencyRevaluation.create({
      data: {
        agencyId: context.agencyId ?? null,
        subAccountId: context.subAccountId ?? null,
        periodId: parsed.data.periodId,
        currencyCode: parsed.data.currencyCode,
        revaluationDate: parsed.data.revaluationDate,
        exchangeRate: new Decimal(parsed.data.exchangeRate),
        previousRate: new Decimal(parsed.data.exchangeRate),
        unrealizedGain: totalGainLoss.greaterThan(0) ? totalGainLoss : new Decimal(0),
        unrealizedLoss: totalGainLoss.lessThan(0) ? totalGainLoss.abs() : new Decimal(0),
        netGainLoss: totalGainLoss,
        journalEntryId: journalEntry.id,
        status: 'POSTED',
        createdBy: context.userId,
        postedAt: new Date(),
        postedBy: context.userId,
      },
    })

    await logGLAudit({
      action: 'CREATE',
      entityType: 'CurrencyRevaluation',
      entityId: journalEntry.id,
      agencyId: context.agencyId,
      subAccountId: context.subAccountId,
      description: `Currency revaluation: ${revaluationLines.length - 1} accounts, gain/loss: ${totalGainLoss.toFixed(2)}`,
    })

    revalidatePath(`/agency/${context.agencyId}/fi/general-ledger/currency`)

    return {
      success: true,
      data: {
        accountsRevalued: revaluationLines.length - 1,
        totalGainLoss: totalGainLoss.toNumber(),
        journalEntryId: journalEntry.id,
      },
    }
  } catch (error) {
    console.error('Error running currency revaluation:', error)
    return { success: false, error: 'Failed to run currency revaluation' }
  }
}

/**
 * Get revaluation history
 */
export const listCurrencyRevaluations = async (options?: {
  periodId?: string
  page?: number
  pageSize?: number
}): Promise<ActionResult<{ revaluations: any[]; total: number }>> => {
  try {
    const context = await getContext()
    if (!context) {
      return { success: false, error: 'Unauthorized: No session found' }
    }

    const hasPermission = await checkPermission(context, 'fi.general_ledger.settings.view')
    if (!hasPermission) {
      return { success: false, error: 'Unauthorized: Missing permission' }
    }

    const page = options?.page ?? 1
    const pageSize = options?.pageSize ?? 20
    const skip = (page - 1) * pageSize

    const whereClause: any = context.subAccountId
      ? { subAccountId: context.subAccountId }
      : { agencyId: context.agencyId, subAccountId: null }

    if (options?.periodId) {
      whereClause.periodId = options.periodId
    }

    const [revaluations, total] = await Promise.all([
      db.currencyRevaluation.findMany({
        where: whereClause,
        include: {
          Currency: { select: { code: true, name: true } },
        },
        orderBy: { revaluationDate: 'desc' },
        skip,
        take: pageSize,
      }),
      db.currencyRevaluation.count({ where: whereClause }),
    ])

    return { success: true, data: { revaluations, total } }
  } catch (error) {
    console.error('Error listing currency revaluations:', error)
    return { success: false, error: 'Failed to list currency revaluations' }
  }
}

// ========== Helper Functions ==========

async function generateEntryNumber(context: CurrencyContext): Promise<string> {
  const whereClause: any = context.subAccountId
    ? { subAccountId: context.subAccountId }
    : { agencyId: context.agencyId, subAccountId: null }

  const count = await db.journalEntry.count({ where: whereClause })
  const year = new Date().getFullYear()
  return `JE-${year}-${String(count + 1).padStart(6, '0')}`
}

/**
 * Convert amount between currencies
 */
export const convertCurrency = async (
  amount: number,
  fromCurrencyCode: string,
  toCurrencyCode: string,
  date?: Date
): Promise<ActionResult<{ convertedAmount: number; rate: number }>> => {
  try {
    if (fromCurrencyCode === toCurrencyCode) {
      return { success: true, data: { convertedAmount: amount, rate: 1 } }
    }

    const rateResult = await getCurrentExchangeRate(fromCurrencyCode, toCurrencyCode)
    if (!rateResult.success || !rateResult.data) {
      return { success: false, error: rateResult.error ?? 'Exchange rate not found' }
    }

    const convertedAmount = new Decimal(amount).times(rateResult.data.rate).toNumber()

    return {
      success: true,
      data: {
        convertedAmount,
        rate: rateResult.data.rate,
      },
    }
  } catch (error) {
    console.error('Error converting currency:', error)
    return { success: false, error: 'Failed to convert currency' }
  }
}
