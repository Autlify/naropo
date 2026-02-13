/**
 * Shared Accounting Defaults Schema
 *
 * Purpose:
 * - Provides GL account defaults for auto-posting (P&L, BS, Tax accounts)
 * - Stripe integration fields for connected accounts
 * - Bank account details for payments
 * - Document template references for invoice/receipt generation
 *
 * Used by: vendor-account, customer-account, agency, subaccount schemas
 */

import { z } from 'zod'

// ---------------------------------------------------------------------------
// GL Account Defaults (for auto-posting)
// ---------------------------------------------------------------------------

/**
 * GL Account Reference - used for linking to Chart of Accounts
 * Supports both ID (preferred) and code (for lookup) references
 */
export const glAccountRefSchema = z.object({
  /** ChartOfAccount ID (preferred) */
  accountId: z.string().uuid().optional().nullable(),
  /** Account code (for lookup if ID not available) */
  accountCode: z.string().min(1).max(32).optional(),
  /** Account name (for display, populated on read) */
  accountName: z.string().max(255).optional(),
})
export type GlAccountRef = z.infer<typeof glAccountRefSchema>

/**
 * AP Posting Defaults - for vendor invoices and payments
 * Maps to FI-GL accounts for automatic journal entry creation
 */
export const apPostingDefaultsSchema = z.object({
  /** Accounts Payable control account (BS Liability) */
  payableAccount: glAccountRefSchema.optional(),
  
  /** Default expense account (P&L Expense) */
  expenseAccount: glAccountRefSchema.optional(),
  
  /** Input tax account (GST/VAT paid on purchases) */
  inputTaxAccount: glAccountRefSchema.optional(),
  
  /** Withholding tax account (if applicable) */
  withholdingTaxAccount: glAccountRefSchema.optional(),
  
  /** Prepayment/advance account */
  prepaymentAccount: glAccountRefSchema.optional(),
  
  /** Bank/cash account for payments */
  paymentBankAccount: glAccountRefSchema.optional(),
  
  /** FX gain/loss account for multi-currency */
  fxGainLossAccount: glAccountRefSchema.optional(),
  
  /** Purchase discount account */
  discountReceivedAccount: glAccountRefSchema.optional(),
})
export type ApPostingDefaults = z.infer<typeof apPostingDefaultsSchema>

/**
 * AR Posting Defaults - for customer invoices and receipts
 * Maps to FI-GL accounts for automatic journal entry creation
 */
export const arPostingDefaultsSchema = z.object({
  /** Accounts Receivable control account (BS Asset) */
  receivableAccount: glAccountRefSchema.optional(),
  
  /** Default revenue account (P&L Revenue) */
  revenueAccount: glAccountRefSchema.optional(),
  
  /** Output tax account (GST/VAT collected on sales) */
  outputTaxAccount: glAccountRefSchema.optional(),
  
  /** Service tax account (Malaysia SST, if separate) */
  serviceTaxAccount: glAccountRefSchema.optional(),
  
  /** Unearned/deferred revenue account */
  deferredRevenueAccount: glAccountRefSchema.optional(),
  
  /** Bank/cash account for receipts */
  receiptBankAccount: glAccountRefSchema.optional(),
  
  /** FX gain/loss account for multi-currency */
  fxGainLossAccount: glAccountRefSchema.optional(),
  
  /** Sales discount account */
  discountGivenAccount: glAccountRefSchema.optional(),
  
  /** Bad debt/write-off account */
  badDebtAccount: glAccountRefSchema.optional(),
})
export type ArPostingDefaults = z.infer<typeof arPostingDefaultsSchema>

/**
 * Combined posting defaults (for entity-level configuration)
 */
export const postingDefaultsSchema = z.object({
  ap: apPostingDefaultsSchema.optional(),
  ar: arPostingDefaultsSchema.optional(),
})
export type PostingDefaults = z.infer<typeof postingDefaultsSchema>

// ---------------------------------------------------------------------------
// Stripe Integration Fields
// ---------------------------------------------------------------------------

/**
 * Stripe Customer Integration - for entities that are Stripe customers
 * Used when the entity pays us (e.g., Agency subscription)
 */
export const stripeCustomerIntegrationSchema = z.object({
  /** Stripe Customer ID (cus_xxx) */
  stripeCustomerId: z.string()
    .regex(/^cus_[a-zA-Z0-9]+$/)
    .optional()
    .nullable(),
  
  /** Default Payment Method ID (pm_xxx or card_xxx) */
  stripeDefaultPaymentMethodId: z.string()
    .regex(/^(pm|card)_[a-zA-Z0-9]+$/)
    .optional()
    .nullable(),
  
  /** Invoice settings (how Stripe invoices are generated) */
  stripeInvoiceSettings: z.object({
    defaultPaymentMethod: z.string().optional(),
    footer: z.string().max(500).optional(),
    renderingOptions: z.record(z.string(), z.unknown()).optional(),
  }).optional(),
  
  /** Tax ID for Stripe Tax */
  stripeTaxId: z.string().max(64).optional(),
  
  /** Tax exempt status in Stripe */
  stripeTaxExempt: z.enum(['none', 'exempt', 'reverse']).optional(),
})
export type StripeCustomerIntegration = z.infer<typeof stripeCustomerIntegrationSchema>

/**
 * Stripe Connected Account Integration - for entities that receive payments
 * Used for agencies/subaccounts collecting from their customers via Stripe Connect
 */
export const stripeConnectedAccountSchema = z.object({
  /** Stripe Connected Account ID (acct_xxx) */
  stripeConnectedAccountId: z.string()
    .regex(/^acct_[a-zA-Z0-9]+$/)
    .optional()
    .nullable(),
  
  /** Account type */
  stripeAccountType: z.enum(['express', 'standard', 'custom']).optional(),
  
  /** Onboarding status */
  stripeOnboardingStatus: z.enum([
    'not_started',
    'pending',
    'complete',
    'restricted',
    'suspended',
  ]).optional(),
  
  /** Charges enabled flag */
  stripeChargesEnabled: z.boolean().optional(),
  
  /** Payouts enabled flag */
  stripePayoutsEnabled: z.boolean().optional(),
  
  /** Default currency for payouts */
  stripeDefaultCurrency: z.string().length(3).optional(),
  
  /** Country of the connected account */
  stripeCountry: z.string().length(2).optional(),
  
  /** External account ID (bank account for payouts) */
  stripeExternalAccountId: z.string().optional(),
})
export type StripeConnectedAccount = z.infer<typeof stripeConnectedAccountSchema>

/**
 * Combined Stripe integration for entities
 */
export const stripeIntegrationSchema = z.object({
  /** As a customer (paying Autlify) */
  customer: stripeCustomerIntegrationSchema.optional(),
  
  /** As a connected account (collecting from their customers) */
  connectedAccount: stripeConnectedAccountSchema.optional(),
})
export type StripeIntegration = z.infer<typeof stripeIntegrationSchema>

// ---------------------------------------------------------------------------
// Bank Account (Extended)
// ---------------------------------------------------------------------------

/**
 * Bank account type enum
 */
export const bankAccountTypeEnum = z.enum([
  'CHECKING',
  'SAVINGS',
  'BUSINESS',
  'MERCHANT',
  'OTHER',
])
export type BankAccountType = z.infer<typeof bankAccountTypeEnum>

/**
 * Extended bank account schema for payments
 * Used for both paying vendors and receiving from customers
 */
export const bankAccountExtendedSchema = z.object({
  /** Internal bank account ID (if stored in our system) */
  id: z.string().uuid().optional(),
  
  /** Account type */
  accountType: bankAccountTypeEnum.optional(),
  
  /** Account holder name */
  accountHolderName: z.string().min(1).max(255).optional(),
  
  /** Account holder type */
  accountHolderType: z.enum(['individual', 'company']).optional(),
  
  /** Bank name */
  bankName: z.string().min(1).max(255).optional(),
  
  /** Bank code (e.g., BSB in AU, Sort Code in UK) */
  bankCode: z.string().min(1).max(32).optional(),
  
  /** Branch code */
  branchCode: z.string().max(32).optional(),
  
  /** Account number */
  accountNumber: z.string().min(1).max(64).optional(),
  
  /** SWIFT/BIC code */
  swiftCode: z.string().min(8).max(11).optional(),
  
  /** IBAN */
  iban: z.string().min(15).max(34).optional(),
  
  /** Routing number (US) */
  routingNumber: z.string().max(32).optional(),
  
  /** Country code (ISO 3166-1 alpha-2) */
  countryCode: z.string().length(2).optional(),
  
  /** Currency (ISO 4217) */
  currency: z.string().length(3).optional(),
  
  /** Is this the default/primary account */
  isDefault: z.boolean().default(false),
  
  /** Is active */
  isActive: z.boolean().default(true),
  
  /** Stripe external account ID (if linked) */
  stripeExternalAccountId: z.string().optional(),
  
  /** Verification status */
  verificationStatus: z.enum([
    'unverified',
    'pending',
    'verified',
    'failed',
  ]).optional(),
  
  /** Last 4 digits (for display) */
  last4: z.string().length(4).optional(),
  
  /** Notes */
  notes: z.string().max(500).optional(),
})
export type BankAccountExtended = z.infer<typeof bankAccountExtendedSchema>

// ---------------------------------------------------------------------------
// Document Template Reference
// ---------------------------------------------------------------------------

/**
 * Document type for template selection
 */
export const documentTemplateTypeEnum = z.enum([
  'INVOICE',
  'CREDIT_NOTE',
  'DEBIT_NOTE',
  'RECEIPT',
  'PAYMENT_VOUCHER',
  'STATEMENT',
  'REMINDER',
  'PURCHASE_ORDER',
  'QUOTATION',
  'DELIVERY_NOTE',
  'PROFORMA_INVOICE',
])
export type DocumentTemplateType = z.infer<typeof documentTemplateTypeEnum>

/**
 * Document template reference
 * References templates from the document builder system
 */
export const documentTemplateRefSchema = z.object({
  /** Template type */
  type: documentTemplateTypeEnum,
  
  /** Template key/ID (references document builder template) */
  templateKey: z.string().min(1).max(64),
  
  /** Template name (for display) */
  templateName: z.string().max(255).optional(),
  
  /** Is this the default template for this type */
  isDefault: z.boolean().default(false),
  
  /** Language/locale for this template */
  locale: z.string().max(10).optional(), // e.g., 'en', 'ms', 'zh-CN'
})
export type DocumentTemplateRef = z.infer<typeof documentTemplateRefSchema>

/**
 * Document template defaults for an entity
 * Allows setting default templates for different document types
 */
export const documentTemplateDefaultsSchema = z.object({
  /** Default invoice template */
  invoice: z.string().max(64).optional(),
  
  /** Default credit note template */
  creditNote: z.string().max(64).optional(),
  
  /** Default debit note template */
  debitNote: z.string().max(64).optional(),
  
  /** Default receipt template */
  receipt: z.string().max(64).optional(),
  
  /** Default payment voucher template */
  paymentVoucher: z.string().max(64).optional(),
  
  /** Default statement template */
  statement: z.string().max(64).optional(),
  
  /** Default reminder/dunning template */
  reminder: z.string().max(64).optional(),
  
  /** Default purchase order template */
  purchaseOrder: z.string().max(64).optional(),
  
  /** Default quotation template */
  quotation: z.string().max(64).optional(),
  
  /** Template locale preference */
  locale: z.string().max(10).default('en'),
  
  /** Custom templates map (for entity-specific overrides) */
  customTemplates: z.array(documentTemplateRefSchema).optional(),
})
export type DocumentTemplateDefaults = z.infer<typeof documentTemplateDefaultsSchema>

// ---------------------------------------------------------------------------
// Combined Entity Accounting Configuration
// ---------------------------------------------------------------------------

/**
 * Complete accounting configuration for an entity
 * Used at Agency, SubAccount, Vendor, Customer level
 */
export const entityAccountingConfigSchema = z.object({
  /** GL posting defaults */
  postingDefaults: postingDefaultsSchema.optional(),
  
  /** Stripe integration */
  stripe: stripeIntegrationSchema.optional(),
  
  /** Bank accounts */
  bankAccounts: z.array(bankAccountExtendedSchema).optional(),
  
  /** Default bank account for payments */
  defaultPaymentBankAccountId: z.string().uuid().optional().nullable(),
  
  /** Default bank account for receipts */
  defaultReceiptBankAccountId: z.string().uuid().optional().nullable(),
  
  /** Document template defaults */
  documentTemplates: documentTemplateDefaultsSchema.optional(),
  
  /** Default posting template key (FI-GL) */
  defaultPostingTemplateKey: z.string().max(64).optional(),
  
  /** Tax configuration */
  taxConfig: z.object({
    /** Tax registration number */
    taxRegistrationNumber: z.string().max(64).optional(),
    /** Tax scheme (VAT, GST, SST) */
    taxScheme: z.enum(['VAT', 'GST', 'SST', 'TIN', 'NONE']).optional(),
    /** Is tax registered */
    isTaxRegistered: z.boolean().default(false),
    /** Standard tax rate (percentage) */
    standardTaxRate: z.number().min(0).max(100).optional(),
    /** Tax filing frequency */
    taxFilingFrequency: z.enum(['MONTHLY', 'QUARTERLY', 'YEARLY']).optional(),
  }).optional(),
})
export type EntityAccountingConfig = z.infer<typeof entityAccountingConfigSchema>
