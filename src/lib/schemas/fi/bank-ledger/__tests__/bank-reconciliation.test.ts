/**
 * FI-BL Bank Reconciliation Schema Tests
 */

import { describe, test, expect } from 'bun:test'
import {
  bankReconciliationSchema,
  createBankReconciliationSchema,
  updateBankReconciliationSchema,
  bankReconciliationFilterSchema,
  reconciliationItemSchema,
  matchingRuleSchema,
  createMatchingRuleSchema,
  startReconciliationSchema,
  matchItemsSchema,
  bulkMatchItemsSchema,
  unmatchItemsSchema,
  excludeItemsSchema,
  addAdjustmentSchema,
  submitReconciliationSchema,
  approveReconciliationSchema,
  rejectReconciliationSchema,
  completeReconciliationSchema,
  voidReconciliationSchema,
  runAutoMatchSchema,
  reconciliationStatusEnum,
  reconciliationTypeEnum,
  matchingRuleTypeEnum,
  reconciliationItemStatusEnum,
} from '../bank-reconciliation'

describe('FI-BL Bank Reconciliation schema', () => {
  // Valid UUIDs following RFC 4122 (version 4)
  const validAgencyId = '550e8400-e29b-41d4-a716-446655440001'
  const validBankAccountId = '550e8400-e29b-41d4-a716-446655440002'
  const validReconciliationId = '550e8400-e29b-41d4-a716-446655440010'

  // Helper to create valid reconciliation data
  const createValidReconciliation = (overrides = {}) => ({
    agencyId: validAgencyId,
    bankAccountId: validBankAccountId,
    reconciliationNumber: 'REC-2024-001',
    periodStart: new Date('2024-01-01'),
    periodEnd: new Date('2024-01-31'),
    reconciliationDate: new Date('2024-02-05'),
    currencyCode: 'USD',
    statementOpeningBalance: 100000,
    statementClosingBalance: 125000,
    bookOpeningBalance: 100000,
    bookClosingBalance: 125000,
    ...overrides,
  })

  describe('reconciliationStatusEnum', () => {
    test('accepts valid statuses', () => {
      const validStatuses = [
        'DRAFT', 'IN_REVIEW', 'APPROVED', 'COMPLETED', 'REJECTED', 'VOID',
      ]
      validStatuses.forEach((status) => {
        const result = reconciliationStatusEnum.safeParse(status)
        expect(result.success).toBe(true)
      })
    })

    test('rejects invalid status', () => {
      const result = reconciliationStatusEnum.safeParse('INVALID')
      expect(result.success).toBe(false)
    })
  })

  describe('reconciliationTypeEnum', () => {
    test('accepts valid types', () => {
      const validTypes = ['FULL', 'PARTIAL', 'QUICK', 'ADJUSTMENT']
      validTypes.forEach((type) => {
        const result = reconciliationTypeEnum.safeParse(type)
        expect(result.success).toBe(true)
      })
    })
  })

  describe('matchingRuleTypeEnum', () => {
    test('accepts valid rule types', () => {
      const validTypes = [
        'EXACT_AMOUNT', 'TOLERANCE', 'REFERENCE', 'DATE_AMOUNT',
        'COUNTERPARTY', 'COMBINATION', 'AI_SUGGESTED', 'MANUAL',
      ]
      validTypes.forEach((type) => {
        const result = matchingRuleTypeEnum.safeParse(type)
        expect(result.success).toBe(true)
      })
    })
  })

  describe('reconciliationItemStatusEnum', () => {
    test('accepts valid item statuses', () => {
      const validStatuses = [
        'PENDING', 'MATCHED', 'PARTIALLY_MATCHED', 'EXCLUDED', 'ADJUSTED', 'DISPUTED',
      ]
      validStatuses.forEach((status) => {
        const result = reconciliationItemStatusEnum.safeParse(status)
        expect(result.success).toBe(true)
      })
    })
  })

  describe('createBankReconciliationSchema', () => {
    test('accepts valid reconciliation', () => {
      const result = createBankReconciliationSchema.safeParse(createValidReconciliation())
      expect(result.success).toBe(true)
    })

    test('accepts reconciliation with full details', () => {
      const result = createBankReconciliationSchema.safeParse(
        createValidReconciliation({
          description: 'January 2024 bank reconciliation',
          reconciliationType: 'FULL',
          statementId: '550e8400-e29b-41d4-a716-446655440020',
          statementNumber: 'STMT-2024-01',
          toleranceAmount: 0.01,
          tolerancePercentage: 0.1,
          matchingRulesUsed: ['EXACT_AMOUNT', 'REFERENCE'],
          notes: 'All items matched successfully',
        })
      )
      expect(result.success).toBe(true)
    })

    test('rejects period end before period start', () => {
      const result = createBankReconciliationSchema.safeParse(
        createValidReconciliation({
          periodStart: new Date('2024-01-31'),
          periodEnd: new Date('2024-01-01'),
        })
      )
      expect(result.success).toBe(false)
    })

    test('rejects missing required fields', () => {
      const result = createBankReconciliationSchema.safeParse({
        agencyId: validAgencyId,
        // Missing bankAccountId, reconciliationNumber, etc.
      })
      expect(result.success).toBe(false)
    })
  })

  describe('updateBankReconciliationSchema', () => {
    test('accepts partial update', () => {
      const result = updateBankReconciliationSchema.safeParse({
        id: validReconciliationId,
        description: 'Updated description',
        notes: 'Additional reconciliation notes',
      })
      expect(result.success).toBe(true)
    })

    test('rejects update without id', () => {
      const result = updateBankReconciliationSchema.safeParse({
        notes: 'Some notes',
      })
      expect(result.success).toBe(false)
    })
  })

  describe('startReconciliationSchema', () => {
    test('accepts valid start request', () => {
      const result = startReconciliationSchema.safeParse({
        bankAccountId: validBankAccountId,
        periodStart: new Date('2024-01-01'),
        periodEnd: new Date('2024-01-31'),
        statementClosingBalance: 125000,
        autoMatch: true,
        toleranceAmount: 0.01,
        description: 'January 2024 reconciliation',
      })
      expect(result.success).toBe(true)
    })

    test('accepts start with statement reference', () => {
      const result = startReconciliationSchema.safeParse({
        bankAccountId: validBankAccountId,
        periodStart: new Date('2024-01-01'),
        periodEnd: new Date('2024-01-31'),
        statementClosingBalance: 125000,
        statementId: '550e8400-e29b-41d4-a716-446655440020',
      })
      expect(result.success).toBe(true)
    })
  })

  describe('matchItemsSchema', () => {
    test('accepts valid match', () => {
      const result = matchItemsSchema.safeParse({
        reconciliationId: validReconciliationId,
        bankItemId: '550e8400-e29b-41d4-a716-446655440030',
        bookItemId: '550e8400-e29b-41d4-a716-446655440031',
        matchingRule: 'MANUAL',
        notes: 'Manually matched after verification',
      })
      expect(result.success).toBe(true)
    })
  })

  describe('bulkMatchItemsSchema', () => {
    test('accepts bulk matches', () => {
      const result = bulkMatchItemsSchema.safeParse({
        reconciliationId: validReconciliationId,
        matches: [
          {
            bankItemId: '550e8400-e29b-41d4-a716-446655440030',
            bookItemId: '550e8400-e29b-41d4-a716-446655440031',
          },
          {
            bankItemId: '550e8400-e29b-41d4-a716-446655440032',
            bookItemId: '550e8400-e29b-41d4-a716-446655440033',
            notes: 'Matched by reference',
          },
        ],
      })
      expect(result.success).toBe(true)
    })

    test('rejects empty matches array', () => {
      const result = bulkMatchItemsSchema.safeParse({
        reconciliationId: validReconciliationId,
        matches: [],
      })
      expect(result.success).toBe(false)
    })
  })

  describe('unmatchItemsSchema', () => {
    test('accepts valid unmatch', () => {
      const result = unmatchItemsSchema.safeParse({
        reconciliationId: validReconciliationId,
        itemIds: [
          '550e8400-e29b-41d4-a716-446655440030',
          '550e8400-e29b-41d4-a716-446655440031',
        ],
        reason: 'Items were matched incorrectly',
      })
      expect(result.success).toBe(true)
    })
  })

  describe('excludeItemsSchema', () => {
    test('accepts valid exclusion', () => {
      const result = excludeItemsSchema.safeParse({
        reconciliationId: validReconciliationId,
        itemIds: ['550e8400-e29b-41d4-a716-446655440030'],
        reason: 'Transaction will be handled in next period',
      })
      expect(result.success).toBe(true)
    })

    test('rejects exclusion without reason', () => {
      const result = excludeItemsSchema.safeParse({
        reconciliationId: validReconciliationId,
        itemIds: ['550e8400-e29b-41d4-a716-446655440030'],
      })
      expect(result.success).toBe(false)
    })
  })

  describe('addAdjustmentSchema', () => {
    test('accepts valid adjustment', () => {
      const result = addAdjustmentSchema.safeParse({
        reconciliationId: validReconciliationId,
        adjustmentDate: new Date('2024-01-31'),
        description: 'Bank fee adjustment',
        amount: -15.50,
        glAccountId: '550e8400-e29b-41d4-a716-446655440040',
        reason: 'Monthly bank service fee not recorded',
      })
      expect(result.success).toBe(true)
    })

    test('accepts adjustment with cost center', () => {
      const result = addAdjustmentSchema.safeParse({
        reconciliationId: validReconciliationId,
        adjustmentDate: new Date(),
        description: 'Interest income adjustment',
        amount: 125.00,
        glAccountId: '550e8400-e29b-41d4-a716-446655440041',
        costCenterId: '550e8400-e29b-41d4-a716-446655440042',
      })
      expect(result.success).toBe(true)
    })
  })

  describe('submitReconciliationSchema', () => {
    test('accepts valid submission', () => {
      const result = submitReconciliationSchema.safeParse({
        id: validReconciliationId,
        notes: 'Ready for review',
        confirmBalance: true,
      })
      expect(result.success).toBe(true)
    })

    test('rejects submission without balance confirmation', () => {
      const result = submitReconciliationSchema.safeParse({
        id: validReconciliationId,
        confirmBalance: false,
      })
      expect(result.success).toBe(false)
    })
  })

  describe('approveReconciliationSchema', () => {
    test('accepts valid approval', () => {
      const result = approveReconciliationSchema.safeParse({
        id: validReconciliationId,
        comments: 'Reviewed and approved',
        postAdjustments: true,
      })
      expect(result.success).toBe(true)
    })
  })

  describe('rejectReconciliationSchema', () => {
    test('accepts valid rejection', () => {
      const result = rejectReconciliationSchema.safeParse({
        id: validReconciliationId,
        reason: 'Outstanding items need to be resolved',
        requireChanges: [
          'Match remaining 3 transactions',
          'Verify adjustment amounts',
        ],
      })
      expect(result.success).toBe(true)
    })

    test('rejects rejection without reason', () => {
      const result = rejectReconciliationSchema.safeParse({
        id: validReconciliationId,
      })
      expect(result.success).toBe(false)
    })
  })

  describe('completeReconciliationSchema', () => {
    test('accepts valid completion', () => {
      const result = completeReconciliationSchema.safeParse({
        id: validReconciliationId,
        finalNotes: 'Reconciliation completed successfully',
        updateBankAccountBalance: true,
      })
      expect(result.success).toBe(true)
    })
  })

  describe('voidReconciliationSchema', () => {
    test('accepts valid void', () => {
      const result = voidReconciliationSchema.safeParse({
        id: validReconciliationId,
        reason: 'Created in error',
        reverseAdjustments: true,
      })
      expect(result.success).toBe(true)
    })

    test('rejects void without reason', () => {
      const result = voidReconciliationSchema.safeParse({
        id: validReconciliationId,
      })
      expect(result.success).toBe(false)
    })
  })

  describe('runAutoMatchSchema', () => {
    test('accepts valid auto-match request', () => {
      const result = runAutoMatchSchema.safeParse({
        reconciliationId: validReconciliationId,
        toleranceAmount: 0.01,
        tolerancePercentage: 0.1,
        includeAiSuggestions: true,
      })
      expect(result.success).toBe(true)
    })

    test('accepts auto-match with specific rules', () => {
      const result = runAutoMatchSchema.safeParse({
        reconciliationId: validReconciliationId,
        matchingRuleIds: [
          '550e8400-e29b-41d4-a716-446655440050',
          '550e8400-e29b-41d4-a716-446655440051',
        ],
      })
      expect(result.success).toBe(true)
    })
  })

  describe('createMatchingRuleSchema', () => {
    test('accepts valid matching rule', () => {
      const result = createMatchingRuleSchema.safeParse({
        agencyId: validAgencyId,
        name: 'Exact Amount Match',
        description: 'Match by exact amount',
        priority: 10,
        ruleType: 'EXACT_AMOUNT',
        isActive: true,
        criteria: {
          amountMatch: 'EXACT',
          dateMatch: true,
          dateTolerance: 3,
        },
        autoMatch: true,
        requiresConfirmation: false,
      })
      expect(result.success).toBe(true)
    })

    test('accepts rule with tolerance matching', () => {
      const result = createMatchingRuleSchema.safeParse({
        agencyId: validAgencyId,
        name: 'Tolerance Match',
        ruleType: 'TOLERANCE',
        criteria: {
          amountMatch: 'TOLERANCE_AMOUNT',
          toleranceAmount: 1.00,
          referenceMatch: true,
          referencePattern: '^INV-\\d+$',
        },
        requiresConfirmation: true,
      })
      expect(result.success).toBe(true)
    })

    test('accepts rule with auto-categorization', () => {
      const result = createMatchingRuleSchema.safeParse({
        agencyId: validAgencyId,
        name: 'Bank Fee Matcher',
        ruleType: 'COMBINATION',
        criteria: {
          descriptionMatch: true,
          descriptionKeywords: ['service fee', 'monthly fee', 'bank charge'],
        },
        defaultCategory: 'BANK_FEES',
        defaultGlAccountId: '550e8400-e29b-41d4-a716-446655440060',
      })
      expect(result.success).toBe(true)
    })
  })

  describe('reconciliationItemSchema', () => {
    test('accepts valid bank item', () => {
      const result = reconciliationItemSchema.safeParse({
        id: '550e8400-e29b-41d4-a716-446655440070',
        reconciliationId: validReconciliationId,
        sourceType: 'BANK',
        transactionId: '550e8400-e29b-41d4-a716-446655440071',
        transactionDate: new Date(),
        description: 'Customer payment',
        amount: 5000.00,
        currencyCode: 'USD',
        status: 'PENDING',
      })
      expect(result.success).toBe(true)
    })

    test('accepts valid book item', () => {
      const result = reconciliationItemSchema.safeParse({
        id: '550e8400-e29b-41d4-a716-446655440072',
        reconciliationId: validReconciliationId,
        sourceType: 'BOOK',
        journalLineId: '550e8400-e29b-41d4-a716-446655440073',
        transactionDate: new Date(),
        description: 'Customer receipt',
        reference: 'REC-001',
        amount: 5000.00,
        currencyCode: 'USD',
        status: 'MATCHED',
        matchedToItemId: '550e8400-e29b-41d4-a716-446655440070',
        matchingRule: 'EXACT_AMOUNT',
        matchConfidence: 100,
      })
      expect(result.success).toBe(true)
    })
  })

  describe('bankReconciliationFilterSchema', () => {
    test('accepts valid filter', () => {
      const result = bankReconciliationFilterSchema.safeParse({
        agencyId: validAgencyId,
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.page).toBe(1)
        expect(result.data.pageSize).toBe(20)
        expect(result.data.sortBy).toBe('periodEnd')
        expect(result.data.sortOrder).toBe('desc')
      }
    })

    test('accepts filter with all options', () => {
      const result = bankReconciliationFilterSchema.safeParse({
        agencyId: validAgencyId,
        bankAccountId: validBankAccountId,
        status: 'DRAFT',
        reconciliationType: 'FULL',
        periodFrom: new Date('2024-01-01'),
        periodTo: new Date('2024-12-31'),
        isBalanced: true,
        hasOutstandingItems: false,
        search: 'january',
        page: 1,
        pageSize: 10,
        sortBy: 'status',
        sortOrder: 'asc',
      })
      expect(result.success).toBe(true)
    })
  })
})
