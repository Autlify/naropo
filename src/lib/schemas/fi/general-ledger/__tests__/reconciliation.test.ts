/**
 * FI-GL Reconciliation Schema Tests
 */

import { describe, test, expect } from 'bun:test'
import {
  createReconciliationSchema,
  reconciliationItemSchema,
  matchItemsSchema,
  unmatchItemSchema,
  reconciliationRuleSchema,
  reconciliationSchema,
  matchTransactionsSchema,
} from '../reconciliation'

describe('FI-GL reconciliation schema', () => {
  const validUUID = '550e8400-e29b-41d4-a716-446655440001'
  const validUUID2 = '550e8400-e29b-41d4-a716-446655440002'

  describe('createReconciliationSchema', () => {
    test('accepts valid reconciliation', () => {
      const result = createReconciliationSchema.safeParse({
        accountId: validUUID,
        periodId: validUUID2,
        statementBalance: 10000.0,
      })
      expect(result.success).toBe(true)
    })

    test('accepts reconciliation with description and notes', () => {
      const result = createReconciliationSchema.safeParse({
        accountId: validUUID,
        periodId: validUUID2,
        description: 'January Bank Reconciliation',
        statementBalance: 25000.0,
        notes: 'Statement from Main Bank Account',
      })
      expect(result.success).toBe(true)
    })

    test('accepts negative statement balance', () => {
      const result = createReconciliationSchema.safeParse({
        accountId: validUUID,
        periodId: validUUID,
        statementBalance: -5000.0,
      })
      expect(result.success).toBe(true)
    })

    test('validates description max length', () => {
      const result = createReconciliationSchema.safeParse({
        accountId: validUUID,
        periodId: validUUID,
        description: 'x'.repeat(501),
        statementBalance: 1000.0,
      })
      expect(result.success).toBe(false)
    })

    test('validates notes max length', () => {
      const result = createReconciliationSchema.safeParse({
        accountId: validUUID,
        periodId: validUUID,
        statementBalance: 1000.0,
        notes: 'x'.repeat(1001),
      })
      expect(result.success).toBe(false)
    })
  })

  describe('reconciliationItemSchema', () => {
    test('accepts BOOK item', () => {
      const result = reconciliationItemSchema.safeParse({
        itemType: 'BOOK',
        transactionDate: new Date('2026-01-15'),
        reference: 'CHK-001',
        description: 'Vendor payment',
        amount: -500.0,
      })
      expect(result.success).toBe(true)
    })

    test('accepts STATEMENT item', () => {
      const result = reconciliationItemSchema.safeParse({
        itemType: 'STATEMENT',
        transactionDate: new Date('2026-01-15'),
        reference: 'DEP-001',
        description: 'Customer deposit',
        amount: 1500.0,
      })
      expect(result.success).toBe(true)
    })

    test('accepts ADJUSTMENT item', () => {
      const result = reconciliationItemSchema.safeParse({
        itemType: 'ADJUSTMENT',
        transactionDate: new Date('2026-01-31'),
        description: 'Bank fee adjustment',
        amount: -25.0,
        notes: 'Monthly service charge',
      })
      expect(result.success).toBe(true)
    })

    test('rejects invalid item type', () => {
      const result = reconciliationItemSchema.safeParse({
        itemType: 'INVALID',
        transactionDate: new Date('2026-01-15'),
        amount: 100.0,
      })
      expect(result.success).toBe(false)
    })
  })

  describe('matchItemsSchema', () => {
    test('accepts valid match request', () => {
      const result = matchItemsSchema.safeParse({
        reconciliationId: validUUID,
        itemIds: [validUUID, validUUID2],
      })
      expect(result.success).toBe(true)
    })

    test('accepts multiple items to match', () => {
      const result = matchItemsSchema.safeParse({
        reconciliationId: validUUID,
        itemIds: [
          '550e8400-e29b-41d4-a716-446655440001',
          '550e8400-e29b-41d4-a716-446655440002',
          '550e8400-e29b-41d4-a716-446655440003',
        ],
      })
      expect(result.success).toBe(true)
    })

    test('rejects single item', () => {
      const result = matchItemsSchema.safeParse({
        reconciliationId: validUUID,
        itemIds: [validUUID],
      })
      expect(result.success).toBe(false) // Requires min 2 items
    })
  })

  describe('unmatchItemSchema', () => {
    test('accepts valid unmatch request', () => {
      const result = unmatchItemSchema.safeParse({
        itemId: validUUID,
      })
      expect(result.success).toBe(true)
    })
  })

  describe('reconciliationRuleSchema', () => {
    test('accepts valid rule', () => {
      const result = reconciliationRuleSchema.safeParse({
        name: 'Auto-match by Reference',
        description: 'Match items with same reference number',
        ruleDefinition: {
          matchBy: ['reference'],
        },
      })
      expect(result.success).toBe(true)
    })

    test('accepts rule with multiple match criteria', () => {
      const result = reconciliationRuleSchema.safeParse({
        name: 'Match by Amount and Date',
        ruleDefinition: {
          matchBy: ['amount', 'date'],
          tolerance: 0.5,
          dateToleranceDays: 3,
        },
        priority: 10,
        isActive: true,
      })
      expect(result.success).toBe(true)
    })

    test('accepts rule with all match criteria', () => {
      const result = reconciliationRuleSchema.safeParse({
        name: 'Full Match Rule',
        ruleDefinition: {
          matchBy: ['reference', 'amount', 'date', 'description'],
        },
      })
      expect(result.success).toBe(true)
    })

    test('validates tolerance percentage', () => {
      const invalid = reconciliationRuleSchema.safeParse({
        name: 'Invalid Tolerance',
        ruleDefinition: {
          matchBy: ['amount'],
          tolerance: 150, // Exceeds 100%
        },
      })
      expect(invalid.success).toBe(false)
    })

    test('validates date tolerance days', () => {
      const invalid = reconciliationRuleSchema.safeParse({
        name: 'Invalid Date Tolerance',
        ruleDefinition: {
          matchBy: ['date'],
          dateToleranceDays: 45, // Exceeds max 30
        },
      })
      expect(invalid.success).toBe(false)
    })

    test('validates name length', () => {
      const result = reconciliationRuleSchema.safeParse({
        name: 'x'.repeat(101),
        ruleDefinition: {
          matchBy: ['reference'],
        },
      })
      expect(result.success).toBe(false)
    })
  })

  describe('reconciliationSchema', () => {
    test('accepts valid reconciliation', () => {
      const result = reconciliationSchema.safeParse({
        accountId: validUUID,
        periodId: validUUID2,
        statementBalance: 10000.0,
        statementDate: new Date('2026-01-31'),
        bookBalance: 9750.0,
      })
      expect(result.success).toBe(true)
    })

    test('accepts with optional fields', () => {
      const result = reconciliationSchema.safeParse({
        accountId: validUUID,
        periodId: validUUID2,
        statementBalance: 15000.0,
        statementDate: new Date('2026-02-28'),
        bookBalance: 14800.0,
        description: 'February reconciliation',
        notes: 'Pending items from January cleared',
      })
      expect(result.success).toBe(true)
    })
  })

  describe('matchTransactionsSchema', () => {
    test('accepts valid match transactions', () => {
      const result = matchTransactionsSchema.safeParse({
        reconciliationId: validUUID,
        transactions: [
          { itemId: validUUID, status: 'MATCHED', matchedItemId: validUUID2 },
          { itemId: validUUID2, status: 'MATCHED', matchedItemId: validUUID },
        ],
      })
      expect(result.success).toBe(true)
    })

    test('accepts unmatched transaction', () => {
      const result = matchTransactionsSchema.safeParse({
        reconciliationId: validUUID,
        transactions: [
          { itemId: validUUID, status: 'UNMATCHED' },
        ],
      })
      expect(result.success).toBe(true)
    })

    test('accepts excluded transaction', () => {
      const result = matchTransactionsSchema.safeParse({
        reconciliationId: validUUID,
        transactions: [
          { itemId: validUUID, status: 'EXCLUDED' },
        ],
      })
      expect(result.success).toBe(true)
    })

    test('accepts discrepancy status', () => {
      const result = matchTransactionsSchema.safeParse({
        reconciliationId: validUUID,
        transactions: [
          { itemId: validUUID, status: 'DISCREPANCY' },
        ],
      })
      expect(result.success).toBe(true)
    })
  })
})
