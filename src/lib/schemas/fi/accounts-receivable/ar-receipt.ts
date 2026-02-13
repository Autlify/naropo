/**
 * FI-AR Receipt Schema
 *
 * Purpose:
 * - Validates AR receipt data for customer payments
 * - Aligns with Prisma `ArReceipt` and `ArReceiptAllocation` models
 * - Supports multiple allocation to open items/invoices
 * - Handles FX differences and early payment discounts
 *
 * Prisma alignment (finance schema):
 * - ArReceipt: agencyId, subAccountId?, receiptNumber, customerId, receiptDate,
 *              paymentMethod, status, currencyCode, amount, amountBase, exchangeRate,
 *              bank details, workflow timestamps, journalEntryId
 * - ArReceiptAllocation: receiptId, openItemId, allocatedAmount, etc.
 */

import { z } from 'zod'
import {
  paymentMethodEnum,
  currencyCodeSchema,
  paymentAllocationBaseSchema,
  bankReferenceSchema,
} from '@/lib/schemas/shared/payment'

// ---------------------------------------------------------------------------
// Status Enum
// ---------------------------------------------------------------------------

export const arReceiptStatusEnum = z.enum([
  'DRAFT',
  'PENDING_APPROVAL',
  'APPROVED',
  'DEPOSITED',  // Deposited to bank
  'CLEARED',    // Bank cleared
  'BOUNCED',    // Check bounced / payment reversed
  'VOID',
])
export type ArReceiptStatus = z.infer<typeof arReceiptStatusEnum>

// ---------------------------------------------------------------------------
// Receipt Allocation (AR-specific)
// ---------------------------------------------------------------------------

export const arReceiptAllocationSchema = paymentAllocationBaseSchema.extend({
  /** Our invoice document number */
  invoiceDocumentNumber: z.string().min(1).max(64).optional(),

  /** Customer's reference on the payment */
  customerReference: z.string().min(1).max(64).optional(),

  /** Early payment discount taken */
  earlyPaymentDiscount: z.number().min(0).optional(),
})
export type ArReceiptAllocation = z.infer<typeof arReceiptAllocationSchema>

// ---------------------------------------------------------------------------
// AR Receipt Base Schema
// ---------------------------------------------------------------------------

const arReceiptBaseSchema = z.object({
  // Identity
  id: z.string().uuid(),

  // Multi-tenant scope
  agencyId: z.string().uuid(),
  subAccountId: z.string().uuid().optional().nullable(),

  // Receipt identification
  receiptNumber: z.string().min(1).max(64),
  reference: z.string().min(1).max(255).optional(), // Customer payment reference

  // Customer
  customerId: z.string().uuid(),
  customerCode: z.string().min(1).max(64).optional(), // For display/lookup

  // Receipt details
  receiptDate: z.coerce.date(),
  paymentMethod: paymentMethodEnum,
  status: arReceiptStatusEnum.default('DRAFT'),

  // Amounts
  currencyCode: currencyCodeSchema.default('MYR'),
  amount: z.number().positive(),
  amountBase: z.number().positive().optional(), // Base currency (calculated)
  exchangeRate: z.number().positive().default(1),
  exchangeDifference: z.number().optional(), // FX difference on receipt

  // Deductions
  earlyPaymentDiscountTotal: z.number().min(0).optional(),
  withholdingTaxTotal: z.number().min(0).optional(),

  // Bank details
  bank: bankReferenceSchema.optional(),

  // Check specific
  checkNumber: z.string().min(1).max(64).optional(),
  checkDate: z.coerce.date().optional(),

  // Deposit tracking
  depositBankAccountId: z.string().uuid().optional().nullable(),
  depositReference: z.string().min(1).max(255).optional(),
  depositDate: z.coerce.date().optional(),

  // Workflow
  submittedAt: z.coerce.date().optional(),
  submittedBy: z.string().min(1).optional(),
  approvedAt: z.coerce.date().optional(),
  approvedBy: z.string().min(1).optional(),
  rejectedAt: z.coerce.date().optional(),
  rejectedBy: z.string().min(1).optional(),
  rejectionReason: z.string().max(500).optional(),
  depositedAt: z.coerce.date().optional(),
  depositedBy: z.string().min(1).optional(),
  clearedAt: z.coerce.date().optional(),
  clearedBy: z.string().min(1).optional(),
  bouncedAt: z.coerce.date().optional(),
  bouncedBy: z.string().min(1).optional(),
  bounceReason: z.string().max(500).optional(),
  voidedAt: z.coerce.date().optional(),
  voidedBy: z.string().min(1).optional(),
  voidReason: z.string().max(500).optional(),

  // Journal linkage
  journalEntryId: z.string().uuid().optional().nullable(),
  clearingDocumentNumber: z.string().min(1).max(64).optional(),

  // Allocations
  allocations: z.array(arReceiptAllocationSchema).min(1).optional(),

  // Unapplied amount (when receipt > invoice)
  unappliedAmount: z.number().min(0).optional(),

  // Forward compatibility
  externalRefs: z.record(z.string().min(1), z.string().min(1)).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  notes: z.string().max(2000).optional(),

  // Audit
  createdAt: z.coerce.date().optional(),
  createdBy: z.string().min(1).optional(),
  updatedAt: z.coerce.date().optional(),
  updatedBy: z.string().min(1).optional(),
})

// ---------------------------------------------------------------------------
// Refinements
// ---------------------------------------------------------------------------

const refineArReceipt = (
  v: {
    amount?: number
    allocations?: { allocatedAmount: number }[]
    unappliedAmount?: number
  },
  ctx: z.RefinementCtx,
) => {
  // Validate that allocations sum + unapplied equals receipt amount
  if (v.amount && v.allocations && v.allocations.length > 0) {
    const allocatedTotal = v.allocations.reduce((sum, a) => sum + (a.allocatedAmount || 0), 0)
    const unapplied = v.unappliedAmount || 0
    if (Math.abs(v.amount - allocatedTotal - unapplied) > 0.01) {
      ctx.addIssue({
        code: 'custom',
        path: ['allocations'],
        message: `Allocation total (${allocatedTotal}) + unapplied (${unapplied}) must equal receipt amount (${v.amount})`,
      })
    }
  }
}

// ---------------------------------------------------------------------------
// Exported Schemas
// ---------------------------------------------------------------------------

export const arReceiptSchema = arReceiptBaseSchema.superRefine(refineArReceipt)
export type ArReceipt = z.infer<typeof arReceiptSchema>

/** Create input: omits server-owned fields */
export const arReceiptCreateSchema = arReceiptBaseSchema
  .omit({
    id: true,
    receiptNumber: true, // Auto-generated
    amountBase: true, // Calculated
    exchangeDifference: true, // Calculated
    unappliedAmount: true, // Calculated
    journalEntryId: true,
    clearingDocumentNumber: true,
    createdAt: true,
    createdBy: true,
    updatedAt: true,
    updatedBy: true,
    // Workflow fields set by actions
    submittedAt: true,
    submittedBy: true,
    approvedAt: true,
    approvedBy: true,
    rejectedAt: true,
    rejectedBy: true,
    rejectionReason: true,
    depositedAt: true,
    depositedBy: true,
    clearedAt: true,
    clearedBy: true,
    bouncedAt: true,
    bouncedBy: true,
    bounceReason: true,
    voidedAt: true,
    voidedBy: true,
    voidReason: true,
  })
  .extend({
    // Optional receipt number override
    receiptNumber: z.string().min(1).max(64).optional(),
  })
  .superRefine(refineArReceipt)

export type ArReceiptCreate = z.infer<typeof arReceiptCreateSchema>

/** Update input: partial update, id required */
export const arReceiptUpdateSchema = arReceiptBaseSchema
  .partial()
  .extend({
    id: z.string().uuid(),
  })
  .superRefine(refineArReceipt)

export type ArReceiptUpdate = z.infer<typeof arReceiptUpdateSchema>

// ---------------------------------------------------------------------------
// Action Schemas
// ---------------------------------------------------------------------------

export const submitArReceiptSchema = z.object({
  id: z.string().uuid(),
})
export type SubmitArReceiptInput = z.infer<typeof submitArReceiptSchema>

export const approveArReceiptSchema = z.object({
  id: z.string().uuid(),
  notes: z.string().max(500).optional(),
})
export type ApproveArReceiptInput = z.infer<typeof approveArReceiptSchema>

export const rejectArReceiptSchema = z.object({
  id: z.string().uuid(),
  reason: z.string().min(1, 'Rejection reason is required').max(500),
})
export type RejectArReceiptInput = z.infer<typeof rejectArReceiptSchema>

export const depositArReceiptSchema = z.object({
  id: z.string().uuid(),
  bankAccountId: z.string().uuid(),
  depositDate: z.coerce.date(),
  depositReference: z.string().max(255).optional(),
  notes: z.string().max(500).optional(),
})
export type DepositArReceiptInput = z.infer<typeof depositArReceiptSchema>

export const clearArReceiptSchema = z.object({
  id: z.string().uuid(),
  clearedDate: z.coerce.date(),
  bankReference: z.string().max(255).optional(),
  notes: z.string().max(500).optional(),
})
export type ClearArReceiptInput = z.infer<typeof clearArReceiptSchema>

export const bounceArReceiptSchema = z.object({
  id: z.string().uuid(),
  reason: z.string().min(1, 'Bounce reason is required').max(500),
  bounceDate: z.coerce.date(),
})
export type BounceArReceiptInput = z.infer<typeof bounceArReceiptSchema>

export const voidArReceiptSchema = z.object({
  id: z.string().uuid(),
  reason: z.string().min(1, 'Void reason is required').max(500),
})
export type VoidArReceiptInput = z.infer<typeof voidArReceiptSchema>

/** Apply unapplied receipt amount to invoice(s) */
export const applyArReceiptSchema = z.object({
  id: z.string().uuid(),
  allocations: z.array(arReceiptAllocationSchema).min(1),
})
export type ApplyArReceiptInput = z.infer<typeof applyArReceiptSchema>

// ---------------------------------------------------------------------------
// Filter/Query Schema
// ---------------------------------------------------------------------------

export const getArReceiptsFilterSchema = z.object({
  // Scope
  customerId: z.string().uuid().optional(),

  // Status
  status: arReceiptStatusEnum.optional(),
  statusIn: z.array(arReceiptStatusEnum).optional(),

  // Date filters
  receiptDateFrom: z.coerce.date().optional(),
  receiptDateTo: z.coerce.date().optional(),

  // Amount filters
  minAmount: z.number().optional(),
  maxAmount: z.number().optional(),

  // Payment method
  paymentMethod: paymentMethodEnum.optional(),

  // Has unapplied
  hasUnappliedAmount: z.boolean().optional(),

  // Search
  search: z.string().optional(), // Search receipt number, reference, customer

  // Pagination
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(25),

  // Sorting
  sortBy: z.enum([
    'receiptDate',
    'receiptNumber',
    'amount',
    'status',
    'createdAt',
  ]).default('receiptDate'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})
export type GetArReceiptsFilter = z.infer<typeof getArReceiptsFilterSchema>

// ---------------------------------------------------------------------------
// Output Schema
// ---------------------------------------------------------------------------

export const arReceiptAllocationOutputSchema = z.object({
  id: z.string().uuid(),
  receiptId: z.string().uuid(),
  openItemId: z.string().nullable(),
  invoiceNumber: z.string().nullable(),
  allocatedAmount: z.number(),
  allocatedAmountBase: z.number().nullable(),
  exchangeDifference: z.number().nullable(),
  createdAt: z.coerce.date(),
})
export type ArReceiptAllocationOutput = z.infer<typeof arReceiptAllocationOutputSchema>

export const arReceiptOutputSchema = z.object({
  id: z.string().uuid(),
  agencyId: z.string(),
  subAccountId: z.string().nullable(),
  receiptNumber: z.string(),
  reference: z.string().nullable(),
  customerId: z.string(),
  receiptDate: z.coerce.date(),
  paymentMethod: z.string(),
  status: z.string(),
  currencyCode: z.string(),
  amount: z.number(),
  amountBase: z.number().nullable(),
  exchangeRate: z.number(),
  exchangeDifference: z.number().nullable(),
  earlyPaymentDiscountTotal: z.number().nullable(),
  withholdingTaxTotal: z.number().nullable(),
  checkNumber: z.string().nullable(),
  checkDate: z.coerce.date().nullable(),
  depositBankAccountId: z.string().nullable(),
  depositReference: z.string().nullable(),
  depositDate: z.coerce.date().nullable(),
  bankName: z.string().nullable(),
  bankReference: z.string().nullable(),
  submittedAt: z.coerce.date().nullable(),
  submittedBy: z.string().nullable(),
  approvedAt: z.coerce.date().nullable(),
  approvedBy: z.string().nullable(),
  rejectedAt: z.coerce.date().nullable(),
  rejectedBy: z.string().nullable(),
  rejectionReason: z.string().nullable(),
  depositedAt: z.coerce.date().nullable(),
  depositedBy: z.string().nullable(),
  clearedAt: z.coerce.date().nullable(),
  clearedBy: z.string().nullable(),
  bouncedAt: z.coerce.date().nullable(),
  bouncedBy: z.string().nullable(),
  bounceReason: z.string().nullable(),
  voidedAt: z.coerce.date().nullable(),
  voidedBy: z.string().nullable(),
  voidReason: z.string().nullable(),
  journalEntryId: z.string().nullable(),
  clearingDocumentNumber: z.string().nullable(),
  unappliedAmount: z.number().nullable(),
  externalRefs: z.record(z.string(), z.string()).nullable(),
  metadata: z.record(z.string(), z.unknown()).nullable(),
  notes: z.string().nullable(),
  createdAt: z.coerce.date(),
  createdBy: z.string(),
  updatedAt: z.coerce.date(),
  updatedBy: z.string().nullable(),

  // Relations (optional)
  ReceiptAllocations: z.array(arReceiptAllocationOutputSchema).optional(),
  Customer: z.object({
    id: z.string(),
    code: z.string(),
    name: z.string(),
  }).optional(),
})
export type ArReceiptOutput = z.infer<typeof arReceiptOutputSchema>
