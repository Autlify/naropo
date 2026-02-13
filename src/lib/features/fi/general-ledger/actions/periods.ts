/**
 * Financial Period Server Actions
 * FI-GL Module - Period management (create, open, close, lock)
 */

'use server';

import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import {
  createPeriodSchema,
  updatePeriodSchema,
  type CreatePeriodInput,
  type UpdatePeriodInput,
} from '@/lib/schemas/fi/general-ledger/period';
import { logGLAudit } from './audit';
import { emitEvent } from './fanout';
import { EVENT_KEYS } from '@/lib/registry/events/trigger';
import { PeriodStatus } from '@/generated/prisma/client';
import { getActionContext, hasContextPermission, type ActionContext } from '@/lib/features/iam/authz/action-context';

type ActionResult<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

type Context = ActionContext;

const getContext = getActionContext;

/**
 * Get Financial Period by ID
 */
export const getFinancialPeriod = async (periodId: string): Promise<ActionResult<any>> => {
  try {
    const context = await getContext();
    if (!context) {
      return { success: false, error: 'Unauthorized: No session found' };
    }

    const hasPermission = await hasContextPermission(context, 'fi.configuration.fiscal_years.view');
    
    if (!hasPermission) {
      return { success: false, error: 'Unauthorized: Missing permission to view periods' };
    }

    const period = await db.financialPeriod.findUnique({
      where: { id: periodId },
    });

    if (!period) {
      return { success: false, error: 'Period not found' };
    }

    // Verify ownership
    const isOwner = context.subAccountId
      ? period.subAccountId === context.subAccountId
      : period.agencyId === context.agencyId && !period.subAccountId;

    if (!isOwner) {
      return { success: false, error: 'Period does not belong to current context' };
    }

    return { success: true, data: period };
  } catch (error) {
    console.error('Error in getFinancialPeriod:', error);
    return { success: false, error: 'Failed to get financial period' };
  }
};

/**
 * Get Current Open Period for posting
 */
export const getCurrentOpenPeriod = async (): Promise<ActionResult<any>> => {
  try {
    const context = await getContext();
    if (!context) {
      return { success: false, error: 'Unauthorized: No session found' };
    }

    const hasPermission = await hasContextPermission(context, 'fi.configuration.fiscal_years.view');
    
    if (!hasPermission) {
      return { success: false, error: 'Unauthorized: Missing permission to view periods' };
    }

    const openPeriod = await db.financialPeriod.findFirst({
      where: {
        ...(context.subAccountId
          ? { subAccountId: context.subAccountId }
          : { agencyId: context.agencyId, subAccountId: null }),
        status: PeriodStatus.OPEN,
      },
      orderBy: [
        { fiscalYear: 'desc' },
        { fiscalPeriod: 'desc' },
      ],
    });

    if (!openPeriod) {
      return { success: false, error: 'No open period found for posting' };
    }

    return { success: true, data: openPeriod };
  } catch (error) {
    console.error('Error in getCurrentOpenPeriod:', error);
    return { success: false, error: 'Failed to get current open period' };
  }
};

/**
 * List Financial Periods
 */
export const listFinancialPeriods = async (): Promise<ActionResult<any>> => {
  try {
    const context = await getContext();
    if (!context) {
      return { success: false, error: 'Unauthorized: No session found' };
    }

    const hasPermission = await hasContextPermission(context, 'fi.configuration.fiscal_years.view');
    
    if (!hasPermission) {
      return { success: false, error: 'Unauthorized: Missing permission to view periods' };
    }

    const periods = await db.financialPeriod.findMany({
      where: context.subAccountId
        ? { subAccountId: context.subAccountId }
        : { agencyId: context.agencyId, subAccountId: null },
      orderBy: [
        { fiscalYear: 'desc' },
        { fiscalPeriod: 'desc' },
      ],
    });

    return { success: true, data: periods };
  } catch (error) {
    console.error('Error in listFinancialPeriods:', error);
    return { success: false, error: 'Failed to list financial periods' };
  }
};

/**
 * Create Financial Period
 */
export const createFinancialPeriod = async (
  input: CreatePeriodInput
): Promise<ActionResult<any>> => {
  try {
    const context = await getContext();
    if (!context) {
      return { success: false, error: 'Unauthorized: No session found' };
    }

    const hasPermission = await hasContextPermission(context, 'fi.configuration.fiscal_years.manage');
    
    if (!hasPermission) {
      return { success: false, error: 'Unauthorized: Missing permission to create periods' };
    }

    // Validate input
    const validated = createPeriodSchema.safeParse(input);
    if (!validated.success) {
      return { success: false, error: validated.error.issues[0].message };
    }

    // Check for overlapping periods
    const overlapping = await db.financialPeriod.findFirst({
      where: {
        ...(context.subAccountId
          ? { subAccountId: context.subAccountId }
          : { agencyId: context.agencyId, subAccountId: null }),
        OR: [
          {
            startDate: {
              lte: validated.data.endDate,
            },
            endDate: {
              gte: validated.data.startDate,
            },
          },
        ],
      },
    });

    if (overlapping) {
      return { success: false, error: 'Period overlaps with existing period' };
    }

    // Create period
    const period = await db.financialPeriod.create({
      data: {
        ...validated.data,
        agencyId: context.subAccountId ? null : context.agencyId,
        subAccountId: context.subAccountId || null,
        status: PeriodStatus.FUTURE,
        createdBy: context.userId,
        updatedBy: context.userId,
      },
    });

    // Audit log
    await logGLAudit({
      action: 'CREATE',
      entityType: 'FinancialPeriod',
      entityId: period.id,
      agencyId: context.agencyId,
      subAccountId: context.subAccountId,
      description: `Financial period ${period.fiscalYear}-${period.fiscalPeriod} created`,
    });

    const basePath = context.subAccountId
      ? `/subaccount/${context.subAccountId}/fi/general-ledger/periods`
      : `/agency/${context.agencyId}/fi/general-ledger/periods`;
    revalidatePath(basePath);

    return { success: true, data: period };
  } catch (error) {
    console.error('Error in createFinancialPeriod:', error);
    return { success: false, error: 'Failed to create financial period' };
  }
};

/**
 * Update Financial Period
 */
export const updateFinancialPeriod = async (
  input: UpdatePeriodInput
): Promise<ActionResult<any>> => {
  try {
    const context = await getContext();
    if (!context) {
      return { success: false, error: 'Unauthorized: No session found' };
    }

    const hasPermission = await hasContextPermission(context, 'fi.configuration.fiscal_years.manage');
    
    if (!hasPermission) {
      return { success: false, error: 'Unauthorized: Missing permission to edit periods' };
    }

    // Validate input
    const validated = updatePeriodSchema.safeParse(input);
    if (!validated.success) {
      return { success: false, error: validated.error.issues[0].message };
    }

    // Get existing period
    const existing = await db.financialPeriod.findUnique({
      where: { id: validated.data.id },
    });

    if (!existing) {
      return { success: false, error: 'Period not found' };
    }

    // Cannot edit closed or locked periods
    if (existing.status === PeriodStatus.CLOSED || existing.status === PeriodStatus.LOCKED) {
      return { success: false, error: 'Cannot edit closed or locked periods' };
    }

    // Update period
    const { id, ...updateData } = validated.data;
    const period = await db.financialPeriod.update({
      where: { id },
      data: {
        ...updateData,
        updatedBy: context.userId,
      },
    });

    // Audit log
    await logGLAudit({
      action: 'UPDATE',
      entityType: 'FinancialPeriod',
      entityId: period.id,
      agencyId: context.agencyId,
      subAccountId: context.subAccountId,
      description: `Financial period ${period.fiscalYear}-${period.fiscalPeriod} updated`,
      previousValues: existing,
      newValues: period,
    });

    const basePath = context.subAccountId
      ? `/subaccount/${context.subAccountId}/fi/general-ledger/periods`
      : `/agency/${context.agencyId}/fi/general-ledger/periods`;
    revalidatePath(basePath);

    return { success: true, data: period };
  } catch (error) {
    console.error('Error in updateFinancialPeriod:', error);
    return { success: false, error: 'Failed to update financial period' };
  }
};

/**
 * Open Period
 */
export const openPeriod = async (periodId: string): Promise<ActionResult<any>> => {
  try {
    const context = await getContext();
    if (!context) {
      return { success: false, error: 'Unauthorized: No session found' };
    }

    const hasPermission = await hasContextPermission(context, 'fi.configuration.fiscal_years.manage');
    
    if (!hasPermission) {
      return { success: false, error: 'Unauthorized: Missing permission to open periods' };
    }

    // Get period
    const period = await db.financialPeriod.findUnique({
      where: { id: periodId },
    });

    if (!period) {
      return { success: false, error: 'Period not found' };
    }

    // Check if already open
    if (period.status === PeriodStatus.OPEN) {
      return { success: false, error: 'Period is already open' };
    }

    // Cannot reopen locked periods
    if (period.status === PeriodStatus.LOCKED) {
      return { success: false, error: 'Cannot reopen locked periods' };
    }

    // Open period
    const updated = await db.financialPeriod.update({
      where: { id: periodId },
      data: {
        status: PeriodStatus.OPEN,
        openedAt: new Date(),
        openedBy: context.userId,
        updatedBy: context.userId,
      },
    });

    // Audit log
    await logGLAudit({
      action: 'UPDATE',
      entityType: 'FinancialPeriod',
      entityId: periodId,
      agencyId: context.agencyId,
      subAccountId: context.subAccountId,
      description: `Period ${period.fiscalYear}-${period.fiscalPeriod} opened`,
    });

    // Emit period opened event
    await emitEvent(
      'fi.general_ledger',
      EVENT_KEYS.fi.general_ledger.periods.opened,
      { type: 'FinancialPeriod', id: periodId },
      { 
        amount: 0,
        reference: `${period.fiscalYear}-${period.fiscalPeriod}`,
        description: period.name || 'Period opened',
      }
    );

    const basePath = context.subAccountId
      ? `/subaccount/${context.subAccountId}/fi/general-ledger/periods`
      : `/agency/${context.agencyId}/fi/general-ledger/periods`;
    revalidatePath(basePath);

    return { success: true, data: updated };
  } catch (error) {
    console.error('Error in openPeriod:', error);
    return { success: false, error: 'Failed to open period' };
  }
};

/**
 * Close Period with Carry Forward
 */
export const closePeriod = async (periodId: string): Promise<ActionResult<any>> => {
  try {
    const context = await getContext();
    if (!context) {
      return { success: false, error: 'Unauthorized: No session found' };
    }

    const hasPermission = await hasContextPermission(context, 'fi.configuration.fiscal_years.manage');
    
    if (!hasPermission) {
      return { success: false, error: 'Unauthorized: Missing permission to close periods' };
    }

    // Get period
    const period = await db.financialPeriod.findUnique({
      where: { id: periodId },
    });

    if (!period) {
      return { success: false, error: 'Period not found' };
    }

    // Check if already closed
    if (period.status === PeriodStatus.CLOSED || period.status === PeriodStatus.LOCKED) {
      return { success: false, error: 'Period is already closed or locked' };
    }

    // Get all account balances for the period
    const balances = await db.accountBalance.findMany({
      where: {
        periodId: periodId,
      },
      include: {
        Account: true,
      },
    });

    // Find next period
    const nextPeriod = await db.financialPeriod.findFirst({
      where: context.subAccountId
        ? {
            subAccountId: context.subAccountId,
            OR: [
              { fiscalYear: period.fiscalYear, fiscalPeriod: { gt: period.fiscalPeriod } },
              { fiscalYear: { gt: period.fiscalYear } },
            ],
          }
        : {
            agencyId: context.agencyId,
            subAccountId: null,
            OR: [
              { fiscalYear: period.fiscalYear, fiscalPeriod: { gt: period.fiscalPeriod } },
              { fiscalYear: { gt: period.fiscalYear } },
            ],
          },
      orderBy: [{ fiscalYear: 'asc' }, { fiscalPeriod: 'asc' }],
    });

    // Use transaction to ensure atomicity
    await db.$transaction(async (tx) => {
      // 1. Close the period
      await tx.financialPeriod.update({
        where: { id: periodId },
        data: {
          status: PeriodStatus.CLOSED,
          closedAt: new Date(),
          closedBy: context.userId,
          updatedBy: context.userId,
        },
      });

      // 2. If next period exists, carry forward balances
      if (nextPeriod) {
        for (const balance of balances) {
          // Carry forward logic based on account type
          const carryForward = ['ASSET', 'LIABILITY', 'EQUITY'].includes(balance.Account.accountType) // TO VERIFY: account type or category
            ? balance.closingBalance // Balance sheet accounts carry ending balance
            : 0; // P&L accounts reset to zero

          // Check if balance already exists for next period
          const existingBalance = await tx.accountBalance.findFirst({
            where: {
              accountId: balance.accountId,
              periodId: nextPeriod.id,
            },
          });

          if (existingBalance) {
            // Update existing balance
            await tx.accountBalance.update({
              where: { id: existingBalance.id },
              data: {
                openingBalance: carryForward,
                // TO ADD: updatedBy, etc
              },
            });
          } else {
            // Create new balance entry
            await tx.accountBalance.create({
              data: {
                accountId: balance.accountId,
                periodId: nextPeriod.id,
                agencyId: context.subAccountId ? null : context.agencyId,
                subAccountId: context.subAccountId || null,
                openingBalance: carryForward,
                closingBalance: carryForward,
                // TO VERIFY: movement fields
                debitMovement: 0,
                creditMovement: 0,
                // TO ADD: currency, createdBy, etc
              },
            });
          }
        }
      }
    });

    // Audit log
    await logGLAudit({
      action: 'UPDATE',
      entityType: 'FinancialPeriod',
      entityId: periodId,
      agencyId: context.agencyId,
      subAccountId: context.subAccountId,
      description: `Period ${period.fiscalYear}-${period.fiscalPeriod} closed with carry forward`,
    });

    // Emit period closed event
    await emitEvent(
      'fi.general_ledger',
      EVENT_KEYS.fi.general_ledger.periods.closed,
      { type: 'FinancialPeriod', id: periodId },
      { 
        amount: 0,
        reference: `${period.fiscalYear}-${period.fiscalPeriod}`,
        description: period.name || 'Period closed',
        metadata: { carryForwardApplied: !!nextPeriod },
      }
    );

    const basePath = context.subAccountId
      ? `/subaccount/${context.subAccountId}/fi/general-ledger/periods`
      : `/agency/${context.agencyId}/fi/general-ledger/periods`;
    revalidatePath(basePath);

    return { success: true, data: { message: 'Period closed successfully' } };
  } catch (error) {
    console.error('Error in closePeriod:', error);
    return { success: false, error: 'Failed to close period' };
  }
};

/**
 * Lock Period (permanent)
 */
export const lockPeriod = async (periodId: string, reason: string): Promise<ActionResult<any>> => {
  try {
    const context = await getContext();
    if (!context) {
      return { success: false, error: 'Unauthorized: No session found' };
    }

    const hasPermission = await hasContextPermission(context, 'fi.configuration.fiscal_years.manage');
    
    if (!hasPermission) {
      return { success: false, error: 'Unauthorized: Missing permission to lock periods' };
    }

    // Get period
    const period = await db.financialPeriod.findUnique({
      where: { id: periodId },
    });

    if (!period) {
      return { success: false, error: 'Period not found' };
    }

    // Check if already locked
    if (period.status === PeriodStatus.LOCKED) {
      return { success: false, error: 'Period is already locked' };
    }

    // Must be closed before locking
    if (period.status !== PeriodStatus.CLOSED) {
      return { success: false, error: 'Period must be closed before locking' };
    }

    // Lock period
    const updated = await db.financialPeriod.update({
      where: { id: periodId },
      data: {
        status: PeriodStatus.LOCKED,
        lockedAt: new Date(),
        lockedBy: context.userId,
        updatedBy: context.userId,
      },
    });

    // Audit log
    await logGLAudit({
      action: 'UPDATE',
      entityType: 'FinancialPeriod',
      entityId: periodId,
      agencyId: context.agencyId,
      subAccountId: context.subAccountId,
      description: `Period ${period.fiscalYear}-${period.fiscalPeriod} locked`,
      reason,
    });

    // Emit period locked event
    await emitEvent(
      'fi.general_ledger',
      EVENT_KEYS.fi.general_ledger.periods.locked,
      { type: 'FinancialPeriod', id: periodId },
      { 
        amount: 0,
        reference: `${period.fiscalYear}-${period.fiscalPeriod}`,
        description: reason || 'Period locked',
      }
    );

    const basePath = context.subAccountId
      ? `/subaccount/${context.subAccountId}/fi/general-ledger/periods`
      : `/agency/${context.agencyId}/fi/general-ledger/periods`;
    revalidatePath(basePath);

    return { success: true, data: updated };
  } catch (error) {
    console.error('Error in lockPeriod:', error);
    return { success: false, error: 'Failed to lock period' };
  }
};
