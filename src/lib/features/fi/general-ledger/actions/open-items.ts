/**
 * Open Item Server Actions
 * FI-GL Module - Open Item Clearing (AR/AP Management)
 * 
 * Manages open items (invoices, payments, etc.) that need to be matched
 * and cleared against each other. Supports both automatic and manual clearing.
 */

'use server';

import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import {
  createOpenItemSchema,
  updateOpenItemSchema,
  getOpenItemsFilterSchema,
  clearOpenItemsSchema,
  partialClearSchema,
  autoClearParametersSchema,
  reverseClearingSchema,
  type CreateOpenItemInput,
  type UpdateOpenItemInput,
  type GetOpenItemsFilter,
  type ClearOpenItemsInput,
  type PartialClearInput,
  type AutoClearParameters,
  type ReverseClearingInput,
  type OpenItemOutput,
  type ClearingResultOutput,
  type AutoClearResultOutput,
} from '@/lib/schemas/fi/general-ledger/open-item';
import { logGLAudit } from './audit';
import { OpenItemStatus, ClearingDocumentType, Prisma, SourceModule } from '@/generated/prisma/client';
import { Decimal } from 'decimal.js';
import { format } from 'date-fns';
import { getActionContext, hasContextPermission, type ActionContext } from '@/lib/features/iam/authz/action-context';

type ActionResult<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

type Context = ActionContext;

const getContext = getActionContext;

// ============================================================
// OPEN ITEM CRUD OPERATIONS
// ============================================================

/**
 * Create Open Item
 * Normally auto-created when posting to control accounts, but can be manual
 */
export const createOpenItem = async (
  input: CreateOpenItemInput
): Promise<ActionResult<OpenItemOutput>> => {
  try {
    const context = await getContext();
    if (!context) {
      return { success: false, error: 'Unauthorized: No session found' };
    }

    const hasPermission = await hasContextPermission(context, 'fi.general_ledger.reconciliation.manage');

    if (!hasPermission) {
      return { success: false, error: 'Unauthorized: Missing permission to create open items' };
    }

    const validated = createOpenItemSchema.safeParse(input);
    if (!validated.success) {
      return { success: false, error: validated.error.issues[0].message };
    }

    const data = validated.data;

    // Verify account exists and is a control account
    const account = await db.chartOfAccount.findUnique({
      where: { id: data.accountId },
    });

    if (!account) {
      return { success: false, error: 'Account not found' };
    }

    // Generate document number if not provided
    let documentNumber = data.documentNumber;
    if (!documentNumber) {
      const config = await db.gLConfiguration.findFirst({
        where: context.subAccountId
          ? { Agency: { SubAccount: { some: { id: context.subAccountId } } } }
          : { agencyId: context.agencyId },
      });
      
      const prefix = config?.journalEntryPrefix || 'OI';
      const count = await db.openItem.count({
        where: context.subAccountId
          ? { subAccountId: context.subAccountId }
          : { agencyId: context.agencyId },
      });
      documentNumber = `${prefix}${String(count + 1).padStart(8, '0')}`;
    }

    // Create the open item
    const openItem = await db.openItem.create({
      data: {
        agencyId: context.subAccountId ? null : context.agencyId,
        subAccountId: context.subAccountId ?? null,
        accountId: data.accountId,
        itemDate: data.documentDate,
        itemType: data.itemType,
        documentNumber,
        documentDate: data.documentDate,
        dueDate: data.dueDate,
        partnerType: data.partnerType,
        customerId: data.customerId,
        vendorId: data.vendorId,
        reference: data.reference,
        assignment: data.assignment,
        text: data.text,
        localCurrencyCode: data.localCurrencyCode,
        localAmount: data.localAmount,
        localRemainingAmount: data.localRemainingAmount ?? data.localAmount,
        documentCurrencyCode: data.documentCurrencyCode,
        documentAmount: data.documentAmount,
        documentRemainingAmount: data.documentRemainingAmount ?? data.documentAmount,
        exchangeRate: data.exchangeRate,
        sourceModule: (data.sourceModule ?? 'MANUAL') as SourceModule,
        sourceId: data.sourceId,
        sourceReference: data.sourceReference,
        journalEntryId: data.journalEntryId,
        journalLineId: data.journalLineId,
        status: 'OPEN',
        createdBy: context.userId,
        enteredAt: new Date(),
      },
      include: {
        Account: { select: { id: true, code: true, name: true } },
        Customer: { select: { id: true, code: true, name: true } },
        Vendor: { select: { id: true, code: true, name: true } },
      },
    });

    await logGLAudit({
      action: 'CREATE',
      entityType: 'OpenItem',
      entityId: openItem.id,
      description: `Created open item ${documentNumber}`,
      newValues: JSON.stringify(openItem),
    });

    const basePath = context.subAccountId
      ? `/subaccount/${context.subAccountId}`
      : `/agency/${context.agencyId}`;
    revalidatePath(`${basePath}/fi/general-ledger/open-items`);

    return { success: true, data: openItem as unknown as OpenItemOutput };
  } catch (error) {
    console.error('Error creating open item:', error);
    return { success: false, error: 'Failed to create open item' };
  }
};

/**
 * Get Open Item by ID
 */
export const getOpenItem = async (
  openItemId: string
): Promise<ActionResult<OpenItemOutput>> => {
  try {
    const context = await getContext();
    if (!context) {
      return { success: false, error: 'Unauthorized: No session found' };
    }

    const hasPermission = await hasContextPermission(context, 'fi.general_ledger.reconciliation.view');

    if (!hasPermission) {
      return { success: false, error: 'Unauthorized: Missing permission to view open items' };
    }

    const openItem = await db.openItem.findUnique({
      where: { id: openItemId },
      include: {
        Allocations: true,
        Account: { select: { id: true, code: true, name: true } },
        Customer: { select: { id: true, code: true, name: true } },
        Vendor: { select: { id: true, code: true, name: true } },
      },
    });

    if (!openItem) {
      return { success: false, error: 'Open item not found' };
    }

    // Verify ownership
    const isOwner = context.subAccountId
      ? openItem.subAccountId === context.subAccountId
      : openItem.agencyId === context.agencyId;

    if (!isOwner) {
      return { success: false, error: 'Unauthorized: Open item does not belong to this context' };
    }

    return { success: true, data: openItem as unknown as OpenItemOutput };
  } catch (error) {
    console.error('Error getting open item:', error);
    return { success: false, error: 'Failed to get open item' };
  }
};

/**
 * Get Open Items with filtering and pagination
 */
export const getOpenItems = async (
  filter: GetOpenItemsFilter
): Promise<ActionResult<{ items: OpenItemOutput[]; total: number; page: number; pageSize: number }>> => {
  try {
    const context = await getContext();
    if (!context) {
      return { success: false, error: 'Unauthorized: No session found' };
    }

    const hasPermission = await hasContextPermission(context, 'fi.general_ledger.reconciliation.view');

    if (!hasPermission) {
      return { success: false, error: 'Unauthorized: Missing permission to view open items' };
    }

    const validated = getOpenItemsFilterSchema.safeParse(filter);
    if (!validated.success) {
      return { success: false, error: validated.error.issues[0].message };
    }

    const {
      accountId,
      customerId,
      vendorId,
      partnerType,
      status,
      statusIn,
      documentDateFrom,
      documentDateTo,
      dueDateFrom,
      dueDateTo,
      minAmount,
      maxAmount,
      includeZeroBalance,
      search,
      page,
      pageSize,
      sortBy,
      sortOrder,
    } = validated.data;

    // Build where clause
    const where: Prisma.OpenItemWhereInput = {
      ...(context.subAccountId
        ? { subAccountId: context.subAccountId }
        : { agencyId: context.agencyId }),
      ...(accountId && { accountId }),
      ...(customerId && { customerId }),
      ...(vendorId && { vendorId }),
      ...(partnerType && { partnerType }),
      ...(status && { status }),
      ...(statusIn && { status: { in: statusIn } }),
      ...(documentDateFrom && { documentDate: { gte: documentDateFrom } }),
      ...(documentDateTo && { documentDate: { lte: documentDateTo } }),
      ...(dueDateFrom && { dueDate: { gte: dueDateFrom } }),
      ...(dueDateTo && { dueDate: { lte: dueDateTo } }),
      ...(minAmount !== undefined && { localAmount: { gte: minAmount } }),
      ...(maxAmount !== undefined && { localAmount: { lte: maxAmount } }),
      ...(!includeZeroBalance && { localRemainingAmount: { not: 0 } }),
      ...(search && {
        OR: [
          { documentNumber: { contains: search, mode: 'insensitive' as const } },
          { reference: { contains: search, mode: 'insensitive' as const } },
          { assignment: { contains: search, mode: 'insensitive' as const } },
          { text: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
    };

    const [items, total] = await Promise.all([
      db.openItem.findMany({
        where,
        include: {
          Account: { select: { id: true, code: true, name: true } },
          Customer: { select: { id: true, code: true, name: true } },
          Vendor: { select: { id: true, code: true, name: true } },
        },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      db.openItem.count({ where }),
    ]);

    return {
      success: true,
      data: {
        items: items as unknown as OpenItemOutput[],
        total,
        page,
        pageSize,
      },
    };
  } catch (error) {
    console.error('Error getting open items:', error);
    return { success: false, error: 'Failed to get open items' };
  }
};

/**
 * Update Open Item (limited fields)
 */
export const updateOpenItem = async (
  input: UpdateOpenItemInput
): Promise<ActionResult<OpenItemOutput>> => {
  try {
    const context = await getContext();
    if (!context) {
      return { success: false, error: 'Unauthorized: No session found' };
    }

    const hasPermission = await hasContextPermission(context, 'fi.general_ledger.reconciliation.manage');

    if (!hasPermission) {
      return { success: false, error: 'Unauthorized: Missing permission to edit open items' };
    }

    const validated = updateOpenItemSchema.safeParse(input);
    if (!validated.success) {
      return { success: false, error: validated.error.issues[0].message };
    }

    const { id, ...updateData } = validated.data;

    // Verify item exists and is not cleared
    const existing = await db.openItem.findUnique({ where: { id } });
    if (!existing) {
      return { success: false, error: 'Open item not found' };
    }

    if (existing.status === 'CLEARED') {
      return { success: false, error: 'Cannot update a cleared open item' };
    }

    const updated = await db.openItem.update({
      where: { id },
      data: updateData,
      include: {
        Account: { select: { id: true, code: true, name: true } },
        Customer: { select: { id: true, code: true, name: true } },
        Vendor: { select: { id: true, code: true, name: true } },
      },
    });

    await logGLAudit({
      action: 'UPDATE',
      entityType: 'OpenItem',
      entityId: id,
      description: `Updated open item ${existing.documentNumber ?? id}`,
      previousValues: JSON.stringify(existing),
      newValues: JSON.stringify(updated),
    });

    const basePath = context.subAccountId
      ? `/subaccount/${context.subAccountId}`
      : `/agency/${context.agencyId}`;
    revalidatePath(`${basePath}/fi/general-ledger/open-items`);

    return { success: true, data: updated as unknown as OpenItemOutput };
  } catch (error) {
    console.error('Error updating open item:', error);
    return { success: false, error: 'Failed to update open item' };
  }
};

// ============================================================
// CLEARING OPERATIONS
// ============================================================

/**
 * Clear multiple open items against each other
 * All items must net to zero (or within tolerance)
 */
export const clearOpenItems = async (
  input: ClearOpenItemsInput
): Promise<ActionResult<ClearingResultOutput>> => {
  try {
    const context = await getContext();
    if (!context) {
      return { success: false, error: 'Unauthorized: No session found' };
    }

    const hasPermission = await hasContextPermission(context, 'fi.general_ledger.reconciliation.clear');

    if (!hasPermission) {
      return { success: false, error: 'Unauthorized: Missing permission to clear open items' };
    }

    const validated = clearOpenItemsSchema.safeParse(input);
    if (!validated.success) {
      return { success: false, error: validated.error.issues[0].message };
    }

    const data = validated.data;

    // Generate clearing document number
    const config = await db.gLConfiguration.findFirst({
      where: context.subAccountId
        ? { Agency: { SubAccount: { some: { id: context.subAccountId } } } }
        : { agencyId: context.agencyId },
    });

    const prefix = config?.reconciliationPrefix || 'CLR';
    const count = await db.openItemAllocation.count({
      where: {
        OpenItem: context.subAccountId
          ? { subAccountId: context.subAccountId }
          : { agencyId: context.agencyId },
      },
    });
    const clearingDocumentNumber = data.clearingDocumentNumber || `${prefix}${String(count + 1).padStart(8, '0')}`;

    const clearedItems: ClearingResultOutput['clearedItems'] = [];
    const exchangeDifferences: ClearingResultOutput['exchangeDifferences'] = [];

    // Execute clearing in transaction
    await db.$transaction(async (tx) => {
      for (const item of data.items) {
        const openItem = await tx.openItem.findUnique({
          where: { id: item.openItemId },
        });

        if (!openItem) {
          throw new Error(`Open item ${item.openItemId} not found`);
        }

        if (openItem.status === 'CLEARED') {
          throw new Error(`Open item ${openItem.documentNumber ?? item.openItemId} is already cleared`);
        }

        const previousStatus = openItem.status;
        const newRemainingLocal = new Decimal(openItem.localRemainingAmount).minus(item.clearAmount).toNumber();
        const newRemainingDoc = item.clearAmountDocument
          ? new Decimal(openItem.documentRemainingAmount).minus(item.clearAmountDocument).toNumber()
          : new Decimal(openItem.documentRemainingAmount).toNumber();

        // Determine new status
        let newStatus: OpenItemStatus = 'OPEN';
        if (Math.abs(newRemainingLocal) < 0.01) {
          newStatus = 'CLEARED';
        } else if (Math.abs(newRemainingLocal) < new Decimal(openItem.localAmount).abs().toNumber()) {
          newStatus = 'PARTIALLY_CLEARED';
        }

        // Calculate exchange difference if applicable
        let exchangeDiff = 0;
        if (data.clearingExchangeRate && data.postExchangeDifference) {
          const originalDocValue = new Decimal(item.clearAmountDocument || 0)
            .times(openItem.exchangeRate)
            .toNumber();
          const currentDocValue = new Decimal(item.clearAmountDocument || 0)
            .times(data.clearingExchangeRate)
            .toNumber();
          exchangeDiff = currentDocValue - originalDocValue;
        }

        // Create allocation record
        await tx.openItemAllocation.create({
          data: {
            openItemId: item.openItemId,
            clearedById: clearingDocumentNumber,
            clearedByType: data.clearingDocumentType as ClearingDocumentType,
            clearedByRef: clearingDocumentNumber,
            localAmount: item.clearAmount,
            documentAmount: item.clearAmountDocument ?? 0,
            exchangeDifference: exchangeDiff,
            allocatedAt: data.clearingDate,
            allocatedBy: context.userId,
            notes: data.notes,
          },
        });

        // Update open item
        await tx.openItem.update({
          where: { id: item.openItemId },
          data: {
            localRemainingAmount: newRemainingLocal,
            documentRemainingAmount: newRemainingDoc,
            status: newStatus,
            clearingDate: newStatus === 'CLEARED' ? data.clearingDate : null,
            clearingDocumentId: newStatus === 'CLEARED' ? clearingDocumentNumber : null,
            clearedAt: newStatus === 'CLEARED' ? new Date() : null,
            clearedBy: newStatus === 'CLEARED' ? context.userId : null,
          },
        });

        clearedItems.push({
          openItemId: item.openItemId,
          documentNumber: openItem.documentNumber ?? item.openItemId,
          previousStatus: previousStatus,
          newStatus: newStatus,
          amountCleared: item.clearAmount,
          remainingAmount: newRemainingLocal,
        });

        if (exchangeDiff !== 0) {
          exchangeDifferences.push({
            openItemId: item.openItemId,
            difference: exchangeDiff,
          });
        }
      }
    });

    await logGLAudit({
      action: 'POST',
      entityType: 'OpenItem',
      entityId: clearingDocumentNumber,
      description: `Cleared ${clearedItems.length} open items with document ${clearingDocumentNumber}`,
      newValues: JSON.stringify({ items: clearedItems, exchangeDifferences }),
    });

    const basePath = context.subAccountId
      ? `/subaccount/${context.subAccountId}`
      : `/agency/${context.agencyId}`;
    revalidatePath(`${basePath}/fi/general-ledger/open-items`);

    return {
      success: true,
      data: {
        success: true,
        message: `Successfully cleared ${clearedItems.length} open items`,
        clearedItems,
        exchangeDifferences: exchangeDifferences.length > 0 ? exchangeDifferences : undefined,
        clearingDocumentNumber,
      },
    };
  } catch (error) {
    console.error('Error clearing open items:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to clear open items' };
  }
};

/**
 * Partial clear a single open item
 */
export const partialClearOpenItem = async (
  input: PartialClearInput
): Promise<ActionResult<OpenItemOutput>> => {
  try {
    const context = await getContext();
    if (!context) {
      return { success: false, error: 'Unauthorized: No session found' };
    }

    const hasPermission = await hasContextPermission(context, 'fi.general_ledger.reconciliation.clear');

    if (!hasPermission) {
      return { success: false, error: 'Unauthorized: Missing permission to clear open items' };
    }

    const validated = partialClearSchema.safeParse(input);
    if (!validated.success) {
      return { success: false, error: validated.error.issues[0].message };
    }

    const data = validated.data;

    const openItem = await db.openItem.findUnique({
      where: { id: data.openItemId },
    });

    if (!openItem) {
      return { success: false, error: 'Open item not found' };
    }

    if (openItem.status === 'CLEARED') {
      return { success: false, error: 'Open item is already cleared' };
    }

    // Validate clear amount doesn't exceed remaining
    if (Math.abs(data.localAmount) > new Decimal(openItem.localRemainingAmount).abs().toNumber()) {
      return { success: false, error: 'Clear amount exceeds remaining amount' };
    }

    const newRemainingLocal = new Decimal(openItem.localRemainingAmount).minus(data.localAmount).toNumber();
    const newRemainingDoc = data.documentAmount
      ? new Decimal(openItem.documentRemainingAmount).minus(data.documentAmount).toNumber()
      : new Decimal(openItem.documentRemainingAmount).toNumber();

    // Determine new status
    let newStatus: OpenItemStatus = 'OPEN';
    if (Math.abs(newRemainingLocal) < 0.01) {
      newStatus = 'CLEARED';
    } else {
      newStatus = 'PARTIALLY_CLEARED';
    }

    const [updated, _allocation] = await db.$transaction([
      db.openItem.update({
        where: { id: data.openItemId },
        data: {
          localRemainingAmount: newRemainingLocal,
          documentRemainingAmount: newRemainingDoc,
          status: newStatus,
          clearingDate: newStatus === 'CLEARED' ? new Date() : null,
          clearedAt: newStatus === 'CLEARED' ? new Date() : null,
          clearedBy: newStatus === 'CLEARED' ? context.userId : null,
        },
        include: {
          Account: { select: { id: true, code: true, name: true } },
          Customer: { select: { id: true, code: true, name: true } },
          Vendor: { select: { id: true, code: true, name: true } },
          Allocations: true,
        },
      }),
      db.openItemAllocation.create({
        data: {
          openItemId: data.openItemId,
          clearedById: data.clearedById ?? 'MANUAL',
          clearedByType: data.clearedByType as ClearingDocumentType,
          clearedByRef: data.clearedByRef,
          localAmount: data.localAmount,
          documentAmount: data.documentAmount ?? 0,
          exchangeDifference: data.exchangeDifference || 0,
          allocatedAt: new Date(),
          allocatedBy: context.userId,
          notes: data.notes,
        },
      }),
    ]);

    await logGLAudit({
      action: 'UPDATE',
      entityType: 'OpenItem',
      entityId: data.openItemId,
      description: `Partially cleared open item ${openItem.documentNumber ?? data.openItemId} with amount ${data.localAmount}`,
      previousValues: JSON.stringify(openItem),
      newValues: JSON.stringify(updated),
    });

    const basePath = context.subAccountId
      ? `/subaccount/${context.subAccountId}`
      : `/agency/${context.agencyId}`;
    revalidatePath(`${basePath}/fi/general-ledger/open-items`);

    return { success: true, data: updated as unknown as OpenItemOutput };
  } catch (error) {
    console.error('Error partially clearing open item:', error);
    return { success: false, error: 'Failed to partially clear open item' };
  }
};

/**
 * Auto-clear open items based on matching criteria
 */
export const autoClearOpenItems = async (
  params: AutoClearParameters
): Promise<ActionResult<AutoClearResultOutput>> => {
  try {
    const context = await getContext();
    if (!context) {
      return { success: false, error: 'Unauthorized: No session found' };
    }

    const hasPermission = await hasContextPermission(context, 'fi.general_ledger.reconciliation.clear');

    if (!hasPermission) {
      return { success: false, error: 'Unauthorized: Missing permission to auto-clear open items' };
    }

    const validated = autoClearParametersSchema.safeParse(params);
    if (!validated.success) {
      return { success: false, error: validated.error.issues[0].message };
    }

    const data = validated.data;
    const clearingDate = data.clearingDate || new Date();

    // Get open items to process
    const where: Prisma.OpenItemWhereInput = {
      ...(context.subAccountId
        ? { subAccountId: context.subAccountId }
        : { agencyId: context.agencyId }),
      status: { in: ['OPEN', 'PARTIALLY_CLEARED'] },
      ...(data.accountId && { accountId: data.accountId }),
      ...(data.customerId && { customerId: data.customerId }),
      ...(data.vendorId && { vendorId: data.vendorId }),
    };

    const openItems = await db.openItem.findMany({
      where,
      orderBy: { itemDate: 'asc' },
      take: data.maxItems,
    });

    if (openItems.length === 0) {
      return {
        success: true,
        data: {
          success: true,
          message: 'No open items found to process',
          itemsProcessed: 0,
          itemsCleared: 0,
          errors: [],
        },
      };
    }

    // Group items by matching criteria
    const groups: Map<string, typeof openItems> = new Map();

    for (const item of openItems) {
      // Build matching key based on selected criteria
      const keyParts: string[] = [];

      if (data.matchBy.includes('documentNumber') && item.documentNumber) {
        keyParts.push(item.documentNumber);
      }
      if (data.matchBy.includes('reference') && item.reference) {
        keyParts.push(item.reference);
      }
      if (data.matchBy.includes('assignment') && item.assignment) {
        keyParts.push(item.assignment);
      }
      if (data.matchBy.includes('amount')) {
        keyParts.push(String(new Decimal(item.localRemainingAmount).abs().toNumber()));
      }
      if (data.matchBy.includes('dueDate') && item.dueDate) {
        keyParts.push(format(item.dueDate, 'yyyy-MM-dd'));
      }

      const key = keyParts.join('|');

      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(item);
    }

    // Find groups that can be cleared (net to zero)
    const proposedClearings: AutoClearResultOutput['proposedClearings'] = [];
    const clearings: AutoClearResultOutput['clearings'] = [];
    const errors: AutoClearResultOutput['errors'] = [];

    let itemsCleared = 0;

    for (const [_key, items] of groups) {
      if (items.length < 2) continue; // Need at least 2 items to clear

      // Check if items net to zero (within tolerance)
      const netAmount = items.reduce((sum, item) => sum + new Decimal(item.localRemainingAmount).toNumber(), 0);

      if (Math.abs(netAmount) > data.amountTolerance) continue;

      const itemsInfo = items.map((item) => ({
        openItemId: item.id,
        documentNumber: item.documentNumber ?? item.id,
        amount: new Decimal(item.localRemainingAmount).toNumber(),
      }));

      if (data.dryRun) {
        proposedClearings.push({
          items: itemsInfo,
          matchedBy: data.matchBy,
          netAmount,
        });
      } else {
        // Actually clear the items
        try {
          const clearResult = await clearOpenItems({
            items: items.map((item) => ({
              openItemId: item.id,
              clearAmount: new Decimal(item.localRemainingAmount).toNumber(),
              clearAmountDocument: new Decimal(item.documentRemainingAmount).toNumber(),
            })),
            clearingDocumentType: 'CLEARING',
            clearingDate,
            postExchangeDifference: true,
          });

          if (clearResult.success && clearResult.data) {
            itemsCleared += items.length;
            clearings.push({
              clearingDocumentNumber: clearResult.data.clearingDocumentNumber || 'N/A',
              itemsCleared: items.length,
              totalAmount: items.reduce((sum, item) => sum + new Decimal(item.localRemainingAmount).abs().toNumber(), 0),
            });
          } else {
            for (const item of items) {
              errors.push({
                openItemId: item.id,
                documentNumber: item.documentNumber ?? item.id,
                error: clearResult.error || 'Unknown error',
              });
            }
          }
        } catch (error) {
          for (const item of items) {
            errors.push({
              openItemId: item.id,
              documentNumber: item.documentNumber ?? item.id,
              error: error instanceof Error ? error.message : 'Unknown error',
            });
          }
        }
      }
    }

    await logGLAudit({
      action: 'POST',
      entityType: 'OpenItem',
      entityId: 'batch',
      description: `Auto-cleared ${itemsCleared} items (dry run: ${data.dryRun})`,
      newValues: JSON.stringify({ proposedClearings, clearings, errors }),
    });

    const basePath = context.subAccountId
      ? `/subaccount/${context.subAccountId}`
      : `/agency/${context.agencyId}`;
    revalidatePath(`${basePath}/fi/general-ledger/open-items`);

    return {
      success: true,
      data: {
        success: true,
        message: data.dryRun
          ? `Found ${proposedClearings.length} potential clearing groups`
          : `Cleared ${itemsCleared} items in ${clearings.length} groups`,
        itemsProcessed: openItems.length,
        itemsCleared,
        errors,
        proposedClearings: data.dryRun ? proposedClearings : undefined,
        clearings: !data.dryRun ? clearings : undefined,
      },
    };
  } catch (error) {
    console.error('Error auto-clearing open items:', error);
    return { success: false, error: 'Failed to auto-clear open items' };
  }
};

/**
 * Reverse a clearing operation
 */
export const reverseClearing = async (
  input: ReverseClearingInput
): Promise<ActionResult<{ reversedItems: number }>> => {
  try {
    const context = await getContext();
    if (!context) {
      return { success: false, error: 'Unauthorized: No session found' };
    }

    const hasPermission = await hasContextPermission(context, 'fi.general_ledger.reconciliation.reset');

    if (!hasPermission) {
      return { success: false, error: 'Unauthorized: Missing permission to reverse clearing' };
    }

    const validated = reverseClearingSchema.safeParse(input);
    if (!validated.success) {
      return { success: false, error: validated.error.issues[0].message };
    }

    const data = validated.data;

    // Find allocations to reverse
    const where: Prisma.OpenItemAllocationWhereInput = {
      ...(data.clearingDocumentId && { id: data.clearingDocumentId }),
      ...(data.clearingDocumentNumber && { clearedByRef: data.clearingDocumentNumber }),
    };

    const allocations = await db.openItemAllocation.findMany({
      where,
      include: { OpenItem: true },
    });

    if (allocations.length === 0) {
      return { success: false, error: 'No allocations found to reverse' };
    }

    let reversedItems = 0;

    await db.$transaction(async (tx) => {
      for (const allocation of allocations) {
        const openItem = allocation.OpenItem;

        // Restore remaining amounts
        const newRemainingLocal = new Decimal(openItem.localRemainingAmount)
          .plus(allocation.localAmount)
          .toNumber();
        const newRemainingDoc = new Decimal(openItem.documentRemainingAmount)
          .plus(allocation.documentAmount)
          .toNumber();

        // Determine new status
        let newStatus: OpenItemStatus = 'OPEN';
        if (openItem.status === 'CLEARED' && Math.abs(newRemainingLocal) > 0.01) {
          newStatus = Math.abs(newRemainingLocal) < new Decimal(openItem.localAmount).abs().toNumber()
            ? 'PARTIALLY_CLEARED'
            : 'OPEN';
        }

        // Update open item
        await tx.openItem.update({
          where: { id: openItem.id },
          data: {
            localRemainingAmount: newRemainingLocal,
            documentRemainingAmount: newRemainingDoc,
            status: newStatus,
            clearingDate: null,
            clearingDocumentId: null,
            clearedAt: null,
            clearedBy: null,
          },
        });

        // Delete allocation
        await tx.openItemAllocation.delete({
          where: { id: allocation.id },
        });

        reversedItems++;
      }
    });

    await logGLAudit({
      action: 'REVERSE',
      entityType: 'OpenItem',
      entityId: data.clearingDocumentId || data.clearingDocumentNumber || 'unknown',
      description: `Reversed clearing for ${reversedItems} items. Reason: ${data.reason}`,
      newValues: JSON.stringify({ reversedItems, reason: data.reason }),
    });

    const basePath = context.subAccountId
      ? `/subaccount/${context.subAccountId}`
      : `/agency/${context.agencyId}`;
    revalidatePath(`${basePath}/fi/general-ledger/open-items`);

    return { success: true, data: { reversedItems } };
  } catch (error) {
    console.error('Error reversing clearing:', error);
    return { success: false, error: 'Failed to reverse clearing' };
  }
};

// ============================================================
// UTILITY FUNCTIONS
// ============================================================

/**
 * Get open item summary for a partner (Customer or Vendor)
 */
export const getPartnerOpenItemsSummary = async (
  partnerId: string,
  partnerType: 'CUSTOMER' | 'VENDOR'
): Promise<ActionResult<{
  partnerId: string;
  partnerType: string;
  totalOpen: number;
  totalPartiallyCleared: number;
  totalCleared: number;
  totalAmount: number;
  totalRemainingAmount: number;
  oldestOpenDate: Date | null;
}>> => {
  try {
    const context = await getContext();
    if (!context) {
      return { success: false, error: 'Unauthorized: No session found' };
    }

    const hasPermission = await hasContextPermission(context, 'fi.general_ledger.reconciliation.view');

    if (!hasPermission) {
      return { success: false, error: 'Unauthorized: Missing permission to view open items' };
    }

    const where: Prisma.OpenItemWhereInput = {
      ...(context.subAccountId
        ? { subAccountId: context.subAccountId }
        : { agencyId: context.agencyId }),
      ...(partnerType === 'CUSTOMER' ? { customerId: partnerId } : { vendorId: partnerId }),
    };

    const [items, oldest] = await Promise.all([
      db.openItem.findMany({
        where,
        select: {
          status: true,
          localAmount: true,
          localRemainingAmount: true,
        },
      }),
      db.openItem.findFirst({
        where: { ...where, status: { in: ['OPEN', 'PARTIALLY_CLEARED'] } },
        orderBy: { itemDate: 'asc' },
        select: { itemDate: true },
      }),
    ]);

    const summary = items.reduce(
      (acc, item) => {
        if (item.status === 'OPEN') acc.totalOpen++;
        else if (item.status === 'PARTIALLY_CLEARED') acc.totalPartiallyCleared++;
        else if (item.status === 'CLEARED') acc.totalCleared++;
        acc.totalAmount += new Decimal(item.localAmount).toNumber();
        acc.totalRemainingAmount += new Decimal(item.localRemainingAmount).toNumber();
        return acc;
      },
      {
        totalOpen: 0,
        totalPartiallyCleared: 0,
        totalCleared: 0,
        totalAmount: 0,
        totalRemainingAmount: 0,
      }
    );

    return {
      success: true,
      data: {
        partnerId,
        partnerType,
        ...summary,
        oldestOpenDate: oldest?.itemDate || null,
      },
    };
  } catch (error) {
    console.error('Error getting partner open items summary:', error);
    return { success: false, error: 'Failed to get partner open items summary' };
  }
};

/**
 * Get aging analysis for open items
 */
export const getOpenItemsAging = async (
  params: {
    accountId?: string;
    customerId?: string;
    vendorId?: string;
    asOfDate?: Date;
  }
): Promise<ActionResult<{
  current: number;
  days1to30: number;
  days31to60: number;
  days61to90: number;
  over90: number;
  total: number;
}>> => {
  try {
    const context = await getContext();
    if (!context) {
      return { success: false, error: 'Unauthorized: No session found' };
    }

    const hasPermission = await hasContextPermission(context, 'fi.general_ledger.reconciliation.view');

    if (!hasPermission) {
      return { success: false, error: 'Unauthorized: Missing permission to view open items' };
    }

    const asOfDate = params.asOfDate || new Date();

    const where: Prisma.OpenItemWhereInput = {
      ...(context.subAccountId
        ? { subAccountId: context.subAccountId }
        : { agencyId: context.agencyId }),
      status: { in: ['OPEN', 'PARTIALLY_CLEARED'] },
      ...(params.accountId && { accountId: params.accountId }),
      ...(params.customerId && { customerId: params.customerId }),
      ...(params.vendorId && { vendorId: params.vendorId }),
    };

    const items = await db.openItem.findMany({
      where,
      select: {
        dueDate: true,
        itemDate: true,
        localRemainingAmount: true,
      },
    });

    const aging = items.reduce(
      (acc, item) => {
        const baseDate = item.dueDate || item.itemDate;
        const daysPast = Math.floor((asOfDate.getTime() - baseDate.getTime()) / (1000 * 60 * 60 * 24));
        const amount = new Decimal(item.localRemainingAmount).abs().toNumber();

        if (daysPast <= 0) {
          acc.current += amount;
        } else if (daysPast <= 30) {
          acc.days1to30 += amount;
        } else if (daysPast <= 60) {
          acc.days31to60 += amount;
        } else if (daysPast <= 90) {
          acc.days61to90 += amount;
        } else {
          acc.over90 += amount;
        }
        acc.total += amount;

        return acc;
      },
      {
        current: 0,
        days1to30: 0,
        days31to60: 0,
        days61to90: 0,
        over90: 0,
        total: 0,
      }
    );

    return { success: true, data: aging };
  } catch (error) {
    console.error('Error getting open items aging:', error);
    return { success: false, error: 'Failed to get open items aging' };
  }
};
