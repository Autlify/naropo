/**
 * Shared Invoice/Credit Note Document Schema
 *
 * Goal:
 * - Provide a canonical, module-agnostic invoice document shape.
 * - Allow FI-AP / FI-AR / platform flows to extend and apply module-specific rules.
 * - Be 3-way-matching ready (PO ↔ GR ↔ Invoice) by supporting optional link fields.
 * - Support optional e-invoice compliance (UBL, Peppol, MyInvois, etc.)
 *
 * NOTE:
 * - This schema is intentionally *not* tied to a specific Prisma model.
 * - Persisted fields may live in module tables or JSON blobs depending on the module.
 */

import { z } from 'zod'
import { eInvoiceDocumentFieldsSchema } from './e-invoice'

// ---------------------------------------------------------------------------
// Primitives
// ---------------------------------------------------------------------------

export const currencyCodeSchema = z
  .string()
  .min(3)
  .max(3)
  .transform((s) => s.toUpperCase())
  .refine((s) => /^[A-Z]{3}$/u.test(s), {
    message: 'Currency must be a 3-letter ISO code',
  })

/**
 * Money object for clarity and future extensibility.
 * Today we keep amount as `number` for UX and early-stage simplicity.
 */
export const moneySchema = z
  .object({
    amount: z.number(),
    currency: currencyCodeSchema,
  })
  .strict()

export type Money = z.infer<typeof moneySchema>

// ---------------------------------------------------------------------------
// 3-way matching scaffolding
// ---------------------------------------------------------------------------

export const matchPolicyEnum = z.enum(['NONE', 'TWO_WAY', 'THREE_WAY'])
export type MatchPolicy = z.infer<typeof matchPolicyEnum>

export const matchStatusEnum = z.enum(['NOT_MATCHED', 'PARTIAL', 'MATCHED', 'EXCEPTION'])
export type MatchStatus = z.infer<typeof matchStatusEnum>

export const matchExceptionSeverityEnum = z.enum(['INFO', 'WARNING', 'BLOCKER'])
export type MatchExceptionSeverity = z.infer<typeof matchExceptionSeverityEnum>

export const matchExceptionSchema = z
  .object({
    code: z.string().min(1).max(64),
    message: z.string().min(1).max(500),
    path: z.array(z.union([z.string(), z.number()])).optional(),
    severity: matchExceptionSeverityEnum.default('WARNING'),
  })
  .strict()

export type MatchException = z.infer<typeof matchExceptionSchema>

export const matchToleranceSchema = z
  .object({
    /** Absolute amount tolerance in document currency. */
    amountTolerance: z.coerce.number().nonnegative().default(0),
    /** Quantity tolerance as absolute quantity delta. */
    quantityTolerance: z.coerce.number().nonnegative().default(0),
    /** Unit price tolerance in document currency. */
    unitPriceTolerance: z.coerce.number().nonnegative().default(0),
    /** Date tolerance in days (used for due/receipt date comparisons). */
    dateToleranceDays: z.coerce.number().int().nonnegative().default(0),
  })
  .strict()

export type MatchTolerance = z.infer<typeof matchToleranceSchema>

export const documentMatchRefsSchema = z
  .object({
    /**
     * IDs are preferred when SCM/PO/GR modules exist (3-way matching).
     * Numbers are kept for ingestion flows (OCR/e-invoice/manual entry) before SCM linking.
     */
    purchaseOrderId: z.uuid().optional().nullable(),
    purchaseOrderNumber: z.string().min(1).max(64).optional(),

    goodsReceiptId: z.uuid().optional().nullable(),
    goodsReceiptNumber: z.string().min(1).max(64).optional(),

    matchPolicy: matchPolicyEnum.optional(),
    matchStatus: matchStatusEnum.optional(),

    tolerance: matchToleranceSchema.optional(),
    exceptions: z.array(matchExceptionSchema).optional(),
  })
  .strict()

export type DocumentMatchRefs = z.infer<typeof documentMatchRefsSchema>

// ---------------------------------------------------------------------------
// Document core
// ---------------------------------------------------------------------------

export const documentKindEnum = z.enum(['INVOICE', 'CREDIT_NOTE', 'DEBIT_NOTE'])
export type DocumentKind = z.infer<typeof documentKindEnum>

export const documentTotalsSchema = z
  .object({
    netAmount: z.coerce.number().nonnegative(),
    taxAmount: z.coerce.number().nonnegative().default(0),
    grossAmount: z.coerce.number().nonnegative(),
    currency: currencyCodeSchema,
  })
  .strict()
  .superRefine((t, ctx) => {
    // Allow rounding differences up to 0.01.
    const expected = t.netAmount + t.taxAmount
    if (Math.abs(expected - t.grossAmount) > 0.01) {
      ctx.addIssue({
        code: 'custom',
        path: ['grossAmount'],
        message: 'grossAmount should equal netAmount + taxAmount (±0.01)',
      })
    }
  })

export type DocumentTotals = z.infer<typeof documentTotalsSchema>

export const documentLineSchema = z
  .object({
    lineNo: z.number().int().min(1),
    description: z.string().min(1).max(500),

    // Amounts
    quantity: z.coerce.number().positive().default(1),
    unitPrice: z.coerce.number().nonnegative(),
    lineNetAmount: z.coerce.number().nonnegative().optional(),
    taxAmount: z.coerce.number().nonnegative().optional(),
    lineGrossAmount: z.coerce.number().nonnegative().optional(),

    /** Optional item reference for future SCM item master. */
    itemId: z.uuid().optional().nullable(),
    sku: z.string().min(1).max(128).optional(),

    // 3-way matching connection points (IDs first)
    purchaseOrderLineId: z.uuid().optional().nullable(),
    goodsReceiptLineId: z.uuid().optional().nullable(),

    /** Optional: carry quantities for match engine output/preview. */
    orderedQuantity: z.coerce.number().nonnegative().optional(),
    receivedQuantity: z.coerce.number().nonnegative().optional(),
  })
  .strict()

export type DocumentLine = z.infer<typeof documentLineSchema>

export const invoiceDocumentCoreSchema = z
  .object({
    kind: documentKindEnum,

    /** Supplier-side document number (invoice number / credit note number). */
    documentNumber: z.string().min(1).max(64),

    /** Issue date of the document (supplier). */
    issueDate: z.coerce.date(),

    /** Due date (optional). */
    dueDate: z.coerce.date().optional().nullable(),

    /** Currency for the document. */
    currency: currencyCodeSchema,

    /** Header totals (recommended even if lines exist for fast reporting). */
    totals: documentTotalsSchema,

    /** Lines (at least 1). */
    lines: z.array(documentLineSchema).min(1),

    /** Optional matching references (supports 2-way/3-way architecture). */
    matchRefs: documentMatchRefsSchema.optional(),

    /** External references for integrations / imports. */
    externalRefs: z.record(z.string().min(1), z.string().min(1)).optional(),

    /** Freeform metadata for forward compatibility. */
    metadata: z.record(z.string(), z.unknown()).optional(),

    /**
     * Optional e-invoice compliance fields.
     * Populated when e-invoicing is enabled for the document.
     * @see src/lib/schemas/shared/e-invoice.ts
     */
    eInvoice: eInvoiceDocumentFieldsSchema.optional(),
  })
  .strict()

export type InvoiceDocumentCore = z.infer<typeof invoiceDocumentCoreSchema>
