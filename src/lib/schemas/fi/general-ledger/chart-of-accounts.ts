import { z } from 'zod';
import { AccountCategory, AccountType, SubledgerType } from '@/generated/prisma/enums'

// Account code validation regex (configurable format)
const accountCodeRegex = /^[A-Z0-9]{1,4}(-[A-Z0-9]{1,4})*$/;

export const createAccountSchema = z.object({
  code: z
    .string()
    .min(1, 'Account code is required')
    .max(20, 'Account code must be 20 characters or less')
    .regex(accountCodeRegex, 'Invalid account code format'),
  
  name: z
    .string()
    .min(1, 'Account name is required')
    .max(100, 'Account name must be 100 characters or less'),
  
  description: z.string().max(500).optional(),
  
  parentAccountId: z.string().uuid().optional().nullable(),
  
  accountType: z.enum(AccountType),
  
  category: z.enum(AccountCategory).optional(),
  
  subcategory: z.string().max(50).optional(),
  
  // Control account settings
  isControlAccount: z.boolean().default(false),
  subledgerType: z.enum(SubledgerType).default('NONE'),
  controlAccountId: z.string().uuid().optional().nullable(),
  
  // Posting behavior
  allowManualPosting: z.boolean().default(true),
  requireApproval: z.boolean().default(false),
  isPostingAccount: z.boolean().default(true),
  
  // Consolidation
  isConsolidationEnabled: z.boolean().default(false),
  consolidationAccountCode: z.string().max(20).optional(),
  
  // Currency
  currencyCode: z.string().length(3).optional(),
  isMultiCurrency: z.boolean().default(false),
  
  // Normal balance
  normalBalance: z.enum(['DEBIT', 'CREDIT']).default('DEBIT'),
  
  sortOrder: z.number().int().min(0).default(0),
});

export const updateAccountSchema = createAccountSchema.partial().extend({
  id: z.uuid(),
});

export const accountHierarchyMoveSchema = z.object({
  accountId: z.uuid(),
  newParentId: z.uuid().optional().nullable(),
  newSortOrder: z.number().int().min(0),
});

export const consolidationMappingSchema = z.object({
  subAccountId: z.uuid(),
  subAccountCOACode: z.string().min(1),
  groupCOAId: z.uuid(),
  mappingPercentage: z.number().min(0).max(100).default(100),
  isElimination: z.boolean().default(false),
  eliminationPairId: z.string().uuid().optional(),
});

export type CreateAccountInput = z.infer<typeof createAccountSchema>;
export type UpdateAccountInput = z.infer<typeof updateAccountSchema>;
export type AccountHierarchyMoveInput = z.infer<typeof accountHierarchyMoveSchema>;
export type ConsolidationMappingInput = z.infer<typeof consolidationMappingSchema>;