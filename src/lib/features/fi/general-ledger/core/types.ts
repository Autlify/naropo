/**
 * GL Shared Types
 * Common type definitions used across GL module
 * 
 * @namespace Autlify.Lib.Features.FI.GL.Core.Types
 */

import type { 
  ChartOfAccount, 
  JournalEntry, 
  JournalEntryLine,
  FinancialPeriod,
  AccountBalance,
  Currency,
  GLConfiguration,
  PostingRule,
} from '@/generated/prisma/client'

// Re-export Prisma types for convenience
export type {
  ChartOfAccount,
  JournalEntry,
  JournalEntryLine,
  FinancialPeriod,
  AccountBalance,
  Currency,
  GLConfiguration,
  PostingRule,
}

/** Account with children for tree display */
export type AccountWithChildren = ChartOfAccount & {
  ChildAccounts: ChartOfAccount[]
  ParentAccount?: ChartOfAccount | null
}

/** Account for selector/dropdown */
export type AccountOption = Pick<ChartOfAccount, 'id' | 'code' | 'name' | 'accountType' | 'category'>

/** Journal entry with lines for form */
export type JournalEntryWithLines = JournalEntry & {
  JournalEntryLines: JournalEntryLine[]
}

/** Journal line input for forms */
export interface JournalLineInput {
  accountId: string
  debitAmount: number
  creditAmount: number
  description?: string
  currency?: string
  exchangeRate?: number
  dimension1?: string
  dimension2?: string
  dimension3?: string
  dimension4?: string
}

/** Period with balance summary */
export type PeriodWithSummary = FinancialPeriod & {
  totalDebits?: number
  totalCredits?: number
  journalCount?: number
}

/** Balance filter options */
export interface BalanceFilters {
  periodId: string
  accountIds?: string[]
  accountType?: string
  includeZeroBalance?: boolean
}

/** Pagination options */
export interface PaginationOptions {
  page?: number
  pageSize?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

/** Paginated result */
export interface PaginatedResult<T> {
  data: T[]
  totalCount: number
  pageCount: number
  page: number
  pageSize: number
}

/** Tax code definition */
export interface TaxCode {
  code: string
  name: string
  rate: number
  accountId: string
  type: 'INPUT' | 'OUTPUT' | 'WITHHOLDING'
  isDefault?: boolean
}

/** Tax settings in GL configuration */
export interface TaxSettings {
  enabled: boolean
  inputVATAccountId?: string
  outputVATAccountId?: string
  withholdingTaxAccountId?: string
  taxClearingAccountId?: string
  taxCodes: TaxCode[]
  taxPeriod: 'MONTHLY' | 'QUARTERLY' | 'ANNUAL'
}

/** Posting rule category */
export type PostingRuleCategory = 
  | 'FOREX'
  | 'ROUNDING' 
  | 'DISCREPANCY'
  | 'TAX'
  | 'CLEARING'
  | 'ALLOCATION'
  | 'CUSTOM'

/** Posting rule with expanded accounts */
export type PostingRuleWithAccounts = PostingRule & {
  DebitAccount?: AccountOption | null
  CreditAccount?: AccountOption | null
}

/** Forex posting side config */
export interface ForexSideConfig {
  gainAccountId: string
  lossAccountId: string
}

/** Tolerance threshold config */
export interface ToleranceConfig {
  minAmount?: number
  maxAmount?: number
  tolerancePercent?: number
  toleranceFixed?: number
}

/** Year-end closing options */
export interface YearEndOptions {
  fiscalYearId: string
  retainedEarningsAccountId: string
  generateClosingEntries: boolean
  generateOpeningBalances: boolean
  includeTaxClearing: boolean
}

/** Report filter options */
export interface ReportFilters {
  periodId?: string
  fromDate?: Date
  toDate?: Date
  accountIds?: string[]
  comparePeriodId?: string
  includeZeroBalance?: boolean
  format?: 'SCREEN' | 'PDF' | 'EXCEL' | 'CSV'
}

/** Trial balance line item */
export interface TrialBalanceItem {
  accountId: string
  accountCode: string
  accountName: string
  accountType: string
  openingDebit: number
  openingCredit: number
  periodDebit: number
  periodCredit: number
  closingDebit: number
  closingCredit: number
}

/** Financial statement section */
export interface FinancialSection {
  name: string
  accounts: TrialBalanceItem[]
  total: number
}

/** Setup wizard step */
export type SetupWizardStep = 
  | 'BUSINESS_TYPE'
  | 'CURRENCY'
  | 'TAX'
  | 'FISCAL_YEAR'
  | 'POSTING_RULES'
  | 'COMPLETE'

/** Setup wizard state */
export interface SetupWizardState {
  currentStep: SetupWizardStep
  businessType?: string
  baseCurrency?: string
  additionalCurrencies?: string[]
  taxEnabled?: boolean
  taxTemplate?: string
  fiscalYearStart?: Date
  useDefaultPostingRules?: boolean
  coaTemplateId?: string
}
