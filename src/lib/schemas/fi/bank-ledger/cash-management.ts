import { z } from 'zod';
import { currencyCodeSchema } from '@/lib/schemas/shared/payment';

/**
 * Cash Position Status Enum
 */
export const cashPositionStatusEnum = z.enum([
  'CURRENT',          // Up-to-date position
  'STALE',            // Data may be outdated
  'UPDATING',         // Currently updating
  'ERROR',            // Error fetching data
]);

export type CashPositionStatus = z.infer<typeof cashPositionStatusEnum>;

/**
 * Forecast Type Enum
 */
export const forecastTypeEnum = z.enum([
  'ACTUAL',           // Actual confirmed
  'COMMITTED',        // Committed (approved invoices/payments)
  'PLANNED',          // Planned/budgeted
  'PROJECTED',        // AI/ML projected
]);

export type ForecastType = z.infer<typeof forecastTypeEnum>;

/**
 * Cash Flow Category Enum
 */
export const cashFlowCategoryEnum = z.enum([
  // Inflows
  'CUSTOMER_RECEIPTS',
  'LOAN_PROCEEDS',
  'INVESTMENT_INCOME',
  'ASSET_SALES',
  'TAX_REFUNDS',
  'OTHER_INCOME',
  // Outflows
  'VENDOR_PAYMENTS',
  'PAYROLL',
  'TAX_PAYMENTS',
  'LOAN_REPAYMENTS',
  'CAPITAL_EXPENDITURE',
  'DIVIDENDS',
  'RENT_UTILITIES',
  'INTEREST_EXPENSE',
  'OTHER_EXPENSE',
  // Transfers
  'INTERNAL_TRANSFER',
  'FX_CONVERSION',
]);

export type CashFlowCategory = z.infer<typeof cashFlowCategoryEnum>;

/**
 * Cash Position Schema
 * Current cash position across all accounts
 */
export const cashPositionSchema = z.object({
  id: z.string().uuid(),
  agencyId: z.string().uuid(),
  subAccountId: z.string().uuid().optional(),

  // Position date
  positionDate: z.coerce.date(),
  status: cashPositionStatusEnum.default('CURRENT'),
  lastUpdatedAt: z.coerce.date(),

  // Total balances by type
  totalOperatingCash: z.number().default(0),
  totalReserves: z.number().default(0),
  totalRestricted: z.number().default(0),
  totalInvestments: z.number().default(0),
  grandTotal: z.number().default(0),

  // Base currency
  baseCurrencyCode: currencyCodeSchema,

  // By currency (for multi-currency)
  byCurrency: z.array(z.object({
    currencyCode: z.string().length(3),
    totalBalance: z.number(),
    availableBalance: z.number(),
    exchangeRate: z.number().positive(),
    totalInBase: z.number(),
    accountCount: z.number().int(),
  })).optional(),

  // Outstanding items
  pendingReceipts: z.number().default(0),
  pendingPayments: z.number().default(0),
  netPendingCashFlow: z.number().default(0),

  // Projected position
  projectedBalance1Day: z.number().optional(),
  projectedBalance7Days: z.number().optional(),
  projectedBalance30Days: z.number().optional(),

  // Liquidity metrics
  currentRatio: z.number().optional(),
  quickRatio: z.number().optional(),
  cashBurnRate: z.number().optional(), // Daily average
  runwayDays: z.number().int().optional(),

  // Credit lines
  totalCreditLineAvailable: z.number().default(0),
  totalCreditLineUsed: z.number().default(0),

  // Alerts
  alerts: z.array(z.object({
    type: z.enum(['LOW_BALANCE', 'OVERDRAFT_RISK', 'LARGE_OUTFLOW', 'FX_EXPOSURE', 'STALE_DATA']),
    severity: z.enum(['INFO', 'WARNING', 'CRITICAL']),
    message: z.string(),
    accountId: z.string().uuid().optional(),
  })).optional(),

  // Snapshots
  previousDayBalance: z.number().optional(),
  changeFromPreviousDay: z.number().optional(),
  changePercentage: z.number().optional(),

  // Metadata
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type CashPosition = z.infer<typeof cashPositionSchema>;

/**
 * Cash Forecast Entry Schema
 * Individual forecast line item
 */
export const cashForecastEntrySchema = z.object({
  id: z.string().uuid(),
  agencyId: z.string().uuid(),
  subAccountId: z.string().uuid().optional(),

  // Forecast grouping
  forecastId: z.string().uuid().optional(), // Link to forecast batch
  forecastDate: z.coerce.date(),
  category: cashFlowCategoryEnum,

  // Type and source
  forecastType: forecastTypeEnum.default('PLANNED'),
  source: z.string().max(50).optional(), // AR, AP, PAYROLL, etc.

  // Amount
  amount: z.number(), // Positive = inflow, negative = outflow
  currencyCode: currencyCodeSchema,
  amountBase: z.number().optional(),
  exchangeRate: z.number().positive().optional(),

  // Details
  description: z.string().max(255).optional(),
  counterpartyName: z.string().max(100).optional(),
  counterpartyId: z.string().uuid().optional(), // Customer/Vendor ID

  // Document reference
  documentType: z.string().max(50).optional(),
  documentId: z.string().uuid().optional(),
  documentNumber: z.string().max(50).optional(),

  // Probability
  probability: z.number().min(0).max(100).default(100), // % likelihood
  weightedAmount: z.number().optional(), // amount * probability

  // Recurrence
  isRecurring: z.boolean().default(false),
  recurrenceFrequency: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'ANNUALLY']).optional(),
  recurrenceEndDate: z.coerce.date().optional(),

  // Status
  isActual: z.boolean().default(false), // Converted to actual
  actualizedAt: z.coerce.date().optional(),
  actualAmount: z.number().optional(),
  variance: z.number().optional(),

  // Notification
  notifyOnDue: z.boolean().default(false),
  notifyDaysBefore: z.number().int().min(0).default(0),

  // Notes
  notes: z.string().max(500).optional(),

  // Audit
  createdAt: z.coerce.date().optional(),
  createdBy: z.string().uuid().optional(),
  updatedAt: z.coerce.date().optional(),
  updatedBy: z.string().uuid().optional(),
});

export type CashForecastEntry = z.infer<typeof cashForecastEntrySchema>;

/**
 * Cash Forecast Schema
 * Cash flow forecast for a period
 */
export const cashForecastSchema = z.object({
  id: z.string().uuid(),
  agencyId: z.string().uuid(),
  subAccountId: z.string().uuid().optional(),

  // Identification
  name: z.string().max(100),
  description: z.string().max(500).optional(),

  // Period
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  granularity: z.enum(['DAILY', 'WEEKLY', 'MONTHLY']).default('WEEKLY'),

  // Currency
  baseCurrencyCode: currencyCodeSchema,

  // Opening balance
  openingBalance: z.number(),
  openingBalanceDate: z.coerce.date(),

  // Totals
  totalInflows: z.number().default(0),
  totalOutflows: z.number().default(0),
  netCashFlow: z.number().default(0),
  closingBalance: z.number().default(0),
  minimumBalance: z.number().optional(),
  minimumBalanceDate: z.coerce.date().optional(),

  // By category
  inflowsByCategory: z.record(cashFlowCategoryEnum, z.number()).optional(),
  outflowsByCategory: z.record(cashFlowCategoryEnum, z.number()).optional(),

  // Status
  status: z.enum(['DRAFT', 'ACTIVE', 'ARCHIVED']).default('DRAFT'),
  isLocked: z.boolean().default(false),

  // Comparison
  previousForecastId: z.string().uuid().optional(),
  varianceFromPrevious: z.number().optional(),

  // AI/ML projections
  hasAiProjections: z.boolean().default(false),
  confidenceLevel: z.number().min(0).max(100).optional(),

  // Notes
  notes: z.string().max(1000).optional(),
  assumptions: z.array(z.string().max(255)).optional(),

  // Audit
  createdAt: z.coerce.date().optional(),
  createdBy: z.string().uuid().optional(),
  updatedAt: z.coerce.date().optional(),
  updatedBy: z.string().uuid().optional(),
  lockedAt: z.coerce.date().optional(),
  lockedBy: z.string().uuid().optional(),
});

export type CashForecast = z.infer<typeof cashForecastSchema>;

/**
 * Cash Pool Schema
 * Cash pooling/sweeping configuration
 */
export const cashPoolSchema = z.object({
  id: z.string().uuid(),
  agencyId: z.string().uuid(),

  // Pool identification
  poolName: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  poolType: z.enum([
    'ZERO_BALANCE',     // ZBA - sweep to zero
    'TARGET_BALANCE',   // Sweep to target balance
    'THRESHOLD',        // Sweep above threshold
    'NOTIONAL',         // Notional pooling (no physical movement)
  ]),

  // Master account
  masterAccountId: z.string().uuid(),
  masterAccountCode: z.string().max(20).optional(),

  // Participating accounts
  participantAccountIds: z.array(z.string().uuid()).min(1),

  // Sweep rules
  sweepDirection: z.enum(['TO_MASTER', 'FROM_MASTER', 'BIDIRECTIONAL']).default('BIDIRECTIONAL'),
  targetBalance: z.number().optional(), // For TARGET_BALANCE type
  thresholdAmount: z.number().optional(), // For THRESHOLD type
  minimumSweepAmount: z.number().min(0).default(0),
  maximumSweepAmount: z.number().optional(),

  // Timing
  sweepFrequency: z.enum(['REAL_TIME', 'EOD', 'WEEKLY', 'MONTHLY']).default('EOD'),
  sweepTime: z.string().max(10).optional(), // HH:MM format
  excludeWeekends: z.boolean().default(true),
  excludeHolidays: z.boolean().default(true),

  // Interest
  interestRateBasis: z.enum(['FIXED', 'VARIABLE', 'TIERED']).optional(),
  interestRate: z.number().min(0).max(100).optional(),

  // Status
  isActive: z.boolean().default(true),
  lastSweepDate: z.coerce.date().optional(),
  lastSweepAmount: z.number().optional(),

  // Notifications
  notifyOnSweep: z.boolean().default(false),
  notifyRecipients: z.array(z.string().email()).optional(),

  // Audit
  createdAt: z.coerce.date().optional(),
  createdBy: z.string().uuid().optional(),
  updatedAt: z.coerce.date().optional(),
  updatedBy: z.string().uuid().optional(),
});

export type CashPool = z.infer<typeof cashPoolSchema>;

/**
 * Internal Transfer Schema
 * Transfer between bank accounts
 */
export const internalTransferSchema = z.object({
  id: z.string().uuid(),
  agencyId: z.string().uuid(),
  subAccountId: z.string().uuid().optional(),

  // Accounts
  fromAccountId: z.string().uuid(),
  toAccountId: z.string().uuid(),

  // Transfer details
  transferDate: z.coerce.date(),
  valueDate: z.coerce.date().optional(),
  amount: z.number().positive(),
  currencyCode: currencyCodeSchema,

  // FX (if different currencies)
  toCurrencyCode: currencyCodeSchema.optional(),
  exchangeRate: z.number().positive().optional(),
  toAmount: z.number().positive().optional(),

  // Reference
  reference: z.string().max(50),
  description: z.string().max(255).optional(),

  // Purpose
  purpose: z.enum(['OPERATIONAL', 'INVESTMENT', 'LOAN_REPAYMENT', 'FX_CONVERSION', 'CASH_POOLING', 'OTHER']).default('OPERATIONAL'),

  // Status
  status: z.enum(['PENDING', 'APPROVED', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED']).default('PENDING'),

  // Approval
  requiresApproval: z.boolean().default(false),
  approvedAt: z.coerce.date().optional(),
  approvedBy: z.string().uuid().optional(),

  // Completion
  completedAt: z.coerce.date().optional(),
  fromTransactionId: z.string().uuid().optional(),
  toTransactionId: z.string().uuid().optional(),

  // GL posting
  journalEntryId: z.string().uuid().optional(),

  // Notes
  notes: z.string().max(500).optional(),

  // Audit
  createdAt: z.coerce.date().optional(),
  createdBy: z.string().uuid().optional(),
  updatedAt: z.coerce.date().optional(),
  updatedBy: z.string().uuid().optional(),
});

export type InternalTransfer = z.infer<typeof internalTransferSchema>;

/**
 * Create Cash Forecast Schema
 */
export const createCashForecastSchema = cashForecastSchema.omit({
  id: true,
  totalInflows: true,
  totalOutflows: true,
  netCashFlow: true,
  closingBalance: true,
  minimumBalance: true,
  minimumBalanceDate: true,
  inflowsByCategory: true,
  outflowsByCategory: true,
  isLocked: true,
  varianceFromPrevious: true,
  createdAt: true,
  createdBy: true,
  updatedAt: true,
  updatedBy: true,
  lockedAt: true,
  lockedBy: true,
});

export type CreateCashForecast = z.infer<typeof createCashForecastSchema>;

/**
 * Create Cash Forecast Entry Schema
 */
export const createCashForecastEntrySchema = cashForecastEntrySchema.omit({
  id: true,
  weightedAmount: true,
  isActual: true,
  actualizedAt: true,
  actualAmount: true,
  variance: true,
  createdAt: true,
  createdBy: true,
  updatedAt: true,
  updatedBy: true,
});

export type CreateCashForecastEntry = z.infer<typeof createCashForecastEntrySchema>;

/**
 * Create Internal Transfer Schema
 */
export const createInternalTransferSchema = internalTransferSchema.omit({
  id: true,
  status: true,
  approvedAt: true,
  approvedBy: true,
  completedAt: true,
  fromTransactionId: true,
  toTransactionId: true,
  journalEntryId: true,
  createdAt: true,
  createdBy: true,
  updatedAt: true,
  updatedBy: true,
});

export type CreateInternalTransfer = z.infer<typeof createInternalTransferSchema>;

/**
 * Approve Internal Transfer Schema
 */
export const approveInternalTransferSchema = z.object({
  id: z.string().uuid(),
  notes: z.string().max(500).optional(),
});

export type ApproveInternalTransfer = z.infer<typeof approveInternalTransferSchema>;

/**
 * Execute Transfer Schema
 */
export const executeTransferSchema = z.object({
  id: z.string().uuid(),
  executionDate: z.coerce.date().optional(),
  notes: z.string().max(500).optional(),
});

export type ExecuteTransfer = z.infer<typeof executeTransferSchema>;

/**
 * Create Cash Pool Schema
 */
export const createCashPoolSchema = cashPoolSchema.omit({
  id: true,
  lastSweepDate: true,
  lastSweepAmount: true,
  createdAt: true,
  createdBy: true,
  updatedAt: true,
  updatedBy: true,
});

export type CreateCashPool = z.infer<typeof createCashPoolSchema>;

/**
 * Run Cash Sweep Schema
 */
export const runCashSweepSchema = z.object({
  poolId: z.string().uuid(),
  sweepDate: z.coerce.date().optional(),
  preview: z.boolean().default(true), // Preview before execution
});

export type RunCashSweep = z.infer<typeof runCashSweepSchema>;

/**
 * Cash Sweep Result Schema
 */
export const cashSweepResultSchema = z.object({
  poolId: z.string().uuid(),
  sweepDate: z.coerce.date(),
  movements: z.array(z.object({
    fromAccountId: z.string().uuid(),
    toAccountId: z.string().uuid(),
    amount: z.number(),
    balanceAfter: z.number(),
  })),
  totalSwept: z.number(),
  transfersCreated: z.number().int(),
  errors: z.array(z.string()).optional(),
});

export type CashSweepResult = z.infer<typeof cashSweepResultSchema>;

/**
 * Refresh Cash Position Schema
 */
export const refreshCashPositionSchema = z.object({
  agencyId: z.string().uuid(),
  subAccountId: z.string().uuid().optional(),
  bankAccountIds: z.array(z.string().uuid()).optional(), // Empty = all
  forceRefresh: z.boolean().default(false),
});

export type RefreshCashPosition = z.infer<typeof refreshCashPositionSchema>;

/**
 * Cash Flow Report Filter Schema
 */
export const cashFlowReportFilterSchema = z.object({
  agencyId: z.string().uuid(),
  subAccountId: z.string().uuid().optional(),
  bankAccountIds: z.array(z.string().uuid()).optional(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  granularity: z.enum(['DAILY', 'WEEKLY', 'MONTHLY']).default('MONTHLY'),
  categories: z.array(cashFlowCategoryEnum).optional(),
  includeActuals: z.boolean().default(true),
  includeForecast: z.boolean().default(false),
  currencyCode: currencyCodeSchema.optional(),
});

export type CashFlowReportFilter = z.infer<typeof cashFlowReportFilterSchema>;

/**
 * Cash Flow Report Schema
 */
export const cashFlowReportSchema = z.object({
  filter: cashFlowReportFilterSchema,
  periods: z.array(z.object({
    periodStart: z.coerce.date(),
    periodEnd: z.coerce.date(),
    openingBalance: z.number(),
    closingBalance: z.number(),
    totalInflows: z.number(),
    totalOutflows: z.number(),
    netCashFlow: z.number(),
    categories: z.record(cashFlowCategoryEnum, z.object({
      actual: z.number(),
      forecast: z.number().optional(),
      variance: z.number().optional(),
    })),
  })),
  summary: z.object({
    totalInflows: z.number(),
    totalOutflows: z.number(),
    netCashFlow: z.number(),
    openingBalance: z.number(),
    closingBalance: z.number(),
    averageBalance: z.number(),
    minimumBalance: z.number(),
    maximumBalance: z.number(),
  }),
});

export type CashFlowReport = z.infer<typeof cashFlowReportSchema>;

/**
 * Cash Forecast Filter Schema
 */
export const cashForecastFilterSchema = z.object({
  agencyId: z.string().uuid(),
  subAccountId: z.string().uuid().optional(),
  status: z.enum(['DRAFT', 'ACTIVE', 'ARCHIVED']).optional(),
  startDateFrom: z.coerce.date().optional(),
  startDateTo: z.coerce.date().optional(),
  search: z.string().max(100).optional(),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
});

export type CashForecastFilter = z.infer<typeof cashForecastFilterSchema>;
