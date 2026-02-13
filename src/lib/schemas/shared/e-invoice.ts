/**
 * Shared E-Invoice Schema
 *
 * Purpose:
 * - Provides e-Invoice related types and validations for international compliance
 * - Aligns with UBL 2.1, Peppol BIS 3.0, EN16931, and regional standards
 * - Used by both FI-AP (receiving) and FI-AR (sending) modules
 * - Supports optional enablement based on business requirements
 *
 * @see src/types/billing.ts for full type definitions
 * @see https://docs.peppol.eu/poacc/billing/3.0/
 * @see https://www.lhdn.gov.my/myinvois/ (Malaysia)
 */

import { z } from 'zod'

// ---------------------------------------------------------------------------
// E-Invoice Format Enum
// ---------------------------------------------------------------------------

export const eInvoiceFormatEnum = z.enum([
  'UBL_2_1',          // OASIS Universal Business Language 2.1
  'CII_D16B',         // UN/CEFACT Cross Industry Invoice D16B
  'PEPPOL_BIS_3',     // Peppol Business Interoperability Specification 3.0
  'EN16931',          // European semantic standard
  'MYINVOIS',         // Malaysia LHDN MyInvois
  'ZATCA_FATOORA',    // Saudi Arabia ZATCA Fatoora
  'SGP_INVOICENOW',   // Singapore InvoiceNow (Peppol-based)
  'FACTUR_X',         // France/Germany hybrid PDF/XML
  'XRECHNUNG',        // German e-Invoice standard (EN16931 CIUS)
  'FatturaPA',        // Italy electronic invoice
  'GST_EINVOICE',     // India GST e-Invoice
])
export type EInvoiceFormat = z.infer<typeof eInvoiceFormatEnum>

// ---------------------------------------------------------------------------
// E-Invoice Status Enum
// ---------------------------------------------------------------------------

export const eInvoiceStatusEnum = z.enum([
  'DRAFT',            // Not yet validated or submitted
  'PENDING_VALIDATION', // Awaiting format/schema validation
  'VALIDATED',        // Passed validation, ready to submit
  'SUBMITTED',        // Sent to tax authority/recipient
  'ACCEPTED',         // Accepted by tax authority
  'REJECTED',         // Rejected with errors
  'CANCELLED',        // Cancelled after acceptance
  'EXPIRED',          // Past submission deadline
])
export type EInvoiceStatus = z.infer<typeof eInvoiceStatusEnum>

// ---------------------------------------------------------------------------
// Document Type Code (UNCL1001)
// ---------------------------------------------------------------------------

export const eInvoiceDocumentTypeEnum = z.enum([
  '380',   // Commercial invoice
  '381',   // Credit note
  '383',   // Debit note
  '384',   // Corrected invoice
  '386',   // Prepayment invoice
  '389',   // Self-billed invoice
  '751',   // Invoice information for accounting purposes
])
export type EInvoiceDocumentType = z.infer<typeof eInvoiceDocumentTypeEnum>

// ---------------------------------------------------------------------------
// Tax Scheme ID
// ---------------------------------------------------------------------------

export const taxSchemeIdEnum = z.enum([
  'VAT',       // Value Added Tax
  'GST',       // Goods and Services Tax
  'SST',       // Sales and Service Tax (Malaysia)
  'TIN',       // Tax Identification Number scheme
  'ABN',       // Australian Business Number
  'GST_MY',    // Malaysia GST (historical, pre-SST)
])
export type TaxSchemeId = z.infer<typeof taxSchemeIdEnum>

// ---------------------------------------------------------------------------
// Tax Category Code (UNCL5305)
// ---------------------------------------------------------------------------

export const taxCategoryCodeEnum = z.enum([
  'S',    // Standard rate
  'Z',    // Zero rated goods
  'E',    // Exempt from tax
  'AE',   // VAT Reverse Charge
  'K',    // Intra-community supply (VAT exempt)
  'G',    // Export outside the EU (exempt)
  'O',    // Services outside scope of tax
  'L',    // Canary Islands general indirect tax
  'M',    // Canary Islands general indirect tax (other)
])
export type TaxCategoryCode = z.infer<typeof taxCategoryCodeEnum>

// ---------------------------------------------------------------------------
// Industry Classification Scheme
// ---------------------------------------------------------------------------

export const industryClassificationSchemeEnum = z.enum([
  'MSIC_2008',      // Malaysian Standard Industrial Classification 2008
  'MSIC_2020',      // Malaysian Standard Industrial Classification 2020
  'ISIC_REV4',      // International Standard Industrial Classification Rev.4
  'SIC_US',         // US Standard Industrial Classification
  'NAICS_2022',     // North American Industry Classification System 2022
  'NACE_REV2',      // Statistical Classification of Economic Activities in EC
  'SSIC_2020',      // Singapore Standard Industrial Classification 2020
  'ANZSIC_2006',    // Australian/New Zealand SIC 2006
  'UNSPSC',         // United Nations Standard Products and Services Code
  'CPV',            // Common Procurement Vocabulary (EU)
  'HS_2022',        // Harmonized System 2022 (customs/trade)
])
export type IndustryClassificationScheme = z.infer<typeof industryClassificationSchemeEnum>

// ---------------------------------------------------------------------------
// E-Invoice Party (Supplier/Customer)
// ---------------------------------------------------------------------------

export const eInvoiceAddressSchema = z.object({
  /** Street name and building number */
  streetName: z.string().max(255).optional(),
  /** Additional street name */
  additionalStreetName: z.string().max(255).optional(),
  /** City name */
  cityName: z.string().max(128).optional(),
  /** Postal/ZIP code */
  postalZone: z.string().max(32).optional(),
  /** State/region/province */
  countrySubentity: z.string().max(64).optional(),
  /** Country code (ISO 3166-1 alpha-2) */
  countryCode: z.string().length(2),
})
export type EInvoiceAddress = z.infer<typeof eInvoiceAddressSchema>

export const eInvoiceContactSchema = z.object({
  name: z.string().max(255).optional(),
  telephone: z.string().max(32).optional(),
  email: z.string().email().optional(),
})
export type EInvoiceContact = z.infer<typeof eInvoiceContactSchema>

export const eInvoicePartyIdentificationSchema = z.object({
  id: z.string().min(1).max(128),
  /** Scheme ID (ISO 6523 ICD codes) */
  schemeId: z.string().min(1).max(64).optional(),
})
export type EInvoicePartyIdentification = z.infer<typeof eInvoicePartyIdentificationSchema>

export const eInvoiceTaxRegistrationSchema = z.object({
  companyId: z.string().min(1).max(64),
  taxScheme: taxSchemeIdEnum,
})
export type EInvoiceTaxRegistration = z.infer<typeof eInvoiceTaxRegistrationSchema>

export const eInvoicePartySchema = z.object({
  /** Party name (required) */
  name: z.string().min(1).max(255),
  /** Trading name (if different from legal name) */
  tradingName: z.string().max(255).optional(),
  /** Party identification (registration number, etc.) */
  partyIdentification: z.array(eInvoicePartyIdentificationSchema).optional(),
  /** Tax registration (VAT/GST number) */
  taxRegistration: z.array(eInvoiceTaxRegistrationSchema).optional(),
  /** Postal address */
  postalAddress: eInvoiceAddressSchema.optional(),
  /** Contact information */
  contact: eInvoiceContactSchema.optional(),
  /** Legal entity information */
  legalEntity: z.object({
    registrationName: z.string().min(1).max(255),
    companyId: z.string().max(64).optional(),
    companyIdScheme: z.string().max(64).optional(),
  }).optional(),
})
export type EInvoiceParty = z.infer<typeof eInvoicePartySchema>

// ---------------------------------------------------------------------------
// E-Invoice Tax Category
// ---------------------------------------------------------------------------

export const eInvoiceTaxCategorySchema = z.object({
  /** Tax category code (UNCL5305) */
  id: taxCategoryCodeEnum,
  /** Tax percentage */
  percent: z.number().min(0).max(100).optional(),
  /** Tax scheme ID */
  taxScheme: taxSchemeIdEnum,
  /** Exemption reason code (if applicable) */
  exemptionReasonCode: z.string().max(64).optional(),
  /** Exemption reason text */
  exemptionReason: z.string().max(500).optional(),
})
export type EInvoiceTaxCategory = z.infer<typeof eInvoiceTaxCategorySchema>

// ---------------------------------------------------------------------------
// E-Invoice Allowance/Charge
// ---------------------------------------------------------------------------

export const eInvoiceAllowanceChargeSchema = z.object({
  /** true = charge, false = allowance */
  chargeIndicator: z.boolean(),
  /** Reason code (e.g., discount, freight) */
  allowanceChargeReasonCode: z.string().max(64).optional(),
  /** Reason description */
  allowanceChargeReason: z.string().max(500).optional(),
  /** Percentage (if percentage-based) */
  multiplierFactorNumeric: z.number().min(0).max(100).optional(),
  /** Amount */
  amount: z.number(),
  /** Base amount (if percentage-based) */
  baseAmount: z.number().optional(),
  /** Tax category for this allowance/charge */
  taxCategory: eInvoiceTaxCategorySchema.optional(),
})
export type EInvoiceAllowanceCharge = z.infer<typeof eInvoiceAllowanceChargeSchema>

// ---------------------------------------------------------------------------
// E-Invoice Line Item
// ---------------------------------------------------------------------------

export const eInvoiceLineItemSchema = z.object({
  /** Line ID (sequential, starts at 1) */
  id: z.string().min(1).max(64),
  /** Quantity */
  invoicedQuantity: z.number(),
  /** Quantity unit code (UN/ECE rec 20) */
  unitCode: z.string().min(1).max(8),
  /** Line extension amount (quantity × price, before tax) */
  lineExtensionAmount: z.number(),
  /** Currency code (ISO 4217) */
  currencyCode: z.string().length(3),
  /** Item/commodity classification */
  item: z.object({
    name: z.string().min(1).max(255),
    description: z.string().max(500).optional(),
    /** Seller's item identification */
    sellersItemId: z.string().max(64).optional(),
    /** Standard item identification (e.g., GTIN/EAN) */
    standardItemId: z.object({
      id: z.string().min(1).max(64),
      schemeId: z.string().max(16).optional(),
    }).optional(),
    /** Commodity classification */
    commodityClassification: z.array(z.object({
      itemClassificationCode: z.string().min(1).max(64),
      listId: industryClassificationSchemeEnum,
    })).optional(),
    /** Tax category for this item */
    taxCategory: eInvoiceTaxCategorySchema.optional(),
  }),
  /** Price information */
  price: z.object({
    priceAmount: z.number(),
    baseQuantity: z.number().optional(),
  }),
  /** Allowances/charges at line level */
  allowanceCharge: z.array(eInvoiceAllowanceChargeSchema).optional(),
  /** Order line reference */
  orderLineReference: z.string().max(64).optional(),
})
export type EInvoiceLineItem = z.infer<typeof eInvoiceLineItemSchema>

// ---------------------------------------------------------------------------
// E-Invoice Submission Metadata
// ---------------------------------------------------------------------------

export const eInvoiceValidationErrorSchema = z.object({
  code: z.string().min(1).max(64),
  message: z.string().min(1).max(500),
  path: z.string().max(255).optional(),
})
export type EInvoiceValidationError = z.infer<typeof eInvoiceValidationErrorSchema>

export const eInvoiceSubmissionMetadataSchema = z.object({
  /** Submission status */
  status: eInvoiceStatusEnum,
  /** Submission timestamp (ISO 8601) */
  submittedAt: z.coerce.date().optional(),
  /** Tax authority response ID */
  authorityResponseId: z.string().max(255).optional(),
  /** Tax authority validation ID (e.g., LHDN UUID) */
  validationId: z.string().max(255).optional(),
  /** Long-term validation ID (LTVID for archival) */
  longTermValidationId: z.string().max(255).optional(),
  /** QR code data (for jurisdictions requiring printed QR) */
  qrCodeData: z.string().max(2000).optional(),
  /** Digital signature */
  digitalSignature: z.object({
    signedAt: z.coerce.date(),
    signatureValue: z.string().max(2000),
    certificateInfo: z.string().max(500).optional(),
  }).optional(),
  /** Validation errors (if rejected) */
  validationErrors: z.array(eInvoiceValidationErrorSchema).optional(),
})
export type EInvoiceSubmissionMetadata = z.infer<typeof eInvoiceSubmissionMetadataSchema>

// ---------------------------------------------------------------------------
// E-Invoice Configuration (Entity-level)
// ---------------------------------------------------------------------------

/**
 * E-Invoice configuration for entities (Agency, SubAccount, Vendor, Customer)
 * Controls whether e-invoice is enabled and how it's processed
 */
export const eInvoiceConfigSchema = z.object({
  /** Whether e-invoice is enabled for this entity */
  enabled: z.boolean().default(false),

  /** Preferred e-invoice format */
  format: eInvoiceFormatEnum.optional(),

  /** Peppol/Network participant ID */
  participantId: z.string().min(1).max(128).optional(),

  /** Participant identification scheme (ISO 6523 ICD) */
  schemeId: z.string().min(1).max(64).optional(),

  /** Endpoint ID for receiving e-invoices */
  endpointId: z.string().max(255).optional(),

  /** Endpoint scheme ID */
  endpointSchemeId: z.string().max(64).optional(),

  /** Electronic delivery preferred over paper */
  electronicDeliveryPreferred: z.boolean().default(true),

  /** Whether digital signature is required */
  requireDigitalSignature: z.boolean().default(false),

  /** Auto-submit to tax authority after validation */
  autoSubmit: z.boolean().default(false),

  /** Archive retention period in months */
  archiveRetentionMonths: z.number().int().min(0).default(84), // 7 years default
})
export type EInvoiceConfig = z.infer<typeof eInvoiceConfigSchema>

// ---------------------------------------------------------------------------
// E-Invoice Document Fields (for invoice schemas)
// ---------------------------------------------------------------------------

/**
 * E-Invoice fields to embed in AP/AR invoice schemas
 * These fields support optional e-invoice compliance
 */
export const eInvoiceDocumentFieldsSchema = z.object({
  /** E-Invoice format used */
  eInvoiceFormat: eInvoiceFormatEnum.optional(),

  /** Document type code (UNCL1001) */
  eInvoiceDocumentTypeCode: eInvoiceDocumentTypeEnum.optional(),

  /** Customization ID (CIUS profile identifier) */
  customizationId: z.string().max(255).optional(),

  /** Profile ID (e.g., Peppol BIS 3.0) */
  profileId: z.string().max(255).optional(),

  /** Supplier party (UBL format) */
  supplierParty: eInvoicePartySchema.optional(),

  /** Customer party (UBL format) */
  customerParty: eInvoicePartySchema.optional(),

  /** E-Invoice formatted lines (UBL format) */
  eInvoiceLines: z.array(eInvoiceLineItemSchema).optional(),

  /** Document-level allowances/charges */
  allowanceCharge: z.array(eInvoiceAllowanceChargeSchema).optional(),

  /** Tax totals */
  taxTotal: z.object({
    taxAmount: z.number(),
    taxSubtotal: z.array(z.object({
      taxableAmount: z.number(),
      taxAmount: z.number(),
      taxCategory: eInvoiceTaxCategorySchema,
    })).optional(),
  }).optional(),

  /** Legal monetary total (UBL format) */
  legalMonetaryTotal: z.object({
    lineExtensionAmount: z.number(),
    taxExclusiveAmount: z.number(),
    taxInclusiveAmount: z.number(),
    allowanceTotalAmount: z.number().optional(),
    chargeTotalAmount: z.number().optional(),
    prepaidAmount: z.number().optional(),
    payableRoundingAmount: z.number().optional(),
    payableAmount: z.number(),
  }).optional(),

  /** Submission metadata */
  submissionMetadata: eInvoiceSubmissionMetadataSchema.optional(),

  /** E-Invoice submission ID (from tax authority) */
  eInvoiceSubmissionId: z.string().max(255).optional(),

  /** Raw e-invoice XML/JSON (for archival) */
  eInvoiceRawDocument: z.string().optional(),
})
export type EInvoiceDocumentFields = z.infer<typeof eInvoiceDocumentFieldsSchema>

// ---------------------------------------------------------------------------
// Industry Classification
// ---------------------------------------------------------------------------

export const industryClassificationSchema = z.object({
  /** Classification scheme used */
  scheme: industryClassificationSchemeEnum,
  /** Classification code */
  code: z.string().min(1).max(32),
  /** Description */
  description: z.string().max(500).optional(),
  /** Version or revision */
  version: z.string().max(32).optional(),
  /** Parent code (hierarchical) */
  parentCode: z.string().max(32).optional(),
  /** Level in hierarchy */
  level: z.number().int().min(0).optional(),
})
export type IndustryClassification = z.infer<typeof industryClassificationSchema>

// ---------------------------------------------------------------------------
// Tax Exemption
// ---------------------------------------------------------------------------

export const taxExemptionVerificationStatusEnum = z.enum([
  'PENDING',
  'VERIFIED',
  'REJECTED',
  'EXPIRED',
])
export type TaxExemptionVerificationStatus = z.infer<typeof taxExemptionVerificationStatusEnum>

export const taxExemptionCertificateSchema = z.object({
  /** Certificate ID/number */
  certificateId: z.string().min(1).max(128),
  /** Exemption reason code */
  exemptionReasonCode: z.string().min(1).max(64).optional(),
  /** Exemption reason text */
  exemptionReason: z.string().max(500).optional(),
  /** Issuing authority */
  issuingAuthority: z.string().max(255).optional(),
  /** Country of issuance (ISO 3166-1 alpha-2) */
  countryCode: z.string().length(2).optional(),
  /** Issue date */
  issueDate: z.coerce.date().optional(),
  /** Expiry date (null for permanent) */
  expiryDate: z.coerce.date().optional().nullable(),
  /** Tax types covered */
  coveredTaxTypes: z.array(taxSchemeIdEnum).optional(),
  /** Percentage exempted (100 = full) */
  exemptionPercentage: z.number().min(0).max(100).default(100),
  /** Document URL */
  documentUrl: z.string().url().optional(),
  /** Verification status */
  verificationStatus: taxExemptionVerificationStatusEnum.default('PENDING'),
  /** Verified by */
  verifiedBy: z.string().max(255).optional(),
  /** Verification date */
  verifiedAt: z.coerce.date().optional(),
  /** Notes */
  notes: z.string().max(1000).optional(),
})
export type TaxExemptionCertificate = z.infer<typeof taxExemptionCertificateSchema>
