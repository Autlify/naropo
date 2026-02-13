/**
 * FI-AP Credit Note Schema
 *
 * Purpose:
 * - Validates AP credit note/debit note data
 * - Credit notes reduce vendor liability (vendor gives us credit)
 * - Debit notes increase vendor liability (we charge vendor)
 * - Uses shared invoice-document schema as base
 * - Supports matching to original invoices
 *
 * NOTE: AP Credit Notes use the shared `invoiceDocumentCoreSchema` with
 * kind = 'CREDIT_NOTE' or 'DEBIT_NOTE'. This file provides AP-specific
 * extensions and workflow handling.
 */

import { z } from 'zod'
import {
  invoiceDocumentCoreSchema,
  documentKindEnum,
} from '@/lib/schemas/shared/invoice-document'

// ---------------------------------------------------------------------------
// Status Enum
// ---------------------------------------------------------------------------

export const apCreditNoteStatusEnum = z.enum([
  'DRAFT',
  'RECEIVED',
  'PENDING_APPROVAL',
  'APPROVED',
  'POSTED',
  'APPLIED', // Applied to original invoice(s)
  'VOID',
])
export type ApCreditNoteStatus = z.infer<typeof apCreditNoteStatusEnum>

// ---------------------------------------------------------------------------
// Application to Invoices
// ---------------------------------------------------------------------------

export const creditNoteApplicationSchema = z.object({
  /** Original invoice open item ID */
  openItemId: z.string().uuid().optional().nullable(),

  /** Original invoice number (when open item not linked) */
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
export type CreditNoteApplication = z.infer<typeof creditNoteApplicationSchema>

// ---------------------------------------------------------------------------
// AP Credit Note Base Schema
// ---------------------------------------------------------------------------

const apCreditNoteBaseSchema = invoiceDocumentCoreSchema
  .extend({
    // Identity
    id: z.string().uuid(),

    // Multi-tenant scope
    agencyId: z.string().uuid(),
    subAccountId: z.string().uuid().optional().nullable(),

    // Vendor binding
    vendorId: z.string().uuid().optional().nullable(),
    vendorCode: z.string().min(1).max(64).optional(),

    // Override kind to only allow credit/debit notes
    kind: z.enum(['CREDIT_NOTE', 'DEBIT_NOTE']),

    // Workflow status
    status: apCreditNoteStatusEnum.default('DRAFT'),

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
    applications: z.array(creditNoteApplicationSchema).optional(),
    remainingAmount: z.number().nonnegative().optional(), // Unapplied amount

    // Workflow timestamps
    receivedAt: z.coerce.date().optional(),
    receivedBy: z.string().min(1).optional(),
    approvedAt: z.coerce.date().optional(),
    approvedBy: z.string().min(1).optional(),
    rejectedAt: z.coerce.date().optional(),
    rejectedBy: z.string().min(1).optional(),
    rejectionReason: z.string().max(500).optional(),
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

const refineApCreditNote = (
  v: {
    vendorId?: unknown
    vendorCode?: unknown
  },
  ctx: z.RefinementCtx,
) => {
  // Require vendor binding
  if (!v.vendorId && !v.vendorCode) {
    ctx.addIssue({
      code: 'custom',
      path: ['vendorId'],
      message: 'AP credit note must include vendorId or vendorCode',
    })
  }
}

// ---------------------------------------------------------------------------
// Exported Schemas
// ---------------------------------------------------------------------------

export const apCreditNoteSchema = apCreditNoteBaseSchema.superRefine(refineApCreditNote)
export type ApCreditNote = z.infer<typeof apCreditNoteSchema>

/** Create input: omits server-owned fields */
export const apCreditNoteCreateSchema = apCreditNoteBaseSchema
  .omit({
    id: true,
    remainingAmount: true, // Calculated
    journalEntryId: true,
    createdAt: true,
    createdBy: true,
    updatedAt: true,
    updatedBy: true,
    // Workflow fields set by actions
    receivedAt: true,
    receivedBy: true,
    approvedAt: true,
    approvedBy: true,
    rejectedAt: true,
    rejectedBy: true,
    rejectionReason: true,
    postedAt: true,
    postedBy: true,
    appliedAt: true,
    appliedBy: true,
    voidedAt: true,
    voidedBy: true,
    voidReason: true,
  })
  .superRefine(refineApCreditNote)

export type ApCreditNoteCreate = z.infer<typeof apCreditNoteCreateSchema>

/** Update input: partial update, id required */
export const apCreditNoteUpdateSchema = apCreditNoteBaseSchema
  .partial()
  .extend({
    id: z.string().uuid(),
  })

export type ApCreditNoteUpdate = z.infer<typeof apCreditNoteUpdateSchema>

// ---------------------------------------------------------------------------
// Action Schemas
// ---------------------------------------------------------------------------

export const submitApCreditNoteSchema = z.object({
  id: z.string().uuid(),
})
export type SubmitApCreditNoteInput = z.infer<typeof submitApCreditNoteSchema>

export const approveApCreditNoteSchema = z.object({
  id: z.string().uuid(),
  notes: z.string().max(500).optional(),
})
export type ApproveApCreditNoteInput = z.infer<typeof approveApCreditNoteSchema>

export const rejectApCreditNoteSchema = z.object({
  id: z.string().uuid(),
  reason: z.string().min(1, 'Rejection reason is required').max(500),
})
export type RejectApCreditNoteInput = z.infer<typeof rejectApCreditNoteSchema>

export const postApCreditNoteSchema = z.object({
  id: z.string().uuid(),
})
export type PostApCreditNoteInput = z.infer<typeof postApCreditNoteSchema>

/** Apply credit note to invoice(s) */
export const applyApCreditNoteSchema = z.object({
  id: z.string().uuid(),
  applications: z.array(creditNoteApplicationSchema).min(1),
})
export type ApplyApCreditNoteInput = z.infer<typeof applyApCreditNoteSchema>

export const voidApCreditNoteSchema = z.object({
  id: z.string().uuid(),
  reason: z.string().min(1, 'Void reason is required').max(500),
})
export type VoidApCreditNoteInput = z.infer<typeof voidApCreditNoteSchema>

// ---------------------------------------------------------------------------
// Filter/Query Schema
// ---------------------------------------------------------------------------

export const getApCreditNotesFilterSchema = z.object({
  // Scope
  vendorId: z.string().uuid().optional(),

  // Kind
  kind: z.enum(['CREDIT_NOTE', 'DEBIT_NOTE']).optional(),

  // Status
  status: apCreditNoteStatusEnum.optional(),
  statusIn: z.array(apCreditNoteStatusEnum).optional(),

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
export type GetApCreditNotesFilter = z.infer<typeof getApCreditNotesFilterSchema>

// ---------------------------------------------------------------------------
// Output Schema
// ---------------------------------------------------------------------------

export const apCreditNoteApplicationOutputSchema = z.object({
  id: z.string().uuid(),
  creditNoteId: z.string().uuid(),
  openItemId: z.string().nullable(),
  invoiceNumber: z.string(),
  appliedAmount: z.number(),
  appliedAmountBase: z.number().nullable(),
  exchangeDifference: z.number().nullable(),
  appliedAt: z.coerce.date(),
})
export type ApCreditNoteApplicationOutput = z.infer<typeof apCreditNoteApplicationOutputSchema>

export const apCreditNoteOutputSchema = z.object({
  id: z.string().uuid(),
  agencyId: z.string(),
  subAccountId: z.string().nullable(),
  kind: z.string(),
  documentNumber: z.string(),
  issueDate: z.coerce.date(),
  vendorId: z.string().nullable(),
  vendorCode: z.string().nullable(),
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
  journalEntryId: z.string().nullable(),
  receivedAt: z.coerce.date().nullable(),
  receivedBy: z.string().nullable(),
  approvedAt: z.coerce.date().nullable(),
  approvedBy: z.string().nullable(),
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
  Applications: z.array(apCreditNoteApplicationOutputSchema).optional(),
  Vendor: z.object({
    id: z.string(),
    code: z.string(),
    name: z.string(),
  }).optional(),
})
export type ApCreditNoteOutput = z.infer<typeof apCreditNoteOutputSchema>
