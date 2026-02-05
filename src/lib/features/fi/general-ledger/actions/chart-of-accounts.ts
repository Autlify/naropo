/**
 * Chart of Accounts Server Actions
 * FI-GL Module - COA CRUD and hierarchy management
 */

'use server';

import { db } from '@/lib/db';
import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';
import { hasAgencyPermission, hasSubAccountPermission } from '@/lib/features/iam/authz/permissions';
import { 
  createAccountSchema, 
  updateAccountSchema,
  type CreateAccountInput,
  type UpdateAccountInput,
  type AccountHierarchyMoveInput,
} from '@/lib/schemas/fi/general-ledger/chart-of-accounts';
import { logGLAudit } from './audit';
import { emitEvent } from './fanout';
import { EVENT_KEYS } from '@/lib/registry/events/trigger';

type ActionResult<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

type Context = {
  agencyId?: string;
  subAccountId?: string;
  userId: string;
};

const getContext = async (): Promise<Context | null> => {
  const session = await auth();
  if (!session?.user?.id) return null;

  const dbSession = await db.session.findFirst({
    where: { userId: session.user.id },
    select: { activeAgencyId: true, activeSubAccountId: true },
  });

  return {
    userId: session.user.id,
    agencyId: dbSession?.activeAgencyId ?? undefined,
    subAccountId: dbSession?.activeSubAccountId ?? undefined,
  };
};

/**
 * Get Account by ID
 */
export const getAccount = async (accountId: string): Promise<ActionResult<any>> => {
  try {
    const context = await getContext();
    if (!context) {
      return { success: false, error: 'Unauthorized: No session found' };
    }

    const hasPermission = context.subAccountId
      ? await hasSubAccountPermission(context.subAccountId, 'fi.master_data.accounts.view')
      : await hasAgencyPermission(context.agencyId!, 'fi.master_data.accounts.view');
    
    if (!hasPermission) {
      return { success: false, error: 'Unauthorized: Missing permission to view COA' };
    }

    const account = await db.chartOfAccount.findUnique({
      where: { id: accountId },
      include: {
        ParentAccount: {
          select: { id: true, code: true, name: true },
        },
        ChildAccounts: {
          select: { id: true, code: true, name: true, accountType: true },
          where: { isArchived: false },
        },
      },
    });

    if (!account) {
      return { success: false, error: 'Account not found' };
    }

    // Verify ownership
    const isOwner = context.subAccountId
      ? account.subAccountId === context.subAccountId
      : account.agencyId === context.agencyId && !account.subAccountId;

    if (!isOwner) {
      return { success: false, error: 'Account does not belong to current context' };
    }

    return { success: true, data: account };
  } catch (error) {
    console.error('Error in getAccount:', error);
    return { success: false, error: 'Failed to get account' };
  }
};

/**
 * List Chart of Accounts
 */
export const listChartOfAccounts = async (): Promise<ActionResult<any>> => {
  try {
    const context = await getContext();
    if (!context) {
      return { success: false, error: 'Unauthorized: No session found' };
    }

    // Build permission check based on context
    const hasPermission = context.subAccountId
      ? await hasSubAccountPermission(context.subAccountId, 'fi.master_data.accounts.view')
      : await hasAgencyPermission(context.agencyId!, 'fi.master_data.accounts.view');
    
    if (!hasPermission) {
      return { success: false, error: 'Unauthorized: Missing permission to view COA' };
    }

    const accounts = await db.chartOfAccount.findMany({
      where: context.subAccountId
        ? { subAccountId: context.subAccountId, isArchived: false }
        : { agencyId: context.agencyId!, subAccountId: null, isArchived: false },
      orderBy: [
        { path: 'asc' },
        { sortOrder: 'asc' },
      ],
      include: {
        ParentAccount: {
          select: { id: true, code: true, name: true },
        },
        ChildAccounts: {
          select: { id: true, code: true, name: true },
        },
      },
    });

    return { success: true, data: accounts };
  } catch (error) {
    console.error('Error in listChartOfAccounts:', error);
    return { success: false, error: 'Failed to list chart of accounts' };
  }
};

/**
 * Create account
 */
export const createAccount = async (input: CreateAccountInput): Promise<ActionResult<any>> => {
  try {
    const context = await getContext();
    if (!context) {
      return { success: false, error: 'Unauthorized: No session found' };
    }

    const hasPermission = context.subAccountId
      ? await hasSubAccountPermission(context.subAccountId, 'fi.master_data.accounts.manage')
      : await hasAgencyPermission(context.agencyId!, 'fi.master_data.accounts.manage');
    
    if (!hasPermission) {
      return { success: false, error: 'Unauthorized: Missing permission to create accounts' };
    }

    // Validate input
    const validated = createAccountSchema.safeParse(input);
    if (!validated.success) {
      return { success: false, error: validated.error.issues[0].message };
    }

    // Check for duplicate code
    const existing = await db.chartOfAccount.findFirst({
      where: context.subAccountId
        ? { subAccountId: context.subAccountId, code: validated.data.code }
        : { agencyId: context.agencyId, code: validated.data.code, subAccountId: null },
    });

    if (existing) {
      return { success: false, error: 'Account code already exists' };
    }

    // Calculate hierarchy path and level
    let path = '/';
    let level = 0;

    if (validated.data.parentAccountId) {
      const parent = await db.chartOfAccount.findUnique({
        where: { id: validated.data.parentAccountId },
        select: { path: true, level: true },
      });

      if (!parent) {
        return { success: false, error: 'Parent account not found' };
      }

      if (parent.level >= 6) {
        return { success: false, error: 'Maximum hierarchy depth (7 levels) reached' };
      }

      path = `${parent.path}${validated.data.code}/`;
      level = parent.level + 1;
    } else {
      path = `/${validated.data.code}/`;
    }

    // Create account
    const account = await db.chartOfAccount.create({
      data: {
        ...validated.data,
        agencyId: context.subAccountId ? null : context.agencyId,
        subAccountId: context.subAccountId || null,
        path,
        level,
        createdBy: context.userId,
        updatedBy: context.userId,
      },
    });

    // Audit log
    await logGLAudit({
      action: 'CREATE',
      entityType: 'ChartOfAccount',
      entityId: account.id,
      agencyId: context.agencyId,
      subAccountId: context.subAccountId,
      description: `Account ${account.code} - ${account.name} created`,
    });

    // Emit account created event
    await emitEvent(
      'fi.general_ledger',
      EVENT_KEYS.fi.general_ledger.accounts.created,
      { type: 'ChartOfAccount', id: account.id },
      { 
        amount: 0,
        reference: account.code,
        description: account.name || 'Account created',
        accountId: account.id,
      }
    );

    const basePath = context.subAccountId
      ? `/subaccount/${context.subAccountId}/fi/general-ledger/chart-of-accounts`
      : `/agency/${context.agencyId}/fi/general-ledger/chart-of-accounts`;
    revalidatePath(basePath);

    return { success: true, data: account };
  } catch (error) {
    console.error('Error in createAccount:', error);
    return { success: false, error: 'Failed to create account' };
  }
};

/**
 * Update account
 */
export const updateAccount = async (input: UpdateAccountInput): Promise<ActionResult<any>> => {
  try {
    const context = await getContext();
    if (!context) {
      return { success: false, error: 'Unauthorized: No session found' };
    }

    const hasPermission = context.subAccountId
      ? await hasSubAccountPermission(context.subAccountId, 'fi.master_data.accounts.manage')
      : await hasAgencyPermission(context.agencyId!, 'fi.master_data.accounts.manage');
    
    if (!hasPermission) {
      return { success: false, error: 'Unauthorized: Missing permission to edit accounts' };
    }

    // Validate input
    const validated = updateAccountSchema.safeParse(input);
    if (!validated.success) {
      return { success: false, error: validated.error.issues[0].message };
    }

    // Get existing account
    const existing = await db.chartOfAccount.findUnique({
      where: { id: validated.data.id },
    });

    if (!existing) {
      return { success: false, error: 'Account not found' };
    }

    // Check if system-managed
    if (existing.isSystemManaged) {
      return { success: false, error: 'Cannot modify system-managed accounts' };
    }

    // Check ownership
    const isOwner = context.subAccountId
      ? existing.subAccountId === context.subAccountId
      : existing.agencyId === context.agencyId && !existing.subAccountId;

    if (!isOwner) {
      return { success: false, error: 'Account does not belong to current context' };
    }

    // Update account
    const { id, ...updateData } = validated.data;
    const account = await db.chartOfAccount.update({
      where: { id },
      data: {
        ...updateData,
        updatedBy: context.userId,
      },
    });

    // Audit log
    await logGLAudit({
      action: 'UPDATE',
      entityType: 'ChartOfAccount',
      entityId: account.id,
      agencyId: context.agencyId,
      subAccountId: context.subAccountId,
      description: `Account ${account.code} - ${account.name} updated`,
      previousValues: existing,
      newValues: account,
    });

    // Emit account updated event
    await emitEvent(
      'fi.general_ledger',
      EVENT_KEYS.fi.general_ledger.accounts.updated,
      { type: 'ChartOfAccount', id: account.id },
      { 
        amount: 0,
        reference: account.code,
        description: account.name || 'Account updated',
        accountId: account.id,
      }
    );

    const basePath = context.subAccountId
      ? `/subaccount/${context.subAccountId}/fi/general-ledger/chart-of-accounts`
      : `/agency/${context.agencyId}/fi/general-ledger/chart-of-accounts`;
    revalidatePath(basePath);

    return { success: true, data: account };
  } catch (error) {
    console.error('Error in updateAccount:', error);
    return { success: false, error: 'Failed to update account' };
  }
};

/**
 * Archive account (soft delete)
 */
export const archiveAccount = async (accountId: string, reason: string): Promise<ActionResult<any>> => {
  try {
    const context = await getContext();
    if (!context) {
      return { success: false, error: 'Unauthorized: No session found' };
    }

    const hasPermission = context.subAccountId
      ? await hasSubAccountPermission(context.subAccountId, 'fi.master_data.accounts.manage')
      : await hasAgencyPermission(context.agencyId!, 'fi.master_data.accounts.manage');
    
    if (!hasPermission) {
      return { success: false, error: 'Unauthorized: Missing permission to delete accounts' };
    }

    // Get account
    const account = await db.chartOfAccount.findUnique({
      where: { id: accountId },
      include: {
        ChildAccounts: true,
        JournalEntryLines: {
          take: 1,
        },
        AccountBalances: {
          take: 1,
        },
      },
    });

    if (!account) {
      return { success: false, error: 'Account not found' };
    }

    // Check if system account
    if (account.isSystemAccount || account.isSystemManaged) {
      return { success: false, error: 'Cannot archive system accounts' };
    }

    // Check if has child accounts
    if (account.ChildAccounts.length > 0) {
      return { success: false, error: 'Cannot archive account with child accounts' };
    }

    // Check if has transactions
    if (account.JournalEntryLines.length > 0) {
      return { success: false, error: 'Cannot archive account with transactions' };
    }

    // Check if has balances
    if (account.AccountBalances.length > 0) {
      return { success: false, error: 'Cannot archive account with balances' };
    }

    // Archive account
    const archived = await db.chartOfAccount.update({
      where: { id: accountId },
      data: {
        isArchived: true,
        archivedAt: new Date(),
        archivedBy: context.userId,
        updatedBy: context.userId,
      },
    });

    // Audit log
    await logGLAudit({
      action: 'DELETE',
      entityType: 'ChartOfAccount',
      entityId: accountId,
      agencyId: context.agencyId,
      subAccountId: context.subAccountId,
      description: `Account ${account.code} - ${account.name} archived`,
      reason,
    });

    // Emit account archived event
    await emitEvent(
      'fi.general_ledger',
      EVENT_KEYS.fi.general_ledger.accounts.archived,
      { type: 'ChartOfAccount', id: accountId },
      { 
        amount: 0,
        reference: account.code,
        description: reason || 'Account archived',
        accountId: accountId,
      }
    );

    const basePath = context.subAccountId
      ? `/subaccount/${context.subAccountId}/fi/general-ledger/chart-of-accounts`
      : `/agency/${context.agencyId}/fi/general-ledger/chart-of-accounts`;
    revalidatePath(basePath);

    return { success: true, data: archived };
  } catch (error) {
    console.error('Error in archiveAccount:', error);
    return { success: false, error: 'Failed to archive account' };
  }
};

/**
 * Move account in hierarchy
 */
export const moveAccountInHierarchy = async (
  input: AccountHierarchyMoveInput
): Promise<ActionResult<any>> => {
  try {
    const context = await getContext();
    if (!context) {
      return { success: false, error: 'Unauthorized: No session found' };
    }

    const hasPermission = context.subAccountId
      ? await hasSubAccountPermission(context.subAccountId, 'fi.master_data.accounts.manage')
      : await hasAgencyPermission(context.agencyId!, 'fi.master_data.accounts.manage');
    
    if (!hasPermission) {
      return { success: false, error: 'Unauthorized: Missing permission to manage hierarchy' };
    }

    // Get account
    const account = await db.chartOfAccount.findUnique({
      where: { id: input.accountId },
    });

    if (!account) {
      return { success: false, error: 'Account not found' };
    }

    // Calculate new path and level
    let newPath = '/';
    let newLevel = 0;

    if (input.newParentId) {
      const newParent = await db.chartOfAccount.findUnique({
        where: { id: input.newParentId },
        select: { path: true, level: true },
      });

      if (!newParent) {
        return { success: false, error: 'New parent account not found' };
      }

      // Prevent moving under self or descendants
      if (newParent.path.startsWith(account.path)) {
        return { success: false, error: 'Cannot move account under itself or its descendants' };
      }

      newPath = `${newParent.path}${account.code}/`;
      newLevel = newParent.level + 1;

      if (newLevel > 6) {
        return { success: false, error: 'Maximum hierarchy depth (7 levels) would be exceeded' };
      }
    } else {
      newPath = `/${account.code}/`;
      newLevel = 0;
    }

    // Update account and all descendants
    await db.$transaction(async (tx) => {
      // Update main account
      await tx.chartOfAccount.update({
        where: { id: input.accountId },
        data: {
          parentAccountId: input.newParentId || null,
          path: newPath,
          level: newLevel,
          sortOrder: input.newSortOrder,
          updatedBy: context.userId,
        },
      });

      // Update all descendants' paths
      const descendants = await tx.chartOfAccount.findMany({
        where: {
          path: {
            startsWith: account.path,
          },
          id: {
            not: account.id,
          },
        },
      });

      for (const descendant of descendants) {
        const oldRelativePath = descendant.path.substring(account.path.length);
        const newDescendantPath = newPath + oldRelativePath;
        const levelDiff = newLevel - account.level;

        await tx.chartOfAccount.update({
          where: { id: descendant.id },
          data: {
            path: newDescendantPath,
            level: descendant.level + levelDiff,
          },
        });
      }
    });

    // Audit log
    await logGLAudit({
      action: 'UPDATE',
      entityType: 'ChartOfAccount',
      entityId: input.accountId,
      agencyId: context.agencyId,
      subAccountId: context.subAccountId,
      description: `Account hierarchy moved: ${account.code}`,
      previousValues: { path: account.path, level: account.level },
      newValues: { path: newPath, level: newLevel },
    });

    const basePath = context.subAccountId
      ? `/subaccount/${context.subAccountId}/fi/general-ledger/chart-of-accounts`
      : `/agency/${context.agencyId}/fi/general-ledger/chart-of-accounts`;
    revalidatePath(basePath);

    return { success: true, data: { message: 'Account moved successfully' } };
  } catch (error) {
    console.error('Error in moveAccountInHierarchy:', error);
    return { success: false, error: 'Failed to move account in hierarchy' };
  }
};
