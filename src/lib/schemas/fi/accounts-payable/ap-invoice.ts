/**
 * FI-AP Invoice Schema (3-way matching ready)
 *
 * - Composes from shared `invoiceDocumentCoreSchema`
 * - Adds AP-specific fields (vendor binding, posting, statuses)
 * - Keeps 3-way fields optional; enforcement is expected to be entitlement/policy-based
 * - Supports receiving e-invoices from vendors
 */

import { z } from 'zod'

import {
  invoiceDocumentCoreSchema,
  matchPolicyEnum,
  matchStatusEnum,
} from '@/lib/schemas/shared/invoice-document'
import { eInvoiceFormatEnum, eInvoiceStatusEnum } from '@/lib/schemas/shared/e-invoice'

export const apInvoiceStatusEnum = z.enum([
  'DRAFT',
  'RECEIVED',
  'PENDING_APPROVAL',
  'APPROVED',
  'POSTED',
  'PARTIALLY_PAID',
  'PAID',
  'VOID',
])
export type ApInvoiceStatus = z.infer<typeof apInvoiceStatusEnum>

const refineApInvoiceMatching = (
  v: {
    matchPolicy?: unknown
    lines?: unknown
  },
  ctx: z.RefinementCtx,
) => {
  // If matchPolicy is THREE_WAY, line refs should exist (policy layer may enforce stricter).
  if (v.matchPolicy === 'THREE_WAY' && Array.isArray(v.lines)) {
    const hasMissing = v.lines.some((l) => {
      if (!l || typeof l !== 'object') return true
      const rec = l as Record<string, unknown>
      return !rec.purchaseOrderLineId && !rec.goodsReceiptLineId
    })

    if (hasMissing) {
      ctx.addIssue({
        code: 'custom',
        path: ['lines'],
        message:
          '3-way matching requires invoice lines to reference purchaseOrderLineId and/or goodsReceiptLineId',
      })
    }
  }
}

const refineApInvoiceRequiredFields = (
  v: {
    vendorId?: unknown
    vendorCode?: unknown
  },
  ctx: z.RefinementCtx,
) => {
  // For AP invoices we require vendor binding (id or code).
  if (!v.vendorId && !v.vendorCode) {
    ctx.addIssue({
      code: 'custom',
      path: ['vendorId'],
      message: 'AP invoice must include vendorId or vendorCode',
    })
  }
}

/**
 * AP invoice base (canonical shape used by UI/server).
 *
 * Note: Persisted model may live in finance tables later. This schema focuses on correctness and integration stability.
 */
export const apInvoiceSchemaBase = invoiceDocumentCoreSchema
  .extend({
    // Identity / scoping
    id: z.uuid(),
    agencyId: z.uuid(),
    subAccountId: z.uuid().optional().nullable(),

    // Vendor binding
    vendorId: z.uuid().optional().nullable(),
    vendorCode: z.string().min(1).max(64).optional(),

    // Workflow
    status: apInvoiceStatusEnum.default('DRAFT'),

    /**
     * Posting template key for FI-AP → FI-GL posting.
     * See: `src/lib/schemas/fi/general-ledger/invoice-posting-templates.ts`
     */
    postingTemplateKey: z
      .string()
      .min(1)
      .max(64)
      .regex(/^[A-Z0-9_\-]+$/i)
      .optional(),

    /**
     * When SCM module is enabled, these become important link points.
     * Keep optional for now; policy layer may require them for 3-way matching.
     */
    matchPolicy: matchPolicyEnum.optional(),
    matchStatus: matchStatusEnum.optional(),

    // ---------------------------------
    // E-Invoice fields (for receiving)
    // ---------------------------------

    /**
     * E-Invoice format of received invoice (if applicable).
     * Populated when invoice is received via e-invoice (Peppol, MyInvois, etc.)
     */
    eInvoiceFormat: eInvoiceFormatEnum.optional(),

    /** E-Invoice document ID from the sender/tax authority */
    eInvoiceDocumentId: z.string().max(255).optional(),

    /** E-Invoice reception status */
    eInvoiceReceptionStatus: eInvoiceStatusEnum.optional(),

    /** Original e-invoice file reference/URL */
    eInvoiceFileRef: z.string().max(500).optional(),

    /**
     * Operational/audit trail fields.
     * These can be written by workflow APIs (receive/approve/post/void) and
     * are valuable for ageing reports, controls, and debugging.
     */
    receivedAt: z.coerce.date().optional(),
    receivedBy: z.string().min(1).optional(),

    approvedAt: z.coerce.date().optional(),
    approvedBy: z.string().min(1).optional(),

    rejectedAt: z.coerce.date().optional(),
    rejectedBy: z.string().min(1).optional(),
    rejectionReason: z.string().max(500).optional(),

    postedAt: z.coerce.date().optional(),
    postedBy: z.string().min(1).optional(),

    voidedAt: z.coerce.date().optional(),
    voidedBy: z.string().min(1).optional(),
    voidReason: z.string().max(500).optional(),

    // Audit
    createdAt: z.coerce.date().optional(),
    createdBy: z.string().min(1).optional(),
    updatedAt: z.coerce.date().optional(),
    updatedBy: z.string().min(1).optional(),
  })
  .strict()

export const apInvoiceSchema = apInvoiceSchemaBase
  .superRefine(refineApInvoiceRequiredFields)
  .superRefine(refineApInvoiceMatching)

export type ApInvoice = z.infer<typeof apInvoiceSchema>

export const apInvoiceCreateSchema = apInvoiceSchemaBase
  .omit({
  id: true,
  createdAt: true,
  createdBy: true,
  updatedAt: true,
  updatedBy: true,
  })
  .superRefine(refineApInvoiceRequiredFields)
  .superRefine(refineApInvoiceMatching)

export type ApInvoiceCreate = z.infer<typeof apInvoiceCreateSchema>

export const apInvoiceUpdateSchema = apInvoiceSchemaBase
  .partial()
  .extend({
    id: z.uuid(),
  })
  .superRefine(refineApInvoiceMatching)

export type ApInvoiceUpdate = z.infer<typeof apInvoiceUpdateSchema>
