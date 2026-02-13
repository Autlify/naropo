/**
 * Vendor Account (Accounts Payable) Schema
 *
 * Purpose
 * - Validates Vendor master data used by FI-AP.
 * - Aligns with Prisma `finance.Vendor` model.
 * - Supports SubLedger linkage for detailed financial tracking/reporting.
 * - Supports e-invoice compliance (optional per vendor)
 * - Supports Stripe integration for vendor payments
 * - Includes GL posting defaults for auto-posting
 *
 * Prisma alignment (finance schema)
 * - Vendor: { agencyId, subAccountId?, code, name, taxId?, email?, phone?, address?, subLedgerId?, paymentTermDays, currency, creditLimit?, bankName?, bankAccount?, bankSwiftCode?, isActive }
 * - SubLedger: linked via `subLedgerId`
 */

import { z } from 'zod'
import { AddressSchema } from '@/lib/schemas/shared/address'
import { SubledgerType } from '@/generated/prisma/enums'
import { eInvoiceFormatEnum, eInvoiceConfigSchema } from '@/lib/schemas/shared/e-invoice'
import {
  apPostingDefaultsSchema,
  stripeCustomerIntegrationSchema,
  bankAccountExtendedSchema,
  documentTemplateDefaultsSchema,
} from '@/lib/schemas/shared/accounting-defaults'

// ---------------------------------------------
// Helpers
// ---------------------------------------------

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v)

const CurrencyCode = z
  .string()
  .min(3)
  .max(3)
  .transform((s) => s.toUpperCase())
  .refine((s) => /^[A-Z]{3}$/u.test(s), { message: 'Currency must be a 3-letter ISO code' })

/**
 * Re-export EInvoiceFormat for backward compatibility.
 * Now uses the shared enum from e-invoice.ts
 */
const EInvoiceFormat = eInvoiceFormatEnum

const InvoiceMatchKey = z.enum([
  'INVOICE_NUMBER',
  'PO_NUMBER',
  'VENDOR_REFERENCE',
  'AMOUNT',
  'CURRENCY',
  'DUE_DATE',
])

/**
 * Accept legacy/alias input shapes and normalize to Prisma-like fields.
 *
 * Supported aliases:
 * - vendorCode | code -> code
 * - vendorName | name -> name
 * - taxNumber -> taxId
 * - paymentTermsDays -> paymentTermDays
 * - bankAccountNumber -> bankAccount
 * - subledgerCode/subLedgerCode -> subLedgerCode
 */
const normalizeVendorAccountInput = (val: unknown): unknown => {
  if (!isRecord(val)) return val

  const v: Record<string, unknown> = { ...val }

  // name/code aliases
  if (typeof v.code !== 'string' && typeof v.vendorCode === 'string') v.code = v.vendorCode
  if (typeof v.name !== 'string' && typeof v.vendorName === 'string') v.name = v.vendorName
  if ('vendorCode' in v) delete v.vendorCode
  if ('vendorName' in v) delete v.vendorName

  // tax alias
  if (typeof v.taxId !== 'string' && typeof v.taxNumber === 'string') v.taxId = v.taxNumber
  if ('taxNumber' in v) delete v.taxNumber

  // terms alias
  if (typeof v.paymentTermDays !== 'number' && typeof v.paymentTermsDays === 'number') {
    v.paymentTermDays = v.paymentTermsDays
  }
  if ('paymentTermsDays' in v) delete v.paymentTermsDays

  // bank alias
  if (typeof v.bankAccount !== 'string' && typeof v.bankAccountNumber === 'string') {
    v.bankAccount = v.bankAccountNumber
  }
  if ('bankAccountNumber' in v) delete v.bankAccountNumber

    // IBAN alias (historical casing)
    if (typeof v.bankIban !== 'string' && typeof v.bankIBAN === 'string') {
      v.bankIban = v.bankIBAN
    }
  if ('bankIBAN' in v) delete v.bankIBAN

  // subledger code aliases
  if (typeof v.subLedgerCode !== 'string' && typeof v.subledgerCode === 'string') {
    v.subLedgerCode = v.subledgerCode
  }
  if ('subledgerCode' in v) delete v.subledgerCode

  return v
}

// ---------------------------------------------
// Canonical schema (Prisma-aligned)
// ---------------------------------------------

const refineVendorAccount = (
  v: {
    subLedgerId?: unknown
    subLedgerCode?: unknown
    subLedgerType?: unknown
  },
  ctx: z.RefinementCtx,
) => {
  // If a subledger code/id is provided, enforce AP-appropriate type to avoid accidental cross-ledger linking.
  // In update flows, subLedgerType may be omitted; only validate when present.
  if (
    (v.subLedgerId || v.subLedgerCode) &&
    typeof v.subLedgerType === 'string' &&
    v.subLedgerType !== 'ACCOUNTS_PAYABLE'
  ) {
    ctx.addIssue({
      code: 'custom',
      path: ['subLedgerType'],
      message: 'Vendor subledger type should be ACCOUNTS_PAYABLE when linked',
    })
  }

  // Avoid ambiguous whitespace.
  if (typeof v.subLedgerCode === 'string' && v.subLedgerCode.trim().length === 0) {
    ctx.addIssue({
      code: 'custom',
      path: ['subLedgerCode'],
      message: 'SubLedger code cannot be blank',
    })
  }
}

const vendorAccountCoreSchemaBase = z
  .object({
    // Identity
    id: z.uuid(),

    // Multi-tenant scope
    agencyId: z.uuid(),
    subAccountId: z.uuid().optional().nullable(),

    // Vendor master data
    code: z.string().min(1, { message: 'Vendor code is required' }).max(64),
    name: z.string().min(1, { message: 'Vendor name is required' }).max(255),

    /** Legal/registered name (often differs from display name). */
    legalName: z.string().min(1).max(255).optional(),

    taxId: z.string().min(1).max(64).optional(),
    email: z.email().optional(),
    phone: z.string().min(3).max(32).optional(),

    /**
     * Address is JSON in Prisma.
     * We validate a structured shape here so the UI/server can safely serialize it.
     */
    address: AddressSchema.optional(),

    /** Optional remit-to/billing address for AP (can differ from legal/registered address). */
    billingAddress: AddressSchema.optional(),

    // ---------------------------------
    // SubLedger integration
    // ---------------------------------

    /** Direct FK link to `finance.SubLedger.id` */
    subLedgerId: z.uuid().optional().nullable(),

    /** Optional alternative (resolve-to-id on server): `finance.SubLedger.code` */
    subLedgerCode: z.string().min(1).max(64).optional(),

    /** Vendors are typically AP subledger parties; keep flexible but safe. */
    subLedgerType: z.enum(SubledgerType).default('ACCOUNTS_PAYABLE'),

    // Payment terms
    paymentTermDays: z.number().int().nonnegative().default(30),
    currency: CurrencyCode.default('MYR'),
    creditLimit: z.coerce.number().nonnegative().optional(),

    // Default posting hints (optional)
    // These are helpful for SMEs (auto-post defaults), but not required.
    // Prefer IDs over codes for stability; code-resolution can be done at API layer if needed.
    defaultExpenseAccountId: z.uuid().optional().nullable(),
    defaultLiabilityAccountId: z.uuid().optional().nullable(),
    defaultTaxAccountId: z.uuid().optional().nullable(),
    defaultWithholdingTaxAccountId: z.uuid().optional().nullable(),

    /** Optional default posting template for vendor invoices (FI-AP → FI-GL). */
    defaultApPostingTemplateKey: z
      .string()
      .min(1)
      .max(64)
      .regex(/^[A-Z0-9_\-]+$/i)
      .optional(),

    // Bank details
    bankName: z.string().min(1).max(255).optional(),
    bankAccount: z.string().min(1).max(128).optional(),
    bankSwiftCode: z.string().min(1).max(32).optional(),

    /** Optional region-specific bank fields (kept flexible for SMEs). */
    bankIban: z.string().min(8).max(64).optional(),
    bankRoutingNumber: z.string().min(3).max(64).optional(),
    bankCountryCode: z.string().length(2).optional(),

    // ---------------------------------
    // Extended Bank Accounts (JSON)
    // ---------------------------------

    /**
     * Extended bank accounts for multiple payment destinations.
     * Supports verification status, Stripe linking, multi-currency.
     */
    bankAccounts: z.array(bankAccountExtendedSchema).optional(),

    // ---------------------------------
    // Stripe Integration
    // ---------------------------------

    /**
     * Stripe integration for vendor payments.
     * When paying vendors via Stripe (e.g., disbursements, transfers),
     * we may create a Stripe Customer for the vendor.
     */
    stripeIntegration: stripeCustomerIntegrationSchema.optional(),

    // ---------------------------------
    // GL Posting Defaults
    // ---------------------------------

    /**
     * Enhanced AP posting defaults using shared schema.
     * Overrides legacy fields (defaultExpenseAccountId, etc.) when populated.
     */
    apPostingDefaults: apPostingDefaultsSchema.optional(),

    // ---------------------------------
    // Document Templates
    // ---------------------------------

    /**
     * Default document templates for vendor documents.
     * References templates from the document builder.
     */
    documentTemplates: documentTemplateDefaultsSchema.optional(),

    // AP operations
    preferredPaymentMethod: z
      .enum(['ACH', 'WIRE', 'CHECK', 'CREDIT_CARD', 'CASH', 'OTHER'])
      .optional(),

    /** Where vendors send invoices (capture/AP inbox). */
    invoiceEmail: z.email().optional(),

    /** Where remittance advice should be sent (often differs from invoiceEmail). */
    remittanceEmail: z.email().optional(),

    /** When enabled, vendor invoices are blocked from payment/auto-post flows. */
    paymentHold: z.boolean().optional(),
    paymentHoldReason: z.string().max(500).optional(),

    /**
     * Vendor-level automation settings to support:
     * - incoming invoice auto-post (FI-AP → FI-GL)
     * - auto-match / auto-clear rules (open-items matching)
     * - e-invoice routing identifiers (Peppol / MyInvois / etc.)
     */
    invoiceAutomation: z
      .object({
        autoPostEnabled: z.boolean().default(false),

        /** Optional override: specific posting template key for AP invoices. */
        autoPostTemplateKey: z
          .string()
          .min(1)
          .max(64)
          .regex(/^[A-Z0-9_\-]+$/i)
          .optional(),

        /** If true, only auto-post when no manual approval is required. */
        requireApproval: z.boolean().default(true),

        /** Auto-match incoming invoices to open items / POs. */
        autoMatchEnabled: z.boolean().default(false),
        matchKeys: z.array(InvoiceMatchKey).min(1).default(['INVOICE_NUMBER']),
        amountTolerance: z.coerce.number().nonnegative().default(0),
        dateToleranceDays: z.coerce.number().int().nonnegative().default(0),
        allowDuplicateInvoiceNumber: z.boolean().default(false),

        /**
         * E-invoice configuration for vendor (receiving/processing).
         * Uses enhanced shared schema for comprehensive compliance support.
         * @see src/lib/schemas/shared/e-invoice.ts
         */
        eInvoice: eInvoiceConfigSchema.optional(),
      })
      .optional(),

    // Status
    isActive: z.boolean().default(true),

    // Audit (often server-controlled)
    createdAt: z.coerce.date().optional(),
    createdBy: z.string().min(1).optional(),
    updatedAt: z.coerce.date().optional(),
    updatedBy: z.string().min(1).optional(),

    // Forward compatibility
    /** Deterministic external identifiers for integrations (eg. Xero/QBO/NetSuite). */
    externalRefs: z.record(z.string().min(1), z.string().min(1)).optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
    notes: z.string().max(5000).optional(),
    tags: z.array(z.string().min(1)).optional(),
  })
  .strict()

const vendorAccountCoreSchema = vendorAccountCoreSchemaBase.superRefine(refineVendorAccount)

export const vendorAccountSchema = z.preprocess(normalizeVendorAccountInput, vendorAccountCoreSchema)
export type VendorAccount = z.infer<typeof vendorAccountSchema>

/** Create input: omits server-owned fields */
export const createVendorAccountSchema = z.preprocess(
  normalizeVendorAccountInput,
  vendorAccountCoreSchemaBase.omit({
    id: true,
    createdAt: true,
    createdBy: true,
    updatedAt: true,
    updatedBy: true,
  }).superRefine(refineVendorAccount),
)
export type VendorAccountCreate = z.infer<typeof createVendorAccountSchema>

/** Update input: partial update, but id required */
export const updateVendorAccountSchema = z.preprocess(
  normalizeVendorAccountInput,
  vendorAccountCoreSchemaBase.partial().extend({
    id: z.uuid(),
  }).superRefine(refineVendorAccount),
)
export type VendorAccountUpdate = z.infer<typeof updateVendorAccountSchema>
