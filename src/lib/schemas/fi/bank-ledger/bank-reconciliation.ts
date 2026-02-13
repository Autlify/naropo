import { z } from 'zod';
import { currencyCodeSchema } from '@/lib/schemas/shared/payment';

/**
 * Reconciliation Status Enum
 */
export const reconciliationStatusEnum = z.enum([
  'DRAFT',            // In progress
  'IN_REVIEW',        // Pending review
  'APPROVED',         // Approved
  'COMPLETED',        // Completed and posted
  'REJECTED',         // Rejected, needs correction
  'VOID',             // Voided
]);

export type ReconciliationStatus = z.infer<typeof reconciliationStatusEnum>;

/**
 * Reconciliation Type Enum
 */
export const reconciliationTypeEnum = z.enum([
  'FULL',             // Full period reconciliation
  'PARTIAL',          // Partial/interim reconciliation
  'QUICK',            // Quick balance check
  'ADJUSTMENT',       // Adjustment to previous reconciliation
]);

export type ReconciliationType = z.infer<typeof reconciliationTypeEnum>;

/**
 * Matching Rule Type Enum
 */
export const matchingRuleTypeEnum = z.enum([
  'EXACT_AMOUNT',     // Exact amount match
  'TOLERANCE',        // Match within tolerance
  'REFERENCE',        // Match by reference number
  'DATE_AMOUNT',      // Match by date and amount
  'COUNTERPARTY',     // Match by counterparty name
  'COMBINATION',      // Multiple criteria
  'AI_SUGGESTED',     // AI/ML suggested match
  'MANUAL',           // Manual match
]);

export type MatchingRuleType = z.infer<typeof matchingRuleTypeEnum>;

/**
 * Reconciliation Item Status Enum
 */
export const reconciliationItemStatusEnum = z.enum([
  'PENDING',          // Not yet matched
  'MATCHED',          // Matched
  'PARTIALLY_MATCHED', // Partial match
  'EXCLUDED',         // Excluded from reconciliation
  'ADJUSTED',         // Adjusted
  'DISPUTED',         // Under dispute
]);

export type ReconciliationItemStatus = z.infer<typeof reconciliationItemStatusEnum>;

/**
 * Bank Reconciliation Schema
 * Main reconciliation record
 */
export const bankReconciliationSchema = z.object({
  id: z.string().uuid(),
  agencyId: z.string().uuid(),
  subAccountId: z.string().uuid().optional(),

  // Account reference
  bankAccountId: z.string().uuid(),
  bankAccountCode: z.string().max(20).optional(),
  bankAccountName: z.string().max(100).optional(),

  // Identification
  reconciliationNumber: z.string().max(50),
  description: z.string().max(255).optional(),
  reconciliationType: reconciliationTypeEnum.default('FULL'),

  // Period
  periodStart: z.coerce.date(),
  periodEnd: z.coerce.date(),
  reconciliationDate: z.coerce.date(),

  // Statement reference
  statementId: z.string().uuid().optional(),
  statementNumber: z.string().max(50).optional(),

  // Currency
  currencyCode: currencyCodeSchema,

  // Balances
  statementOpeningBalance: z.number(),
  statementClosingBalance: z.number(),
  bookOpeningBalance: z.number(),
  bookClosingBalance: z.number(),

  // Reconciled balances
  reconciledBankBalance: z.number().optional(),
  reconciledBookBalance: z.number().optional(),
  balanceDifference: z.number().default(0),
  isBalanced: z.boolean().default(false),

  // Outstanding items
  outstandingDeposits: z.number().default(0), // Deposits in transit
  outstandingPayments: z.number().default(0), // Outstanding checks/payments
  outstandingDepositCount: z.number().int().min(0).default(0),
  outstandingPaymentCount: z.number().int().min(0).default(0),

  // Adjustments
  totalAdjustments: z.number().default(0),
  adjustmentCount: z.number().int().min(0).default(0),

  // Matching stats
  totalMatchedItems: z.number().int().min(0).default(0),
  totalUnmatchedItems: z.number().int().min(0).default(0),
  totalExcludedItems: z.number().int().min(0).default(0),
  autoMatchedCount: z.number().int().min(0).default(0),
  manualMatchedCount: z.number().int().min(0).default(0),

  // Status
  status: reconciliationStatusEnum.default('DRAFT'),

  // GL posting
  journalEntryId: z.string().uuid().optional(),
  adjustedEntriesPosted: z.boolean().default(false),

  // Approval workflow
  submittedAt: z.coerce.date().optional(),
  submittedBy: z.string().uuid().optional(),
  approvedAt: z.coerce.date().optional(),
  approvedBy: z.string().uuid().optional(),
  rejectedAt: z.coerce.date().optional(),
  rejectedBy: z.string().uuid().optional(),
  rejectionReason: z.string().max(500).optional(),

  // Completion
  completedAt: z.coerce.date().optional(),
  completedBy: z.string().uuid().optional(),

  // Settings used
  toleranceAmount: z.number().min(0).default(0.01),
  tolerancePercentage: z.number().min(0).max(100).optional(),
  matchingRulesUsed: z.array(matchingRuleTypeEnum).optional(),

  // Notes
  notes: z.string().max(2000).optional(),
  internalNotes: z.string().max(1000).optional(),

  // Attachments
  attachmentIds: z.array(z.string().uuid()).optional(),

  // Audit
  createdAt: z.coerce.date().optional(),
  createdBy: z.string().uuid().optional(),
  updatedAt: z.coerce.date().optional(),
  updatedBy: z.string().uuid().optional(),
  voidedAt: z.coerce.date().optional(),
  voidedBy: z.string().uuid().optional(),
  voidReason: z.string().max(500).optional(),
}).refine(
  data => data.periodEnd >= data.periodStart,
  { message: 'Period end must be on or after period start', path: ['periodEnd'] }
);

export type BankReconciliation = z.infer<typeof bankReconciliationSchema>;

/**
 * Reconciliation Item Schema
 * Individual items in a reconciliation
 */
export const reconciliationItemSchema = z.object({
  id: z.string().uuid(),
  reconciliationId: z.string().uuid(),

  // Source
  sourceType: z.enum(['BANK', 'BOOK']), // From bank statement or book
  transactionId: z.string().uuid().optional(), // Bank transaction
  journalLineId: z.string().uuid().optional(), // GL journal line

  // Transaction details
  transactionDate: z.coerce.date(),
  valueDate: z.coerce.date().optional(),
  description: z.string().max(500),
  reference: z.string().max(100).optional(),
  amount: z.number(),
  currencyCode: currencyCodeSchema,

  // Matching
  status: reconciliationItemStatusEnum.default('PENDING'),
  matchedToItemId: z.string().uuid().optional(), // Matched item
  matchedAmount: z.number().optional(), // For partial matches
  matchingRule: matchingRuleTypeEnum.optional(),
  matchConfidence: z.number().min(0).max(100).optional(),

  // Exclusion
  isExcluded: z.boolean().default(false),
  excludedReason: z.string().max(255).optional(),

  // Adjustment
  isAdjustment: z.boolean().default(false),
  adjustmentReason: z.string().max(255).optional(),
  adjustmentAccountId: z.string().uuid().optional(),

  // Notes
  notes: z.string().max(500).optional(),

  // Audit
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  matchedAt: z.coerce.date().optional(),
  matchedBy: z.string().uuid().optional(),
});

export type ReconciliationItem = z.infer<typeof reconciliationItemSchema>;

/**
 * Matching Rule Schema
 * Rules for automatic matching
 */
export const matchingRuleSchema = z.object({
  id: z.string().uuid(),
  agencyId: z.string().uuid(),
  subAccountId: z.string().uuid().optional(),

  // Identification
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  priority: z.number().int().min(1).default(100),

  // Scope
  bankAccountIds: z.array(z.string().uuid()).optional(), // Empty = all accounts
  ruleType: matchingRuleTypeEnum,
  isActive: z.boolean().default(true),

  // Criteria
  criteria: z.object({
    // Amount matching
    amountMatch: z.enum(['EXACT', 'TOLERANCE_AMOUNT', 'TOLERANCE_PERCENT']).optional(),
    toleranceAmount: z.number().min(0).optional(),
    tolerancePercent: z.number().min(0).max(100).optional(),

    // Date matching
    dateMatch: z.boolean().default(false),
    dateTolerance: z.number().int().min(0).max(30).default(0), // Days

    // Reference matching
    referenceMatch: z.boolean().default(false),
    referencePattern: z.string().max(200).optional(), // Regex pattern

    // Counterparty matching
    counterpartyMatch: z.boolean().default(false),
    counterpartyPattern: z.string().max(200).optional(),

    // Description matching
    descriptionMatch: z.boolean().default(false),
    descriptionPattern: z.string().max(200).optional(),
    descriptionKeywords: z.array(z.string().max(50)).optional(),
  }),

  // Actions
  autoMatch: z.boolean().default(false), // Auto-match without review
  requiresConfirmation: z.boolean().default(true),

  // Auto-categorization
  defaultCategory: z.string().max(50).optional(),
  defaultGlAccountId: z.string().uuid().optional(),
  defaultCostCenterId: z.string().uuid().optional(),

  // Statistics
  matchCount: z.number().int().min(0).default(0),
  lastMatchedAt: z.coerce.date().optional(),
  successRate: z.number().min(0).max(100).optional(),

  // Audit
  createdAt: z.coerce.date().optional(),
  createdBy: z.string().uuid().optional(),
  updatedAt: z.coerce.date().optional(),
  updatedBy: z.string().uuid().optional(),
});

export type MatchingRule = z.infer<typeof matchingRuleSchema>;

/**
 * Bank Reconciliation Base Schema (without refinement for creating/updating)
 */
const bankReconciliationBaseSchema = z.object({
  agencyId: z.string().uuid(),
  subAccountId: z.string().uuid().optional(),
  bankAccountId: z.string().uuid(),
  bankAccountCode: z.string().max(20).optional(),
  bankAccountName: z.string().max(100).optional(),
  reconciliationNumber: z.string().max(50),
  description: z.string().max(255).optional(),
  reconciliationType: reconciliationTypeEnum.default('FULL'),
  periodStart: z.coerce.date(),
  periodEnd: z.coerce.date(),
  reconciliationDate: z.coerce.date(),
  statementId: z.string().uuid().optional(),
  statementNumber: z.string().max(50).optional(),
  currencyCode: currencyCodeSchema,
  statementOpeningBalance: z.number(),
  statementClosingBalance: z.number(),
  bookOpeningBalance: z.number(),
  bookClosingBalance: z.number(),
  toleranceAmount: z.number().min(0).default(0.01),
  tolerancePercentage: z.number().min(0).max(100).optional(),
  matchingRulesUsed: z.array(matchingRuleTypeEnum).optional(),
  notes: z.string().max(2000).optional(),
  internalNotes: z.string().max(1000).optional(),
  attachmentIds: z.array(z.string().uuid()).optional(),
});

/**
 * Create Bank Reconciliation Schema
 */
export const createBankReconciliationSchema = bankReconciliationBaseSchema.refine(
  data => data.periodEnd >= data.periodStart,
  { message: 'Period end must be on or after period start', path: ['periodEnd'] }
);

export type CreateBankReconciliation = z.infer<typeof createBankReconciliationSchema>;

/**
 * Update Bank Reconciliation Schema
 * Note: Uses base schema without refinement to allow .partial()
 */
export const updateBankReconciliationSchema = bankReconciliationBaseSchema.partial().extend({
  id: z.string().uuid(),
});

export type UpdateBankReconciliation = z.infer<typeof updateBankReconciliationSchema>;

/**
 * Start Reconciliation Schema
 */
export const startReconciliationSchema = z.object({
  bankAccountId: z.string().uuid(),
  periodStart: z.coerce.date(),
  periodEnd: z.coerce.date(),
  statementClosingBalance: z.number(),
  statementId: z.string().uuid().optional(),
  autoMatch: z.boolean().default(true),
  toleranceAmount: z.number().min(0).default(0.01),
  description: z.string().max(255).optional(),
});

export type StartReconciliation = z.infer<typeof startReconciliationSchema>;

/**
 * Match Items Schema
 * Match bank and book items
 */
export const matchItemsSchema = z.object({
  reconciliationId: z.string().uuid(),
  bankItemId: z.string().uuid(),
  bookItemId: z.string().uuid(),
  matchingRule: matchingRuleTypeEnum.default('MANUAL'),
  notes: z.string().max(500).optional(),
});

export type MatchItems = z.infer<typeof matchItemsSchema>;

/**
 * Bulk Match Items Schema
 */
export const bulkMatchItemsSchema = z.object({
  reconciliationId: z.string().uuid(),
  matches: z.array(z.object({
    bankItemId: z.string().uuid(),
    bookItemId: z.string().uuid(),
    notes: z.string().max(500).optional(),
  })).min(1).max(100),
});

export type BulkMatchItems = z.infer<typeof bulkMatchItemsSchema>;

/**
 * Unmatch Items Schema
 */
export const unmatchItemsSchema = z.object({
  reconciliationId: z.string().uuid(),
  itemIds: z.array(z.string().uuid()).min(1).max(100),
  reason: z.string().max(255).optional(),
});

export type UnmatchItems = z.infer<typeof unmatchItemsSchema>;

/**
 * Exclude Items Schema
 */
export const excludeItemsSchema = z.object({
  reconciliationId: z.string().uuid(),
  itemIds: z.array(z.string().uuid()).min(1).max(100),
  reason: z.string().min(1).max(255),
});

export type ExcludeItems = z.infer<typeof excludeItemsSchema>;

/**
 * Add Adjustment Schema
 */
export const addAdjustmentSchema = z.object({
  reconciliationId: z.string().uuid(),
  adjustmentDate: z.coerce.date(),
  description: z.string().min(1).max(255),
  amount: z.number(),
  glAccountId: z.string().uuid(),
  costCenterId: z.string().uuid().optional(),
  reason: z.string().max(500).optional(),
});

export type AddAdjustment = z.infer<typeof addAdjustmentSchema>;

/**
 * Submit Reconciliation Schema
 */
export const submitReconciliationSchema = z.object({
  id: z.string().uuid(),
  notes: z.string().max(500).optional(),
  confirmBalance: z.boolean().refine(val => val === true, {
    message: 'Must confirm balance before submission',
  }),
});

export type SubmitReconciliation = z.infer<typeof submitReconciliationSchema>;

/**
 * Approve Reconciliation Schema
 */
export const approveReconciliationSchema = z.object({
  id: z.string().uuid(),
  comments: z.string().max(500).optional(),
  postAdjustments: z.boolean().default(true),
});

export type ApproveReconciliation = z.infer<typeof approveReconciliationSchema>;

/**
 * Reject Reconciliation Schema
 */
export const rejectReconciliationSchema = z.object({
  id: z.string().uuid(),
  reason: z.string().min(1).max(500),
  requireChanges: z.array(z.string().max(255)).optional(),
});

export type RejectReconciliation = z.infer<typeof rejectReconciliationSchema>;

/**
 * Complete Reconciliation Schema
 */
export const completeReconciliationSchema = z.object({
  id: z.string().uuid(),
  finalNotes: z.string().max(500).optional(),
  updateBankAccountBalance: z.boolean().default(true),
});

export type CompleteReconciliation = z.infer<typeof completeReconciliationSchema>;

/**
 * Void Reconciliation Schema
 */
export const voidReconciliationSchema = z.object({
  id: z.string().uuid(),
  reason: z.string().min(1).max(500),
  reverseAdjustments: z.boolean().default(true),
});

export type VoidReconciliation = z.infer<typeof voidReconciliationSchema>;

/**
 * Run Auto-Match Schema
 */
export const runAutoMatchSchema = z.object({
  reconciliationId: z.string().uuid(),
  matchingRuleIds: z.array(z.string().uuid()).optional(), // Specific rules, or all
  toleranceAmount: z.number().min(0).optional(),
  tolerancePercentage: z.number().min(0).max(100).optional(),
  includeAiSuggestions: z.boolean().default(false),
});

export type RunAutoMatch = z.infer<typeof runAutoMatchSchema>;

/**
 * Auto-Match Result Schema
 */
export const autoMatchResultSchema = z.object({
  reconciliationId: z.string().uuid(),
  matchesFound: z.number().int().min(0),
  autoApplied: z.number().int().min(0),
  pendingReview: z.number().int().min(0),
  suggestions: z.array(z.object({
    bankItemId: z.string().uuid(),
    bookItemId: z.string().uuid(),
    confidence: z.number().min(0).max(100),
    matchingRule: matchingRuleTypeEnum,
    reason: z.string(),
  })).optional(),
});

export type AutoMatchResult = z.infer<typeof autoMatchResultSchema>;

/**
 * Bank Reconciliation Filter Schema
 */
export const bankReconciliationFilterSchema = z.object({
  agencyId: z.string().uuid(),
  subAccountId: z.string().uuid().optional(),
  bankAccountId: z.string().uuid().optional(),
  status: reconciliationStatusEnum.optional(),
  reconciliationType: reconciliationTypeEnum.optional(),
  periodFrom: z.coerce.date().optional(),
  periodTo: z.coerce.date().optional(),
  isBalanced: z.boolean().optional(),
  hasOutstandingItems: z.boolean().optional(),
  search: z.string().max(100).optional(),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
  sortBy: z.enum(['periodEnd', 'reconciliationDate', 'createdAt', 'status']).default('periodEnd'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type BankReconciliationFilter = z.infer<typeof bankReconciliationFilterSchema>;

/**
 * Create Matching Rule Schema
 */
export const createMatchingRuleSchema = matchingRuleSchema.omit({
  id: true,
  matchCount: true,
  lastMatchedAt: true,
  successRate: true,
  createdAt: true,
  createdBy: true,
  updatedAt: true,
  updatedBy: true,
});

export type CreateMatchingRule = z.infer<typeof createMatchingRuleSchema>;

/**
 * Update Matching Rule Schema
 */
export const updateMatchingRuleSchema = createMatchingRuleSchema.partial().extend({
  id: z.string().uuid(),
});

export type UpdateMatchingRule = z.infer<typeof updateMatchingRuleSchema>;

/**
 * Reconciliation Summary Schema
 */
export const reconciliationSummarySchema = z.object({
  bankAccountId: z.string().uuid(),
  bankAccountName: z.string(),
  currencyCode: z.string().length(3),
  lastReconciliationDate: z.coerce.date().optional(),
  lastReconciledBalance: z.number().optional(),
  currentBookBalance: z.number(),
  currentBankBalance: z.number().optional(),
  unreconciledItemCount: z.number().int(),
  unreconciledAmount: z.number(),
  daysSinceLastReconciliation: z.number().int().optional(),
  reconciliationStatus: z.enum(['CURRENT', 'DUE', 'OVERDUE']),
});

export type ReconciliationSummary = z.infer<typeof reconciliationSummarySchema>;
