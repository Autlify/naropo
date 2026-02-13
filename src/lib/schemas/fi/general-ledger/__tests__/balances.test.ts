/**
 * FI-GL Balances Schema Tests
 */

import { describe, test, expect } from 'bun:test'
import {
  glBalanceSchema,
  glBalanceAdjustmentSchema,
  glNormalBalanceSchema,
} from '../balances'

describe('FI-GL balances schema', () => {
  const validUUID = '550e8400-e29b-41d4-a716-446655440001'

  describe('glBalanceSchema', () => {
    test('accepts valid balance record', () => {
      const result = glBalanceSchema.safeParse({
        accountCode: '1000',
        periodId: validUUID,
        debit: 10000.0,
        credit: 0,
        beginningBalance: 5000.0,
        endingBalance: 15000.0,
      })
      expect(result.success).toBe(true)
    })

    test('accepts minimal balance with defaults', () => {
      const result = glBalanceSchema.safeParse({
        accountCode: '2000',
        periodId: validUUID,
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.debit).toBe(0)
        expect(result.data.credit).toBe(0)
        expect(result.data.beginningBalance).toBe(0)
        expect(result.data.endingBalance).toBe(0)
      }
    })

    test('accepts credit balance', () => {
      const result = glBalanceSchema.safeParse({
        accountCode: '3000',
        periodId: validUUID,
        debit: 0,
        credit: 5000.0,
        beginningBalance: 0,
        endingBalance: -5000.0,
      })
      expect(result.success).toBe(true)
    })

    test('rejects negative debit', () => {
      const result = glBalanceSchema.safeParse({
        accountCode: '1000',
        periodId: validUUID,
        debit: -1000.0,
        credit: 0,
      })
      expect(result.success).toBe(false)
    })

    test('rejects negative credit', () => {
      const result = glBalanceSchema.safeParse({
        accountCode: '1000',
        periodId: validUUID,
        debit: 0,
        credit: -500.0,
      })
      expect(result.success).toBe(false)
    })

    test('validates accountCode length', () => {
      const tooLong = glBalanceSchema.safeParse({
        accountCode: '12345678901234567890X', // 21 chars
        periodId: validUUID,
      })
      expect(tooLong.success).toBe(false)

      const empty = glBalanceSchema.safeParse({
        accountCode: '',
        periodId: validUUID,
      })
      expect(empty.success).toBe(false)
    })

    test('validates periodId is UUID', () => {
      const result = glBalanceSchema.safeParse({
        accountCode: '1000',
        periodId: 'not-a-uuid',
      })
      expect(result.success).toBe(false)
    })
  })

  describe('glBalanceAdjustmentSchema', () => {
    test('accepts valid adjustment', () => {
      const result = glBalanceAdjustmentSchema.safeParse({
        accountCode: '1000',
        periodId: validUUID,
        adjustmentAmount: 1000.0,
        reason: 'Account reclassification for reporting',
      })
      expect(result.success).toBe(true)
    })

    test('accepts negative adjustment', () => {
      const result = glBalanceAdjustmentSchema.safeParse({
        accountCode: '1000',
        periodId: validUUID,
        adjustmentAmount: -500.0,
        reason: 'Correction entry',
      })
      expect(result.success).toBe(true)
    })

    test('accepts adjustment without reason', () => {
      const result = glBalanceAdjustmentSchema.safeParse({
        accountCode: '2000',
        periodId: validUUID,
        adjustmentAmount: 250.0,
      })
      expect(result.success).toBe(true)
    })

    test('validates reason max length', () => {
      const result = glBalanceAdjustmentSchema.safeParse({
        accountCode: '1000',
        periodId: validUUID,
        adjustmentAmount: 100.0,
        reason: 'x'.repeat(501), // Exceeds 500 char limit
      })
      expect(result.success).toBe(false)
    })
  })

  describe('glNormalBalanceSchema', () => {
    test('accepts DEBIT', () => {
      const result = glNormalBalanceSchema.safeParse('DEBIT')
      expect(result.success).toBe(true)
    })

    test('accepts CREDIT', () => {
      const result = glNormalBalanceSchema.safeParse('CREDIT')
      expect(result.success).toBe(true)
    })

    test('rejects invalid values', () => {
      const result = glNormalBalanceSchema.safeParse('BALANCE')
      expect(result.success).toBe(false)
    })
  })
})
