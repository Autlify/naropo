/**
 * FI-GL Tax Schema Tests
 */

import { describe, test, expect } from 'bun:test'
import {
  taxCodeSchema,
  updateTaxCodeSchema,
  taxSettingsSchema,
  taxClearingEntrySchema,
  taxCalculationSchema,
  taxReportFilterSchema,
} from '../tax'

describe('FI-GL tax schema', () => {
  const validUUID = '550e8400-e29b-41d4-a716-446655440001'

  describe('taxCodeSchema', () => {
    test('accepts valid input tax code', () => {
      const result = taxCodeSchema.safeParse({
        code: 'VAT_IN',
        name: 'Input VAT',
        description: 'Input VAT for purchases',
        rate: 20.0,
        type: 'INPUT',
        accountId: validUUID,
      })
      expect(result.success).toBe(true)
    })

    test('accepts output tax code', () => {
      const result = taxCodeSchema.safeParse({
        code: 'VAT_OUT',
        name: 'Output VAT',
        description: 'Output VAT for sales',
        rate: 20.0,
        type: 'OUTPUT',
        accountId: validUUID,
      })
      expect(result.success).toBe(true)
    })

    test('accepts zero-rated tax code', () => {
      const result = taxCodeSchema.safeParse({
        code: 'VAT_ZERO',
        name: 'Zero Rate VAT',
        description: 'Zero-rated goods and services',
        rate: 0.0,
        type: 'OUTPUT',
      })
      expect(result.success).toBe(true)
    })

    test('accepts exempt tax code', () => {
      const result = taxCodeSchema.safeParse({
        code: 'EXEMPT',
        name: 'VAT Exempt',
        description: 'VAT exempt supplies',
        rate: 0.0,
        type: 'EXEMPT',
      })
      expect(result.success).toBe(true)
    })

    test('accepts withholding tax code', () => {
      const result = taxCodeSchema.safeParse({
        code: 'WHT',
        name: 'Withholding Tax',
        description: 'Withholding tax on services',
        rate: 15.0,
        type: 'WITHHOLDING',
        accountId: validUUID,
      })
      expect(result.success).toBe(true)
    })

    test('accepts tax code with effective dates', () => {
      const result = taxCodeSchema.safeParse({
        code: 'VAT_NEW',
        name: 'New VAT Rate',
        rate: 21.0,
        type: 'OUTPUT',
        effectiveFrom: '2026-04-01',
        effectiveTo: '2027-03-31',
      })
      expect(result.success).toBe(true)
    })

    test('validates tax rate is non-negative', () => {
      const result = taxCodeSchema.safeParse({
        code: 'INVALID',
        name: 'Invalid Tax',
        rate: -5.0,
        type: 'INPUT',
      })
      expect(result.success).toBe(false)
    })

    test('validates tax rate maximum', () => {
      const result = taxCodeSchema.safeParse({
        code: 'INVALID',
        name: 'Invalid Tax',
        rate: 150.0, // Too high
        type: 'INPUT',
      })
      expect(result.success).toBe(false)
    })

    test('validates code format', () => {
      const result = taxCodeSchema.safeParse({
        code: 'invalid code!',
        name: 'Bad Code',
        rate: 10.0,
        type: 'INPUT',
      })
      expect(result.success).toBe(false)
    })
  })

  describe('updateTaxCodeSchema', () => {
    test('allows partial updates', () => {
      const result = updateTaxCodeSchema.safeParse({
        id: validUUID,
        name: 'Updated Tax Name',
        description: 'Updated description',
      })
      expect(result.success).toBe(true)
    })

    test('allows rate update', () => {
      const result = updateTaxCodeSchema.safeParse({
        id: validUUID,
        rate: 21.0,
      })
      expect(result.success).toBe(true)
    })

    test('allows activation status update', () => {
      const result = updateTaxCodeSchema.safeParse({
        id: validUUID,
        isActive: false,
      })
      expect(result.success).toBe(true)
    })
  })

  describe('taxSettingsSchema', () => {
    test('accepts valid tax settings', () => {
      const result = taxSettingsSchema.safeParse({
        enabled: true,
        inputVATAccountId: validUUID,
        outputVATAccountId: validUUID,
        taxPeriod: 'QUARTERLY',
      })
      expect(result.success).toBe(true)
    })

    test('accepts settings with all accounts', () => {
      const result = taxSettingsSchema.safeParse({
        enabled: true,
        inputVATAccountId: validUUID,
        outputVATAccountId: validUUID,
        withholdingTaxAccountId: validUUID,
        taxClearingAccountId: validUUID,
        taxPayableAccountId: validUUID,
        taxReceivableAccountId: validUUID,
        taxPeriod: 'MONTHLY',
        autoApplyDefaultTax: true,
        requireTaxOnInvoice: true,
        calculateTaxInclusive: false,
      })
      expect(result.success).toBe(true)
    })

    test('accepts minimal settings with defaults', () => {
      const result = taxSettingsSchema.safeParse({})
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.enabled).toBe(false)
        expect(result.data.taxPeriod).toBe('MONTHLY')
      }
    })
  })

  describe('taxClearingEntrySchema', () => {
    test('accepts tax clearing entry', () => {
      const result = taxClearingEntrySchema.safeParse({
        periodId: validUUID,
        clearingDate: '2026-03-31',
        clearInputVAT: true,
        clearOutputVAT: true,
      })
      expect(result.success).toBe(true)
    })

    test('accepts clearing entry with description', () => {
      const result = taxClearingEntrySchema.safeParse({
        periodId: validUUID,
        clearingDate: '2026-03-31',
        description: 'Q1 2026 VAT clearing',
        clearInputVAT: true,
        clearOutputVAT: true,
        clearWithholding: false,
        netToPayable: true,
      })
      expect(result.success).toBe(true)
    })
  })

  describe('taxCalculationSchema', () => {
    test('accepts exclusive calculation', () => {
      const result = taxCalculationSchema.safeParse({
        amount: 1000.0,
        taxCodeId: 'VAT_OUT',
        isInclusive: false,
      })
      expect(result.success).toBe(true)
    })

    test('accepts inclusive calculation', () => {
      const result = taxCalculationSchema.safeParse({
        amount: 1200.0,
        taxCodeId: 'VAT_OUT',
        isInclusive: true,
      })
      expect(result.success).toBe(true)
    })
  })

  describe('taxReportFilterSchema', () => {
    test('accepts period filter', () => {
      const result = taxReportFilterSchema.safeParse({
        periodId: validUUID,
      })
      expect(result.success).toBe(true)
    })

    test('accepts date range filter', () => {
      const result = taxReportFilterSchema.safeParse({
        fromDate: '2026-01-01',
        toDate: '2026-03-31',
        taxType: 'OUTPUT',
      })
      expect(result.success).toBe(true)
    })

    test('accepts format and tax codes filter', () => {
      const result = taxReportFilterSchema.safeParse({
        periodId: validUUID,
        taxCodes: ['VAT_IN', 'VAT_OUT'],
        format: 'PDF',
      })
      expect(result.success).toBe(true)
    })

    test('accepts all formats', () => {
      const formats = ['SCREEN', 'PDF', 'EXCEL', 'CSV']
      for (const format of formats) {
        const result = taxReportFilterSchema.safeParse({
          periodId: validUUID,
          format,
        })
        expect(result.success).toBe(true)
      }
    })
  })
})
