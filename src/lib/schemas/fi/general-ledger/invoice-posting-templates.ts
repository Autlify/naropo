/**
 * Invoice Posting Templates (FI-AP/AR → FI-GL)
 *
 * This module defines a **configurable** posting-template model for invoice documents.
 *
 * Design goals:
 * - Avoid tax advice: we only provide a *mechanism* and user-configured mappings.
 * - Strict validation: prevent invalid postings (eg. AP invoice without AP control line).
 * - SSoT-friendly: templates are stored in finance.IntegrationConnector settings (`connectorId = "fi-invoice"`).
 * - Extensible: supports future AP/AR submodules without schema migrations.
 */

import { z } from 'zod'

export const invoiceDocumentKindEnum = z.enum([
  'AP_INVOICE',
  'AP_CREDIT_NOTE',
  'AR_INVOICE',
  'AR_CREDIT_NOTE',
])
export type InvoiceDocumentKind = z.infer<typeof invoiceDocumentKindEnum>

export const postingSideEnum = z.enum(['DEBIT', 'CREDIT'])
export type PostingSide = z.infer<typeof postingSideEnum>

/**
 * Posting roles are *semantic* and later resolved to ChartOfAccount IDs using user mappings.
 *
 * NOTE: keep this set small + generic; roles can be mapped to accounts by CoA template and tax settings.
 */
export const postingRoleEnum = z.enum([
  // Controls
  'AP_CONTROL',
  'AR_CONTROL',

  // P&L
  'EXPENSE',
  'REVENUE',
  'DISCOUNT',

  // Taxes
  'INPUT_TAX',
  'OUTPUT_TAX',
  'WITHHOLDING_TAX',

  // Balance sheet / misc
  'ROUNDING',
  'CLEARING',
])
export type PostingRole = z.infer<typeof postingRoleEnum>

/**
 * Amount sources are derived from invoice totals.
 * In early implementation we only need NET + TAX + GROSS + ROUNDING + DISCOUNT.
 */
export const amountSourceEnum = z.enum([
  'NET',
  'TAX',
  'GROSS',
  'DISCOUNT',
  'ROUNDING',
])
export type AmountSource = z.infer<typeof amountSourceEnum>

export const invoicePostingTemplateLineSchema = z
  .object({
    lineNo: z.number().int().min(1),
    side: postingSideEnum,
    role: postingRoleEnum,
    amountSource: amountSourceEnum,

    /**
     * Percent of the amountSource to post. Defaults to 100.
     * Use cases: splits (eg. 70/30 expense allocation), partial withholding, etc.
     */
    percent: z.number().min(0).max(100).default(100),

    /**
     * Optional fixed override (absolute amount in document currency).
     * If provided, percent is ignored.
     */
    fixedAmount: z.number().optional(),

    /** Optional override: direct ChartOfAccount ID. Prefer role-based mapping for portability. */
    accountId: z.string().uuid().optional(),

    /** Optional constraints for later execution engine (kept as JSON). */
    conditions: z.record(z.string(), z.any()).optional(),
  })
  .strict()

export type InvoicePostingTemplateLineInput = z.infer<typeof invoicePostingTemplateLineSchema>

export const invoicePostingTemplateSchema = z
  .object({
    key: z.string().min(1).max(64).regex(/^[A-Z0-9_\-]+$/i),
    kind: invoiceDocumentKindEnum,
    name: z.string().min(1).max(120),
    description: z.string().max(500).optional(),
    isSystem: z.boolean().default(false),
    isActive: z.boolean().default(true),
    lines: z.array(invoicePostingTemplateLineSchema).min(2),
  })
  .strict()

export type InvoicePostingTemplateInput = z.infer<typeof invoicePostingTemplateSchema>

// ---------------------------------------------------------------------------
// System templates (safe defaults)
// ---------------------------------------------------------------------------

/**
 * These templates are intentionally conservative.
 * - AP invoice: Dr EXPENSE (NET), Dr INPUT_TAX (TAX, optional), Cr AP_CONTROL (GROSS)
 * - AR invoice: Dr AR_CONTROL (GROSS), Cr REVENUE (NET), Cr OUTPUT_TAX (TAX, optional)
 */
export const INVOICE_POSTING_TEMPLATES: Record<string, InvoicePostingTemplateInput> = {
  AP_INVOICE_STANDARD: {
    key: 'AP_INVOICE_STANDARD',
    kind: 'AP_INVOICE',
    name: 'AP Invoice (Standard)',
    description: 'Default AP invoice posting: Expense + Input Tax to AP Control.',
    isSystem: true,
    isActive: true,
    lines: [
      { lineNo: 1, side: 'DEBIT', role: 'EXPENSE', amountSource: 'NET', percent: 100 },
      // Optional tax line (user can disable tax engine at settings level)
      { lineNo: 2, side: 'DEBIT', role: 'INPUT_TAX', amountSource: 'TAX', percent: 100 },
      { lineNo: 3, side: 'CREDIT', role: 'AP_CONTROL', amountSource: 'GROSS', percent: 100 },
    ],
  },
  AP_CREDIT_NOTE_STANDARD: {
    key: 'AP_CREDIT_NOTE_STANDARD',
    kind: 'AP_CREDIT_NOTE',
    name: 'AP Credit Note (Standard)',
    description: 'Default AP credit note posting (reverse of AP invoice).',
    isSystem: true,
    isActive: true,
    lines: [
      { lineNo: 1, side: 'DEBIT', role: 'AP_CONTROL', amountSource: 'GROSS', percent: 100 },
      { lineNo: 2, side: 'CREDIT', role: 'EXPENSE', amountSource: 'NET', percent: 100 },
      { lineNo: 3, side: 'CREDIT', role: 'INPUT_TAX', amountSource: 'TAX', percent: 100 },
    ],
  },
  AR_INVOICE_STANDARD: {
    key: 'AR_INVOICE_STANDARD',
    kind: 'AR_INVOICE',
    name: 'AR Invoice (Standard)',
    description: 'Default AR invoice posting: AR Control to Revenue + Output Tax.',
    isSystem: true,
    isActive: true,
    lines: [
      { lineNo: 1, side: 'DEBIT', role: 'AR_CONTROL', amountSource: 'GROSS', percent: 100 },
      { lineNo: 2, side: 'CREDIT', role: 'REVENUE', amountSource: 'NET', percent: 100 },
      { lineNo: 3, side: 'CREDIT', role: 'OUTPUT_TAX', amountSource: 'TAX', percent: 100 },
    ],
  },
  AR_CREDIT_NOTE_STANDARD: {
    key: 'AR_CREDIT_NOTE_STANDARD',
    kind: 'AR_CREDIT_NOTE',
    name: 'AR Credit Note (Standard)',
    description: 'Default AR credit note posting (reverse of AR invoice).',
    isSystem: true,
    isActive: true,
    lines: [
      { lineNo: 1, side: 'DEBIT', role: 'REVENUE', amountSource: 'NET', percent: 100 },
      { lineNo: 2, side: 'DEBIT', role: 'OUTPUT_TAX', amountSource: 'TAX', percent: 100 },
      { lineNo: 3, side: 'CREDIT', role: 'AR_CONTROL', amountSource: 'GROSS', percent: 100 },
    ],
  },
} as const

// ---------------------------------------------------------------------------
// Stored settings schema (IntegrationConnector.settings)
// ---------------------------------------------------------------------------

export const storedInvoicePostingSchema = z
  .object({
    schemaVersion: z.number().int().min(1).default(1),
    defaults: z
      .object({
        AP_INVOICE: z.string().default('AP_INVOICE_STANDARD'),
        AP_CREDIT_NOTE: z.string().default('AP_CREDIT_NOTE_STANDARD'),
        AR_INVOICE: z.string().default('AR_INVOICE_STANDARD'),
        AR_CREDIT_NOTE: z.string().default('AR_CREDIT_NOTE_STANDARD'),
      })
      .default({
        AP_INVOICE: 'AP_INVOICE_STANDARD',
        AP_CREDIT_NOTE: 'AP_CREDIT_NOTE_STANDARD',
        AR_INVOICE: 'AR_INVOICE_STANDARD',
        AR_CREDIT_NOTE: 'AR_CREDIT_NOTE_STANDARD',
      }),
    // Custom templates keyed by template.key
    templates: z.record(z.string(), invoicePostingTemplateSchema).default({}),
  })
  .default({
    schemaVersion: 1,
    defaults: {
      AP_INVOICE: 'AP_INVOICE_STANDARD',
      AP_CREDIT_NOTE: 'AP_CREDIT_NOTE_STANDARD',
      AR_INVOICE: 'AR_INVOICE_STANDARD',
      AR_CREDIT_NOTE: 'AR_CREDIT_NOTE_STANDARD',
    },
    templates: {},
  })

export type StoredInvoicePosting = z.infer<typeof storedInvoicePostingSchema>

// ---------------------------------------------------------------------------
// Validation helpers
// ---------------------------------------------------------------------------

export function validateInvoicePostingTemplate(input: InvoicePostingTemplateInput): {
  ok: boolean
  errors: string[]
} {
  const errors: string[] = []

  const lines = [...input.lines].sort((a, b) => a.lineNo - b.lineNo)
  const roleCount = (role: PostingRole, side?: PostingSide) =>
    lines.filter((l) => l.role === role && (!side || l.side === side)).length

  const hasRole = (role: PostingRole, side?: PostingSide) => roleCount(role, side) > 0

  // Core invariants
  if (input.kind === 'AP_INVOICE') {
    if (!hasRole('AP_CONTROL', 'CREDIT')) errors.push('AP invoice template must credit AP_CONTROL.')
    if (!hasRole('EXPENSE', 'DEBIT')) errors.push('AP invoice template must debit EXPENSE (NET).')
  }

  if (input.kind === 'AR_INVOICE') {
    if (!hasRole('AR_CONTROL', 'DEBIT')) errors.push('AR invoice template must debit AR_CONTROL.')
    if (!hasRole('REVENUE', 'CREDIT')) errors.push('AR invoice template must credit REVENUE (NET).')
  }

  if (input.kind === 'AP_CREDIT_NOTE') {
    if (!hasRole('AP_CONTROL', 'DEBIT')) errors.push('AP credit note template must debit AP_CONTROL.')
  }

  if (input.kind === 'AR_CREDIT_NOTE') {
    if (!hasRole('AR_CONTROL', 'CREDIT')) errors.push('AR credit note template must credit AR_CONTROL.')
  }

  // Ensure lineNo uniqueness
  const uniq = new Set(lines.map((l) => l.lineNo))
  if (uniq.size !== lines.length) errors.push('Template line numbers (lineNo) must be unique.')

  return { ok: errors.length === 0, errors }
}
