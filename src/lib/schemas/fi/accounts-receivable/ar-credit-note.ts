/**
 * FI-AR Credit Note Schema
 *
 * Purpose:
 * - Validates AR credit note/debit note data
 * - Credit notes reduce customer receivable (we give customer credit)
 * - Debit notes increase customer receivable (we charge customer more)
 * - Uses shared invoice-document schema as base
 * - Supports matching to original invoices
 *
 * NOTE: AR Credit Notes use the shared `invoiceDocumentCoreSchema` with
 * kind = 'CREDIT_NOTE' or 'DEBIT_NOTE'. This file provides AR-specific
 * extensions and workflow handling.
 */

import { z } from 'zod'
import {
  invoiceDocumentCoreSchema,
} from '@/lib/schemas/shared/invoice-document'
import { deliveryMethodEnum, deliveryStatusEnum } from './ar-invoice'

// ---------------------------------------------------------------------------
// Status Enum
// ---------------------------------------------------------------------------

export const arCreditNoteStatusEnum = z.enum([
  'DRAFT',
  'PENDING_APPROVAL',
  'APPROVED',
  'SENT',     // Sent to customer
  'POSTED',   // Posted to GL
  'APPLIED',  // Applied to original invoice(s)
  'VOID',
])
export type ArCreditNoteStatus = z.infer<typeof arCreditNoteStatusEnum>

// ---------------------------------------------------------------------------
// Application to Invoices
// ---------------------------------------------------------------------------

export const arCreditNoteApplicationSchema = z.object({
  /** Original invoice open item ID */
  openItemId: z.string().uuid().optional().nullable(),

  /** Original invoice number */
  invoiceNumber: z.string().min(1).max(64),

  /** Amount applied from credit note */
  appliedAmount: z.number().nonnegative(),

  /** Base currency amount */
  appliedAmountBase: z.number().nonnegative().optional(),

  /** FX difference on application */
  exchangeDifference: z.number().optional(),

  /** Application date */
  appliedAt: z.coerce.date().optional(),
})
export type ArCreditNoteApplication = z.infer<typeof arCreditNoteApplicationSchema>

// ---------------------------------------------------------------------------
// AR Credit Note Base Schema
// ---------------------------------------------------------------------------

const arCreditNoteBaseSchema = invoiceDocumentCoreSchema
  .extend({
    // Identity
    id: z.string().uuid(),

    // Multi-tenant scope
    agencyId: z.string().uuid(),
    subAccountId: z.string().uuid().optional().nullable(),

    // Customer binding
    customerId: z.string().uuid().optional().nullable(),
    customerCode: z.string().min(1).max(64).optional(),

    // Override kind to only allow credit/debit notes
    kind: z.enum(['CREDIT_NOTE', 'DEBIT_NOTE']),

    // Workflow status
    status: arCreditNoteStatusEnum.default('DRAFT'),

    // Reference to original invoice(s) being credited
    originalInvoiceNumbers: z.array(z.string().min(1).max(64)).optional(),

    // Reason for credit/debit
    reasonCode: z.string().min(1).max(64).optional(),
    reasonDescription: z.string().max(500).optional(),

    // Posting template
    postingTemplateKey: z
      .string()
      .min(1)
      .max(64)
      .regex(/^[A-Z0-9_\-]+$/i)
      .optional(),

    // Application to invoices
    applications: z.array(arCreditNoteApplicationSchema).optional(),
    remainingAmount: z.number().nonnegative().optional(), // Unapplied amount

    // Delivery
    deliveryMethod: deliveryMethodEnum.optional(),
    deliveryStatus: deliveryStatusEnum.default('NOT_SENT'),
    deliveredAt: z.coerce.date().optional(),
    deliveryReference: z.string().max(255).optional(),

    // E-Invoice specific
    eInvoiceFormat: z
      .enum([
        'UBL_2_1',
        'CII_D16B',
        'PEPPOL_BIS_3',
        'EN16931',
        'MYINVOIS',
        'ZATCA_FATOORA',
        'SGP_INVOICENOW',
        'FACTUR_X',
        'XRECHNUNG',
        'FatturaPA',
        'GST_EINVOICE',
      ])
      .optional(),
    eInvoiceSubmissionId: z.string().max(255).optional(),
    eInvoiceSubmissionStatus: z
      .enum(['PENDING', 'SUBMITTED', 'ACCEPTED', 'REJECTED', 'CANCELLED'])
      .optional(),

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
    appliedAt: z.coerce.date().optional(),
    appliedBy: z.string().min(1).optional(),
    voidedAt: z.coerce.date().optional(),
    voidedBy: z.string().min(1).optional(),
    voidReason: z.string().max(500).optional(),

    // Journal linkage
    journalEntryId: z.string().uuid().optional().nullable(),

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

const refineArCreditNote = (
  v: {
    customerId?: unknown
    customerCode?: unknown
  },
  ctx: z.RefinementCtx,
) => {
  // Require customer binding
  if (!v.customerId && !v.customerCode) {
    ctx.addIssue({
      code: 'custom',
      path: ['customerId'],
      message: 'AR credit note must include customerId or customerCode',
    })
  }
}

// ---------------------------------------------------------------------------
// Exported Schemas
// ---------------------------------------------------------------------------

export const arCreditNoteSchema = arCreditNoteBaseSchema.superRefine(refineArCreditNote)
export type ArCreditNote = z.infer<typeof arCreditNoteSchema>

/** Create input: omits server-owned fields */
export const arCreditNoteCreateSchema = arCreditNoteBaseSchema
  .omit({
    id: true,
    remainingAmount: true,
    deliveryStatus: true,
    deliveredAt: true,
    deliveryReference: true,
    eInvoiceSubmissionId: true,
    eInvoiceSubmissionStatus: true,
    journalEntryId: true,
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
    appliedAt: true,
    appliedBy: true,
    voidedAt: true,
    voidedBy: true,
    voidReason: true,
  })
  .superRefine(refineArCreditNote)

export type ArCreditNoteCreate = z.infer<typeof arCreditNoteCreateSchema>

/** Update input: partial update, id required */
export const arCreditNoteUpdateSchema = arCreditNoteBaseSchema
  .partial()
  .extend({
    id: z.string().uuid(),
  })

export type ArCreditNoteUpdate = z.infer<typeof arCreditNoteUpdateSchema>

// ---------------------------------------------------------------------------
// Action Schemas
// ---------------------------------------------------------------------------

export const submitArCreditNoteSchema = z.object({
  id: z.string().uuid(),
})
export type SubmitArCreditNoteInput = z.infer<typeof submitArCreditNoteSchema>

export const approveArCreditNoteSchema = z.object({
  id: z.string().uuid(),
  notes: z.string().max(500).optional(),
})
export type ApproveArCreditNoteInput = z.infer<typeof approveArCreditNoteSchema>

export const rejectArCreditNoteSchema = z.object({
  id: z.string().uuid(),
  reason: z.string().min(1, 'Rejection reason is required').max(500),
})
export type RejectArCreditNoteInput = z.infer<typeof rejectArCreditNoteSchema>

export const sendArCreditNoteSchema = z.object({
  id: z.string().uuid(),
  method: deliveryMethodEnum.optional(),
  recipientEmail: z.string().email().optional(),
  notes: z.string().max(500).optional(),
})
export type SendArCreditNoteInput = z.infer<typeof sendArCreditNoteSchema>

export const postArCreditNoteSchema = z.object({
  id: z.string().uuid(),
})
export type PostArCreditNoteInput = z.infer<typeof postArCreditNoteSchema>

/** Apply credit note to invoice(s) */
export const applyArCreditNoteSchema = z.object({
  id: z.string().uuid(),
  applications: z.array(arCreditNoteApplicationSchema).min(1),
})
export type ApplyArCreditNoteInput = z.infer<typeof applyArCreditNoteSchema>

export const voidArCreditNoteSchema = z.object({
  id: z.string().uuid(),
  reason: z.string().min(1, 'Void reason is required').max(500),
})
export type VoidArCreditNoteInput = z.infer<typeof voidArCreditNoteSchema>

// ---------------------------------------------------------------------------
// Filter/Query Schema
// ---------------------------------------------------------------------------

export const getArCreditNotesFilterSchema = z.object({
  // Scope
  customerId: z.string().uuid().optional(),

  // Kind
  kind: z.enum(['CREDIT_NOTE', 'DEBIT_NOTE']).optional(),

  // Status
  status: arCreditNoteStatusEnum.optional(),
  statusIn: z.array(arCreditNoteStatusEnum).optional(),

  // Date filters
  issueDateFrom: z.coerce.date().optional(),
  issueDateTo: z.coerce.date().optional(),

  // Amount filters
  minAmount: z.number().optional(),
  maxAmount: z.number().optional(),

  // Show only unapplied
  hasRemainingAmount: z.boolean().optional(),

  // Search
  search: z.string().optional(),

  // Pagination
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(25),

  // Sorting
  sortBy: z.enum([
    'issueDate',
    'documentNumber',
    'status',
    'createdAt',
  ]).default('issueDate'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})
export type GetArCreditNotesFilter = z.infer<typeof getArCreditNotesFilterSchema>

// ---------------------------------------------------------------------------
// Output Schema
// ---------------------------------------------------------------------------

export const arCreditNoteApplicationOutputSchema = z.object({
  id: z.string().uuid(),
  creditNoteId: z.string().uuid(),
  openItemId: z.string().nullable(),
  invoiceNumber: z.string(),
  appliedAmount: z.number(),
  appliedAmountBase: z.number().nullable(),
  exchangeDifference: z.number().nullable(),
  appliedAt: z.coerce.date(),
})
export type ArCreditNoteApplicationOutput = z.infer<typeof arCreditNoteApplicationOutputSchema>

export const arCreditNoteOutputSchema = z.object({
  id: z.string().uuid(),
  agencyId: z.string(),
  subAccountId: z.string().nullable(),
  kind: z.string(),
  documentNumber: z.string(),
  issueDate: z.coerce.date(),
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
  reasonCode: z.string().nullable(),
  reasonDescription: z.string().nullable(),
  originalInvoiceNumbers: z.array(z.string()).nullable(),
  remainingAmount: z.number().nullable(),
  deliveryMethod: z.string().nullable(),
  deliveryStatus: z.string(),
  deliveredAt: z.coerce.date().nullable(),
  eInvoiceFormat: z.string().nullable(),
  eInvoiceSubmissionStatus: z.string().nullable(),
  journalEntryId: z.string().nullable(),
  submittedAt: z.coerce.date().nullable(),
  submittedBy: z.string().nullable(),
  approvedAt: z.coerce.date().nullable(),
  approvedBy: z.string().nullable(),
  sentAt: z.coerce.date().nullable(),
  sentBy: z.string().nullable(),
  postedAt: z.coerce.date().nullable(),
  postedBy: z.string().nullable(),
  appliedAt: z.coerce.date().nullable(),
  appliedBy: z.string().nullable(),
  voidedAt: z.coerce.date().nullable(),
  voidedBy: z.string().nullable(),
  voidReason: z.string().nullable(),
  createdAt: z.coerce.date(),
  createdBy: z.string(),
  updatedAt: z.coerce.date(),
  updatedBy: z.string().nullable(),

  // Relations (optional)
  Applications: z.array(arCreditNoteApplicationOutputSchema).optional(),
  Customer: z.object({
    id: z.string(),
    code: z.string(),
    name: z.string(),
  }).optional(),
})
export type ArCreditNoteOutput = z.infer<typeof arCreditNoteOutputSchema>
