
import { z } from 'zod';

export const createConsolidationSnapshotSchema = z.object({
  periodId: z.uuid(),
  name: z.string().min(1).max(100),
  description: z.string().max(1000).optional(),
  subAccountIds: z.array(z.string().uuid()).min(1),
  consolidationMethod: z.enum(['FULL', 'PROPORTIONAL', 'EQUITY']).default('FULL'),
  notes: z.string().max(1000).optional(),
});

export const executeConsolidationSchema = z.object({
  snapshotId: z.uuid(),
});

export const consolidationAdjustmentSchema = z.object({
  snapshotId: z.uuid(),
  description: z.string().min(1).max(500),
  debitAccountCode: z.string().min(1),
  creditAccountCode: z.string().min(1),
  amount: z.number().positive(),
  adjustmentType: z.enum([
    'MANUAL',
    'MINORITY_INTEREST',
    'GOODWILL',
    'OTHER',
  ]),
  notes: z.string().max(1000).optional(),
});

export const intercompanyEliminationSchema = z.object({
  snapshotId: z.uuid(),
  description: z.string().min(1).max(500),
  subAccountId1: z.string().uuid(),
  subAccountId2: z.string().uuid(),
  accountCode1: z.string().min(1),
  accountCode2: z.string().min(1),
  amount: z.number().positive(),
  eliminationType: z.enum([
    'REVENUE_EXPENSE',
    'RECEIVABLE_PAYABLE',
    'INVENTORY_PROFIT',
    'OTHER',
  ]),
  notes: z.string().max(1000).optional(),
});

export const subAccountOwnershipSchema = z.object({
  subAccountId: z.uuid(),
  ownershipPercentage: z.number().min(0).max(100),
  consolidationMethod: z.enum(['FULL', 'PROPORTIONAL', 'EQUITY']),
  effectiveFrom: z.coerce.date(),
  effectiveTo: z.coerce.date().optional(),
  minorityInterestAccountCode: z.string().optional(),
});

export type CreateConsolidationSnapshotInput = z.infer<typeof createConsolidationSnapshotSchema>;
export type ConsolidationAdjustmentInput = z.infer<typeof consolidationAdjustmentSchema>;
export type IntercompanyEliminationInput = z.infer<typeof intercompanyEliminationSchema>;
export type SubAccountOwnershipInput = z.infer<typeof subAccountOwnershipSchema>;