/**
 * Tax Management Schemas
 * FI-GL Module - Tax accounts, codes, and posting configuration
 * 
 * @namespace Autlify.Lib.Schemas.FI.GL.Tax
 */

import { z } from 'zod'

/** Tax type options */
export const taxTypeEnum = z.enum(['INPUT', 'OUTPUT', 'WITHHOLDING', 'EXEMPT'])
export type TaxType = z.infer<typeof taxTypeEnum>

/** Tax period options */
export const taxPeriodEnum = z.enum(['MONTHLY', 'QUARTERLY', 'ANNUAL'])
export type TaxPeriod = z.infer<typeof taxPeriodEnum>

/** Tax code schema */
export const taxCodeSchema = z.object({
  code: z.string().min(1).max(10).regex(/^[A-Z0-9_-]+$/i, 'Code must be alphanumeric'),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  rate: z.number().min(0).max(100),
  type: taxTypeEnum,
  accountId: z.uuid(),
  reverseChargeAccountId: z.string().uuid().optional(),
  isDefault: z.boolean().default(false),
  isActive: z.boolean().default(true),
  effectiveFrom: z.coerce.date().optional(),
  effectiveTo: z.coerce.date().optional(),
})

export type TaxCodeInput = z.infer<typeof taxCodeSchema>

/** Create tax code schema */
export const createTaxCodeSchema = taxCodeSchema

/** Update tax code schema */
export const updateTaxCodeSchema = taxCodeSchema.partial().extend({
  id: z.uuid(),
})

export type UpdateTaxCodeInput = z.infer<typeof updateTaxCodeSchema>

/** Tax settings schema (part of GL configuration) */
export const taxSettingsSchema = z.object({
  enabled: z.boolean().default(false),
  
  // Tax accounts
  inputVATAccountId: z.string().uuid().nullable().optional(),
  outputVATAccountId: z.string().uuid().nullable().optional(),
  withholdingTaxAccountId: z.string().uuid().nullable().optional(),
  taxClearingAccountId: z.string().uuid().nullable().optional(),
  taxPayableAccountId: z.string().uuid().nullable().optional(),
  taxReceivableAccountId: z.string().uuid().nullable().optional(),
  
  // Tax period
  taxPeriod: taxPeriodEnum.default('MONTHLY'),
  
  // Tax codes (stored as JSON)
  taxCodes: z.array(taxCodeSchema).default([]),
  
  // Behavior
  autoApplyDefaultTax: z.boolean().default(false),
  requireTaxOnInvoice: z.boolean().default(false),
  calculateTaxInclusive: z.boolean().default(false),
})

export type TaxSettingsInput = z.infer<typeof taxSettingsSchema>

/** Tax clearing entry schema */
export const taxClearingEntrySchema = z.object({
  periodId: z.uuid(),
  clearingDate: z.coerce.date(),
  description: z.string().max(200).optional(),
  clearInputVAT: z.boolean().default(true),
  clearOutputVAT: z.boolean().default(true),
  clearWithholding: z.boolean().default(false),
  netToPayable: z.boolean().default(true),
})

export type TaxClearingEntryInput = z.infer<typeof taxClearingEntrySchema>

/** Tax calculation input */
export const taxCalculationSchema = z.object({
  amount: z.number(),
  taxCodeId: z.string(),
  isInclusive: z.boolean().default(false),
})

export type TaxCalculationInput = z.infer<typeof taxCalculationSchema>

/** Tax calculation result */
export interface TaxCalculationResult {
  netAmount: number
  taxAmount: number
  grossAmount: number
  taxRate: number
  taxAccountId: string
}

/** Tax summary for reporting */
export interface TaxSummaryItem {
  taxCode: string
  taxName: string
  type: TaxType
  rate: number
  baseAmount: number
  taxAmount: number
  accountId: string
  accountName: string
}

/** Tax report filter schema */
export const taxReportFilterSchema = z.object({
  periodId: z.string().uuid().optional(),
  fromDate: z.coerce.date().optional(),
  toDate: z.coerce.date().optional(),
  taxType: taxTypeEnum.optional(),
  taxCodes: z.array(z.string()).optional(),
  format: z.enum(['SCREEN', 'PDF', 'EXCEL', 'CSV']).default('SCREEN'),
})

export type TaxReportFilterInput = z.infer<typeof taxReportFilterSchema>

/** Preset tax templates for quick setup */
export const TAX_TEMPLATES = {
  SIMPLE_VAT: {
    name: 'Simple VAT',
    description: 'Standard input/output VAT setup',
    codes: [
      { code: 'VAT_IN', name: 'Input VAT', type: 'INPUT' as TaxType, rate: 0 },
      { code: 'VAT_OUT', name: 'Output VAT', type: 'OUTPUT' as TaxType, rate: 0 },
    ],
  },
  GST: {
    name: 'GST',
    description: 'Goods and Services Tax setup',
    codes: [
      { code: 'GST_IN', name: 'GST Input', type: 'INPUT' as TaxType, rate: 0 },
      { code: 'GST_OUT', name: 'GST Output', type: 'OUTPUT' as TaxType, rate: 0 },
      { code: 'GST_EXEMPT', name: 'GST Exempt', type: 'EXEMPT' as TaxType, rate: 0 },
    ],
  },
  SALES_TAX: {
    name: 'Sales Tax',
    description: 'US-style sales tax setup',
    codes: [
      { code: 'SALES_TAX', name: 'Sales Tax', type: 'OUTPUT' as TaxType, rate: 0 },
      { code: 'USE_TAX', name: 'Use Tax', type: 'INPUT' as TaxType, rate: 0 },
    ],
  },
  WITHHOLDING: {
    name: 'Withholding Tax',
    description: 'Income withholding tax setup',
    codes: [
      { code: 'WHT', name: 'Withholding Tax', type: 'WITHHOLDING' as TaxType, rate: 0 },
    ],
  },
  NONE: {
    name: 'No Tax',
    description: 'No tax management',
    codes: [],
  },
} as const

export type TaxTemplateKey = keyof typeof TAX_TEMPLATES

/** Alias for TAX_TEMPLATES for backward compatibility */
export const TAX_PRESETS = Object.entries(TAX_TEMPLATES).map(([id, template]) => ({
  id,
  ...template,
}))
