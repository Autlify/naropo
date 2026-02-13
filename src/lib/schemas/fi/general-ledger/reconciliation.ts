
import { z } from 'zod';

export const createReconciliationSchema = z.object({
  accountId: z.string().uuid(),
  periodId: z.string().uuid(),
  description: z.string().max(500).optional(),
  statementBalance: z.number(),
  notes: z.string().max(1000).optional(),
});

export const reconciliationItemSchema = z.object({
  itemType: z.enum(['BOOK', 'STATEMENT', 'ADJUSTMENT']),
  transactionDate: z.coerce.date(),
  reference: z.string().max(100).optional(),
  description: z.string().max(500).optional(),
  amount: z.number(),
  notes: z.string().max(500).optional(),
});

export const matchItemsSchema = z.object({
  reconciliationId: z.string().uuid(),
  itemIds: z.array(z.string().uuid()).min(2),
});

export const unmatchItemSchema = z.object({
  itemId: z.string().uuid(),
});

export const reconciliationRuleSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  ruleDefinition: z.object({
    matchBy: z.array(z.enum(['reference', 'amount', 'date', 'description'])),
    tolerance: z.number().min(0).max(100).optional(), // Percentage tolerance
    dateToleranceDays: z.number().int().min(0).max(30).optional(),
  }),
  priority: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
});

export const reconciliationSchema = z.object({
  accountId: z.string().uuid('Invalid account'),
  periodId: z.string().uuid('Invalid period'),
  statementBalance: z.number(),
  statementDate: z.date(),
  bookBalance: z.number(),
  description: z.string().optional(),
  notes: z.string().optional(),
})
 
export const matchTransactionsSchema = z.object({
  reconciliationId: z.string().uuid(),
  transactions: z.array(z.object({
    itemId: z.string().uuid(),
    matchedItemId: z.string().uuid().optional(),
    status: z.enum(['UNMATCHED', 'MATCHED', 'EXCLUDED', 'DISCREPANCY']),
  })),
})

export type CreateReconciliationInput = z.infer<typeof createReconciliationSchema>;
export type ReconciliationItemInput = z.infer<typeof reconciliationItemSchema>;
export type ReconciliationRuleInput = z.infer<typeof reconciliationRuleSchema>;
export type ReconciliationInput = z.infer<typeof reconciliationSchema> 
export type MatchTransactionsInput = z.infer<typeof matchTransactionsSchema>
 