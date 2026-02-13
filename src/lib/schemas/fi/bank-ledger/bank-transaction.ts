import { z } from 'zod';
import { currencyCodeSchema } from '@/lib/schemas/shared/payment';

/**
 * Bank Transaction Type Enum
 * Types of bank transactions
 */
export const bankTransactionTypeEnum = z.enum([
  'CREDIT',             // Incoming payment
  'DEBIT',              // Outgoing payment
  'TRANSFER_IN',        // Internal transfer in
  'TRANSFER_OUT',       // Internal transfer out
  'INTEREST_CREDIT',    // Interest earned
  'INTEREST_DEBIT',     // Interest charged
  'FEE',                // Bank fee
  'REVERSAL',           // Transaction reversal
  'ADJUSTMENT',         // Balance adjustment
  'OPENING_BALANCE',    // Opening balance entry
  'FX_GAIN',            // Foreign exchange gain
  'FX_LOSS',            // Foreign exchange loss
  'CHECK_DEPOSIT',      // Check deposit
  'CHECK_PAYMENT',      // Check payment
  'WIRE_IN',            // Wire transfer in
  'WIRE_OUT',           // Wire transfer out
  'ACH_IN',             // ACH credit
  'ACH_OUT',            // ACH debit
  'DIRECT_DEBIT',       // Direct debit
  'STANDING_ORDER',     // Standing order payment
]);

export type BankTransactionType = z.infer<typeof bankTransactionTypeEnum>;

/**
 * Bank Transaction Status Enum
 */
export const bankTransactionStatusEnum = z.enum([
  'PENDING',            // Not yet cleared
  'CLEARED',            // Cleared at bank
  'RECONCILED',         // Reconciled in system
  'UNRECONCILED',       // Imported but not reconciled
  'MATCHED',            // Matched to document
  'PARTIALLY_MATCHED',  // Partially matched
  'DISPUTED',           // Under dispute
  'REVERSED',           // Reversed
  'VOID',               // Voided
  'FAILED',             // Failed transaction
]);

export type BankTransactionStatus = z.infer<typeof bankTransactionStatusEnum>;

/**
 * Transaction Source Enum
 * How the transaction was created
 */
export const transactionSourceEnum = z.enum([
  'MANUAL',             // Manually entered
  'IMPORT',             // Imported from statement
  'SYNC',               // Synced via API
  'SYSTEM',             // System-generated
  'PAYMENT_RUN',        // From payment batch
  'RECEIPT',            // From receipt posting
  'TRANSFER',           // Internal transfer
  'JOURNAL',            // From journal entry
]);

export type TransactionSource = z.infer<typeof transactionSourceEnum>;

/**
 * Payment Method Enum for Bank Transactions
 */
export const bankPaymentMethodEnum = z.enum([
  'CHECK',
  'WIRE',
  'ACH',
  'BACS',
  'SEPA',
  'SWIFT',
  'CHAPS',
  'FASTER_PAYMENTS',
  'DIRECT_DEBIT',
  'STANDING_ORDER',
  'CARD',
  'CASH',
  'INTERNAL_TRANSFER',
  'EXTERNAL_TRANSFER',
  'OTHER',
]);

export type BankPaymentMethod = z.infer<typeof bankPaymentMethodEnum>;

/**
 * Counterparty Schema
 * Details about the other party in the transaction
 */
export const counterpartySchema = z.object({
  name: z.string().max(100).optional(),
  accountNumber: z.string().max(50).optional(),
  iban: z.string().max(34).optional(),
  bankName: z.string().max(100).optional(),
  swiftBic: z.string().max(11).optional(),
  reference: z.string().max(100).optional(), // Their reference
});

export type Counterparty = z.infer<typeof counterpartySchema>;

/**
 * Bank Transaction Schema
 * Individual bank transaction record
 */
export const bankTransactionSchema = z.object({
  id: z.string().uuid(),
  agencyId: z.string().uuid(),
  subAccountId: z.string().uuid().optional(),

  // Account reference
  bankAccountId: z.string().uuid(),
  bankAccountCode: z.string().max(20).optional(),

  // Statement reference
  statementId: z.string().uuid().optional(),
  statementLineNumber: z.number().int().optional(),

  // Transaction identification
  transactionNumber: z.string().max(50).optional(), // Internal ref
  externalId: z.string().max(100).optional(), // Bank's transaction ID
  checkNumber: z.string().max(20).optional(),

  // Type and status
  transactionType: bankTransactionTypeEnum,
  status: bankTransactionStatusEnum.default('PENDING'),
  source: transactionSourceEnum.default('MANUAL'),
  paymentMethod: bankPaymentMethodEnum.optional(),

  // Dates
  transactionDate: z.coerce.date(), // When it occurred
  valueDate: z.coerce.date().optional(), // When it clears
  bookingDate: z.coerce.date().optional(), // When booked
  entryDate: z.coerce.date().optional(), // When entered in system

  // Amounts
  amount: z.number(), // Positive for credits, negative for debits
  currencyCode: currencyCodeSchema,
  amountBase: z.number().optional(), // In base currency
  exchangeRate: z.number().positive().optional(),

  // Running balance
  balanceAfter: z.number().optional(),

  // Counterparty
  ...counterpartySchema.shape,

  // References
  ourReference: z.string().max(100).optional(),
  theirReference: z.string().max(100).optional(),
  endToEndId: z.string().max(35).optional(), // ISO 20022
  mandateId: z.string().max(35).optional(), // Direct Debit mandate
  creditorId: z.string().max(35).optional(), // SEPA creditor ID

  // Description
  description: z.string().max(500).optional(),
  narrative: z.string().max(1000).optional(), // Full bank narrative
  category: z.string().max(50).optional(),
  tags: z.array(z.string().max(50)).max(20).optional(),

  // Matching/Reconciliation
  isReconciled: z.boolean().default(false),
  reconciledAt: z.coerce.date().optional(),
  reconciledBy: z.string().uuid().optional(),
  reconciliationId: z.string().uuid().optional(),

  matchedDocumentType: z.string().max(50).optional(), // INVOICE, PAYMENT, etc.
  matchedDocumentId: z.string().uuid().optional(),
  matchedDocumentNumber: z.string().max(50).optional(),
  matchConfidence: z.number().min(0).max(100).optional(), // AI matching confidence

  // GL posting
  journalEntryId: z.string().uuid().optional(),
  glAccountId: z.string().uuid().optional(),
  costCenterId: z.string().uuid().optional(),
  projectId: z.string().uuid().optional(),

  // For AP/AR linking
  vendorId: z.string().uuid().optional(),
  customerId: z.string().uuid().optional(),
  invoiceId: z.string().uuid().optional(),
  paymentId: z.string().uuid().optional(),
  receiptId: z.string().uuid().optional(),

  // Dispute handling
  isDisputed: z.boolean().default(false),
  disputeReason: z.string().max(500).optional(),
  disputeResolvedAt: z.coerce.date().optional(),
  disputeResolution: z.string().max(500).optional(),

  // Bank fees
  feeAmount: z.number().min(0).optional(),
  feeCurrencyCode: currencyCodeSchema.optional(),

  // Attachments
  attachmentIds: z.array(z.string().uuid()).optional(),
  hasAttachments: z.boolean().default(false),

  // Notes
  notes: z.string().max(1000).optional(),
  internalNotes: z.string().max(500).optional(),

  // Metadata
  metadata: z.record(z.string(), z.unknown()).optional(),
  importBatchId: z.string().uuid().optional(),

  // Audit
  createdAt: z.coerce.date().optional(),
  createdBy: z.string().uuid().optional(),
  updatedAt: z.coerce.date().optional(),
  updatedBy: z.string().uuid().optional(),
});

export type BankTransaction = z.infer<typeof bankTransactionSchema>;

/**
 * Create Bank Transaction Schema
 */
export const createBankTransactionSchema = bankTransactionSchema.omit({
  id: true,
  balanceAfter: true,
  isReconciled: true,
  reconciledAt: true,
  reconciledBy: true,
  reconciliationId: true,
  matchConfidence: true,
  journalEntryId: true,
  isDisputed: true,
  disputeReason: true,
  disputeResolvedAt: true,
  disputeResolution: true,
  hasAttachments: true,
  importBatchId: true,
  createdAt: true,
  createdBy: true,
  updatedAt: true,
  updatedBy: true,
});

export type CreateBankTransaction = z.infer<typeof createBankTransactionSchema>;

/**
 * Update Bank Transaction Schema
 */
export const updateBankTransactionSchema = createBankTransactionSchema.partial().extend({
  id: z.string().uuid(),
});

export type UpdateBankTransaction = z.infer<typeof updateBankTransactionSchema>;

/**
 * Bank Transaction Output Schema
 */
export const bankTransactionOutputSchema = bankTransactionSchema.extend({
  bankAccountName: z.string().optional(),
  matchedDocumentDetails: z.object({
    type: z.string(),
    number: z.string(),
    amount: z.number(),
    date: z.coerce.date(),
    counterpartyName: z.string().optional(),
  }).optional(),
});

export type BankTransactionOutput = z.infer<typeof bankTransactionOutputSchema>;

/**
 * Match Transaction Schema
 * Manually match a transaction to a document
 */
export const matchTransactionSchema = z.object({
  transactionId: z.string().uuid(),
  documentType: z.string().max(50),
  documentId: z.string().uuid(),
  matchAmount: z.number().optional(), // For partial matches
  notes: z.string().max(500).optional(),
});

export type MatchTransaction = z.infer<typeof matchTransactionSchema>;

/**
 * Unmatch Transaction Schema
 */
export const unmatchTransactionSchema = z.object({
  transactionId: z.string().uuid(),
  reason: z.string().max(500).optional(),
});

export type UnmatchTransaction = z.infer<typeof unmatchTransactionSchema>;

/**
 * Dispute Transaction Schema
 */
export const disputeTransactionSchema = z.object({
  transactionId: z.string().uuid(),
  reason: z.string().min(1).max(500),
  expectedAmount: z.number().optional(),
  contactBank: z.boolean().default(false),
});

export type DisputeTransaction = z.infer<typeof disputeTransactionSchema>;

/**
 * Resolve Dispute Schema
 */
export const resolveDisputeSchema = z.object({
  transactionId: z.string().uuid(),
  resolution: z.string().min(1).max(500),
  adjustAmount: z.number().optional(),
  createAdjustmentEntry: z.boolean().default(false),
});

export type ResolveDispute = z.infer<typeof resolveDisputeSchema>;

/**
 * Categorize Transaction Schema
 */
export const categorizeTransactionSchema = z.object({
  transactionId: z.string().uuid(),
  category: z.string().max(50),
  glAccountId: z.string().uuid().optional(),
  costCenterId: z.string().uuid().optional(),
  applyToSimilar: z.boolean().default(false), // Create rule
});

export type CategorizeTransaction = z.infer<typeof categorizeTransactionSchema>;

/**
 * Bulk Categorize Transactions Schema
 */
export const bulkCategorizeSchema = z.object({
  transactionIds: z.array(z.string().uuid()).min(1).max(100),
  category: z.string().max(50),
  glAccountId: z.string().uuid().optional(),
  costCenterId: z.string().uuid().optional(),
});

export type BulkCategorize = z.infer<typeof bulkCategorizeSchema>;

/**
 * Split Transaction Schema
 * Split a transaction into multiple GL entries
 */
export const splitTransactionSchema = z.object({
  transactionId: z.string().uuid(),
  splits: z.array(z.object({
    amount: z.number(),
    description: z.string().max(255).optional(),
    glAccountId: z.string().uuid(),
    costCenterId: z.string().uuid().optional(),
    projectId: z.string().uuid().optional(),
    category: z.string().max(50).optional(),
  })).min(2).max(20),
});

export type SplitTransaction = z.infer<typeof splitTransactionSchema>;

/**
 * Bank Transaction Filter Schema
 */
export const bankTransactionFilterSchema = z.object({
  agencyId: z.string().uuid(),
  subAccountId: z.string().uuid().optional(),
  bankAccountId: z.string().uuid().optional(),
  statementId: z.string().uuid().optional(),
  transactionType: bankTransactionTypeEnum.optional(),
  status: bankTransactionStatusEnum.optional(),
  source: transactionSourceEnum.optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  amountMin: z.number().optional(),
  amountMax: z.number().optional(),
  isReconciled: z.boolean().optional(),
  isDisputed: z.boolean().optional(),
  isMatched: z.boolean().optional(),
  category: z.string().max(50).optional(),
  vendorId: z.string().uuid().optional(),
  customerId: z.string().uuid().optional(),
  search: z.string().max(100).optional(), // Search description/reference
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(50),
  sortBy: z.enum(['transactionDate', 'amount', 'status', 'createdAt']).default('transactionDate'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type BankTransactionFilter = z.infer<typeof bankTransactionFilterSchema>;

/**
 * Transaction Summary Schema
 */
export const transactionSummarySchema = z.object({
  period: z.object({
    from: z.coerce.date(),
    to: z.coerce.date(),
  }),
  totals: z.object({
    creditCount: z.number().int(),
    creditAmount: z.number(),
    debitCount: z.number().int(),
    debitAmount: z.number(),
    netAmount: z.number(),
  }),
  byStatus: z.record(bankTransactionStatusEnum, z.number().int()),
  byCategory: z.record(z.string(), z.object({
    count: z.number().int(),
    amount: z.number(),
  })).optional(),
  unreconciledCount: z.number().int(),
  unreconciledAmount: z.number(),
});

export type TransactionSummary = z.infer<typeof transactionSummarySchema>;
