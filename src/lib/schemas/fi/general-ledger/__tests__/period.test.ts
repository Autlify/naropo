/**
 * FI-GL Period Schema Tests
 */

import { describe, test, expect } from 'bun:test'
import {
  createPeriodSchema,
  updatePeriodSchema,
  openPeriodSchema,
  closePeriodSchema,
  lockPeriodSchema,
  yearEndProcessingSchema,
  financialPeriodSchema,
} from '../period'

describe('FI-GL period schema', () => {
  const validUUID = '550e8400-e29b-41d4-a716-446655440001'

  describe('createPeriodSchema', () => {
    test('accepts valid monthly period', () => {
      const result = createPeriodSchema.safeParse({
        name: 'January 2026',
        shortName: 'Jan-26',
        periodType: 'MONTH',
        fiscalYear: 2026,
        fiscalPeriod: 1,
        startDate: '2026-01-01',
        endDate: '2026-01-31',
      })
      expect(result.success).toBe(true)
    })

    test('accepts quarterly period', () => {
      const result = createPeriodSchema.safeParse({
        name: 'Q1 FY2026',
        shortName: 'Q1-26',
        periodType: 'QUARTER',
        fiscalYear: 2026,
        fiscalPeriod: 1,
        startDate: '2026-01-01',
        endDate: '2026-03-31',
      })
      expect(result.success).toBe(true)
    })

    test('accepts year-end period', () => {
      const result = createPeriodSchema.safeParse({
        name: 'December 2026',
        periodType: 'MONTH',
        fiscalYear: 2026,
        fiscalPeriod: 12,
        startDate: '2026-12-01',
        endDate: '2026-12-31',
        isYearEnd: true,
        notes: 'Year-end closing period',
      })
      expect(result.success).toBe(true)
    })

    test('rejects end date before start date', () => {
      const result = createPeriodSchema.safeParse({
        name: 'Invalid Period',
        periodType: 'MONTH',
        fiscalYear: 2026,
        fiscalPeriod: 1,
        startDate: '2026-01-31',
        endDate: '2026-01-01',
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('after start date')
      }
    })

    test('validates fiscal year range', () => {
      const tooOld = createPeriodSchema.safeParse({
        name: 'Old Period',
        periodType: 'YEAR',
        fiscalYear: 1999,
        fiscalPeriod: 1,
        startDate: '1999-01-01',
        endDate: '1999-12-31',
      })
      expect(tooOld.success).toBe(false)

      const tooNew = createPeriodSchema.safeParse({
        name: 'Future Period',
        periodType: 'YEAR',
        fiscalYear: 2101,
        fiscalPeriod: 1,
        startDate: '2101-01-01',
        endDate: '2101-12-31',
      })
      expect(tooNew.success).toBe(false)
    })

    test('validates fiscal period range', () => {
      const invalid = createPeriodSchema.safeParse({
        name: 'Invalid Fiscal Period',
        periodType: 'MONTH',
        fiscalYear: 2026,
        fiscalPeriod: 13, // Invalid - max is 12
        startDate: '2026-01-01',
        endDate: '2026-01-31',
      })
      expect(invalid.success).toBe(false)

      const valid = createPeriodSchema.safeParse({
        name: 'December',
        periodType: 'MONTH',
        fiscalYear: 2026,
        fiscalPeriod: 12,
        startDate: '2026-12-01',
        endDate: '2026-12-31',
      })
      expect(valid.success).toBe(true)
    })

    test('accepts all period types', () => {
      const periodTypes = ['MONTH', 'QUARTER', 'HALF_YEAR', 'YEAR', 'CUSTOM']
      
      for (const periodType of periodTypes) {
        const result = createPeriodSchema.safeParse({
          name: `Period - ${periodType}`,
          periodType,
          fiscalYear: 2026,
          fiscalPeriod: 1,
          startDate: '2026-01-01',
          endDate: '2026-01-31',
        })
        expect(result.success).toBe(true)
      }
    })
  })

  describe('updatePeriodSchema', () => {
    test('requires id and all createPeriodSchema fields', () => {
      const result = updatePeriodSchema.safeParse({
        id: validUUID,
        name: 'Updated Period Name',
        periodType: 'MONTH',
        fiscalYear: 2026,
        fiscalPeriod: 2,
        startDate: '2026-02-01',
        endDate: '2026-02-28',
      })
      expect(result.success).toBe(true)
    })
  })

  describe('action schemas', () => {
    test('openPeriodSchema requires id', () => {
      const result = openPeriodSchema.safeParse({
        id: validUUID,
      })
      expect(result.success).toBe(true)
    })

    test('closePeriodSchema accepts optional notes', () => {
      const result = closePeriodSchema.safeParse({
        id: validUUID,
        notes: 'Period closed after reconciliation',
      })
      expect(result.success).toBe(true)
    })

    test('lockPeriodSchema accepts optional notes', () => {
      const result = lockPeriodSchema.safeParse({
        id: validUUID,
        notes: 'Locked for audit',
      })
      expect(result.success).toBe(true)
    })
  })

  describe('yearEndProcessingSchema', () => {
    test('requires period and retained earnings account', () => {
      const result = yearEndProcessingSchema.safeParse({
        periodId: validUUID,
        retainedEarningsAccountId: validUUID,
      })
      expect(result.success).toBe(true)
    })

    test('accepts full year-end options', () => {
      const result = yearEndProcessingSchema.safeParse({
        periodId: validUUID,
        retainedEarningsAccountId: validUUID,
        createBroughtForward: true,
        notes: 'FY2026 year-end closing',
      })
      expect(result.success).toBe(true)
    })

    test('defaults createBroughtForward to true', () => {
      const result = yearEndProcessingSchema.safeParse({
        periodId: validUUID,
        retainedEarningsAccountId: validUUID,
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.createBroughtForward).toBe(true)
      }
    })
  })

  describe('financialPeriodSchema', () => {
    test('validates period status enum', () => {
      const statuses = ['FUTURE', 'OPEN', 'CLOSED', 'LOCKED']
      
      for (const status of statuses) {
        const result = financialPeriodSchema.safeParse({
          name: 'Period',
          periodType: 'MONTH',
          fiscalYear: 2026,
          fiscalPeriod: 1,
          startDate: '2026-01-01',
          endDate: '2026-01-31',
          status,
        })
        expect(result.success).toBe(true)
      }
    })
  })
})
