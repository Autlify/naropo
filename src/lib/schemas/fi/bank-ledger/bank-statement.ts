import { z } from 'zod';
import { currencyCodeSchema } from '@/lib/schemas/shared/payment';
import { paymentFileFormatEnum } from './bank-account';

/**
 * Statement Status Enum
 */
export const statementStatusEnum = z.enum([
  'DRAFT',            // Statement created but not imported
  'IMPORTING',        // Import in progress
  'IMPORTED',         // Import complete
  'PARTIALLY_MATCHED', // Some transactions matched
  'FULLY_MATCHED',    // All transactions matched
  'RECONCILED',       // Fully reconciled
  'ERROR',            // Import/processing error
  'ARCHIVED',         // Archived
]);

export type StatementStatus = z.infer<typeof statementStatusEnum>;

/**
 * Statement Import Type Enum
 */
export const statementImportTypeEnum = z.enum([
  'MANUAL',           // Manually entered
  'FILE_UPLOAD',      // Uploaded file
  'API_SYNC',         // Synced via API
  'EMAIL',            // Received via email
  'SFTP',             // Downloaded from SFTP
]);

export type StatementImportType = z.infer<typeof statementImportTypeEnum>;

/**
 * Bank Statement Schema
 * Represents a bank statement for a period
 */
export const bankStatementSchema = z.object({
  id: z.string().uuid(),
  agencyId: z.string().uuid(),
  subAccountId: z.string().uuid().optional(),

  // Account reference
  bankAccountId: z.string().uuid(),
  bankAccountCode: z.string().max(20).optional(),
  bankAccountName: z.string().max(100).optional(),

  // Statement identification
  statementNumber: z.string().max(50),
  externalStatementId: z.string().max(100).optional(), // Bank's statement ID
  sequenceNumber: z.number().int().optional(), // For sequential statements

  // Period
  periodStart: z.coerce.date(),
  periodEnd: z.coerce.date(),
  statementDate: z.coerce.date(), // Date statement was generated

  // Currency
  currencyCode: currencyCodeSchema,

  // Balances
  openingBalance: z.number(),
  closingBalance: z.number(),
  totalCredits: z.number().default(0),
  totalDebits: z.number().default(0),
  creditCount: z.number().int().min(0).default(0),
  debitCount: z.number().int().min(0).default(0),
  totalTransactions: z.number().int().min(0).default(0),

  // Status
  status: statementStatusEnum.default('DRAFT'),

  // Import details
  importType: statementImportTypeEnum.default('MANUAL'),
  importFormat: paymentFileFormatEnum.optional(),
  importedAt: z.coerce.date().optional(),
  importedBy: z.string().uuid().optional(),
  originalFileName: z.string().max(255).optional(),
  fileSize: z.number().int().optional(),
  fileHash: z.string().max(64).optional(), // SHA-256 hash for duplicate detection

  // Processing
  processedAt: z.coerce.date().optional(),
  processedBy: z.string().uuid().optional(),
  processingErrors: z.array(z.object({
    lineNumber: z.number().int().optional(),
    field: z.string().max(50).optional(),
    error: z.string().max(500),
  })).optional(),
  processingWarnings: z.array(z.string().max(500)).optional(),

  // Matching stats
  matchedTransactionCount: z.number().int().min(0).default(0),
  unmatchedTransactionCount: z.number().int().min(0).default(0),
  matchedAmount: z.number().default(0),
  unmatchedAmount: z.number().default(0),

  // Reconciliation
  isReconciled: z.boolean().default(false),
  reconciledAt: z.coerce.date().optional(),
  reconciledBy: z.string().uuid().optional(),
  reconciliationId: z.string().uuid().optional(),
  reconciledBalance: z.number().optional(),
  balanceDifference: z.number().optional(), // Diff between expected and actual

  // Attachments
  attachmentId: z.string().uuid().optional(), // Original statement file
  attachmentIds: z.array(z.string().uuid()).optional(),

  // Notes
  notes: z.string().max(1000).optional(),
  bankNotes: z.string().max(1000).optional(), // Notes from bank

  // Metadata
  metadata: z.record(z.string(), z.unknown()).optional(),

  // Audit
  createdAt: z.coerce.date().optional(),
  createdBy: z.string().uuid().optional(),
  updatedAt: z.coerce.date().optional(),
  updatedBy: z.string().uuid().optional(),
  archivedAt: z.coerce.date().optional(),
  archivedBy: z.string().uuid().optional(),
}).refine(
  data => data.periodEnd >= data.periodStart,
  { message: 'Period end must be on or after period start', path: ['periodEnd'] }
);

export type BankStatement = z.infer<typeof bankStatementSchema>;

/**
 * Create Bank Statement Base Schema (without refinement for .partial() usage)
 */
const createBankStatementBaseSchema = z.object({
  agencyId: z.string().uuid(),
  subAccountId: z.string().uuid().optional(),
  bankAccountId: z.string().uuid(),
  bankAccountCode: z.string().max(20).optional(),
  bankAccountName: z.string().max(100).optional(),
  statementNumber: z.string().max(50),
  externalStatementId: z.string().max(100).optional(),
  sequenceNumber: z.number().int().optional(),
  periodStart: z.coerce.date(),
  periodEnd: z.coerce.date(),
  statementDate: z.coerce.date(),
  currencyCode: currencyCodeSchema,
  openingBalance: z.number(),
  closingBalance: z.number(),
  status: statementStatusEnum.default('DRAFT'),
  importType: statementImportTypeEnum.default('MANUAL'),
  importFormat: paymentFileFormatEnum.optional(),
  originalFileName: z.string().max(255).optional(),
  fileSize: z.number().int().optional(),
  fileHash: z.string().max(64).optional(),
  attachmentId: z.string().uuid().optional(),
  attachmentIds: z.array(z.string().uuid()).optional(),
  notes: z.string().max(1000).optional(),
  bankNotes: z.string().max(1000).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

/**
 * Create Bank Statement Schema (with date validation)
 */
export const createBankStatementSchema = createBankStatementBaseSchema.refine(
  data => data.periodEnd >= data.periodStart,
  { message: 'Period end must be on or after period start', path: ['periodEnd'] }
);

export type CreateBankStatement = z.infer<typeof createBankStatementSchema>;

/**
 * Update Bank Statement Schema
 * Note: Uses base schema without refinement to allow .partial()
 */
export const updateBankStatementSchema = createBankStatementBaseSchema.partial().extend({
  id: z.string().uuid(),
});

export type UpdateBankStatement = z.infer<typeof updateBankStatementSchema>;

/**
 * Bank Statement Output Schema
 */
export const bankStatementOutputSchema = bankStatementSchema.and(z.object({
  // Additional computed fields
  periodDays: z.number().int().optional(),
  averageBalance: z.number().optional(),
  reconciledPercentage: z.number().min(0).max(100).optional(),
}));

export type BankStatementOutput = z.infer<typeof bankStatementOutputSchema>;

/**
 * Import Statement Schema
 * For importing statement files
 */
export const importStatementSchema = z.object({
  bankAccountId: z.string().uuid(),
  format: paymentFileFormatEnum,
  fileContent: z.string().optional(), // Base64 encoded or raw content
  fileName: z.string().max(255),
  fileUrl: z.string().url().optional(), // If file is already uploaded
  autoMatch: z.boolean().default(true),
  skipDuplicates: z.boolean().default(true),
  importHistoricalDays: z.number().int().min(1).max(365).optional(),
});

export type ImportStatement = z.infer<typeof importStatementSchema>;

/**
 * Import Statement Result Schema
 */
export const importStatementResultSchema = z.object({
  statementId: z.string().uuid(),
  success: z.boolean(),
  transactionsImported: z.number().int().min(0),
  transactionsSkipped: z.number().int().min(0),
  duplicatesFound: z.number().int().min(0),
  errors: z.array(z.object({
    lineNumber: z.number().int().optional(),
    message: z.string(),
  })).optional(),
  warnings: z.array(z.string()).optional(),
});

export type ImportStatementResult = z.infer<typeof importStatementResultSchema>;

/**
 * Parse Statement Preview Schema
 * Preview parsed statement before import
 */
export const parseStatementPreviewSchema = z.object({
  bankAccountId: z.string().uuid(),
  format: paymentFileFormatEnum,
  fileContent: z.string(),
  fileName: z.string().max(255),
});

export type ParseStatementPreview = z.infer<typeof parseStatementPreviewSchema>;

/**
 * Statement Preview Result Schema
 */
export const statementPreviewResultSchema = z.object({
  statementNumber: z.string().optional(),
  periodStart: z.coerce.date().optional(),
  periodEnd: z.coerce.date().optional(),
  openingBalance: z.number().optional(),
  closingBalance: z.number().optional(),
  transactionCount: z.number().int(),
  totalCredits: z.number(),
  totalDebits: z.number(),
  currencyCode: z.string().length(3).optional(),
  transactions: z.array(z.object({
    date: z.coerce.date(),
    description: z.string(),
    amount: z.number(),
    type: z.string(),
    reference: z.string().optional(),
  })).max(100), // Preview first 100
  validationErrors: z.array(z.string()).optional(),
  potentialDuplicates: z.number().int().min(0).optional(),
});

export type StatementPreviewResult = z.infer<typeof statementPreviewResultSchema>;

/**
 * Archive Statement Schema
 */
export const archiveStatementSchema = z.object({
  id: z.string().uuid(),
  reason: z.string().max(500).optional(),
});

export type ArchiveStatement = z.infer<typeof archiveStatementSchema>;

/**
 * Reprocess Statement Schema
 */
export const reprocessStatementSchema = z.object({
  id: z.string().uuid(),
  clearExistingTransactions: z.boolean().default(false),
  rerunMatching: z.boolean().default(true),
});

export type ReprocessStatement = z.infer<typeof reprocessStatementSchema>;

/**
 * Bank Statement Filter Schema
 */
export const bankStatementFilterSchema = z.object({
  agencyId: z.string().uuid(),
  subAccountId: z.string().uuid().optional(),
  bankAccountId: z.string().uuid().optional(),
  status: statementStatusEnum.optional(),
  importType: statementImportTypeEnum.optional(),
  periodFrom: z.coerce.date().optional(),
  periodTo: z.coerce.date().optional(),
  isReconciled: z.boolean().optional(),
  hasErrors: z.boolean().optional(),
  hasUnmatchedTransactions: z.boolean().optional(),
  search: z.string().max(100).optional(),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
  sortBy: z.enum(['periodStart', 'periodEnd', 'statementDate', 'createdAt']).default('periodEnd'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type BankStatementFilter = z.infer<typeof bankStatementFilterSchema>;

/**
 * Statement Balance Verification Schema
 */
export const statementBalanceVerificationSchema = z.object({
  statementId: z.string().uuid(),
  verifiedOpeningBalance: z.number(),
  verifiedClosingBalance: z.number(),
  notes: z.string().max(500).optional(),
});

export type StatementBalanceVerification = z.infer<typeof statementBalanceVerificationSchema>;

/**
 * Statement Summary Schema
 */
export const statementSummarySchema = z.object({
  bankAccountId: z.string().uuid(),
  period: z.object({
    from: z.coerce.date(),
    to: z.coerce.date(),
  }),
  statementCount: z.number().int(),
  reconciledCount: z.number().int(),
  pendingCount: z.number().int(),
  totalCredits: z.number(),
  totalDebits: z.number(),
  startingBalance: z.number(),
  endingBalance: z.number(),
  unmatchedTransactionCount: z.number().int(),
  oldestUnmatchedDate: z.coerce.date().optional(),
});

export type StatementSummary = z.infer<typeof statementSummarySchema>;
