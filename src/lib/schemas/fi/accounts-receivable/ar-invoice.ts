/**
 * FI-AR Invoice Schema
 *
 * Purpose:
 * - Validates AR invoice data from customers (revenue recognition)
 * - Composes from shared `invoiceDocumentCoreSchema`
 * - Adds AR-specific fields (customer binding, posting, dunning)
 * - Supports e-invoice generation and submission
 *
 * NOTE: This is the selling/issuing side of invoices (we send to customers).
 * For AP (purchasing side), see ap-invoice.ts
 */

import { z } from 'zod'

import {
  invoiceDocumentCoreSchema,
  matchPolicyEnum,
  matchStatusEnum,
} from '@/lib/schemas/shared/invoice-document'
import { eInvoiceFormatEnum, eInvoiceStatusEnum } from '@/lib/schemas/shared/e-invoice'

// ---------------------------------------------------------------------------
// Status Enum
// ---------------------------------------------------------------------------

export const arInvoiceStatusEnum = z.enum([
  'DRAFT',
  'PENDING_APPROVAL',
  'APPROVED',
  'SENT',           // Sent to customer
  'POSTED',         // Posted to GL
  'PARTIALLY_PAID',
  'PAID',
  'OVERDUE',
  'IN_DISPUTE',
  'WRITE_OFF',
  'VOID',
])
export type ArInvoiceStatus = z.infer<typeof arInvoiceStatusEnum>

// ---------------------------------------------------------------------------
// Sending/Delivery Status
// ---------------------------------------------------------------------------

export const deliveryStatusEnum = z.enum([
  'NOT_SENT',
  'PENDING',
  'SENT',
  'DELIVERED',
  'FAILED',
  'BOUNCED',
])
export type DeliveryStatus = z.infer<typeof deliveryStatusEnum>

export const deliveryMethodEnum = z.enum([
  'EMAIL',
  'EINVOICE',  // Electronic invoice (Peppol, MyInvois, etc.)
  'POSTAL',
  'PORTAL',    // Customer portal
  'API',       // Direct API delivery
])
export type DeliveryMethod = z.infer<typeof deliveryMethodEnum>

// ---------------------------------------------------------------------------
// Dunning Information
// ---------------------------------------------------------------------------

export const dunningInfoSchema = z.object({
  /** Current dunning level (0 = no dunning, 1+ = dunning in progress) */
  level: z.number().int().min(0).default(0),

  /** Date of last dunning notice */
  lastDunningDate: z.coerce.date().optional(),

  /** Date of next scheduled dunning */
  nextDunningDate: z.coerce.date().optional(),

  /** Block dunning for this invoice */
  dunningBlocked: z.boolean().default(false),
  dunningBlockReason: z.string().max(500).optional(),

  /** Number of dunning notices sent */
  noticeCount: z.number().int().min(0).default(0),
})
export type DunningInfo = z.infer<typeof dunningInfoSchema>

// ---------------------------------------------------------------------------
// Refinements
// ---------------------------------------------------------------------------

const refineArInvoiceRequiredFields = (
  v: {
    customerId?: unknown
    customerCode?: unknown
  },
  ctx: z.RefinementCtx,
) => {
  // For AR invoices we require customer binding
  if (!v.customerId && !v.customerCode) {
    ctx.addIssue({
      code: 'custom',
      path: ['customerId'],
      message: 'AR invoice must include customerId or customerCode',
    })
  }
}

// ---------------------------------------------------------------------------
// AR Invoice Base Schema
// ---------------------------------------------------------------------------

export const arInvoiceSchemaBase = invoiceDocumentCoreSchema
  .extend({
    // Identity / scoping
    id: z.string().uuid(),
    agencyId: z.string().uuid(),
    subAccountId: z.string().uuid().optional().nullable(),

    // Customer binding
    customerId: z.string().uuid().optional().nullable(),
    customerCode: z.string().min(1).max(64).optional(),

    // Workflow
    status: arInvoiceStatusEnum.default('DRAFT'),

    /**
     * Posting template key for FI-AR → FI-GL posting.
     */
    postingTemplateKey: z
      .string()
      .min(1)
      .max(64)
      .regex(/^[A-Z0-9_\-]+$/i)
      .optional(),

    // Customer reference (PO number, etc.)
    customerReference: z.string().max(64).optional(),
    customerPurchaseOrder: z.string().max(64).optional(),

    // Payment terms
    paymentTermDays: z.number().int().nonnegative().optional(),
    earlyPaymentDiscountPercent: z.number().min(0).max(100).optional(),
    earlyPaymentDiscountDays: z.number().int().nonnegative().optional(),

    // Delivery
    deliveryMethod: deliveryMethodEnum.optional(),
    deliveryStatus: deliveryStatusEnum.default('NOT_SENT'),
    deliveredAt: z.coerce.date().optional(),
    deliveryReference: z.string().max(255).optional(), // Email message ID, e-invoice submission ID

    // E-Invoice specific (uses shared enums for consistency)
    eInvoiceFormat: eInvoiceFormatEnum.optional(),
    eInvoiceSubmissionId: z.string().max(255).optional(),
    eInvoiceSubmissionStatus: eInvoiceStatusEnum.optional(),

    // Dunning
    dunning: dunningInfoSchema.optional(),

    // Dispute handling
    inDispute: z.boolean().default(false),
    disputeReason: z.string().max(500).optional(),
    disputeOpenedAt: z.coerce.date().optional(),
    disputeResolvedAt: z.coerce.date().optional(),

    // Collected/Paid amounts (for partial payments)
    paidAmount: z.number().nonnegative().optional(),
    paidAmountBase: z.number().nonnegative().optional(),
    remainingAmount: z.number().nonnegative().optional(),
    lastPaymentDate: z.coerce.date().optional(),

    // Write-off
    writtenOffAmount: z.number().nonnegative().optional(),
    writtenOffAt: z.coerce.date().optional(),
    writtenOffBy: z.string().min(1).optional(),
    writeOffReason: z.string().max(500).optional(),

    // Workflow timestamps
    submittedAt: z.coerce.date().optional(),
    submittedBy: z.string().min(1).optional(),
    approvedAt: z.coerce.date().optional(),
    approvedBy: z.string().min(1).optional(),
    rejectedAt: z.coerce.date().optional(),
    rejectedBy: z.string().min(1).optional(),
    rejectionReason: z.string().max(500).optional(),
    sentAt: z.coerce.date().optional(),
    sentBy: z.string().min(1).optional(),
    postedAt: z.coerce.date().optional(),
    postedBy: z.string().min(1).optional(),
    voidedAt: z.coerce.date().optional(),
    voidedBy: z.string().min(1).optional(),
    voidReason: z.string().max(500).optional(),

    // Journal linkage
    journalEntryId: z.string().uuid().optional().nullable(),

    // Open item linkage
    openItemId: z.string().uuid().optional().nullable(),

    // Audit
    createdAt: z.coerce.date().optional(),
    createdBy: z.string().min(1).optional(),
    updatedAt: z.coerce.date().optional(),
    updatedBy: z.string().min(1).optional(),
  })
  .strict()

export const arInvoiceSchema = arInvoiceSchemaBase
  .superRefine(refineArInvoiceRequiredFields)

export type ArInvoice = z.infer<typeof arInvoiceSchema>

/** Create input: omits server-owned fields */
export const arInvoiceCreateSchema = arInvoiceSchemaBase
  .omit({
    id: true,
    deliveryStatus: true,
    deliveredAt: true,
    deliveryReference: true,
    eInvoiceSubmissionId: true,
    eInvoiceSubmissionStatus: true,
    paidAmount: true,
    paidAmountBase: true,
    remainingAmount: true,
    lastPaymentDate: true,
    writtenOffAmount: true,
    writtenOffAt: true,
    writtenOffBy: true,
    writeOffReason: true,
    journalEntryId: true,
    openItemId: true,
    createdAt: true,
    createdBy: true,
    updatedAt: true,
    updatedBy: true,
    // Workflow fields
    submittedAt: true,
    submittedBy: true,
    approvedAt: true,
    approvedBy: true,
    rejectedAt: true,
    rejectedBy: true,
    rejectionReason: true,
    sentAt: true,
    sentBy: true,
    postedAt: true,
    postedBy: true,
    voidedAt: true,
    voidedBy: true,
    voidReason: true,
  })
  .superRefine(refineArInvoiceRequiredFields)

export type ArInvoiceCreate = z.infer<typeof arInvoiceCreateSchema>

/** Update input: partial update, id required */
export const arInvoiceUpdateSchema = arInvoiceSchemaBase
  .partial()
  .extend({
    id: z.string().uuid(),
  })

export type ArInvoiceUpdate = z.infer<typeof arInvoiceUpdateSchema>

// ---------------------------------------------------------------------------
// Action Schemas
// ---------------------------------------------------------------------------

export const submitArInvoiceSchema = z.object({
  id: z.string().uuid(),
})
export type SubmitArInvoiceInput = z.infer<typeof submitArInvoiceSchema>

export const approveArInvoiceSchema = z.object({
  id: z.string().uuid(),
  notes: z.string().max(500).optional(),
})
export type ApproveArInvoiceInput = z.infer<typeof approveArInvoiceSchema>

export const rejectArInvoiceSchema = z.object({
  id: z.string().uuid(),
  reason: z.string().min(1, 'Rejection reason is required').max(500),
})
export type RejectArInvoiceInput = z.infer<typeof rejectArInvoiceSchema>

export const sendArInvoiceSchema = z.object({
  id: z.string().uuid(),
  method: deliveryMethodEnum.optional(),
  recipientEmail: z.string().email().optional(),
  notes: z.string().max(500).optional(),
})
export type SendArInvoiceInput = z.infer<typeof sendArInvoiceSchema>

export const postArInvoiceSchema = z.object({
  id: z.string().uuid(),
})
export type PostArInvoiceInput = z.infer<typeof postArInvoiceSchema>

export const openDisputeSchema = z.object({
  id: z.string().uuid(),
  reason: z.string().min(1, 'Dispute reason is required').max(500),
})
export type OpenDisputeInput = z.infer<typeof openDisputeSchema>

export const resolveDisputeSchema = z.object({
  id: z.string().uuid(),
  resolution: z.string().min(1).max(500),
  adjustmentAmount: z.number().optional(), // If credit/adjustment needed
})
export type ResolveDisputeInput = z.infer<typeof resolveDisputeSchema>

export const writeOffArInvoiceSchema = z.object({
  id: z.string().uuid(),
  amount: z.number().positive(),
  reason: z.string().min(1, 'Write-off reason is required').max(500),
})
export type WriteOffArInvoiceInput = z.infer<typeof writeOffArInvoiceSchema>

export const voidArInvoiceSchema = z.object({
  id: z.string().uuid(),
  reason: z.string().min(1, 'Void reason is required').max(500),
})
export type VoidArInvoiceInput = z.infer<typeof voidArInvoiceSchema>

// ---------------------------------------------------------------------------
// Filter/Query Schema
// ---------------------------------------------------------------------------

export const getArInvoicesFilterSchema = z.object({
  // Scope
  customerId: z.string().uuid().optional(),

  // Status
  status: arInvoiceStatusEnum.optional(),
  statusIn: z.array(arInvoiceStatusEnum).optional(),

  // Date filters
  issueDateFrom: z.coerce.date().optional(),
  issueDateTo: z.coerce.date().optional(),
  dueDateFrom: z.coerce.date().optional(),
  dueDateTo: z.coerce.date().optional(),

  // Amount filters
  minAmount: z.number().optional(),
  maxAmount: z.number().optional(),

  // Overdue only
  overdueOnly: z.boolean().optional(),

  // Dunning
  dunningLevelGte: z.number().int().min(0).optional(),

  // Dispute
  inDispute: z.boolean().optional(),

  // Delivery
  deliveryStatus: deliveryStatusEnum.optional(),

  // Search
  search: z.string().optional(),

  // Pagination
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(25),

  // Sorting
  sortBy: z.enum([
    'issueDate',
    'dueDate',
    'documentNumber',
    'status',
    'remainingAmount',
    'createdAt',
  ]).default('issueDate'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})
export type GetArInvoicesFilter = z.infer<typeof getArInvoicesFilterSchema>

// ---------------------------------------------------------------------------
// Output Schema
// ---------------------------------------------------------------------------

export const arInvoiceOutputSchema = z.object({
  id: z.string().uuid(),
  agencyId: z.string(),
  subAccountId: z.string().nullable(),
  kind: z.string(),
  documentNumber: z.string(),
  issueDate: z.coerce.date(),
  dueDate: z.coerce.date().nullable(),
  customerId: z.string().nullable(),
  customerCode: z.string().nullable(),
  status: z.string(),
  currency: z.string(),
  totals: z.object({
    netAmount: z.number(),
    taxAmount: z.number(),
    grossAmount: z.number(),
    currency: z.string(),
  }),
  customerReference: z.string().nullable(),
  customerPurchaseOrder: z.string().nullable(),
  paymentTermDays: z.number().nullable(),
  deliveryMethod: z.string().nullable(),
  deliveryStatus: z.string(),
  deliveredAt: z.coerce.date().nullable(),
  eInvoiceFormat: z.string().nullable(),
  eInvoiceSubmissionStatus: z.string().nullable(),
  dunning: dunningInfoSchema.nullable(),
  inDispute: z.boolean(),
  disputeReason: z.string().nullable(),
  paidAmount: z.number().nullable(),
  remainingAmount: z.number().nullable(),
  lastPaymentDate: z.coerce.date().nullable(),
  writtenOffAmount: z.number().nullable(),
  journalEntryId: z.string().nullable(),
  openItemId: z.string().nullable(),
  // Workflow
  submittedAt: z.coerce.date().nullable(),
  submittedBy: z.string().nullable(),
  approvedAt: z.coerce.date().nullable(),
  approvedBy: z.string().nullable(),
  sentAt: z.coerce.date().nullable(),
  sentBy: z.string().nullable(),
  postedAt: z.coerce.date().nullable(),
  postedBy: z.string().nullable(),
  voidedAt: z.coerce.date().nullable(),
  voidedBy: z.string().nullable(),
  voidReason: z.string().nullable(),
  createdAt: z.coerce.date(),
  createdBy: z.string(),
  updatedAt: z.coerce.date(),
  updatedBy: z.string().nullable(),

  // Relations (optional)
  Customer: z.object({
    id: z.string(),
    code: z.string(),
    name: z.string(),
  }).optional(),
  lines: z.array(z.object({
    lineNo: z.number(),
    description: z.string(),
    quantity: z.number(),
    unitPrice: z.number(),
    lineNetAmount: z.number().optional(),
    taxAmount: z.number().optional(),
    lineGrossAmount: z.number().optional(),
  })).optional(),
})
export type ArInvoiceOutput = z.infer<typeof arInvoiceOutputSchema>
