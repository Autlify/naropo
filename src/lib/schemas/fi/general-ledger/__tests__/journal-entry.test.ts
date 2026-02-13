/**
 * FI-GL Journal Entry Schema Tests
 */

import { describe, test, expect } from 'bun:test'
import {
  journalEntryLineSchema,
  createJournalEntrySchema,
  updateJournalEntrySchema,
  submitJournalEntrySchema,
  approveJournalEntrySchema,
  rejectJournalEntrySchema,
  reverseJournalEntrySchema,
  voidJournalEntrySchema,
  nextLineNumber,
} from '../journal-entry'

describe('FI-GL journalEntry schema', () => {
  // Valid UUIDs following RFC 4122 (version 4)
  const validAccountId = '550e8400-e29b-41d4-a716-446655440001'
  const validPeriodId = '550e8400-e29b-41d4-a716-446655440002'

  // Helper to create valid line data
  const createLine = (lineNumber: number, debit: number, credit: number) => ({
    lineNumber,
    accountId: validAccountId,
    description: `Line ${lineNumber}`,
    debitAmount: debit,
    creditAmount: credit,
    subledgerType: 'NONE' as const,
    isIntercompany: false,
  })

  describe('journalEntryLineSchema', () => {
    test('accepts valid debit line', () => {
      const result = journalEntryLineSchema.safeParse({
        lineNumber: 1,
        accountId: validAccountId,
        description: 'Revenue posting',
        debitAmount: 1000,
        creditAmount: 0,
        subledgerType: 'NONE' as const,
        isIntercompany: false,
      })
      expect(result.success).toBe(true)
    })

    test('accepts valid credit line', () => {
      const result = journalEntryLineSchema.safeParse({
        lineNumber: 2,
        accountId: validAccountId,
        description: 'Cash payment',
        debitAmount: 0,
        creditAmount: 500.50,
        subledgerType: 'NONE' as const,
        isIntercompany: false,
      })
      expect(result.success).toBe(true)
    })

    test('rejects line with both debit and credit', () => {
      const result = journalEntryLineSchema.safeParse({
        lineNumber: 1,
        accountId: validAccountId,
        debitAmount: 100,
        creditAmount: 100,
        subledgerType: 'NONE' as const,
        isIntercompany: false,
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        const messages = result.error.issues.map((i) => i.message).join(' ')
        expect(messages).toContain('both debit and credit')
      }
    })

    test('rejects line with zero amounts', () => {
      const result = journalEntryLineSchema.safeParse({
        lineNumber: 1,
        accountId: validAccountId,
        debitAmount: 0,
        creditAmount: 0,
        subledgerType: 'NONE' as const,
        isIntercompany: false,
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        const messages = result.error.issues.map((i) => i.message).join(' ')
        expect(messages).toContain('either a debit or credit')
      }
    })

    test('accepts line with subledger linking', () => {
      const result = journalEntryLineSchema.safeParse({
        lineNumber: 1,
        accountId: validAccountId,
        debitAmount: 500,
        creditAmount: 0,
        subledgerType: 'ACCOUNTS_RECEIVABLE' as const,
        subledgerReference: 'INV-2026-001',
        isIntercompany: false,
      })
      expect(result.success).toBe(true)
    })

    test('accepts line with dimensions', () => {
      const result = journalEntryLineSchema.safeParse({
        lineNumber: 1,
        accountId: validAccountId,
        debitAmount: 1000,
        creditAmount: 0,
        dimension1: 'CC001', // Cost center
        dimension2: 'SALES', // Department
        dimension3: 'PROJ-A', // Project
        subledgerType: 'NONE' as const,
        isIntercompany: false,
      })
      expect(result.success).toBe(true)
    })

    test('accepts line with exchange rate override', () => {
      const result = journalEntryLineSchema.safeParse({
        lineNumber: 1,
        accountId: validAccountId,
        debitAmount: 1000,
        creditAmount: 0,
        exchangeRate: 4.75,
        subledgerType: 'NONE' as const,
        isIntercompany: false,
      })
      expect(result.success).toBe(true)
    })
  })

  describe('createJournalEntrySchema', () => {
    test('accepts minimal valid journal entry', () => {
      const result = createJournalEntrySchema.safeParse({
        periodId: validPeriodId,
        entryDate: '2026-02-01',
        description: 'Test journal entry',
        currencyCode: 'MYR',
        lines: [
          createLine(1, 1000, 0),
          createLine(2, 0, 1000),
        ],
      })
      expect(result.success).toBe(true)
    })

    test('rejects unbalanced journal entry', () => {
      const result = createJournalEntrySchema.safeParse({
        periodId: validPeriodId,
        entryDate: '2026-02-01',
        description: 'Unbalanced entry',
        currencyCode: 'MYR',
        lines: [
          createLine(1, 1000, 0),
          createLine(2, 0, 500), // Debits != Credits
        ],
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('double-entry')
      }
    })

    test('accepts balanced entry with rounding tolerance', () => {
      const result = createJournalEntrySchema.safeParse({
        periodId: validPeriodId,
        entryDate: '2026-02-01',
        description: 'Entry with minor rounding',
        currencyCode: 'MYR',
        lines: [
          createLine(1, 1000.005, 0), // Slight rounding difference
          createLine(2, 0, 1000),
        ],
      })
      expect(result.success).toBe(true) // Tolerance of 0.01 allowed
    })

    test('rejects entry with single line', () => {
      const result = createJournalEntrySchema.safeParse({
        periodId: validPeriodId,
        entryDate: '2026-02-01',
        description: 'Single line entry',
        currencyCode: 'MYR',
        lines: [createLine(1, 1000, 0)],
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('At least 2 lines')
      }
    })

    test('accepts entry with entry type and source module', () => {
      const result = createJournalEntrySchema.safeParse({
        periodId: validPeriodId,
        entryDate: '2026-02-01',
        entryType: 'ADJUSTMENT',
        sourceModule: 'INVOICE',
        sourceId: validAccountId,
        sourceReference: 'INV-2026-001',
        description: 'Invoice posting',
        currencyCode: 'MYR',
        lines: [
          createLine(1, 1000, 0),
          createLine(2, 0, 1000),
        ],
      })
      expect(result.success).toBe(true)
    })

    test('accepts multi-currency entry', () => {
      const result = createJournalEntrySchema.safeParse({
        periodId: validPeriodId,
        entryDate: '2026-02-01',
        description: 'USD transaction',
        currencyCode: 'USD',
        exchangeRate: 4.75,
        lines: [
          createLine(1, 1000, 0),
          createLine(2, 0, 1000),
        ],
      })
      expect(result.success).toBe(true)
    })

    test('accepts complex multi-line balanced entry', () => {
      const result = createJournalEntrySchema.safeParse({
        periodId: validPeriodId,
        entryDate: '2026-02-01',
        description: 'Multi-line posting',
        currencyCode: 'MYR',
        lines: [
          createLine(1, 500, 0),
          createLine(2, 300, 0),
          createLine(3, 200, 0),
          createLine(4, 0, 600),
          createLine(5, 0, 400),
        ],
      })
      expect(result.success).toBe(true)
    })
  })

  describe('updateJournalEntrySchema', () => {
    test('requires id for update', () => {
      const result = updateJournalEntrySchema.safeParse({
        id: validAccountId,
        periodId: validPeriodId,
        entryDate: '2026-02-01',
        description: 'Updated entry',
        currencyCode: 'MYR',
        lines: [
          createLine(1, 2000, 0),
          createLine(2, 0, 2000),
        ],
      })
      expect(result.success).toBe(true)
    })
  })

  describe('action schemas', () => {
    test('submitJournalEntrySchema requires id', () => {
      const result = submitJournalEntrySchema.safeParse({
        id: validAccountId,
      })
      expect(result.success).toBe(true)
    })

    test('approveJournalEntrySchema accepts optional notes', () => {
      const result = approveJournalEntrySchema.safeParse({
        id: validAccountId,
        notes: 'Approved as per policy',
      })
      expect(result.success).toBe(true)
    })

    test('rejectJournalEntrySchema requires reason', () => {
      const result = rejectJournalEntrySchema.safeParse({
        id: validAccountId,
      })
      expect(result.success).toBe(false)

      const validResult = rejectJournalEntrySchema.safeParse({
        id: validAccountId,
        reason: 'Missing documentation',
      })
      expect(validResult.success).toBe(true)
    })

    test('reverseJournalEntrySchema requires date and reason', () => {
      const result = reverseJournalEntrySchema.safeParse({
        id: validAccountId,
        reversalDate: '2026-02-15',
        reason: 'Entry posted in error',
      })
      expect(result.success).toBe(true)
    })

    test('voidJournalEntrySchema requires reason', () => {
      const result = voidJournalEntrySchema.safeParse({
        id: validAccountId,
        reason: 'Duplicate entry',
      })
      expect(result.success).toBe(true)
    })
  })

  describe('nextLineNumber helper', () => {
    test('returns 1 for empty lines', () => {
      expect(nextLineNumber([])).toBe(1)
    })

    test('returns next sequential number', () => {
      const lines = [
        { lineNumber: 1, accountId: validAccountId, debitAmount: 100, creditAmount: 0, subledgerType: 'NONE' as const, isIntercompany: false },
        { lineNumber: 2, accountId: validAccountId, debitAmount: 0, creditAmount: 100, subledgerType: 'NONE' as const, isIntercompany: false },
      ]
      expect(nextLineNumber(lines)).toBe(3)
    })

    test('handles non-sequential line numbers', () => {
      const lines = [
        { lineNumber: 1, accountId: validAccountId, debitAmount: 100, creditAmount: 0, subledgerType: 'NONE' as const, isIntercompany: false },
        { lineNumber: 5, accountId: validAccountId, debitAmount: 0, creditAmount: 100, subledgerType: 'NONE' as const, isIntercompany: false },
      ]
      expect(nextLineNumber(lines)).toBe(6)
    })
  })
})
