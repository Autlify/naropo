import { z } from 'zod';
import { currencyCodeSchema } from '@/lib/schemas/shared/payment';
import { paymentFileFormatEnum } from './bank-account';

/**
 * Payment Batch Status Enum
 */
export const paymentBatchStatusEnumBL = z.enum([
  'DRAFT',            // Being prepared
  'PENDING_APPROVAL', // Awaiting approval
  'APPROVED',         // Approved for processing
  'PROCESSING',       // Being processed
  'SUBMITTED',        // Submitted to bank
  'PARTIALLY_COMPLETED', // Some payments completed
  'COMPLETED',        // All payments completed
  'REJECTED',         // Rejected
  'FAILED',           // Processing failed
  'CANCELLED',        // Cancelled
]);

export type PaymentBatchStatusBL = z.infer<typeof paymentBatchStatusEnumBL>;

/**
 * Payment Batch Type Enum
 */
export const paymentBatchTypeEnum = z.enum([
  'VENDOR',           // Vendor/supplier payments
  'EMPLOYEE',         // Employee payments (expenses, payroll)
  'TAX',              // Tax payments
  'TRANSFER',         // Internal transfers
  'REFUND',           // Customer refunds
  'MISC',             // Miscellaneous
]);

export type PaymentBatchType = z.infer<typeof paymentBatchTypeEnum>;

/**
 * Payment Item Status Enum
 */
export const paymentItemStatusEnum = z.enum([
  'PENDING',          // Not yet processed
  'VALIDATED',        // Validated successfully
  'VALIDATION_ERROR', // Validation failed
  'PROCESSING',       // Being processed
  'SUBMITTED',        // Submitted to bank
  'COMPLETED',        // Payment completed
  'RETURNED',         // Returned by bank
  'FAILED',           // Failed
  'CANCELLED',        // Cancelled
  'ON_HOLD',          // On hold
]);

export type PaymentItemStatus = z.infer<typeof paymentItemStatusEnum>;

/**
 * Payment Priority Enum
 */
export const paymentPriorityEnum = z.enum([
  'NORMAL',           // Standard processing
  'HIGH',             // High priority
  'URGENT',           // Urgent/same-day
  'SCHEDULED',        // Scheduled for future date
]);

export type PaymentPriority = z.infer<typeof paymentPriorityEnum>;

/**
 * Beneficiary Schema
 * Payment recipient details
 */
export const beneficiarySchema = z.object({
  name: z.string().min(1).max(100),
  accountNumber: z.string().min(1).max(50),
  iban: z.string().max(34).optional(),
  bankName: z.string().max(100).optional(),
  bankCode: z.string().max(20).optional(),
  swiftBic: z.string().max(11).optional(),
  routingNumber: z.string().max(20).optional(),
  sortCode: z.string().max(8).optional(),
  bankCountry: z.string().length(2).optional(),
  addressLine1: z.string().max(100).optional(),
  addressLine2: z.string().max(100).optional(),
  city: z.string().max(50).optional(),
  postalCode: z.string().max(20).optional(),
  country: z.string().length(2).optional(),
});

export type Beneficiary = z.infer<typeof beneficiarySchema>;

/**
 * Payment Batch Schema
 * Batch of payments for processing
 */
export const paymentBatchSchema = z.object({
  id: z.string().uuid(),
  agencyId: z.string().uuid(),
  subAccountId: z.string().uuid().optional(),

  // Identification
  batchNumber: z.string().max(50),
  description: z.string().max(255).optional(),
  batchType: paymentBatchTypeEnum.default('VENDOR'),

  // Source bank account
  bankAccountId: z.string().uuid(),
  bankAccountCode: z.string().max(20).optional(),

  // Payment details
  paymentDate: z.coerce.date(), // Requested payment date
  valueDate: z.coerce.date().optional(), // Value date
  currencyCode: currencyCodeSchema,
  paymentFormat: paymentFileFormatEnum.optional(),

  // Totals
  totalAmount: z.number().default(0),
  totalItems: z.number().int().min(0).default(0),
  completedItems: z.number().int().min(0).default(0),
  failedItems: z.number().int().min(0).default(0),

  // Status
  status: paymentBatchStatusEnumBL.default('DRAFT'),
  priority: paymentPriorityEnum.default('NORMAL'),

  // Validation
  isValidated: z.boolean().default(false),
  validatedAt: z.coerce.date().optional(),
  validatedBy: z.string().uuid().optional(),
  validationErrors: z.array(z.object({
    itemId: z.string().uuid().optional(),
    field: z.string().max(50),
    error: z.string().max(255),
  })).optional(),

  // Approval workflow
  requiresApproval: z.boolean().default(true),
  approvalThreshold: z.number().optional(), // Amount threshold for approval
  submittedForApprovalAt: z.coerce.date().optional(),
  submittedForApprovalBy: z.string().uuid().optional(),
  approvedAt: z.coerce.date().optional(),
  approvedBy: z.string().uuid().optional(),
  approvalNotes: z.string().max(500).optional(),
  rejectedAt: z.coerce.date().optional(),
  rejectedBy: z.string().uuid().optional(),
  rejectionReason: z.string().max(500).optional(),

  // Process tracking
  processStartedAt: z.coerce.date().optional(),
  processCompletedAt: z.coerce.date().optional(),
  submittedToBankAt: z.coerce.date().optional(),
  bankReference: z.string().max(100).optional(),
  bankResponseCode: z.string().max(20).optional(),
  bankResponseMessage: z.string().max(500).optional(),

  // File generation
  paymentFileId: z.string().uuid().optional(), // Generated file reference
  paymentFileName: z.string().max(255).optional(),
  paymentFileHash: z.string().max(64).optional(),
  fileGeneratedAt: z.coerce.date().optional(),

  // Confirmation
  confirmationFileId: z.string().uuid().optional(),
  confirmedAt: z.coerce.date().optional(),

  // GL posting
  journalEntryId: z.string().uuid().optional(),
  isPosted: z.boolean().default(false),

  // Notes
  notes: z.string().max(1000).optional(),
  internalNotes: z.string().max(500).optional(),

  // Attachments
  attachmentIds: z.array(z.string().uuid()).optional(),

  // Audit
  createdAt: z.coerce.date().optional(),
  createdBy: z.string().uuid().optional(),
  updatedAt: z.coerce.date().optional(),
  updatedBy: z.string().uuid().optional(),
  cancelledAt: z.coerce.date().optional(),
  cancelledBy: z.string().uuid().optional(),
  cancellationReason: z.string().max(500).optional(),
});

export type PaymentBatch = z.infer<typeof paymentBatchSchema>;

/**
 * Payment Batch Item Schema
 * Individual payment in a batch
 */
export const paymentBatchItemSchema = z.object({
  id: z.string().uuid(),
  batchId: z.string().uuid(),
  lineNumber: z.number().int().min(1),

  // Beneficiary
  ...beneficiarySchema.shape,

  // Amount
  amount: z.number().positive(),
  currencyCode: currencyCodeSchema,
  exchangeRate: z.number().positive().optional(),
  amountBase: z.number().optional(),

  // References
  reference: z.string().max(35), // End-to-end ID (ISO 20022)
  internalReference: z.string().max(50).optional(),
  invoiceNumbers: z.array(z.string().max(50)).optional(),
  creditorReference: z.string().max(35).optional(), // Structured creditor reference

  // Purpose
  purposeCode: z.string().max(10).optional(), // ISO purpose code
  purposeDescription: z.string().max(255).optional(),
  remittanceInfo: z.string().max(140).optional(), // Remittance information

  // Status
  status: paymentItemStatusEnum.default('PENDING'),
  statusMessage: z.string().max(500).optional(),

  // Validation
  isValid: z.boolean().default(false),
  validationErrors: z.array(z.string().max(255)).optional(),

  // Bank response
  bankTransactionId: z.string().max(100).optional(),
  bankStatus: z.string().max(50).optional(),
  bankStatusCode: z.string().max(20).optional(),
  bankStatusMessage: z.string().max(500).optional(),
  processedAt: z.coerce.date().optional(),
  returnReason: z.string().max(255).optional(),

  // Linked documents
  vendorId: z.string().uuid().optional(),
  invoiceId: z.string().uuid().optional(),
  paymentId: z.string().uuid().optional(), // AP Payment reference

  // Priority
  priority: paymentPriorityEnum.default('NORMAL'),
  isUrgent: z.boolean().default(false),

  // Hold
  isOnHold: z.boolean().default(false),
  holdReason: z.string().max(255).optional(),
  holdBy: z.string().uuid().optional(),
  holdAt: z.coerce.date().optional(),

  // Notes
  notes: z.string().max(500).optional(),

  // Audit
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
});

export type PaymentBatchItem = z.infer<typeof paymentBatchItemSchema>;

/**
 * Create Payment Batch Schema
 */
export const createPaymentBatchSchema = paymentBatchSchema.omit({
  id: true,
  totalAmount: true,
  totalItems: true,
  completedItems: true,
  failedItems: true,
  isValidated: true,
  validatedAt: true,
  validatedBy: true,
  validationErrors: true,
  submittedForApprovalAt: true,
  submittedForApprovalBy: true,
  approvedAt: true,
  approvedBy: true,
  approvalNotes: true,
  rejectedAt: true,
  rejectedBy: true,
  rejectionReason: true,
  processStartedAt: true,
  processCompletedAt: true,
  submittedToBankAt: true,
  bankReference: true,
  bankResponseCode: true,
  bankResponseMessage: true,
  paymentFileId: true,
  paymentFileName: true,
  paymentFileHash: true,
  fileGeneratedAt: true,
  confirmationFileId: true,
  confirmedAt: true,
  journalEntryId: true,
  isPosted: true,
  createdAt: true,
  createdBy: true,
  updatedAt: true,
  updatedBy: true,
  cancelledAt: true,
  cancelledBy: true,
  cancellationReason: true,
});

export type CreatePaymentBatch = z.infer<typeof createPaymentBatchSchema>;

/**
 * Add Payment Item Schema
 */
export const addPaymentItemSchema = paymentBatchItemSchema.omit({
  id: true,
  batchId: true,
  lineNumber: true,
  status: true,
  statusMessage: true,
  isValid: true,
  validationErrors: true,
  bankTransactionId: true,
  bankStatus: true,
  bankStatusCode: true,
  bankStatusMessage: true,
  processedAt: true,
  returnReason: true,
  isOnHold: true,
  holdReason: true,
  holdBy: true,
  holdAt: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  batchId: z.string().uuid(),
});

export type AddPaymentItem = z.infer<typeof addPaymentItemSchema>;

/**
 * Update Payment Item Schema
 */
export const updatePaymentItemSchema = addPaymentItemSchema.partial().extend({
  id: z.string().uuid(),
});

export type UpdatePaymentItem = z.infer<typeof updatePaymentItemSchema>;

/**
 * Validate Payment Batch Schema
 */
export const validatePaymentBatchSchema = z.object({
  id: z.string().uuid(),
  validateBeneficiaryDetails: z.boolean().default(true),
  validateAmounts: z.boolean().default(true),
  validateReferences: z.boolean().default(true),
  validateBankDetails: z.boolean().default(true),
});

export type ValidatePaymentBatch = z.infer<typeof validatePaymentBatchSchema>;

/**
 * Submit for Approval Schema
 */
export const submitBatchForApprovalSchema = z.object({
  id: z.string().uuid(),
  notes: z.string().max(500).optional(),
  urgentApproval: z.boolean().default(false),
});

export type SubmitBatchForApproval = z.infer<typeof submitBatchForApprovalSchema>;

/**
 * Approve Payment Batch Schema
 */
export const approvePaymentBatchSchema = z.object({
  id: z.string().uuid(),
  comments: z.string().max(500).optional(),
  scheduleProcessing: z.boolean().default(false),
  scheduledDate: z.coerce.date().optional(),
});

export type ApprovePaymentBatch = z.infer<typeof approvePaymentBatchSchema>;

/**
 * Reject Payment Batch Schema
 */
export const rejectPaymentBatchSchema = z.object({
  id: z.string().uuid(),
  reason: z.string().min(1).max(500),
  returnToDraft: z.boolean().default(true),
});

export type RejectPaymentBatch = z.infer<typeof rejectPaymentBatchSchema>;

/**
 * Process Payment Batch Schema
 */
export const processPaymentBatchSchema = z.object({
  id: z.string().uuid(),
  generateFile: z.boolean().default(true),
  submitToBank: z.boolean().default(false), // Direct API submission
  testMode: z.boolean().default(false),
});

export type ProcessPaymentBatch = z.infer<typeof processPaymentBatchSchema>;

/**
 * Download Payment File Schema
 */
export const downloadPaymentFileSchema = z.object({
  batchId: z.string().uuid(),
  format: paymentFileFormatEnum,
  includeHeaders: z.boolean().default(true),
});

export type DownloadPaymentFile = z.infer<typeof downloadPaymentFileSchema>;

/**
 * Hold/Release Payment Item Schema
 */
export const holdPaymentItemSchema = z.object({
  id: z.string().uuid(),
  reason: z.string().min(1).max(255),
});

export type HoldPaymentItem = z.infer<typeof holdPaymentItemSchema>;

export const releasePaymentItemSchema = z.object({
  id: z.string().uuid(),
  notes: z.string().max(255).optional(),
});

export type ReleasePaymentItem = z.infer<typeof releasePaymentItemSchema>;

/**
 * Cancel Payment Batch Schema
 */
export const cancelPaymentBatchSchema = z.object({
  id: z.string().uuid(),
  reason: z.string().min(1).max(500),
  notifyBeneficiaries: z.boolean().default(false),
});

export type CancelPaymentBatch = z.infer<typeof cancelPaymentBatchSchema>;

/**
 * Import Bank Response Schema
 */
export const importBankResponseSchema = z.object({
  batchId: z.string().uuid(),
  responseFileContent: z.string(),
  responseFormat: paymentFileFormatEnum,
});

export type ImportBankResponse = z.infer<typeof importBankResponseSchema>;

/**
 * Payment Batch Filter Schema
 */
export const paymentBatchFilterSchema = z.object({
  agencyId: z.string().uuid(),
  subAccountId: z.string().uuid().optional(),
  bankAccountId: z.string().uuid().optional(),
  batchType: paymentBatchTypeEnum.optional(),
  status: paymentBatchStatusEnumBL.optional(),
  priority: paymentPriorityEnum.optional(),
  paymentDateFrom: z.coerce.date().optional(),
  paymentDateTo: z.coerce.date().optional(),
  amountMin: z.number().optional(),
  amountMax: z.number().optional(),
  requiresApproval: z.boolean().optional(),
  isPosted: z.boolean().optional(),
  search: z.string().max(100).optional(),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
  sortBy: z.enum(['paymentDate', 'totalAmount', 'createdAt', 'status']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type PaymentBatchFilter = z.infer<typeof paymentBatchFilterSchema>;

/**
 * Payment Batch Summary Schema
 */
export const paymentBatchSummarySchema = z.object({
  period: z.object({
    from: z.coerce.date(),
    to: z.coerce.date(),
  }),
  totalBatches: z.number().int(),
  totalPayments: z.number().int(),
  totalAmount: z.number(),
  byStatus: z.record(paymentBatchStatusEnumBL, z.object({
    count: z.number().int(),
    amount: z.number(),
  })),
  pendingApprovalCount: z.number().int(),
  pendingApprovalAmount: z.number(),
  scheduledPayments: z.array(z.object({
    batchId: z.string().uuid(),
    paymentDate: z.coerce.date(),
    amount: z.number(),
  })).optional(),
});

export type PaymentBatchSummary = z.infer<typeof paymentBatchSummarySchema>;
