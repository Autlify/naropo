/**
 * Report Generation Actions
 * FI-GL Module - Financial statement and report generation
 */

'use server';

import { db } from '@/lib/db';
import { calculateAccountBalance, formatCurrency, formatDate } from '../utils/helpers';
import { BALANCE_SHEET_SECTIONS, INCOME_STATEMENT_SECTIONS } from '../constants';
import type { AccountCategory } from '@/generated/prisma/client';
import Decimal from 'decimal.js';
import { getActionContext, hasContextPermission, type ActionContext } from '@/lib/features/iam/authz/action-context';

type ActionResult<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

type Context = ActionContext;

const getContext = getActionContext;

/**
 * Generate Trial Balance
 */
export const generateTrialBalance = async (
  periodId: string,
  options?: {
    includeZeroBalances?: boolean;
    currency?: string;
  }
): Promise<ActionResult<any>> => {
  try {
    const context = await getContext();
    if (!context) {
      return { success: false, error: 'Unauthorized: No session found' };
    }

    const hasPermission = await hasContextPermission(context, 'fi.general_ledger.reports.generate');
    
    if (!hasPermission) {
      return { success: false, error: 'Unauthorized: Missing permission to generate reports' };
    }

    // Get period
    const period = await db.financialPeriod.findUnique({
      where: { id: periodId },
    });

    if (!period) {
      return { success: false, error: 'Financial period not found' };
    }

    // Get all account balances for the period
    const balances = await db.accountBalance.findMany({
      where: {
        periodId,
        ...(options?.currency && { currency: options.currency }),
      },
      include: {
        Account: {
          select: {
            id: true,
            code: true,
            name: true,
            category: true,
            accountType: true,
            path: true,
          },
        },
      },
      orderBy: {
        Account: {
          path: 'asc',
        },
      },
    });

    // Filter out zero balances if requested
    const filteredBalances = options?.includeZeroBalances
      ? balances
      : balances.filter((b) => new Decimal(b.closingBalance).toDecimalPlaces(2).toNumber() !== 0);

    // Calculate totals
    let totalDebits = 0;
    let totalCredits = 0;

    const trialBalanceLines = filteredBalances.map((balance) => {
      const normalSide = ['ASSET', 'EXPENSE'].includes(balance.Account.accountType )
        ? 'DEBIT'
        : 'CREDIT';

      const debitBalance = normalSide === 'DEBIT' && new Decimal(balance.closingBalance).gte(0)
        ? new Decimal(balance.closingBalance).abs().toNumber()
        : normalSide === 'CREDIT' && new Decimal(balance.closingBalance).lt(0)
        ? new Decimal(balance.closingBalance).abs().toNumber()
        : 0;

      const creditBalance = normalSide === 'CREDIT' && new Decimal(balance.closingBalance).gte(0)
        ? new Decimal(balance.closingBalance).abs().toNumber()
        : normalSide === 'DEBIT' && new Decimal(balance.closingBalance).lt(0)
        ? new Decimal(balance.closingBalance).abs().toNumber()
        : 0;

      totalDebits += debitBalance;
      totalCredits += creditBalance;

      return {
        accountId: balance.accountId,
        accountCode: balance.Account.code,
        accountName: balance.Account.name,
        category: balance.Account.category,
        accountType: balance.Account.accountType,
        debitBalance,
        creditBalance,
        currency: balance.currencyCode,
      };
    });

    const report = {
      reportType: 'TRIAL_BALANCE',
      periodId: period.id,
      periodName: period.name,
      year: period.fiscalYear,
      periodNumber: period.fiscalPeriod,
      startDate: period.startDate,
      endDate: period.endDate,
      generatedAt: new Date(),
      generatedBy: context.userId,
      currency: options?.currency || 'USD',
      lines: trialBalanceLines,
      totals: {
        totalDebits,
        totalCredits,
        difference: Math.abs(totalDebits - totalCredits),
        balanced: Math.abs(totalDebits - totalCredits) < 0.01,
      },
    };

    return { success: true, data: report };
  } catch (error) {
    console.error('Error in generateTrialBalance:', error);
    return { success: false, error: 'Failed to generate trial balance' };
  }
};

/**
 * Generate Balance Sheet
 */
export const generateBalanceSheet = async (
  periodId: string,
  options?: {
    comparative?: boolean;
    previousPeriodId?: string;
    currency?: string;
  }
): Promise<ActionResult<any>> => {
  try {
    const context = await getContext();
    if (!context) {
      return { success: false, error: 'Unauthorized: No session found' };
    }

    const hasPermission = await hasContextPermission(context, 'fi.general_ledger.reports.generate');
    
    if (!hasPermission) {
      return { success: false, error: 'Unauthorized: Missing permission to generate reports' };
    }

    // Get period
    const period = await db.financialPeriod.findUnique({
      where: { id: periodId },
    });

    if (!period) {
      return { success: false, error: 'Financial period not found' };
    }

    // Get balances
    const balances = await db.accountBalance.findMany({
      where: {
        periodId,
        Account: {
          accountType: {
            in: ['ASSET', 'LIABILITY', 'EQUITY'],
          },
        },
        ...(options?.currency && { currency: options.currency }),
      },
      include: {
        Account: {
          select: {
            id: true,
            code: true,
            name: true,
            category: true,
            accountType: true,
            path: true,
            level: true,
          },
        },
      },
    });

    // Group by sections
    const assets = {
      currentAssets: balances.filter((b) =>
        b.Account.accountType === 'ASSET' &&
        BALANCE_SHEET_SECTIONS.ASSETS.CURRENT_ASSETS.includes(b.Account.accountType)
      ),
      fixedAssets: balances.filter((b) =>
        b.Account.accountType === 'ASSET' &&
        BALANCE_SHEET_SECTIONS.ASSETS.FIXED_ASSETS.includes(b.Account.accountType)
      ),
      otherAssets: balances.filter((b) =>
        b.Account.accountType === 'ASSET' &&
        BALANCE_SHEET_SECTIONS.ASSETS.OTHER_ASSETS.includes(b.Account.accountType)
      ),
    };

    const liabilities = {
      currentLiabilities: balances.filter((b) =>
        b.Account.accountType === 'LIABILITY' &&
        BALANCE_SHEET_SECTIONS.LIABILITIES.CURRENT_LIABILITIES.includes(b.Account.accountType)
      ),
      longTermLiabilities: balances.filter((b) =>
        b.Account.accountType === 'LIABILITY' &&
        BALANCE_SHEET_SECTIONS.LIABILITIES.LONG_TERM_LIABILITIES.includes(b.Account.accountType)
      ),
    };

    const equity = balances.filter((b) => b.Account.accountType === 'EQUITY');
    // Calculate totals
    const totalCurrentAssets = assets.currentAssets.reduce((sum, b) => new Decimal(sum).plus(b.closingBalance), new Decimal(0)).toNumber();
    const totalFixedAssets = assets.fixedAssets.reduce((sum, b) => new Decimal(sum).plus(b.closingBalance), new Decimal(0)).toNumber();
    const totalOtherAssets = assets.otherAssets.reduce((sum, b) => new Decimal(sum).plus(b.closingBalance), new Decimal(0)).toNumber();
    const totalAssets = totalCurrentAssets + totalFixedAssets + totalOtherAssets;

    const totalCurrentLiabilities = liabilities.currentLiabilities.reduce((sum, b) => new Decimal(sum).plus(b.closingBalance), new Decimal(0)).toNumber();
    const totalLongTermLiabilities = liabilities.longTermLiabilities.reduce((sum, b) => new Decimal(sum).plus(b.closingBalance), new Decimal(0)).toNumber();
    const totalLiabilities = totalCurrentLiabilities + totalLongTermLiabilities;

    const totalEquity = equity.reduce((sum, b) => new Decimal(sum).plus(b.closingBalance), new Decimal(0)).toNumber();

    const report = {
      reportType: 'BALANCE_SHEET',
      periodId: period.id,
      periodName: period.name,
      asOfDate: period.endDate,
      generatedAt: new Date(),
      generatedBy: context.userId,
      currency: options?.currency || 'USD',
      assets: {
        currentAssets: {
          accounts: assets.currentAssets.map((b) => ({
            code: b.Account.code,
            name: b.Account.name,
            balance: b.closingBalance,
            level: b.Account.level,
          })),
          total: totalCurrentAssets,
        },
        fixedAssets: {
          accounts: assets.fixedAssets.map((b) => ({
            code: b.Account.code,
            name: b.Account.name,
            balance: b.closingBalance,
            level: b.Account.level,
          })),
          total: totalFixedAssets,
        },
        otherAssets: {
          accounts: assets.otherAssets.map((b) => ({
            code: b.Account.code,
            name: b.Account.name,
            balance: b.closingBalance,
            level: b.Account.level,
          })),
          total: totalOtherAssets,
        },
        totalAssets,
      },
      liabilities: {
        currentLiabilities: {
          accounts: liabilities.currentLiabilities.map((b) => ({
            code: b.Account.code,
            name: b.Account.name,
            balance: b.closingBalance,
            level: b.Account.level,
          })),
          total: totalCurrentLiabilities,
        },
        longTermLiabilities: {
          accounts: liabilities.longTermLiabilities.map((b) => ({
            code: b.Account.code,
            name: b.Account.name,
            balance: b.closingBalance,
            level: b.Account.level,
          })),
          total: totalLongTermLiabilities,
        },
        totalLiabilities,
      },
      equity: {
        accounts: equity.map((b) => ({
          code: b.Account.code,
          name: b.Account.name,
          balance: b.closingBalance,
          level: b.Account.level,
        })),
        totalEquity,
      },
      totalLiabilitiesAndEquity: totalLiabilities + totalEquity,
      balanced: Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.01,
    };

    return { success: true, data: report };
  } catch (error) {
    console.error('Error in generateBalanceSheet:', error);
    return { success: false, error: 'Failed to generate balance sheet' };
  }
};

/**
 * Generate Income Statement (P&L)
 */
export const generateIncomeStatement = async (
  periodId: string,
  options?: {
    comparative?: boolean;
    previousPeriodId?: string;
    currency?: string;
  }
): Promise<ActionResult<any>> => {
  try {
    const context = await getContext();
    if (!context) {
      return { success: false, error: 'Unauthorized: No session found' };
    }

    const hasPermission = await hasContextPermission(context, 'fi.general_ledger.reports.generate');
    
    if (!hasPermission) {
      return { success: false, error: 'Unauthorized: Missing permission to generate reports' };
    }

    // Get period
    const period = await db.financialPeriod.findUnique({
      where: { id: periodId },
    });

    if (!period) {
      return { success: false, error: 'Financial period not found' };
    }

    // Get balances for revenue and expense accounts
    const balances = await db.accountBalance.findMany({
      where: {
        periodId,
        Account: {
          accountType: {
            in: ['REVENUE', 'EXPENSE'],
          },
        },
        ...(options?.currency && { currency: options.currency }),
      },
      include: {
        Account: {
          select: {
            id: true,
            code: true,
            name: true,
            category: true,
            accountType: true,
            path: true,
            level: true,
          },
        },
      },
    });

    // Group by sections
    const revenue = {
      operatingRevenue: balances.filter((b) =>
        b.Account.accountType === 'REVENUE' &&
        INCOME_STATEMENT_SECTIONS.REVENUE.OPERATING_REVENUE.includes(b.Account.accountType)
      ),
      otherRevenue: balances.filter((b) =>
        b.Account.accountType === 'REVENUE' &&
        INCOME_STATEMENT_SECTIONS.REVENUE.OTHER_REVENUE.includes(b.Account.accountType)
      ),
    };

    const expenses = {
      costOfGoodsSold: balances.filter((b) =>
        b.Account.accountType === 'EXPENSE' &&
        INCOME_STATEMENT_SECTIONS.EXPENSES.COST_OF_GOODS_SOLD.includes(b.Account.accountType)
      ),
      operatingExpenses: balances.filter((b) =>
        b.Account.accountType === 'EXPENSE' &&
        INCOME_STATEMENT_SECTIONS.EXPENSES.OPERATING_EXPENSES.includes(b.Account.accountType)
      ),
      depreciation: balances.filter((b) =>
        b.Account.accountType === 'EXPENSE' &&
        INCOME_STATEMENT_SECTIONS.EXPENSES.DEPRECIATION.includes(b.Account.accountType)
      ),
      otherExpenses: balances.filter((b) =>
        b.Account.accountType === 'EXPENSE' &&
        INCOME_STATEMENT_SECTIONS.EXPENSES.OTHER_EXPENSES.includes(b.Account.accountType)
      ),
    };

    // Calculate totals (revenue is credit, expense is debit)
    const totalOperatingRevenue = revenue.operatingRevenue.reduce((sum, b) =>  new Decimal(sum).plus(b.closingBalance), new Decimal(0)).toNumber();
    const totalOtherRevenue = revenue.otherRevenue.reduce((sum, b) => new Decimal(sum).plus(b.closingBalance), new Decimal(0)).toNumber();
    const totalRevenue = totalOperatingRevenue + totalOtherRevenue;

    const totalCOGS = expenses.costOfGoodsSold.reduce((sum, b) =>  new Decimal(sum).plus(b.closingBalance), new Decimal(0)).toNumber();
    const grossProfit = totalRevenue - totalCOGS;

    const totalOperatingExpenses = expenses.operatingExpenses.reduce((sum, b) => new Decimal(sum).plus(b.closingBalance), new Decimal(0)).toNumber();
    const totalDepreciation = expenses.depreciation.reduce((sum, b) => new Decimal(sum).plus(b.closingBalance), new Decimal(0)).toNumber();
    const totalOtherExpenses = expenses.otherExpenses.reduce((sum, b) => new Decimal(sum).plus(b.closingBalance), new Decimal(0)).toNumber();
    const totalExpenses = totalCOGS + totalOperatingExpenses + totalDepreciation + totalOtherExpenses;

    const netIncome = totalRevenue - totalExpenses;

    const report = {
      reportType: 'INCOME_STATEMENT',
      periodId: period.id,
      periodName: period.name,
      startDate: period.startDate,
      endDate: period.endDate,
      generatedAt: new Date(),
      generatedBy: context.userId,
      currency: options?.currency || 'USD',
      revenue: {
        operatingRevenue: {
          accounts: revenue.operatingRevenue.map((b) => ({
            code: b.Account.code,
            name: b.Account.name,
            amount: new Decimal(b.closingBalance).abs().toNumber(),
            level: b.Account.level,
          })),
          total: totalOperatingRevenue,
        },
        otherRevenue: {
          accounts: revenue.otherRevenue.map((b) => ({
            code: b.Account.code,
            name: b.Account.name,
            amount: new Decimal(b.closingBalance).abs().toNumber(),
            level: b.Account.level,
          })),
          total: totalOtherRevenue,
        },
        totalRevenue,
      },
      expenses: {
        costOfGoodsSold: {
          accounts: expenses.costOfGoodsSold.map((b) => ({
            code: b.Account.code,
            name: b.Account.name,
            amount: new Decimal(b.closingBalance).abs().toNumber(),
            level: b.Account.level,
          })),
          total: totalCOGS,
        },
        grossProfit,
        operatingExpenses: {
          accounts: expenses.operatingExpenses.map((b) => ({
            code: b.Account.code,
            name: b.Account.name,
            amount: new Decimal(b.closingBalance).abs().toNumber(),
            level: b.Account.level,
          })),
          total: totalOperatingExpenses,
        },
        depreciation: {
          accounts: expenses.depreciation.map((b) => ({
            code: b.Account.code,
            name: b.Account.name,
            amount: new Decimal(b.closingBalance).abs().toNumber(),
            level: b.Account.level,
          })),
          total: totalDepreciation,
        },
        otherExpenses: {
          accounts: expenses.otherExpenses.map((b) => ({
            code: b.Account.code,
            name: b.Account.name,
            amount: new Decimal(b.closingBalance).abs().toNumber(),
            level: b.Account.level,
          })),
          total: totalOtherExpenses,
        },
        totalExpenses,
      },
      netIncome,
    };

    return { success: true, data: report };
  } catch (error) {
    console.error('Error in generateIncomeStatement:', error);
    return { success: false, error: 'Failed to generate income statement' };
  }
};

/**
 * Generate General Ledger Report
 */
export const generateGeneralLedger = async (
  accountId: string,
  startDate: Date,
  endDate: Date
): Promise<ActionResult<any>> => {
  try {
    const context = await getContext();
    if (!context) {
      return { success: false, error: 'Unauthorized: No session found' };
    }

    const hasPermission = await hasContextPermission(context, 'fi.general_ledger.reports.generate');
    
    if (!hasPermission) {
      return { success: false, error: 'Unauthorized: Missing permission to generate reports' };
    }

    // Get account
    const account = await db.chartOfAccount.findUnique({
      where: { id: accountId },
    });

    if (!account) {
      return { success: false, error: 'Account not found' };
    }

    // Get all journal entry lines for this account in date range
    const lines = await db.journalEntryLine.findMany({
      where: {
        accountId,
        JournalEntry: {
          entryDate: {
            gte: startDate,
            lte: endDate,
          },
          status: 'APPROVED',
        },
      },
      include: {
        JournalEntry: {
          select: {
            entryNumber: true,
            entryDate: true,
            description: true,
            reference: true,
          },
        },
      },
      orderBy: {
        JournalEntry: {
          entryDate: 'asc',
        },
      },
    });

    // Calculate running balance
    let runningBalance = new Decimal(0);
    const transactions = lines.map((line) => {
      runningBalance = runningBalance.plus(line.debitAmount).minus(line.creditAmount);

      return {
        date: line.JournalEntry.entryDate,
        entryNumber: line.JournalEntry.entryNumber,
        description: line.description,
        reference: line.JournalEntry.reference,
        debitAmount: line.debitAmount,
        creditAmount: line.creditAmount,
        balance: runningBalance.toNumber(),
      };
    });

    const report = {
      reportType: 'GENERAL_LEDGER',
      accountId: account.id,
      accountCode: account.code,
      accountName: account.name,
      category: account.category,
      startDate,
      endDate,
      generatedAt: new Date(),
      generatedBy: context.userId,
      transactions,
      summary: {
        totalDebits: lines.reduce((sum, l) =>  sum.plus(l.debitAmount), new Decimal(0)).toNumber(),
        totalCredits: lines.reduce((sum, l) => sum.plus(l.creditAmount), new Decimal(0)).toNumber(),
        endingBalance: runningBalance.toNumber(),
        transactionCount: lines.length,
      },
    };

    return { success: true, data: report };
  } catch (error) {
    console.error('Error in generateGeneralLedger:', error);
    return { success: false, error: 'Failed to generate general ledger' };
  }
};
