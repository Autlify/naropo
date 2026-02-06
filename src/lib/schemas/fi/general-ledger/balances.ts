import { z } from 'zod';

// ========== General Ledger Balances Schema ==========

export const glBalanceSchema = z.object({
  accountCode: z.string().min(1).max(20),
  periodId: z.uuid(),
  debit: z.number().min(0).default(0),
  credit: z.number().min(0).default(0),
  beginningBalance: z.number().default(0),
  endingBalance: z.number().default(0),
});

export const glBalanceAdjustmentSchema = z.object({
  accountCode: z.string().min(1).max(20),
  periodId: z.uuid(),
  adjustmentAmount: z.number(),
  reason: z.string().max(500).optional(),
});

export const glNormalBalanceSchema = z.enum(['DEBIT', 'CREDIT']);

export type GLBalanceInput = z.infer<typeof glBalanceSchema>;
export type GLBalanceAdjustmentInput = z.infer<typeof glBalanceAdjustmentSchema>;
export type GLNormalBalance = z.infer<typeof glNormalBalanceSchema>;