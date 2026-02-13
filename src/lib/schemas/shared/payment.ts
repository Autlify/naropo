/**
 * Shared Payment Schema
 *
 * Purpose:
 * - Provides common payment-related enums, types, and validations
 * - Used by FI-AP (payments to vendors) and FI-AR (receipts from customers)
 * - Shared across modules for consistency
 */

import { z } from 'zod'

// ---------------------------------------------------------------------------
// Payment Method Enum
// ---------------------------------------------------------------------------

export const paymentMethodEnum = z.enum([
  'ACH',
  'WIRE',
  'CHECK',
  'CREDIT_CARD',
  'DEBIT_CARD',
  'CASH',
  'BANK_TRANSFER',
  'DIGITAL_WALLET',
  'OTHER',
])
export type PaymentMethod = z.infer<typeof paymentMethodEnum>

// ---------------------------------------------------------------------------
// Currency Code
// ---------------------------------------------------------------------------

export const currencyCodeSchema = z
  .string()
  .min(3)
  .max(3)
  .transform((s) => s.toUpperCase())
  .refine((s) => /^[A-Z]{3}$/u.test(s), {
    message: 'Currency must be a 3-letter ISO code',
  })

// ---------------------------------------------------------------------------
// Payment Terms Schema
// ---------------------------------------------------------------------------

export const paymentTermsTypeEnum = z.enum([
  'NET',          // Net days (e.g., Net 30)
  'EOM',          // End of month
  'CBD',          // Cash before delivery
  'COD',          // Cash on delivery
  'CIA',          // Cash in advance
  'INSTALLMENT',  // Installment payments
  'RECURRING',    // Recurring/subscription
  'CUSTOM',       // Custom terms
])
export type PaymentTermsType = z.infer<typeof paymentTermsTypeEnum>

export const paymentTermsSchema = z.object({
  /** Type of payment terms */
  type: paymentTermsTypeEnum.default('NET'),

  /** Number of days until payment is due (for NET type) */
  netDays: z.number().int().nonnegative().default(30),

  /** Early payment discount percentage */
  discountPercent: z.number().min(0).max(100).optional(),

  /** Days for early payment discount */
  discountDays: z.number().int().nonnegative().optional(),

  /** Description of terms (e.g., "2/10 Net 30") */
  description: z.string().max(255).optional(),

  /** Installment configuration (if type is INSTALLMENT) */
  installments: z.array(z.object({
    dueDate: z.coerce.date().optional(),
    dueDays: z.number().int().nonnegative().optional(),
    percentage: z.number().min(0).max(100),
    amount: z.number().nonnegative().optional(),
  })).optional(),
})
export type PaymentTerms = z.infer<typeof paymentTermsSchema>

// ---------------------------------------------------------------------------
// Payment Allocation Schema (shared for AP/AR)
// ---------------------------------------------------------------------------

export const paymentAllocationBaseSchema = z.object({
  /** Open item being paid/settled */
  openItemId: z.string().uuid().optional().nullable(),

  /** Invoice number (when open item not available) */
  invoiceNumber: z.string().min(1).max(64).optional(),

  /** Invoice date (for reference) */
  invoiceDate: z.coerce.date().optional(),

  /** Document currency amount */
  allocatedAmount: z.number(),

  /** Base currency amount (calculated) */
  allocatedAmountBase: z.number().optional(),

  /** Exchange rate difference on allocation */
  exchangeDifference: z.number().optional(),

  /** Discount taken on this allocation */
  discountTaken: z.number().min(0).optional(),

  /** Withholding tax amount */
  withholdingTax: z.number().min(0).optional(),

  /** Notes for this allocation */
  notes: z.string().max(500).optional(),
})
export type PaymentAllocationBase = z.infer<typeof paymentAllocationBaseSchema>

// ---------------------------------------------------------------------------
// Bank Reference Schema
// ---------------------------------------------------------------------------

export const bankReferenceSchema = z.object({
  /** Bank account ID (internal) */
  bankAccountId: z.string().uuid().optional().nullable(),

  /** Bank name */
  bankName: z.string().min(1).max(255).optional(),

  /** Account number used */
  accountNumber: z.string().min(1).max(128).optional(),

  /** Bank transaction reference */
  transactionReference: z.string().min(1).max(255).optional(),

  /** Check number (for check payments) */
  checkNumber: z.string().min(1).max(64).optional(),

  /** Remittance reference */
  remittanceReference: z.string().min(1).max(255).optional(),
})
export type BankReference = z.infer<typeof bankReferenceSchema>

// ---------------------------------------------------------------------------
// Payment Batch Schema (for batch processing)
// ---------------------------------------------------------------------------

export const paymentBatchStatusEnum = z.enum([
  'DRAFT',
  'PENDING_APPROVAL',
  'APPROVED',
  'PROCESSING',
  'COMPLETED',
  'PARTIALLY_COMPLETED',
  'FAILED',
  'CANCELLED',
])
export type PaymentBatchStatus = z.infer<typeof paymentBatchStatusEnum>

export const paymentBatchSchema = z.object({
  /** Batch identifier */
  batchNumber: z.string().min(1).max(64),

  /** Batch description */
  description: z.string().max(500).optional(),

  /** Payment method for the batch */
  paymentMethod: paymentMethodEnum,

  /** Payment date for the batch */
  paymentDate: z.coerce.date(),

  /** Currency for the batch (all payments should match) */
  currencyCode: currencyCodeSchema.default('MYR'),

  /** Status */
  status: paymentBatchStatusEnum.default('DRAFT'),

  /** Bank account for the batch */
  bankAccountId: z.string().uuid().optional().nullable(),

  /** Total amount in batch */
  totalAmount: z.number().nonnegative().optional(),

  /** Number of payments in batch */
  paymentCount: z.number().int().nonnegative().optional(),
})
export type PaymentBatch = z.infer<typeof paymentBatchSchema>
