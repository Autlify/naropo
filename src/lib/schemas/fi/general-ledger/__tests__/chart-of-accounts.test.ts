/**
 * FI-GL Chart of Accounts Schema Tests
 */

import { describe, test, expect } from 'bun:test'
import {
  createAccountSchema,
  updateAccountSchema,
  accountHierarchyMoveSchema,
  consolidationMappingSchema,
} from '../chart-of-accounts'

describe('FI-GL chartOfAccounts schema', () => {
  const validUUID = '550e8400-e29b-41d4-a716-446655440001'

  describe('createAccountSchema', () => {
    test('accepts minimal valid account', () => {
      const result = createAccountSchema.safeParse({
        code: '1000',
        name: 'Cash',
        accountType: 'ASSET',
      })
      expect(result.success).toBe(true)
    })

    test('accepts full account with all fields', () => {
      const result = createAccountSchema.safeParse({
        code: '1000-001',
        name: 'Petty Cash',
        description: 'Office petty cash fund',
        parentAccountId: validUUID,
        accountType: 'ASSET',
        category: 'CURRENT_ASSET',
        subcategory: 'Cash and Equivalents',
        isControlAccount: false,
        subledgerType: 'NONE',
        allowManualPosting: true,
        requireApproval: false,
        isPostingAccount: true,
        currencyCode: 'MYR',
        isMultiCurrency: true,
        normalBalance: 'DEBIT',
        sortOrder: 10,
      })
      expect(result.success).toBe(true)
    })

    test('accepts hierarchical account code format', () => {
      const result = createAccountSchema.safeParse({
        code: 'A1-B2-C3',
        name: 'Nested Account',
        accountType: 'EXPENSE',
      })
      expect(result.success).toBe(true)
    })

    test('rejects invalid account code format', () => {
      const result = createAccountSchema.safeParse({
        code: 'invalid code!',
        name: 'Bad Account',
        accountType: 'ASSET',
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Invalid account code')
      }
    })

    test('rejects empty account name', () => {
      const result = createAccountSchema.safeParse({
        code: '1000',
        name: '',
        accountType: 'ASSET',
      })
      expect(result.success).toBe(false)
    })

    test('accepts control account with subledger type', () => {
      const result = createAccountSchema.safeParse({
        code: '1100',
        name: 'Accounts Receivable',
        accountType: 'ASSET',
        category: 'CURRENT_ASSET',
        isControlAccount: true,
        subledgerType: 'ACCOUNTS_RECEIVABLE',
        allowManualPosting: false,
      })
      expect(result.success).toBe(true)
    })

    test('accepts consolidation-enabled account', () => {
      const result = createAccountSchema.safeParse({
        code: '1000',
        name: 'Cash - Group',
        accountType: 'ASSET',
        isConsolidationEnabled: true,
        consolidationAccountCode: 'GROUP-1000',
      })
      expect(result.success).toBe(true)
    })

    test('validates account type enum', () => {
      const result = createAccountSchema.safeParse({
        code: '1000',
        name: 'Test',
        accountType: 'INVALID_TYPE',
      })
      expect(result.success).toBe(false)
    })

    test('accepts all valid account types', () => {
      const accountTypes = ['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE']
      
      for (const accountType of accountTypes) {
        const result = createAccountSchema.safeParse({
          code: '1000',
          name: 'Test Account',
          accountType,
        })
        expect(result.success).toBe(true)
      }
    })

    test('validates normal balance enum', () => {
      const validDebit = createAccountSchema.safeParse({
        code: '1000',
        name: 'Cash',
        accountType: 'ASSET',
        normalBalance: 'DEBIT',
      })
      expect(validDebit.success).toBe(true)

      const validCredit = createAccountSchema.safeParse({
        code: '2000',
        name: 'Payables',
        accountType: 'LIABILITY',
        normalBalance: 'CREDIT',
      })
      expect(validCredit.success).toBe(true)

      const invalid = createAccountSchema.safeParse({
        code: '1000',
        name: 'Test',
        accountType: 'ASSET',
        normalBalance: 'INVALID',
      })
      expect(invalid.success).toBe(false)
    })
  })

  describe('updateAccountSchema', () => {
    test('requires id for update', () => {
      const result = updateAccountSchema.safeParse({
        id: validUUID,
        name: 'Updated Cash',
      })
      expect(result.success).toBe(true)
    })

    test('allows partial updates', () => {
      const result = updateAccountSchema.safeParse({
        id: validUUID,
        description: 'Updated description only',
      })
      expect(result.success).toBe(true)
    })

    test('rejects update without id', () => {
      const result = updateAccountSchema.safeParse({
        name: 'No ID',
      })
      expect(result.success).toBe(false)
    })
  })

  describe('accountHierarchyMoveSchema', () => {
    test('accepts valid hierarchy move', () => {
      const result = accountHierarchyMoveSchema.safeParse({
        accountId: validUUID,
        newParentId: validUUID,
        newSortOrder: 5,
      })
      expect(result.success).toBe(true)
    })

    test('allows null parent (move to root)', () => {
      const result = accountHierarchyMoveSchema.safeParse({
        accountId: validUUID,
        newParentId: null,
        newSortOrder: 0,
      })
      expect(result.success).toBe(true)
    })

    test('requires valid sort order', () => {
      const result = accountHierarchyMoveSchema.safeParse({
        accountId: validUUID,
        newSortOrder: -1,
      })
      expect(result.success).toBe(false)
    })
  })

  describe('consolidationMappingSchema', () => {
    test('accepts valid consolidation mapping', () => {
      const result = consolidationMappingSchema.safeParse({
        subAccountId: validUUID,
        subAccountCOACode: '1000',
        groupCOAId: validUUID,
        mappingPercentage: 100,
        isElimination: false,
      })
      expect(result.success).toBe(true)
    })

    test('accepts elimination mapping', () => {
      const result = consolidationMappingSchema.safeParse({
        subAccountId: validUUID,
        subAccountCOACode: '1500',
        groupCOAId: validUUID,
        mappingPercentage: 100,
        isElimination: true,
        eliminationPairId: validUUID,
      })
      expect(result.success).toBe(true)
    })

    test('validates percentage range', () => {
      const tooHigh = consolidationMappingSchema.safeParse({
        subAccountId: validUUID,
        subAccountCOACode: '1000',
        groupCOAId: validUUID,
        mappingPercentage: 150,
      })
      expect(tooHigh.success).toBe(false)

      const negative = consolidationMappingSchema.safeParse({
        subAccountId: validUUID,
        subAccountCOACode: '1000',
        groupCOAId: validUUID,
        mappingPercentage: -10,
      })
      expect(negative.success).toBe(false)
    })

    test('accepts partial ownership percentage', () => {
      const result = consolidationMappingSchema.safeParse({
        subAccountId: validUUID,
        subAccountCOACode: '1000',
        groupCOAId: validUUID,
        mappingPercentage: 60, // 60% ownership
      })
      expect(result.success).toBe(true)
    })
  })
})
