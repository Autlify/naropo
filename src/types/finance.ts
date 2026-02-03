/**
 * 
 * @name FinanceTypes
 * @description Contain all types related to finance module.
 * @namespace Autlify.Types.Finance
 * @module TYPES
 * @author Autlify Team
 * @created 2026-Feb-15
 * @see prisma/schema.prisma - ChartOfAccount, JournalEntry, FiscalPeriod, etc.
 * 
 */

// ============================================================================
// REVENUE RECOGNITION TYPES (ASC 606 / IFRS 15)
// ============================================================================

/**
 * Revenue Recognition Pattern Type
 * @description Determines how and when revenue is recognized per accounting standards
 */
export type RevenueRecognitionType =
  | 'point_in_time'        // Recognize immediately upon delivery (goods, setup fees)
  | 'over_time_ratable'    // Recognize evenly over service period (subscriptions)
  | 'over_time_usage'      // Recognize based on usage/consumption (metered)
  | 'milestone'            // Recognize upon completion of milestones
  | 'percentage_complete'  // Recognize based on % of work completed

/**
 * Recognition Frequency Type
 * @description How often deferred revenue is recognized
 */
export type RecognitionFrequencyType = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly'

/**
 * Deferred Revenue Configuration
 * @description How to handle revenue deferral for multi-period pricing
 */
export interface DeferredRevenueConfig {
  /** Whether to create deferred revenue entries */
  createDeferredEntry: boolean
  /** GL Account for deferred revenue (liability) */
  deferredRevenueAccount?: string
  /** GL Account for recognized revenue (income) */
  revenueAccount?: string
  /** Recognition schedule: daily, weekly, monthly, quarterly, yearly */
  recognitionFrequency?: RecognitionFrequencyType
  /** Number of periods to defer (for prepaid annual, etc.) */
  deferralPeriods?: number
}

/**
 * Accounting Configuration
 * @description GL account mappings for journal entry generation
 */
export interface AccountingConfig {
  /** Revenue account code */
  revenueAccountCode?: string
  /** Deferred revenue account code */
  deferredRevenueAccountCode?: string
  /** Cost of goods sold account (for goods) */
  cogsAccountCode?: string
  /** Expense account (for internal use) */
  expenseAccountCode?: string
  /** Department/Cost center */
  costCenter?: string
  /** Profit center */
  profitCenter?: string
}

// ============================================================================
// REVENUE RECOGNITION SCHEDULE TYPES
// ============================================================================

/**
 * Revenue Recognition Entry
 * @description Single journal entry in a recognition schedule
 */
export interface RevenueRecognitionEntry {
  date: Date
  debit: {
    account: string
    amount: number
    description: string
  }
  credit: {
    account: string
    amount: number
    description: string
  }
}

/**
 * Revenue Recognition Schedule
 * @description Full schedule of journal entries for revenue recognition
 */
export interface RevenueRecognitionSchedule {
  purchaseDate: Date
  totalAmount: number
  deferredAmount: number
  recognizedAmount: number
  entries: RevenueRecognitionEntry[]
}

// ============================================================================
// GL ACCOUNT TYPES
// ============================================================================

type GenLedgerAccount = {
    id: string;
    code: string;
    name: string;
    category: AccountCategory;
    accountType: AccountType;
    level: number;
    isActive: boolean;
    isSystemAccount: boolean;
    parentAccount?: {
        id: string;
        code: string;
        name: string;
    } | null;
};

type FiscalPeriodType =
    | 'MONTH'
    | 'QUARTER'
    | 'HALF_YEAR'
    | 'YEAR'
    | 'CUSTOM';

type FiscalPeriod = {
    id: string;
    name: string;
    startDate: Date;
    endDate: Date;
    status: string;
}


type FiscalPeriodFormValues = {
    /** The name of the fiscal period Eg., Q1 2024 */
    name: string
    /**
     * @requires Optional
     * @description A short name or code for the fiscal period
     * @example Q1
     */
    shortName?: string
    periodType: FiscalPeriodType
    fiscalYear: number
    fiscalPeriod: number
    startDate: Date
    endDate: Date
    isYearEnd: boolean
    notes?: string
}


interface FiscalPeriodFormProps {
    mode: 'create' | 'edit'
    period?: FiscalPeriodFormValues & { id: string }
    onSuccess?: () => void
    onCancel?: () => void
}

interface FiscalPeriodFormTriggerProps {
    mode: 'create' | 'edit'
    period?: FiscalPeriodFormValues & { id: string }
    trigger?: React.ReactNode
    onSuccess?: () => void
}

type ConsolidationType =
    | 'FULL'
    | 'PROPORTIONAL'
    | 'EQUITY';

type ConsolidationFormValues = {
    name: string;
    description: string;
    periodId: string;
    consolidationMethod: ConsolidationType;
};

type ConsolidationSnapshot = {
    id: string;
    snapshotNumber: string;
    name: string;
    description: string | null;
    status: 'DRAFT' | 'IN_PROGRESS' | 'COMPLETED' | 'APPROVED';
    consolidationMethod: ConsolidationType;
    createdAt: Date;
    Period: { id: string; name: string };
    _count: {
        WorksheetLines: number;
        Adjustments: number;
        Eliminations: number;
    };
};


type JournalEntryStatus = 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';
type JournalEntryType = 'NORMAL' | 'ADJUSTMENT' | 'REVERSAL';
type JournalEntry = {
    id: string;
    entryNumber: number;
    entryDate: Date;
    description: string;
    status: JournalEntryStatus;
    entryType: JournalEntryType;
    Lines: Array<{
        debitAmount: number;
        creditAmount: number;
    }>;
    Period: {
        name: string;
    };
};
type JournalEntryLine = {
    id: string;
    Account: { code: string; name: string };
    lineNumber: number;
    accountId: string;
    description: string | null;
    debitAmount: number;
    creditAmount: number;
    dimension1: string | null;
    dimension2: string | null;
};
type JournalEntryFormValues = {
    periodId: string;
    entryDate: string;
    entryType: JournalEntryType;
    description: string;
    notes?: string;
    currencyCode?: string;
    exchangeRate?: number;
    lines: JournalEntryLine[];
};
interface JournalEntryFormProps {
    agencyId: string
    accounts: Partial<GenLedgerAccount[]>
    periods: FiscalPeriod[]
}

type PendingEntry = {
    id: string;
    entryNumber: string;
    entryDate: Date;
    description: string;
    entryType: JournalEntryType;
    submittedAt: Date | null;
    Lines: JournalEntryLine[];
    Period: { name: string };
    submitter: { name: string | null; email: string } | null;
};

type AmountType =
    | 'FULL'
    | 'PERCENTAGE'
    | 'FIXED'

type NormalBalance =
    | 'DEBIT'
    | 'CREDIT'

type AccountType =
    | 'ASSET'
    | 'LIABILITY'
    | 'EQUITY'
    | 'REVENUE'
    | 'EXPENSE'

type AccountCategory =
    | 'CURRENT_ASSET'
    | 'FIXED_ASSET'
    | 'OTHER_ASSET'
    | 'CURRENT_LIABILITY'
    | 'LONG_TERM_LIABILITY'
    | 'CAPITAL'
    | 'RETAINED_EARNINGS_CAT'
    | 'OPERATING_REVENUE'
    | 'OTHER_REVENUE'
    | 'COST_OF_GOODS_SOLD'
    | 'OPERATING_EXPENSE'
    | 'OTHER_EXPENSE'

type SubledgerType =
    | 'NONE'
    | 'ACCOUNTS_RECEIVABLE'
    | 'ACCOUNTS_PAYABLE'
    | 'INVENTORY'
    | 'FIXED_ASSETS'
    | 'PAYROLL'
    | 'BANK'

type PostingRuleSourceModule =
    | 'MANUAL'
    | 'INVOICE'
    | 'PAYMENT'
    | 'EXPENSE'
    | 'PAYROLL'
    | 'BANK'
    | 'ADJUSTMENT'
    | 'YEAR_END'
    | 'ASSET'
    | 'INVENTORY'
    | 'CONSOLIDATION'
    | 'INTERCOMPANY'
    | 'REVERSAL'
    | 'OPENING_BALANCE'



type AccountFormValues = {
    code: string
    name: string
    description?: string
    parentAccountId?: string | null
    accountType: AccountType
    category?: AccountCategory
    subcategory?: string
    isControlAccount: boolean
    subledgerType: SubledgerType
    controlAccountId?: string | null
    allowManualPosting: boolean
    requireApproval: boolean
    isPostingAccount: boolean
    isConsolidationEnabled: boolean
    consolidationAccountCode?: string
    currencyCode?: string
    isMultiCurrency: boolean
    normalBalance: NormalBalance
    sortOrder: number
}
interface AccountFormProps {
    mode: 'create' | 'edit'
    account?: AccountFormValues & { id: string }
    parentAccounts?: Array<{ id: string; code: string; name: string }>
    onSuccess?: () => void
    onCancel?: () => void
    agencyId?: string
}
interface AccountFormTriggerProps {
    mode: 'create' | 'edit'
    account?: AccountFormValues & { id: string }
    parentAccounts?: Array<{ id: string; code: string; name: string }>
    agencyId?: string
    trigger?: React.ReactNode
    onSuccess?: () => void
}

type OpenItem = {
    id: string;
    sourceReference: string | null;
    reference: string | null;
    assignment: string | null;
    text: string | null;
    accountId: string;
    Account?: { id: string; code: string; name: string };
    documentNumber: string;
    documentDate: Date;
    dueDate: Date | null;
    sourceModule: string | null;
    localAmount: number;
    localRemainingAmount: number;
    localCurrencyCode: string;
    documentAmount: number;
    documentRemainingAmount: number;
    documentCurrencyCode: string;
    status: string;
    partnerType: string | null;
    customerId: string | null;
    vendorId: string | null;
    Customer?: { id: string; name: string } | null;
    Vendor?: { id: string; name: string } | null;
    clearingDate: Date | null;
    clearingReference: string | null;
    createdAt: Date;
};

type OpenItemsTableProps = {
    items: OpenItem[];
    baseUrl: string;
    selectable?: boolean;
    selectedIds?: Set<string>;
    onSelectionChange?: (ids: Set<string>) => void;
    showAccount?: boolean;
    showPartner?: boolean;
    showStatus?: boolean;
    emptyMessage?: string;
};

type PostingRule = {
    id: string;
    code: string;
    name: string;
    description: string | null;
    category: PostingRuleCategory;
    sourceModule: PostingRuleSourceModule;
    debitAccountId: string
    creditAccountId: string
    amountType: AmountType;
    percentage: number | null;
    fixedAmount: number | null;
    isActive: boolean;
    priority: number;
    autoPost: boolean;
    DebitAccount?: { id: string; code: string; name: string }
    CreditAccount?: { id: string; code: string; name: string }
};

type PostingRuleCategory =
    | 'CUSTOM'
    | 'FOREX'
    | 'ROUNDING'
    | 'DISCREPANCY'
    | 'TAX'
    | 'CLEARING'
    | 'ALLOCATION';

type ReportExportFormat = 'csv' | 'xlsx' | 'pdf'

type PostingRuleFormValues = {
    code: string;
    name: string;
    description: string;
    category: PostingRuleCategory;
    sourceModule: PostingRuleSourceModule;
    debitAccountId: string;
    creditAccountId: string;
    amountType: AmountType;
    percentage: number | undefined;
    fixedAmount: number | undefined;
    priority: number;
    isActive: boolean;
    autoPost: boolean;
};
interface PostingRulesTableProps {
    rules: PostingRule[]
    accounts: Partial<GenLedgerAccount[]>
    canEdit: boolean
    agencyId: string
}

interface ClearingFormProps {
    selectedItems: OpenItem[]
    currency: string
    onClear: (clearingDate: Date, reference: string, notes: string) => void
    onCancel: () => void
    isPending: boolean
}

interface ReconciliationPanelProps {
    accountId: string
    accountCode: string
    accountName: string
    openItems: OpenItem[]
    baseUrl: string
    currency?: string
    onReconciliationComplete?: () => void
}

interface ReconciliationTriggerProps {
    accountId: string
    accountCode: string
    accountName: string
    trigger?: React.ReactNode
    onComplete?: () => void
}

interface ReportExportButtonProps {
    /** API endpoint for export */
    exportEndpoint: string
    /** Report name for filename */
    reportName: string
    /** Additional query params */
    params?: Record<string, string | undefined>
    /** Include print button */
    showPrint?: boolean
    /** Disabled state */
    disabled?: boolean
}

interface ReportHeaderProps {
    title: string
    subtitle?: string
    exportEndpoint: string
    reportName: string
    params?: Record<string, string | undefined>
}

interface ReportPrintHeaderProps {
    title: string
    subtitle?: string
    generatedAt?: string | Date
}

export type {
    GenLedgerAccount,
    AccountType,
    AccountCategory,
    AccountFormValues,
    AccountFormProps,
    AccountFormTriggerProps,

    ConsolidationSnapshot,
    ConsolidationFormValues,

    ReconciliationPanelProps,
    ReconciliationTriggerProps,

    OpenItem,
    OpenItemsTableProps,
    PostingRule,
    PostingRuleCategory,
    PostingRuleFormValues,
    PostingRulesTableProps,
    ClearingFormProps,

    FiscalPeriod,
    FiscalPeriodType,
    FiscalPeriodFormValues,
    FiscalPeriodFormProps,
    FiscalPeriodFormTriggerProps,

    JournalEntry,
    JournalEntryLine,
    JournalEntryType,
    JournalEntryStatus,
    JournalEntryFormValues,
    JournalEntryFormProps,

    ReportExportButtonProps,
    ReportHeaderProps,
    ReportExportFormat,
    ReportPrintHeaderProps,

    PendingEntry,
    NormalBalance,
    SubledgerType,
    PostingRuleSourceModule,
    AmountType,
};