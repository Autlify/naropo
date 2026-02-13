/**
 * Customer Account (Accounts Receivable) Schema
 *
 * Purpose:
 * - Validates Customer master data used by FI-AR
 * - Aligns with Prisma `Customer` model
 * - Supports SubLedger linkage for detailed financial tracking/reporting
 * - Mirrors VendorAccount structure for AP/AR consistency
 * - Supports e-invoice compliance (optional per customer)
 * - Supports Stripe integration for customer payments
 * - Includes GL posting defaults for auto-posting
 *
 * Prisma alignment (finance schema):
 * - Customer: agencyId, subAccountId?, code, name, legalName?, taxId?, email?, phone?,
 *             address?, billingAddress?, shippingAddress?, subLedgerId?,
 *             paymentTermDays, currency, creditLimit?, bank details,
 *             defaultRevenueAccountId?, defaultReceivableAccountId?, defaultTaxAccountId?,
 *             dunning settings, invoiceAutomation?, isActive
 */

import { z } from 'zod'
import { AddressSchema } from '@/lib/schemas/shared/address'
import { SubledgerType } from '@/generated/prisma/enums'
import { eInvoiceFormatEnum, eInvoiceConfigSchema } from '@/lib/schemas/shared/e-invoice'
import {
  arPostingDefaultsSchema,
  stripeCustomerIntegrationSchema,
  bankAccountExtendedSchema,
  documentTemplateDefaultsSchema,
} from '@/lib/schemas/shared/accounting-defaults'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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
  'CUSTOMER_REFERENCE',
  'PO_NUMBER',
  'AMOUNT',
  'CURRENCY',
  'DUE_DATE',
])

/**
 * Accept legacy/alias input shapes and normalize to Prisma-like fields.
 *
 * Supported aliases:
 * - customerCode | code -> code
 * - customerName | name -> name
 * - taxNumber -> taxId
 * - paymentTermsDays -> paymentTermDays
 * - bankAccountNumber -> bankAccount
 * - subledgerCode/subLedgerCode -> subLedgerCode
 */
const normalizeCustomerAccountInput = (val: unknown): unknown => {
  if (!isRecord(val)) return val

  const v: Record<string, unknown> = { ...val }

  // name/code aliases
  if (typeof v.code !== 'string' && typeof v.customerCode === 'string') v.code = v.customerCode
  if (typeof v.name !== 'string' && typeof v.customerName === 'string') v.name = v.customerName
  if ('customerCode' in v) delete v.customerCode
  if ('customerName' in v) delete v.customerName

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

// ---------------------------------------------------------------------------
// Canonical schema (Prisma-aligned)
// ---------------------------------------------------------------------------

const refineCustomerAccount = (
  v: {
    subLedgerId?: unknown
    subLedgerCode?: unknown
    subLedgerType?: unknown
  },
  ctx: z.RefinementCtx,
) => {
  // If a subledger code/id is provided, enforce AR-appropriate type
  if (
    (v.subLedgerId || v.subLedgerCode) &&
    typeof v.subLedgerType === 'string' &&
    v.subLedgerType !== 'ACCOUNTS_RECEIVABLE'
  ) {
    ctx.addIssue({
      code: 'custom',
      path: ['subLedgerType'],
      message: 'Customer subledger type should be ACCOUNTS_RECEIVABLE when linked',
    })
  }

  // Avoid ambiguous whitespace
  if (typeof v.subLedgerCode === 'string' && v.subLedgerCode.trim().length === 0) {
    ctx.addIssue({
      code: 'custom',
      path: ['subLedgerCode'],
      message: 'SubLedger code cannot be blank',
    })
  }
}

const CustomerAccountCoreSchemaBase = z
  .object({
    // Identity
    id: z.string().uuid(),

    // Multi-tenant scope
    agencyId: z.string().uuid(),
    subAccountId: z.string().uuid().optional().nullable(),

    // Customer master data
    code: z.string().min(1, { message: 'Customer code is required' }).max(64),
    name: z.string().min(1, { message: 'Customer name is required' }).max(255),

    /** Legal/registered name (often differs from display name) */
    legalName: z.string().min(1).max(255).optional(),

    taxId: z.string().min(1).max(64).optional(),
    email: z.string().email().optional(),
    phone: z.string().min(3).max(32).optional(),

    /**
     * Address is JSON in Prisma.
     * We validate a structured shape here.
     */
    address: AddressSchema.optional(),

    /** Billing address (can differ from registered address) */
    billingAddress: AddressSchema.optional(),

    /** Shipping address */
    shippingAddress: AddressSchema.optional(),

    // ---------------------------------
    // SubLedger integration
    // ---------------------------------

    /** Direct FK link to `finance.SubLedger.id` */
    subLedgerId: z.string().uuid().optional().nullable(),

    /** Optional alternative (resolve-to-id on server): `finance.SubLedger.code` */
    subLedgerCode: z.string().min(1).max(64).optional(),

    /** Customers are typically AR subledger parties */
    subLedgerType: z.enum(SubledgerType).default('ACCOUNTS_RECEIVABLE'),

    // Payment/Credit terms
    paymentTermDays: z.number().int().nonnegative().default(30),
    currency: CurrencyCode.default('MYR'),
    creditLimit: z.coerce.number().nonnegative().optional(),

    // Default posting accounts (for auto-post)
    defaultRevenueAccountId: z.string().uuid().optional().nullable(),
    defaultReceivableAccountId: z.string().uuid().optional().nullable(),
    defaultTaxAccountId: z.string().uuid().optional().nullable(),

    /** Optional default posting template for customer invoices (FI-AR → FI-GL) */
    defaultArPostingTemplateKey: z
      .string()
      .min(1)
      .max(64)
      .regex(/^[A-Z0-9_\-]+$/i)
      .optional(),

    // Bank details (for refunds, etc.)
    bankName: z.string().min(1).max(255).optional(),
    bankAccount: z.string().min(1).max(128).optional(),
    bankSwiftCode: z.string().min(1).max(32).optional(),
    bankIban: z.string().min(8).max(64).optional(),
    bankRoutingNumber: z.string().min(3).max(64).optional(),
    bankCountryCode: z.string().length(2).optional(),

    // ---------------------------------
    // Extended Bank Accounts (JSON)
    // ---------------------------------

    /**
     * Extended bank accounts for multiple payment sources (refunds, etc.).
     * Supports verification status, Stripe linking, multi-currency.
     */
    bankAccounts: z.array(bankAccountExtendedSchema).optional(),

    // ---------------------------------
    // Stripe Integration
    // ---------------------------------

    /**
     * Stripe integration for customer payments.
     * When collecting payments from customers via Stripe,
     * we create a Stripe Customer for the customer.
     */
    stripeIntegration: stripeCustomerIntegrationSchema.optional(),

    // ---------------------------------
    // GL Posting Defaults
    // ---------------------------------

    /**
     * Enhanced AR posting defaults using shared schema.
     * Overrides legacy fields (defaultRevenueAccountId, etc.) when populated.
     */
    arPostingDefaults: arPostingDefaultsSchema.optional(),

    // ---------------------------------
    // Document Templates
    // ---------------------------------

    /**
     * Default document templates for customer documents.
     * References templates from the document builder.
     */
    documentTemplates: documentTemplateDefaultsSchema.optional(),

    // AR operations
    preferredPaymentMethod: z
      .enum(['ACH', 'WIRE', 'CHECK', 'CREDIT_CARD', 'DEBIT_CARD', 'CASH', 'OTHER'])
      .optional(),

    /** Where statements are sent */
    statementEmail: z.string().email().optional(),

    /** Where dunning notices are sent */
    dunningEmail: z.string().email().optional(),

    /** When enabled, customer orders/invoices are blocked */
    creditHold: z.boolean().optional(),
    creditHoldReason: z.string().max(500).optional(),

    // Dunning settings
    dunningEnabled: z.boolean().default(true),
    dunningLevel: z.number().int().min(0).default(0), // Current dunning level
    lastDunningDate: z.coerce.date().optional(),

    /**
     * Customer-level automation settings to support:
     * - outgoing invoice auto-send
     * - auto-match / auto-clear rules
     * - e-invoice routing identifiers
     */
    invoiceAutomation: z
      .object({
        /** Auto-send invoices (email/e-invoice) */
        autoSendEnabled: z.boolean().default(false),
        autoSendMethod: z.enum(['EMAIL', 'EINVOICE', 'BOTH']).default('EMAIL'),

        /** Auto-match incoming receipts to invoices */
        autoMatchEnabled: z.boolean().default(false),
        matchKeys: z.array(InvoiceMatchKey).min(1).default(['INVOICE_NUMBER']),
        amountTolerance: z.coerce.number().nonnegative().default(0),
        dateToleranceDays: z.coerce.number().int().nonnegative().default(0),

        /**
         * E-invoice configuration for customer (sending).
         * Uses enhanced shared schema for comprehensive compliance support.
         * @see src/lib/schemas/shared/e-invoice.ts
         */
        eInvoice: eInvoiceConfigSchema.optional(),

        /** Auto-apply unapplied payments to oldest invoices */
        autoApplyPayments: z.boolean().default(false),
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
    /** Deterministic external identifiers for integrations */
    externalRefs: z.record(z.string().min(1), z.string().min(1)).optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
    notes: z.string().max(5000).optional(),
    tags: z.array(z.string().min(1)).optional(),
  })
  .strict()

const CustomerAccountCoreSchema = CustomerAccountCoreSchemaBase.superRefine(refineCustomerAccount)

export const CustomerAccountSchema = z.preprocess(normalizeCustomerAccountInput, CustomerAccountCoreSchema)
export type CustomerAccount = z.infer<typeof CustomerAccountSchema>

/** Create input: omits server-owned fields */
export const CustomerAccountCreateSchema = z.preprocess(
  normalizeCustomerAccountInput,
  CustomerAccountCoreSchemaBase.omit({
    id: true,
    createdAt: true,
    createdBy: true,
    updatedAt: true,
    updatedBy: true,
  }).superRefine(refineCustomerAccount),
)
export type CustomerAccountCreate = z.infer<typeof CustomerAccountCreateSchema>

/** Update input: partial update, but id required */
export const CustomerAccountUpdateSchema = z.preprocess(
  normalizeCustomerAccountInput,
  CustomerAccountCoreSchemaBase.partial().extend({
    id: z.string().uuid(),
  }).superRefine(refineCustomerAccount),
)
export type CustomerAccountUpdate = z.infer<typeof CustomerAccountUpdateSchema>

// ---------------------------------------------------------------------------
// Filter/Query Schema
// ---------------------------------------------------------------------------

export const getCustomersFilterSchema = z.object({
  // Status
  isActive: z.boolean().optional(),

  // SubLedger
  subLedgerId: z.string().uuid().optional(),

  // Credit status
  creditHold: z.boolean().optional(),

  // Dunning status
  dunningLevel: z.number().int().min(0).optional(),
  dunningLevelGte: z.number().int().min(0).optional(), // >= this level

  // Search
  search: z.string().optional(), // Search code, name, email

  // Pagination
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(25),

  // Sorting
  sortBy: z.enum([
    'code',
    'name',
    'creditLimit',
    'dunningLevel',
    'createdAt',
  ]).default('name'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
})
export type GetCustomersFilter = z.infer<typeof getCustomersFilterSchema>

// ---------------------------------------------------------------------------
// Output Schema
// ---------------------------------------------------------------------------

export const customerAccountOutputSchema = z.object({
  id: z.string().uuid(),
  agencyId: z.string(),
  subAccountId: z.string().nullable(),
  code: z.string(),
  name: z.string(),
  legalName: z.string().nullable(),
  taxId: z.string().nullable(),
  email: z.string().nullable(),
  phone: z.string().nullable(),
  address: z.record(z.string(), z.unknown()).nullable(),
  billingAddress: z.record(z.string(), z.unknown()).nullable(),
  shippingAddress: z.record(z.string(), z.unknown()).nullable(),
  subLedgerId: z.string().nullable(),
  subLedgerType: z.string(),
  paymentTermDays: z.number(),
  currency: z.string(),
  creditLimit: z.number().nullable(),
  defaultRevenueAccountId: z.string().nullable(),
  defaultReceivableAccountId: z.string().nullable(),
  defaultTaxAccountId: z.string().nullable(),
  defaultArPostingTemplateKey: z.string().nullable(),
  bankName: z.string().nullable(),
  bankAccount: z.string().nullable(),
  bankSwiftCode: z.string().nullable(),
  bankIban: z.string().nullable(),
  bankRoutingNumber: z.string().nullable(),
  bankCountryCode: z.string().nullable(),
  preferredPaymentMethod: z.string().nullable(),
  statementEmail: z.string().nullable(),
  dunningEmail: z.string().nullable(),
  creditHold: z.boolean(),
  creditHoldReason: z.string().nullable(),
  dunningEnabled: z.boolean(),
  dunningLevel: z.number(),
  lastDunningDate: z.coerce.date().nullable(),
  invoiceAutomation: z.record(z.string(), z.unknown()).nullable(),
  externalRefs: z.record(z.string(), z.string()).nullable(),
  metadata: z.record(z.string(), z.unknown()).nullable(),
  notes: z.string().nullable(),
  tags: z.array(z.string()).nullable(),
  isActive: z.boolean(),
  createdAt: z.coerce.date(),
  createdBy: z.string(),
  updatedAt: z.coerce.date(),
  updatedBy: z.string().nullable(),

  // Relations (optional)
  SubLedger: z.object({
    id: z.string(),
    code: z.string(),
    name: z.string(),
  }).optional(),
})
export type CustomerAccountOutput = z.infer<typeof customerAccountOutputSchema>
