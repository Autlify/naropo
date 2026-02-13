/**
 * FI-GL Posting Rules Schema Tests
 */

import { describe, test, expect } from 'bun:test'
import {
  postingRuleSchema,
  updatePostingRuleSchema,
  createPostingRuleSchema,
  toleranceConfigSchema,
  forexSideConfigSchema,
  ruleConditionsSchema,
  postingRuleCategoryEnum,
  sourceModuleEnum,
  POSTING_RULE_TEMPLATES,
} from '../posting-rules'

describe('FI-GL posting-rules schema', () => {
  const validUUID = '550e8400-e29b-41d4-a716-446655440001'
  const validUUID2 = '550e8400-e29b-41d4-a716-446655440002'

  describe('postingRuleSchema', () => {
    test('accepts valid posting rule', () => {
      const result = postingRuleSchema.safeParse({
        code: 'FOREX_GAIN',
        name: 'Forex Gain Posting',
        description: 'Automatic posting for forex gains',
        category: 'FOREX',
        sourceModule: 'PAYMENT',
        debitAccountId: validUUID,
        creditAccountId: validUUID2,
        amountType: 'FULL',
        isActive: true,
      })
      expect(result.success).toBe(true)
    })

    test('accepts percentage amount type', () => {
      const result = postingRuleSchema.safeParse({
        code: 'TAX_ALLOC',
        name: 'Tax Allocation',
        sourceModule: 'INVOICE',
        debitAccountId: validUUID,
        creditAccountId: validUUID2,
        amountType: 'PERCENTAGE',
        percentage: 20,
      })
      expect(result.success).toBe(true)
    })

    test('accepts fixed amount type', () => {
      const result = postingRuleSchema.safeParse({
        code: 'BANK_FEE',
        name: 'Bank Fee Posting',
        sourceModule: 'BANK',
        debitAccountId: validUUID,
        creditAccountId: validUUID2,
        amountType: 'FIXED',
        fixedAmount: 25.0,
      })
      expect(result.success).toBe(true)
    })

    test('validates code is required', () => {
      const result = postingRuleSchema.safeParse({
        code: '',
        name: 'Test Rule',
        sourceModule: 'MANUAL',
        debitAccountId: validUUID,
        creditAccountId: validUUID2,
        amountType: 'FULL',
      })
      expect(result.success).toBe(false)
    })

    test('validates priority range', () => {
      const invalid = postingRuleSchema.safeParse({
        code: 'TEST',
        name: 'Test Rule',
        sourceModule: 'MANUAL',
        debitAccountId: validUUID,
        creditAccountId: validUUID2,
        amountType: 'FULL',
        priority: 1000, // Exceeds max 999
      })
      expect(invalid.success).toBe(false)
    })

    test('validates percentage range', () => {
      const invalid = postingRuleSchema.safeParse({
        code: 'TEST',
        name: 'Test Rule',
        sourceModule: 'MANUAL',
        debitAccountId: validUUID,
        creditAccountId: validUUID2,
        amountType: 'PERCENTAGE',
        percentage: 150, // Exceeds 100%
      })
      expect(invalid.success).toBe(false)
    })

    test('accepts all source modules', () => {
      const modules = [
        'MANUAL', 'INVOICE', 'PAYMENT', 'EXPENSE', 'PAYROLL',
        'ASSET', 'INVENTORY', 'BANK', 'ADJUSTMENT', 'CONSOLIDATION',
        'INTERCOMPANY', 'REVERSAL', 'YEAR_END', 'OPENING_BALANCE',
      ]
      
      for (const sourceModule of modules) {
        const result = postingRuleSchema.safeParse({
          code: `TEST_${sourceModule}`,
          name: `Test ${sourceModule}`,
          sourceModule,
          debitAccountId: validUUID,
          creditAccountId: validUUID2,
          amountType: 'FULL',
        })
        expect(result.success).toBe(true)
      }
    })

    test('accepts all categories', () => {
      const categories = [
        'FOREX', 'ROUNDING', 'DISCREPANCY', 'TAX', 'CLEARING', 'ALLOCATION', 'CUSTOM',
      ]
      
      for (const category of categories) {
        const result = postingRuleSchema.safeParse({
          code: `CAT_${category}`,
          name: `Category ${category}`,
          category,
          sourceModule: 'MANUAL',
          debitAccountId: validUUID,
          creditAccountId: validUUID2,
          amountType: 'FULL',
        })
        expect(result.success).toBe(true)
      }
    })
  })

  describe('updatePostingRuleSchema', () => {
    test('requires id for update', () => {
      const result = updatePostingRuleSchema.safeParse({
        id: validUUID,
        name: 'Updated Rule Name',
        isActive: false,
      })
      expect(result.success).toBe(true)
    })

    test('allows partial update', () => {
      const result = updatePostingRuleSchema.safeParse({
        id: validUUID,
        priority: 50,
      })
      expect(result.success).toBe(true)
    })
  })

  describe('toleranceConfigSchema', () => {
    test('accepts min/max amount', () => {
      const result = toleranceConfigSchema.safeParse({
        minAmount: 0.01,
        maxAmount: 10.0,
      })
      expect(result.success).toBe(true)
    })

    test('accepts percentage tolerance', () => {
      const result = toleranceConfigSchema.safeParse({
        tolerancePercent: 5,
      })
      expect(result.success).toBe(true)
    })

    test('accepts fixed tolerance', () => {
      const result = toleranceConfigSchema.safeParse({
        toleranceFixed: 0.99,
      })
      expect(result.success).toBe(true)
    })

    test('accepts combined tolerances', () => {
      const result = toleranceConfigSchema.safeParse({
        minAmount: 0,
        maxAmount: 100,
        tolerancePercent: 1,
        toleranceFixed: 0.5,
      })
      expect(result.success).toBe(true)
    })

    test('validates non-negative minAmount', () => {
      const result = toleranceConfigSchema.safeParse({
        minAmount: -1,
      })
      expect(result.success).toBe(false)
    })

    test('validates percentage max 100', () => {
      const result = toleranceConfigSchema.safeParse({
        tolerancePercent: 101,
      })
      expect(result.success).toBe(false)
    })
  })

  describe('forexSideConfigSchema', () => {
    test('accepts gain/loss accounts', () => {
      const result = forexSideConfigSchema.safeParse({
        gainAccountId: validUUID,
        lossAccountId: validUUID2,
      })
      expect(result.success).toBe(true)
    })

    test('accepts with unrealized account', () => {
      const result = forexSideConfigSchema.safeParse({
        gainAccountId: validUUID,
        lossAccountId: validUUID2,
        realizedOnly: false,
        unrealizedAccountId: '550e8400-e29b-41d4-a716-446655440003',
      })
      expect(result.success).toBe(true)
    })

    test('defaults realizedOnly to false', () => {
      const result = forexSideConfigSchema.safeParse({
        gainAccountId: validUUID,
        lossAccountId: validUUID2,
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.realizedOnly).toBe(false)
      }
    })
  })

  describe('ruleConditionsSchema', () => {
    test('accepts document types filter', () => {
      const result = ruleConditionsSchema.safeParse({
        documentTypes: ['INVOICE', 'CREDIT_NOTE'],
      })
      expect(result.success).toBe(true)
    })

    test('accepts currencies filter', () => {
      const result = ruleConditionsSchema.safeParse({
        currencies: ['USD', 'EUR', 'GBP'],
      })
      expect(result.success).toBe(true)
    })

    test('accepts account types filter', () => {
      const result = ruleConditionsSchema.safeParse({
        accountTypes: ['ASSET', 'LIABILITY'],
      })
      expect(result.success).toBe(true)
    })

    test('accepts dimensions filter', () => {
      const result = ruleConditionsSchema.safeParse({
        dimensions: {
          costCenter: ['CC001', 'CC002'],
          department: ['SALES', 'ADMIN'],
        },
      })
      expect(result.success).toBe(true)
    })

    test('accepts custom expression', () => {
      const result = ruleConditionsSchema.safeParse({
        customExpression: 'amount > 1000 AND currency != "USD"',
      })
      expect(result.success).toBe(true)
    })

    test('accepts combined conditions', () => {
      const result = ruleConditionsSchema.safeParse({
        documentTypes: ['PAYMENT'],
        currencies: ['EUR'],
        dimensions: {
          project: ['PROJ-001'],
        },
      })
      expect(result.success).toBe(true)
    })
  })

  describe('postingRuleCategoryEnum', () => {
    test('validates all categories', () => {
      const categories = ['FOREX', 'ROUNDING', 'DISCREPANCY', 'TAX', 'CLEARING', 'ALLOCATION', 'CUSTOM']
      for (const cat of categories) {
        expect(postingRuleCategoryEnum.safeParse(cat).success).toBe(true)
      }
    })

    test('rejects invalid category', () => {
      expect(postingRuleCategoryEnum.safeParse('INVALID').success).toBe(false)
    })
  })

  describe('sourceModuleEnum', () => {
    test('validates all source modules', () => {
      const modules = [
        'MANUAL', 'INVOICE', 'PAYMENT', 'EXPENSE', 'PAYROLL',
        'ASSET', 'INVENTORY', 'BANK', 'ADJUSTMENT', 'CONSOLIDATION',
        'INTERCOMPANY', 'REVERSAL', 'YEAR_END', 'OPENING_BALANCE',
      ]
      for (const mod of modules) {
        expect(sourceModuleEnum.safeParse(mod).success).toBe(true)
      }
    })

    test('rejects invalid source module', () => {
      expect(sourceModuleEnum.safeParse('UNKNOWN').success).toBe(false)
    })
  })

  describe('POSTING_RULE_TEMPLATES', () => {
    test('contains FOREX_REALIZED template', () => {
      const template = POSTING_RULE_TEMPLATES.FOREX_REALIZED
      expect(template.code).toBe('FOREX_REALIZED')
      expect(template.category).toBe('FOREX')
      expect(template.sourceModule).toBe('PAYMENT')
    })

    test('contains FOREX_UNREALIZED template', () => {
      const template = POSTING_RULE_TEMPLATES.FOREX_UNREALIZED
      expect(template.code).toBe('FOREX_UNREALIZED')
      expect(template.category).toBe('FOREX')
    })

    test('contains PAYMENT_DISCREPANCY template', () => {
      const template = POSTING_RULE_TEMPLATES.PAYMENT_DISCREPANCY
      expect(template.code).toBe('PAY_DISC')
      expect(template.category).toBe('DISCREPANCY')
      expect(template.tolerance?.maxAmount).toBe(10)
    })

    test('contains ROUNDING template', () => {
      const template = POSTING_RULE_TEMPLATES.ROUNDING
      expect(template.code).toBe('ROUNDING')
      expect(template.category).toBe('ROUNDING')
    })

    test('contains CASH_CLEARING template', () => {
      const template = POSTING_RULE_TEMPLATES.CASH_CLEARING
      expect(template.code).toBe('CASH_CLEAR')
      expect(template.category).toBe('CLEARING')
    })

    test('contains TAX_CLEARING template', () => {
      const template = POSTING_RULE_TEMPLATES.TAX_CLEARING
      expect(template.code).toBe('TAX_CLEAR')
      expect(template.category).toBe('TAX')
    })
  })
})
