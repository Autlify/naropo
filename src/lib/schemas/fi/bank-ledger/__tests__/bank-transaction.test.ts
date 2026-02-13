/**
 * FI-BL Bank Transaction Schema Tests
 */

import { describe, test, expect } from 'bun:test'
import {
  bankTransactionSchema,
  createBankTransactionSchema,
  updateBankTransactionSchema,
  bankTransactionFilterSchema,
  matchTransactionSchema,
  unmatchTransactionSchema,
  disputeTransactionSchema,
  resolveDisputeSchema,
  categorizeTransactionSchema,
  bulkCategorizeSchema,
  splitTransactionSchema,
  bankTransactionTypeEnum,
  bankTransactionStatusEnum,
  transactionSourceEnum,
  bankPaymentMethodEnum,
} from '../bank-transaction'

describe('FI-BL Bank Transaction schema', () => {
  // Valid UUIDs following RFC 4122 (version 4)
  const validAgencyId = '550e8400-e29b-41d4-a716-446655440001'
  const validBankAccountId = '550e8400-e29b-41d4-a716-446655440002'
  const validGlAccountId = '550e8400-e29b-41d4-a716-446655440003'
  const validTransactionId = '550e8400-e29b-41d4-a716-446655440010'

  // Helper to create valid transaction data
  const createValidTransaction = (overrides = {}) => ({
    agencyId: validAgencyId,
    bankAccountId: validBankAccountId,
    transactionType: 'CREDIT',
    transactionDate: new Date(),
    amount: 1500.00,
    currencyCode: 'USD',
    ...overrides,
  })

  describe('bankTransactionTypeEnum', () => {
    test('accepts valid transaction types', () => {
      const validTypes = [
        'CREDIT', 'DEBIT', 'TRANSFER_IN', 'TRANSFER_OUT',
        'INTEREST_CREDIT', 'INTEREST_DEBIT', 'FEE', 'REVERSAL',
        'ADJUSTMENT', 'OPENING_BALANCE', 'FX_GAIN', 'FX_LOSS',
        'CHECK_DEPOSIT', 'CHECK_PAYMENT', 'WIRE_IN', 'WIRE_OUT',
        'ACH_IN', 'ACH_OUT', 'DIRECT_DEBIT', 'STANDING_ORDER',
      ]
      validTypes.forEach((type) => {
        const result = bankTransactionTypeEnum.safeParse(type)
        expect(result.success).toBe(true)
      })
    })

    test('rejects invalid transaction type', () => {
      const result = bankTransactionTypeEnum.safeParse('INVALID')
      expect(result.success).toBe(false)
    })
  })

  describe('bankTransactionStatusEnum', () => {
    test('accepts valid statuses', () => {
      const validStatuses = [
        'PENDING', 'CLEARED', 'RECONCILED', 'UNRECONCILED',
        'MATCHED', 'PARTIALLY_MATCHED', 'DISPUTED', 'REVERSED',
        'VOID', 'FAILED',
      ]
      validStatuses.forEach((status) => {
        const result = bankTransactionStatusEnum.safeParse(status)
        expect(result.success).toBe(true)
      })
    })
  })

  describe('transactionSourceEnum', () => {
    test('accepts valid sources', () => {
      const validSources = [
        'MANUAL', 'IMPORT', 'SYNC', 'SYSTEM',
        'PAYMENT_RUN', 'RECEIPT', 'TRANSFER', 'JOURNAL',
      ]
      validSources.forEach((source) => {
        const result = transactionSourceEnum.safeParse(source)
        expect(result.success).toBe(true)
      })
    })
  })

  describe('bankPaymentMethodEnum', () => {
    test('accepts valid payment methods', () => {
      const validMethods = [
        'CHECK', 'WIRE', 'ACH', 'BACS', 'SEPA', 'SWIFT',
        'CHAPS', 'FASTER_PAYMENTS', 'DIRECT_DEBIT',
        'STANDING_ORDER', 'CARD', 'CASH',
        'INTERNAL_TRANSFER', 'EXTERNAL_TRANSFER', 'OTHER',
      ]
      validMethods.forEach((method) => {
        const result = bankPaymentMethodEnum.safeParse(method)
        expect(result.success).toBe(true)
      })
    })
  })

  describe('createBankTransactionSchema', () => {
    test('accepts valid credit transaction', () => {
      const result = createBankTransactionSchema.safeParse(
        createValidTransaction({
          transactionType: 'CREDIT',
          amount: 5000.00,
          description: 'Customer payment received',
        })
      )
      expect(result.success).toBe(true)
    })

    test('accepts valid debit transaction', () => {
      const result = createBankTransactionSchema.safeParse(
        createValidTransaction({
          transactionType: 'DEBIT',
          amount: -2500.00,
          description: 'Vendor payment',
        })
      )
      expect(result.success).toBe(true)
    })

    test('accepts transaction with counterparty details', () => {
      const result = createBankTransactionSchema.safeParse(
        createValidTransaction({
          name: 'ABC Corporation',
          accountNumber: '9876543210',
          iban: 'GB82WEST12345698765432',
          bankName: 'Western Bank',
          reference: 'INV-2024-001',
        })
      )
      expect(result.success).toBe(true)
    })

    test('accepts transaction with full details', () => {
      const result = createBankTransactionSchema.safeParse(
        createValidTransaction({
          transactionNumber: 'TRX-2024-0001',
          externalId: 'BANK-REF-123456',
          checkNumber: '1234',
          transactionType: 'CHECK_PAYMENT',
          source: 'MANUAL',
          paymentMethod: 'CHECK',
          valueDate: new Date(),
          bookingDate: new Date(),
          amountBase: 5000.00,
          exchangeRate: 1.0,
          ourReference: 'PAY-001',
          theirReference: 'INV-123',
          description: 'Payment for invoice INV-123',
          narrative: 'Check payment to vendor ABC Corp',
          category: 'VENDOR_PAYMENTS',
          tags: ['urgent', 'vendor'],
          vendorId: '550e8400-e29b-41d4-a716-446655440020',
          glAccountId: validGlAccountId,
          notes: 'Approved by finance manager',
        })
      )
      expect(result.success).toBe(true)
    })

    test('rejects missing required fields', () => {
      const result = createBankTransactionSchema.safeParse({
        agencyId: validAgencyId,
        // Missing bankAccountId, transactionType, etc.
      })
      expect(result.success).toBe(false)
    })

    test('accepts transaction with fee', () => {
      const result = createBankTransactionSchema.safeParse(
        createValidTransaction({
          transactionType: 'WIRE_OUT',
          feeAmount: 25.00,
          feeCurrencyCode: 'USD',
        })
      )
      expect(result.success).toBe(true)
    })
  })

  describe('updateBankTransactionSchema', () => {
    test('accepts partial update with id', () => {
      const result = updateBankTransactionSchema.safeParse({
        id: validTransactionId,
        description: 'Updated description',
        category: 'CUSTOMER_RECEIPTS',
      })
      expect(result.success).toBe(true)
    })

    test('rejects update without id', () => {
      const result = updateBankTransactionSchema.safeParse({
        description: 'Updated description',
      })
      expect(result.success).toBe(false)
    })
  })

  describe('matchTransactionSchema', () => {
    test('accepts valid match', () => {
      const result = matchTransactionSchema.safeParse({
        transactionId: validTransactionId,
        documentType: 'INVOICE',
        documentId: '550e8400-e29b-41d4-a716-446655440030',
        matchAmount: 1500.00,
        notes: 'Matched to invoice INV-001',
      })
      expect(result.success).toBe(true)
    })

    test('accepts match without optional fields', () => {
      const result = matchTransactionSchema.safeParse({
        transactionId: validTransactionId,
        documentType: 'RECEIPT',
        documentId: '550e8400-e29b-41d4-a716-446655440031',
      })
      expect(result.success).toBe(true)
    })
  })

  describe('unmatchTransactionSchema', () => {
    test('accepts valid unmatch', () => {
      const result = unmatchTransactionSchema.safeParse({
        transactionId: validTransactionId,
        reason: 'Matched to wrong invoice',
      })
      expect(result.success).toBe(true)
    })
  })

  describe('disputeTransactionSchema', () => {
    test('accepts valid dispute', () => {
      const result = disputeTransactionSchema.safeParse({
        transactionId: validTransactionId,
        reason: 'Unauthorized transaction',
        expectedAmount: 0,
        contactBank: true,
      })
      expect(result.success).toBe(true)
    })

    test('rejects dispute without reason', () => {
      const result = disputeTransactionSchema.safeParse({
        transactionId: validTransactionId,
      })
      expect(result.success).toBe(false)
    })
  })

  describe('resolveDisputeSchema', () => {
    test('accepts valid resolution', () => {
      const result = resolveDisputeSchema.safeParse({
        transactionId: validTransactionId,
        resolution: 'Bank confirmed transaction was valid',
        adjustAmount: 0,
        createAdjustmentEntry: false,
      })
      expect(result.success).toBe(true)
    })

    test('accepts resolution with adjustment', () => {
      const result = resolveDisputeSchema.safeParse({
        transactionId: validTransactionId,
        resolution: 'Bank refunded partial amount',
        adjustAmount: 500.00,
        createAdjustmentEntry: true,
      })
      expect(result.success).toBe(true)
    })
  })

  describe('categorizeTransactionSchema', () => {
    test('accepts valid categorization', () => {
      const result = categorizeTransactionSchema.safeParse({
        transactionId: validTransactionId,
        category: 'VENDOR_PAYMENTS',
        glAccountId: validGlAccountId,
        applyToSimilar: true,
      })
      expect(result.success).toBe(true)
    })
  })

  describe('bulkCategorizeSchema', () => {
    test('accepts bulk categorization', () => {
      const result = bulkCategorizeSchema.safeParse({
        transactionIds: [
          '550e8400-e29b-41d4-a716-446655440010',
          '550e8400-e29b-41d4-a716-446655440011',
          '550e8400-e29b-41d4-a716-446655440012',
        ],
        category: 'BANK_FEES',
        glAccountId: validGlAccountId,
      })
      expect(result.success).toBe(true)
    })

    test('rejects empty transaction list', () => {
      const result = bulkCategorizeSchema.safeParse({
        transactionIds: [],
        category: 'BANK_FEES',
      })
      expect(result.success).toBe(false)
    })

    test('rejects more than 100 transactions', () => {
      const ids = Array.from({ length: 101 }, (_, i) => 
        `550e8400-e29b-41d4-a716-4466554400${String(i).padStart(2, '0')}`
      )
      const result = bulkCategorizeSchema.safeParse({
        transactionIds: ids,
        category: 'MISC',
      })
      expect(result.success).toBe(false)
    })
  })

  describe('splitTransactionSchema', () => {
    test('accepts valid split with 2 entries', () => {
      const result = splitTransactionSchema.safeParse({
        transactionId: validTransactionId,
        splits: [
          {
            amount: 1000.00,
            description: 'Office supplies',
            glAccountId: '550e8400-e29b-41d4-a716-446655440040',
            category: 'SUPPLIES',
          },
          {
            amount: 500.00,
            description: 'Shipping costs',
            glAccountId: '550e8400-e29b-41d4-a716-446655440041',
            category: 'SHIPPING',
          },
        ],
      })
      expect(result.success).toBe(true)
    })

    test('rejects split with only 1 entry', () => {
      const result = splitTransactionSchema.safeParse({
        transactionId: validTransactionId,
        splits: [
          {
            amount: 1500.00,
            glAccountId: validGlAccountId,
          },
        ],
      })
      expect(result.success).toBe(false)
    })

    test('rejects split with more than 20 entries', () => {
      const splits = Array.from({ length: 21 }, (_, i) => ({
        amount: 100.00,
        glAccountId: validGlAccountId,
      }))
      const result = splitTransactionSchema.safeParse({
        transactionId: validTransactionId,
        splits,
      })
      expect(result.success).toBe(false)
    })
  })

  describe('bankTransactionFilterSchema', () => {
    test('accepts valid filter', () => {
      const result = bankTransactionFilterSchema.safeParse({
        agencyId: validAgencyId,
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.page).toBe(1)
        expect(result.data.pageSize).toBe(50)
        expect(result.data.sortBy).toBe('transactionDate')
        expect(result.data.sortOrder).toBe('desc')
      }
    })

    test('accepts filter with all options', () => {
      const result = bankTransactionFilterSchema.safeParse({
        agencyId: validAgencyId,
        bankAccountId: validBankAccountId,
        transactionType: 'CREDIT',
        status: 'CLEARED',
        source: 'IMPORT',
        dateFrom: new Date('2024-01-01'),
        dateTo: new Date('2024-12-31'),
        amountMin: 100,
        amountMax: 10000,
        isReconciled: false,
        isDisputed: false,
        isMatched: true,
        category: 'CUSTOMER_RECEIPTS',
        search: 'payment',
        page: 2,
        pageSize: 25,
        sortBy: 'amount',
        sortOrder: 'asc',
      })
      expect(result.success).toBe(true)
    })
  })

  describe('bankTransactionSchema (full schema)', () => {
    test('accepts complete transaction', () => {
      const result = bankTransactionSchema.safeParse({
        id: validTransactionId,
        agencyId: validAgencyId,
        bankAccountId: validBankAccountId,
        transactionType: 'CREDIT',
        status: 'CLEARED',
        source: 'IMPORT',
        transactionDate: new Date(),
        valueDate: new Date(),
        amount: 5000.00,
        currencyCode: 'USD',
        balanceAfter: 155000.00,
        description: 'Customer payment - INV-001',
        isReconciled: true,
        reconciledAt: new Date(),
        createdAt: new Date(),
      })
      expect(result.success).toBe(true)
    })
  })
})
