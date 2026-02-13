/**
 * FI-AP Payment Schema
 *
 * Purpose:
 * - Validates AP payment data for vendor payments
 * - Aligns with Prisma `ApPayment` and `ApPaymentAllocation` models
 * - Supports multiple allocation to open items/invoices
 * - Handles FX differences and withholding tax
 *
 * Prisma alignment (finance schema):
 * - ApPayment: agencyId, subAccountId?, paymentNumber, vendorId, paymentDate,
 *              paymentMethod, status, currencyCode, amount, amountBase, exchangeRate,
 *              bank details, workflow timestamps, journalEntryId
 * - ApPaymentAllocation: paymentId, openItemId, allocatedAmount, etc.
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

export const apPaymentStatusEnum = z.enum([
  'DRAFT',
  'PENDING_APPROVAL',
  'APPROVED',
  'SCHEDULED',
  'PROCESSING',
  'COMPLETED',
  'FAILED',
  'VOID',
])
export type ApPaymentStatus = z.infer<typeof apPaymentStatusEnum>

// ---------------------------------------------------------------------------
// Payment Allocation (AP-specific)
// ---------------------------------------------------------------------------

export const apPaymentAllocationSchema = paymentAllocationBaseSchema.extend({
  /** Vendor invoice document number */
  vendorInvoiceNumber: z.string().min(1).max(64).optional(),

  /** PO reference (for matching) */
  purchaseOrderNumber: z.string().min(1).max(64).optional(),
})
export type ApPaymentAllocation = z.infer<typeof apPaymentAllocationSchema>

// ---------------------------------------------------------------------------
// AP Payment Base Schema
// ---------------------------------------------------------------------------

const apPaymentBaseSchema = z.object({
  // Identity
  id: z.string().uuid(),

  // Multi-tenant scope
  agencyId: z.string().uuid(),
  subAccountId: z.string().uuid().optional().nullable(),

  // Payment identification
  paymentNumber: z.string().min(1).max(64),
  reference: z.string().min(1).max(255).optional(),

  // Vendor
  vendorId: z.string().uuid(),
  vendorCode: z.string().min(1).max(64).optional(), // For display/lookup

  // Payment details
  paymentDate: z.coerce.date(),
  paymentMethod: paymentMethodEnum,
  status: apPaymentStatusEnum.default('DRAFT'),

  // Amounts
  currencyCode: currencyCodeSchema.default('MYR'),
  amount: z.number().positive(),
  amountBase: z.number().positive().optional(), // Base currency (calculated)
  exchangeRate: z.number().positive().default(1),
  exchangeDifference: z.number().optional(), // FX difference on payment

  // Deductions
  discountTaken: z.number().min(0).optional(),
  withholdingTax: z.number().min(0).optional(),

  // Bank details
  bank: bankReferenceSchema.optional(),

  // Scheduling
  scheduledDate: z.coerce.date().optional(),
  scheduledBy: z.string().min(1).optional(),

  // Workflow
  submittedAt: z.coerce.date().optional(),
  submittedBy: z.string().min(1).optional(),
  approvedAt: z.coerce.date().optional(),
  approvedBy: z.string().min(1).optional(),
  rejectedAt: z.coerce.date().optional(),
  rejectedBy: z.string().min(1).optional(),
  rejectionReason: z.string().max(500).optional(),
  processedAt: z.coerce.date().optional(),
  processedBy: z.string().min(1).optional(),
  voidedAt: z.coerce.date().optional(),
  voidedBy: z.string().min(1).optional(),
  voidReason: z.string().max(500).optional(),

  // Journal linkage
  journalEntryId: z.string().uuid().optional().nullable(),
  clearingDocumentNumber: z.string().min(1).max(64).optional(),

  // Allocations
  allocations: z.array(apPaymentAllocationSchema).min(1).optional(),

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

const refineApPayment = (
  v: {
    amount?: number
    allocations?: { allocatedAmount: number }[]
  },
  ctx: z.RefinementCtx,
) => {
  // Validate that allocations sum matches payment amount (if allocations provided)
  if (v.amount && v.allocations && v.allocations.length > 0) {
    const allocatedTotal = v.allocations.reduce((sum, a) => sum + (a.allocatedAmount || 0), 0)
    if (Math.abs(v.amount - allocatedTotal) > 0.01) {
      ctx.addIssue({
        code: 'custom',
        path: ['allocations'],
        message: `Allocation total (${allocatedTotal}) must equal payment amount (${v.amount})`,
      })
    }
  }
}

// ---------------------------------------------------------------------------
// Exported Schemas
// ---------------------------------------------------------------------------

export const apPaymentSchema = apPaymentBaseSchema.superRefine(refineApPayment)
export type ApPayment = z.infer<typeof apPaymentSchema>

/** Create input: omits server-owned fields */
export const apPaymentCreateSchema = apPaymentBaseSchema
  .omit({
    id: true,
    paymentNumber: true, // Auto-generated
    amountBase: true, // Calculated
    exchangeDifference: true, // Calculated
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
    processedAt: true,
    processedBy: true,
    voidedAt: true,
    voidedBy: true,
    voidReason: true,
  })
  .extend({
    // Optional payment number override
    paymentNumber: z.string().min(1).max(64).optional(),
  })
  .superRefine(refineApPayment)

export type ApPaymentCreate = z.infer<typeof apPaymentCreateSchema>

/** Update input: partial update, id required */
export const apPaymentUpdateSchema = apPaymentBaseSchema
  .partial()
  .extend({
    id: z.string().uuid(),
  })
  .superRefine(refineApPayment)

export type ApPaymentUpdate = z.infer<typeof apPaymentUpdateSchema>

// ---------------------------------------------------------------------------
// Action Schemas
// ---------------------------------------------------------------------------

export const submitApPaymentSchema = z.object({
  id: z.string().uuid(),
})
export type SubmitApPaymentInput = z.infer<typeof submitApPaymentSchema>

export const approveApPaymentSchema = z.object({
  id: z.string().uuid(),
  notes: z.string().max(500).optional(),
})
export type ApproveApPaymentInput = z.infer<typeof approveApPaymentSchema>

export const rejectApPaymentSchema = z.object({
  id: z.string().uuid(),
  reason: z.string().min(1, 'Rejection reason is required').max(500),
})
export type RejectApPaymentInput = z.infer<typeof rejectApPaymentSchema>

export const scheduleApPaymentSchema = z.object({
  id: z.string().uuid(),
  scheduledDate: z.coerce.date(),
  notes: z.string().max(500).optional(),
})
export type ScheduleApPaymentInput = z.infer<typeof scheduleApPaymentSchema>

export const processApPaymentSchema = z.object({
  id: z.string().uuid(),
  bankReference: z.string().max(255).optional(),
  notes: z.string().max(500).optional(),
})
export type ProcessApPaymentInput = z.infer<typeof processApPaymentSchema>

export const voidApPaymentSchema = z.object({
  id: z.string().uuid(),
  reason: z.string().min(1, 'Void reason is required').max(500),
})
export type VoidApPaymentInput = z.infer<typeof voidApPaymentSchema>

// ---------------------------------------------------------------------------
// Filter/Query Schema
// ---------------------------------------------------------------------------

export const getApPaymentsFilterSchema = z.object({
  // Scope
  vendorId: z.string().uuid().optional(),
  
  // Status
  status: apPaymentStatusEnum.optional(),
  statusIn: z.array(apPaymentStatusEnum).optional(),

  // Date filters
  paymentDateFrom: z.coerce.date().optional(),
  paymentDateTo: z.coerce.date().optional(),

  // Amount filters
  minAmount: z.number().optional(),
  maxAmount: z.number().optional(),

  // Payment method
  paymentMethod: paymentMethodEnum.optional(),

  // Search
  search: z.string().optional(), // Search payment number, reference, vendor

  // Pagination
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(25),

  // Sorting
  sortBy: z.enum([
    'paymentDate',
    'paymentNumber',
    'amount',
    'status',
    'createdAt',
  ]).default('paymentDate'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})
export type GetApPaymentsFilter = z.infer<typeof getApPaymentsFilterSchema>

// ---------------------------------------------------------------------------
// Output Schema
// ---------------------------------------------------------------------------

export const apPaymentAllocationOutputSchema = z.object({
  id: z.string().uuid(),
  paymentId: z.string().uuid(),
  openItemId: z.string().nullable(),
  invoiceNumber: z.string().nullable(),
  allocatedAmount: z.number(),
  allocatedAmountBase: z.number().nullable(),
  exchangeDifference: z.number().nullable(),
  createdAt: z.coerce.date(),
})
export type ApPaymentAllocationOutput = z.infer<typeof apPaymentAllocationOutputSchema>

export const apPaymentOutputSchema = z.object({
  id: z.string().uuid(),
  agencyId: z.string(),
  subAccountId: z.string().nullable(),
  paymentNumber: z.string(),
  reference: z.string().nullable(),
  vendorId: z.string(),
  paymentDate: z.coerce.date(),
  paymentMethod: z.string(),
  status: z.string(),
  currencyCode: z.string(),
  amount: z.number(),
  amountBase: z.number().nullable(),
  exchangeRate: z.number(),
  exchangeDifference: z.number().nullable(),
  bankAccountId: z.string().nullable(),
  bankName: z.string().nullable(),
  bankAccount: z.string().nullable(),
  bankReference: z.string().nullable(),
  submittedAt: z.coerce.date().nullable(),
  submittedBy: z.string().nullable(),
  approvedAt: z.coerce.date().nullable(),
  approvedBy: z.string().nullable(),
  rejectedAt: z.coerce.date().nullable(),
  rejectedBy: z.string().nullable(),
  rejectionReason: z.string().nullable(),
  processedAt: z.coerce.date().nullable(),
  processedBy: z.string().nullable(),
  voidedAt: z.coerce.date().nullable(),
  voidedBy: z.string().nullable(),
  voidReason: z.string().nullable(),
  journalEntryId: z.string().nullable(),
  clearingDocumentNumber: z.string().nullable(),
  externalRefs: z.record(z.string(), z.string()).nullable(),
  metadata: z.record(z.string(), z.unknown()).nullable(),
  notes: z.string().nullable(),
  createdAt: z.coerce.date(),
  createdBy: z.string(),
  updatedAt: z.coerce.date(),
  updatedBy: z.string().nullable(),

  // Relations (optional)
  PaymentAllocations: z.array(apPaymentAllocationOutputSchema).optional(),
  Vendor: z.object({
    id: z.string(),
    code: z.string(),
    name: z.string(),
  }).optional(),
})
export type ApPaymentOutput = z.infer<typeof apPaymentOutputSchema>
