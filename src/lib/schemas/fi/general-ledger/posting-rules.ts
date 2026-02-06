import { z } from 'zod'

// ========== Enums & Constants ==========

/** Posting rule categories for organization */
export const postingRuleCategoryEnum = z.enum([
  'FOREX',       // Foreign exchange gains/losses
  'ROUNDING',    // Cent/decimal rounding
  'DISCREPANCY', // Small payment discrepancies
  'TAX',         // Tax-related postings
  'CLEARING',    // Cash/account clearing
  'ALLOCATION',  // Cost allocation
  'CUSTOM',      // User-defined
])

export type PostingRuleCategory = z.infer<typeof postingRuleCategoryEnum>

/** Source module for triggering rule */
export const sourceModuleEnum = z.enum([
  'MANUAL',
  'INVOICE',
  'PAYMENT',
  'EXPENSE',
  'PAYROLL',
  'ASSET',
  'INVENTORY',
  'BANK',
  'ADJUSTMENT',
  'CONSOLIDATION',
  'INTERCOMPANY',
  'REVERSAL',
  'YEAR_END',
  'OPENING_BALANCE',
])

export type SourceModule = z.infer<typeof sourceModuleEnum>

// ========== Sub-schemas ==========

/** Tolerance/threshold configuration */
export const toleranceConfigSchema = z.object({
  minAmount: z.number().min(0).optional(),
  maxAmount: z.number().positive().optional(),
  tolerancePercent: z.number().min(0).max(100).optional(),
  toleranceFixed: z.number().min(0).optional(),
})

export type ToleranceConfig = z.infer<typeof toleranceConfigSchema>

/** Forex side configuration (gain/loss accounts) */
export const forexSideConfigSchema = z.object({
  gainAccountId: z.uuid(),
  lossAccountId: z.uuid(),
  realizedOnly: z.boolean().default(false),
  unrealizedAccountId: z.string().uuid().optional(),
})

export type ForexSideConfig = z.infer<typeof forexSideConfigSchema>

/** Rule conditions builder */
export const ruleConditionsSchema = z.object({
  documentTypes: z.array(z.string()).optional(),
  currencies: z.array(z.string()).optional(),
  accountTypes: z.array(z.string()).optional(),
  dimensions: z.record(z.string(), z.array(z.string())).optional(),
  customExpression: z.string().optional(),
})

export type RuleConditions = z.infer<typeof ruleConditionsSchema>

// ========== Main Schemas ==========

export const postingRuleSchema = z.object({
  code: z.string().min(1, 'Code is required').max(50),
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().max(500).optional(),
  
  // Category for organization
  category: postingRuleCategoryEnum.default('CUSTOM'),
  
  // Trigger configuration
  sourceModule: sourceModuleEnum,
  
  // Account configuration
  debitAccountId: z.string().uuid('Invalid debit account'),
  creditAccountId: z.string().uuid('Invalid credit account'),
  
  // Amount configuration
  amountType: z.enum(['FULL', 'PERCENTAGE', 'FIXED']),
  percentage: z.number().min(0).max(100).optional(),
  fixedAmount: z.number().optional(),
  
  // Tolerance/threshold (for discrepancy/rounding rules)
  tolerance: toleranceConfigSchema.optional(),
  
  // Forex-specific (for forex rules)
  forexConfig: forexSideConfigSchema.optional(),
  
  // Conditions for rule matching
  conditions: ruleConditionsSchema.optional(),
  
  // Flags
  isActive: z.boolean().default(true),
  priority: z.number().int().min(0).max(999).default(100),
  autoPost: z.boolean().default(false),
  
  // Audit
  effectiveFrom: z.coerce.date().optional(),
  effectiveTo: z.coerce.date().optional(),
})

export const updatePostingRuleSchema = postingRuleSchema.partial().extend({
  id: z.uuid(),
})

export const createPostingRuleSchema = postingRuleSchema

export type PostingRuleInput = z.infer<typeof postingRuleSchema>
export type UpdatePostingRuleInput = z.infer<typeof updatePostingRuleSchema>
export type CreatePostingRuleInput = z.infer<typeof createPostingRuleSchema>

// ========== Templates ==========

/** Preset posting rule templates for quick setup */
export const POSTING_RULE_TEMPLATES = {
  FOREX_REALIZED: {
    code: 'FOREX_REALIZED',
    name: 'Realized Forex Gain/Loss',
    description: 'Automatically post exchange differences on payment settlement',
    category: 'FOREX' as PostingRuleCategory,
    sourceModule: 'PAYMENT' as SourceModule,
    amountType: 'FULL' as const,
    priority: 10,
    autoPost: true,
  },
  FOREX_UNREALIZED: {
    code: 'FOREX_UNREALIZED',
    name: 'Unrealized Forex Gain/Loss',
    description: 'Period-end exchange rate revaluation',
    category: 'FOREX' as PostingRuleCategory,
    sourceModule: 'ADJUSTMENT' as SourceModule, // Uses ADJUSTMENT for period-end
    amountType: 'FULL' as const,
    priority: 20,
    autoPost: true,
  },
  PAYMENT_DISCREPANCY: {
    code: 'PAY_DISC',
    name: 'Payment Discrepancy',
    description: 'Write off small payment differences under threshold',
    category: 'DISCREPANCY' as PostingRuleCategory,
    sourceModule: 'PAYMENT' as SourceModule,
    amountType: 'FULL' as const,
    priority: 50,
    autoPost: true,
    tolerance: {
      maxAmount: 10,
      toleranceFixed: 10,
    },
  },
  ROUNDING: {
    code: 'ROUNDING',
    name: 'Rounding Adjustment',
    description: 'Adjust for cent/decimal rounding differences',
    category: 'ROUNDING' as PostingRuleCategory,
    sourceModule: 'ADJUSTMENT' as SourceModule,
    amountType: 'FULL' as const,
    priority: 100,
    autoPost: true,
    tolerance: {
      maxAmount: 0.99,
    },
  },
  CASH_CLEARING: {
    code: 'CASH_CLEAR',
    name: 'Cash Clearing',
    description: 'Clear petty cash to main cash account',
    category: 'CLEARING' as PostingRuleCategory,
    sourceModule: 'BANK' as SourceModule,
    amountType: 'FULL' as const,
    priority: 30,
    autoPost: false,
  },
  TAX_CLEARING: {
    code: 'TAX_CLEAR',
    name: 'Tax Clearing',
    description: 'Clear VAT/GST accounts to tax payable',
    category: 'TAX' as PostingRuleCategory,
    sourceModule: 'ADJUSTMENT' as SourceModule, // Uses ADJUSTMENT for tax clearing
    amountType: 'FULL' as const,
    priority: 40,
    autoPost: false,
  },
} as const

export type PostingRuleTemplateKey = keyof typeof POSTING_RULE_TEMPLATES
