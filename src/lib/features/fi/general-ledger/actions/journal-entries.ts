/**
 * Journal Entry Server Actions
 * FI-GL Module - Double-entry bookkeeping core functions
 */

'use server';

import { db } from '@/lib/db';
import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';
import { hasAgencyPermission, hasSubAccountPermission } from '@/lib/features/iam/authz/permissions';
import {
    createJournalEntrySchema,
    updateJournalEntrySchema,
    type CreateJournalEntryInput,
    type UpdateJournalEntryInput,
} from '@/lib/schemas/fi/general-ledger/journal-entry';
import { logGLAudit } from './audit';
import { ConsolidationMethod, JournalEntryStatus, PeriodStatus } from '@/generated/prisma/client';
import { format } from 'date-fns';
import { Decimal } from 'decimal.js';
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
 * Validate double-entry balance
 */
const validateDoubleEntry = (lines: Array<{ debitAmount: number; creditAmount: number }>) => {
    const totalDebits = lines.reduce((sum, line) => sum + (line.debitAmount || 0), 0);
    const totalCredits = lines.reduce((sum, line) => sum + (line.creditAmount || 0), 0);

    if (Math.abs(totalDebits - totalCredits) > 0.01) {
        return { valid: false, message: 'Debits and credits must balance' };
    }

    if (totalDebits === 0 && totalCredits === 0) {
        return { valid: false, message: 'Journal entry must have at least one debit and one credit' };
    }

    return { valid: true };
};

/**
 * Update account balances
 */
const updateAccountBalances = async (
    tx: any,
    periodId: string,
    lines: Array<{ accountId: string; debitAmount: number; creditAmount: number; currency: string }>,
    userId: string,
    context: Context
) => {
    for (const line of lines) {
        const balance = await tx.accountBalance.findFirst({
            where: {
                accountId: line.accountId,
                financialPeriodId: periodId,
            },
        });

        if (balance) {
            // Update existing balance
            const newDebit = new Decimal(balance.debitAmount).plus(line.debitAmount).toNumber();
            const newCredit = new Decimal(balance.creditAmount).plus(line.creditAmount).toNumber();
            const newEnding = new Decimal(balance.openingBalance)
                .plus(newDebit)
                .minus(newCredit)
                .toNumber();

            await tx.accountBalance.update({
                where: { id: balance.id },
                data: {
                    debitAmount: newDebit,
                    creditAmount: newCredit,
                    endingBalance: newEnding,
                    updatedBy: userId,
                },
            });
        } else {
            // Create new balance entry
            const endingBalance = new Decimal(line.debitAmount).minus(line.creditAmount).toNumber();

            await tx.accountBalance.create({
                data: {
                    accountId: line.accountId,
                    financialPeriodId: periodId,
                    agencyId: context.subAccountId ? null : context.agencyId,
                    subAccountId: context.subAccountId || null,
                    openingBalance: 0,
                    debitAmount: line.debitAmount,
                    creditAmount: line.creditAmount,
                    endingBalance,
                    currency: line.currency,
                    createdBy: userId,
                    updatedBy: userId,
                },
            });
        }
    }
};

/**
 * Get Journal Entry by ID
 */
export const getJournalEntry = async (
    entryId: string
): Promise<ActionResult<any>> => {
    try {
        const context = await getContext();
        if (!context) {
            return { success: false, error: 'Unauthorized: No session found' };
        }

        const hasPermission = context.subAccountId
            ? await hasSubAccountPermission(context.subAccountId, 'fi.general_ledger.journal_entries.read')
            : await hasAgencyPermission(context.agencyId!, 'fi.general_ledger.journal_entries.read');

        if (!hasPermission) {
            return { success: false, error: 'Unauthorized: Missing permission to view journal entries' };
        }

        const entry = await db.journalEntry.findUnique({
            where: { id: entryId },
            include: {
                Lines: {
                    include: {
                        Account: {
                            select: { id: true, code: true, name: true, accountType: true },
                        },
                    },
                    orderBy: { lineNumber: 'asc' },
                },
                Period: {
                    select: { id: true, name: true, fiscalYear: true, fiscalPeriod: true, status: true },
                },
            },
        });

        if (!entry) {
            return { success: false, error: 'Journal entry not found' };
        }

        // Verify ownership
        const isOwner = context.subAccountId
            ? entry.subAccountId === context.subAccountId
            : entry.agencyId === context.agencyId && !entry.subAccountId;

        if (!isOwner) {
            return { success: false, error: 'Journal entry does not belong to current context' };
        }

        return { success: true, data: entry };
    } catch (error) {
        console.error('Error in getJournalEntry:', error);
        return { success: false, error: 'Failed to get journal entry' };
    }
};

/**
 * List Journal Entries
 */
export const listJournalEntries = async (filters?: {
    status?: JournalEntryStatus[];
    startDate?: Date;
    endDate?: Date;
}): Promise<ActionResult<any>> => {
    try {
        const context = await getContext();
        if (!context) {
            return { success: false, error: 'Unauthorized: No session found' };
        }

        const hasPermission = context.subAccountId
            ? await hasSubAccountPermission(context.subAccountId, 'fi.general_ledger.journal_entries.read')
            : await hasAgencyPermission(context.agencyId!, 'fi.general_ledger.journal_entries.read');

        if (!hasPermission) {
            return { success: false, error: 'Unauthorized: Missing permission to view journal entries' };
        }

        const whereClause: any = context.subAccountId
            ? { subAccountId: context.subAccountId }
            : { agencyId: context.agencyId, subAccountId: null };

        if (filters?.status && filters.status.length > 0) {
            whereClause.status = { in: filters.status };
        }

        if (filters?.startDate || filters?.endDate) {
            whereClause.entryDate = {};
            if (filters.startDate) whereClause.entryDate.gte = filters.startDate;
            if (filters.endDate) whereClause.entryDate.lte = filters.endDate;
        }

        const entries = await db.journalEntry.findMany({
            where: whereClause,
            orderBy: [
                { entryDate: 'desc' },
                { entryNumber: 'desc' },
            ],
            include: {
                Lines: {
                    include: {
                        Account: {
                            select: { id: true, code: true, name: true },
                        },
                    },
                },
                Period: {
                    select: { id: true, name: true, fiscalYear: true, fiscalPeriod: true },
                },
            },
            take: 100,
        });

        return { success: true, data: entries };
    } catch (error) {
        console.error('Error in listJournalEntries:', error);
        return { success: false, error: 'Failed to list journal entries' };
    }
};

/**
 * Get pending approvals for the current user
 */
export const getPendingApprovals = async (): Promise<ActionResult<{
    journalEntries: any[];
    counts: { journalEntries: number };
}>> => {
    try {
        const context = await getContext();
        if (!context) {
            return { success: false, error: 'Unauthorized: No session found' };
        }

        const hasPermission = context.subAccountId
            ? await hasSubAccountPermission(context.subAccountId, 'fi.general_ledger.journal_entries.approve')
            : await hasAgencyPermission(context.agencyId!, 'fi.general_ledger.journal_entries.approve');

        if (!hasPermission) {
            return { success: false, error: 'Unauthorized: Missing approval permission' };
        }

        const whereClause: any = context.subAccountId
            ? { subAccountId: context.subAccountId }
            : { agencyId: context.agencyId, subAccountId: null };

        whereClause.status = JournalEntryStatus.PENDING_APPROVAL;

        const journalEntries = await db.journalEntry.findMany({
            where: whereClause,
            orderBy: { submittedAt: 'asc' },
            include: {
                Lines: {
                    include: {
                        Account: { select: { id: true, code: true, name: true } },
                    },
                },
                Period: { select: { name: true } },
            },
            take: 50,
        });

        // Get submitter info
        const withSubmitter = await Promise.all(
            journalEntries.map(async (entry) => {
                const submitter = entry.submittedBy
                    ? await db.user.findUnique({
                          where: { id: entry.submittedBy },
                          select: { name: true, email: true },
                      })
                    : null;
                return { ...entry, submitter };
            })
        );

        return {
            success: true,
            data: {
                journalEntries: withSubmitter,
                counts: { journalEntries: journalEntries.length },
            },
        };
    } catch (error) {
        console.error('Error in getPendingApprovals:', error);
        return { success: false, error: 'Failed to get pending approvals' };
    }
};

/**
 * Create Journal Entry (Draft)
 */
export const createJournalEntry = async (
    input: CreateJournalEntryInput
): Promise<ActionResult<any>> => {
    try {
        const context = await getContext();
        if (!context) {
            return { success: false, error: 'Unauthorized: No session found' };
        }

        const hasPermission = context.subAccountId
            ? await hasSubAccountPermission(context.subAccountId, 'fi.general_ledger.journal_entries.create')
            : await hasAgencyPermission(context.agencyId!, 'fi.general_ledger.journal_entries.create');

        if (!hasPermission) {
            return { success: false, error: 'Unauthorized: Missing permission to create journal entries' };
        }

        // Validate input
        const validated = createJournalEntrySchema.safeParse(input);
        if (!validated.success) {
            return { success: false, error: validated.error.issues[0].message };
        }

        // Validate double-entry balance
        const balanceCheck = validateDoubleEntry(validated.data.lines);
        if (!balanceCheck.valid) {
            return { success: false, error: balanceCheck.message };
        }

        // Get period
        const period = await db.financialPeriod.findUnique({
            where: { id: validated.data.periodId },
        });

        if (!period) {
            return { success: false, error: 'Financial period not found' };
        }

        // Cannot post to draft periods
        if (period.status === PeriodStatus.FUTURE) {
            return { success: false, error: 'Cannot create entries in future periods' };
        }

        // Get next entry number
        const lastEntry = await db.journalEntry.findFirst({
            where: context.subAccountId
                ? { subAccountId: context.subAccountId }
                : { agencyId: context.agencyId, subAccountId: null },
            orderBy: { entryNumber: 'desc' },
            select: { entryNumber: true },
        });

        const nextNumber = lastEntry ? lastEntry.entryNumber + 1 : 1;

        // Create entry with lines in transaction
        const entry = await db.$transaction(async (tx) => {
            const created = await tx.journalEntry.create({
                data: {
                    entryNumber: `${nextNumber}`.padStart(6, '0'),
                    entryDate: validated.data.entryDate,
                    description: validated.data.description,
                    reference: validated.data.sourceReference,
                    status: JournalEntryStatus.DRAFT,
                    entryType: validated.data.entryType,
                    periodId: validated.data.periodId,
                    agencyId: context.subAccountId ? null : context.agencyId,
                    subAccountId: context.subAccountId || null,
                    createdBy: context.userId,
                    updatedBy: context.userId,
                },
                include: {
                    Lines: true,
                },
            });

            // Create journal entry lines
            for (const line of validated.data.lines) {
                await tx.journalEntryLine.create({
                    data: {
                        lineNumber: line.lineNumber,
                        journalEntryId: created.id,
                        accountId: line.accountId,
                        description: line.description || created.description,
                        debitAmount: line.debitAmount || 0,
                        creditAmount: line.creditAmount || 0,
                        taxCode: line.taxCode || null,
                        taxAmount: line.taxAmount || 0,
                        debitAmountBase: (line.debitAmount || 0) * (line.exchangeRate || 1),
                        creditAmountBase: (line.creditAmount || 0) * (line.exchangeRate || 1),
                        createdAt: new Date(),
                    }
                });
            }

            return tx.journalEntry.findUnique({
                where: { id: created.id },
                include: {
                    Lines: {
                        include: {
                            Account: true,
                        },
                    },
                },
            });
        });

        // Audit log
        await logGLAudit({
            action: 'CREATE',
            entityType: 'JournalEntry',
            entityId: entry!.id,
            agencyId: context.agencyId,
            subAccountId: context.subAccountId,
            description: `Journal entry ${entry!.entryNumber} created`,
        });

        const basePath = context.subAccountId
            ? `/subaccount/${context.subAccountId}/fi/general-ledger/journal-entries`
            : `/agency/${context.agencyId}/fi/general-ledger/journal-entries`;
        revalidatePath(basePath);

        return { success: true, data: entry };
    } catch (error) {
        console.error('Error in createJournalEntry:', error);
        return { success: false, error: 'Failed to create journal entry' };
    }
};

/**
 * Update Journal Entry (Draft only)
 */
export const updateJournalEntry = async (
    input: UpdateJournalEntryInput
): Promise<ActionResult<any>> => {
    try {
        const context = await getContext();
        if (!context) {
            return { success: false, error: 'Unauthorized: No session found' };
        }

        const hasPermission = context.subAccountId
            ? await hasSubAccountPermission(context.subAccountId, 'fi.general_ledger.journal_entries.update')
            : await hasAgencyPermission(context.agencyId!, 'fi.general_ledger.journal_entries.update');

        if (!hasPermission) {
            return { success: false, error: 'Unauthorized: Missing permission to edit journal entries' };
        }

        // Validate input
        const validated = updateJournalEntrySchema.safeParse(input);
        if (!validated.success) {
            return { success: false, error: validated.error.issues[0].message };
        }

        // Get existing entry
        const existing = await db.journalEntry.findUnique({
            where: { id: validated.data.id },
            include: { Lines: true },
        });

        if (!existing) {
            return { success: false, error: 'Journal entry not found' };
        }

        // Can only edit drafts
        if (existing.status !== JournalEntryStatus.DRAFT) {
            return { success: false, error: 'Can only edit draft journal entries' };
        }

        // Validate double-entry if lines provided
        if (validated.data.lines) {
            const balanceCheck = validateDoubleEntry(validated.data.lines);
            if (!balanceCheck.valid) {
                return { success: false, error: balanceCheck.message };
            }
        }

        // Update entry with lines in transaction
        const entry = await db.$transaction(async (tx) => {
            const { id, lines, ...updateData } = validated.data;

            // Update header
            const updated = await tx.journalEntry.update({
                where: { id },
                data: {
                    ...updateData,
                    updatedBy: context.userId,
                },
            });

            // If lines provided, replace all lines
            if (lines) {
                // Delete existing lines
                await tx.journalEntryLine.deleteMany({
                    where: { journalEntryId: id },
                });

                // Create new lines
                for (const line of lines) {
                    await tx.journalEntryLine.create({
                        data: {
                            journalEntryId: id,
                            accountId: line.accountId,
                            description: line.description || updated.description,
                            debitAmount: line.debitAmount || 0,
                            creditAmount: line.creditAmount || 0,
                            taxCode: line.taxCode || null,
                            taxAmount: line.taxAmount || 0,
                            exchangeRate: line.exchangeRate || 1,
                            creditAmountBase: (line.creditAmount || 0) * (line.exchangeRate || 1),
                            debitAmountBase: (line.debitAmount || 0) * (line.exchangeRate || 1),
                            lineNumber: line.lineNumber,
                            createdAt: new Date(),

                        },
                    });
                }
            }

            return tx.journalEntry.findUnique({
                where: { id },
                include: {
                    Lines: {
                        include: {
                            Account: true,
                        },
                    },
                },
            });
        });

        // Audit log
        await logGLAudit({
            action: 'UPDATE',
            entityType: 'JournalEntry',
            entityId: entry!.id,
            agencyId: context.agencyId,
            subAccountId: context.subAccountId,
            description: `Journal entry ${entry!.entryNumber} updated`,
            previousValues: existing,
            newValues: entry,
        });

        const basePath = context.subAccountId
            ? `/subaccount/${context.subAccountId}/fi/general-ledger/journal-entries`
            : `/agency/${context.agencyId}/fi/general-ledger/journal-entries`;
        revalidatePath(basePath);

        return { success: true, data: entry };
    } catch (error) {
        console.error('Error in updateJournalEntry:', error);
        return { success: false, error: 'Failed to update journal entry' };
    }
};

/**
 * Submit Journal Entry for Approval
 */
export const submitJournalEntry = async (entryId: string): Promise<ActionResult<any>> => {
    try {
        const context = await getContext();
        if (!context) {
            return { success: false, error: 'Unauthorized: No session found' };
        }

        const hasPermission = context.subAccountId
            ? await hasSubAccountPermission(context.subAccountId, 'fi.general_ledger.journal_entries.submit')
            : await hasAgencyPermission(context.agencyId!, 'fi.general_ledger.journal_entries.submit');

        if (!hasPermission) {
            return { success: false, error: 'Unauthorized: Missing permission to submit journal entries' };
        }

        // Get entry
        const entry = await db.journalEntry.findUnique({
            where: { id: entryId },
            include: { Lines: true },
        });

        if (!entry) {
            return { success: false, error: 'Journal entry not found' };
        }

        if (entry.status !== JournalEntryStatus.DRAFT) {
            return { success: false, error: 'Can only submit draft journal entries' };
        }

        // Validate double-entry
        const balanceCheck = validateDoubleEntry(entry.Lines.map(line => ({
            debitAmount: line.debitAmount.toNumber(),
            creditAmount: line.creditAmount.toNumber(),
        })));
        if (!balanceCheck.valid) {
            return { success: false, error: balanceCheck.message };
        }

        // Submit entry
        const updated = await db.journalEntry.update({
            where: { id: entryId },
            data: {
                status: JournalEntryStatus.PENDING_APPROVAL,
                submittedAt: new Date(),
                submittedBy: context.userId,
                updatedBy: context.userId,
            },
        });

        // Audit log
        await logGLAudit({
            action: 'UPDATE',
            entityType: 'JournalEntry',
            entityId: entryId,
            agencyId: context.agencyId,
            subAccountId: context.subAccountId,
            description: `Journal entry ${entry.entryNumber} submitted for approval`,
        });

        const basePath = context.subAccountId
            ? `/subaccount/${context.subAccountId}/fi/general-ledger/journal-entries`
            : `/agency/${context.agencyId}/fi/general-ledger/journal-entries`;
        revalidatePath(basePath);

        return { success: true, data: updated };
    } catch (error) {
        console.error('Error in submitJournalEntry:', error);
        return { success: false, error: 'Failed to submit journal entry' };
    }
};

/**
 * Approve and Post Journal Entry
 */
export const approveJournalEntry = async (
    entryId: string,
    notes?: string
): Promise<ActionResult<any>> => {
    try {
        const context = await getContext();
        if (!context) {
            return { success: false, error: 'Unauthorized: No session found' };
        }

        const hasPermission = context.subAccountId
            ? await hasSubAccountPermission(context.subAccountId, 'fi.general_ledger.journal_entries.approve')
            : await hasAgencyPermission(context.agencyId!, 'fi.general_ledger.journal_entries.approve');

        if (!hasPermission) {
            return { success: false, error: 'Unauthorized: Missing permission to approve journal entries' };
        }

        // Get entry with account details for control account check
        const entry = await db.journalEntry.findUnique({
            where: { id: entryId },
            include: {
                Lines: {
                    include: {
                        Account: {
                            select: {
                                id: true,
                                isControlAccount: true,
                                accountType: true,
                            },
                        },
                    },
                },
                Period: true,
            },
        });

        if (!entry) {
            return { success: false, error: 'Journal entry not found' };
        }

        if (entry.status !== JournalEntryStatus.PENDING_APPROVAL) {
            return { success: false, error: 'Can only approve entries pending approval' };
        }

        // Check period is open
        if (entry.Period.status !== PeriodStatus.OPEN) {
            return { success: false, error: 'Cannot post to closed or locked periods' };
        }

        // Get GL configuration for currency
        let baseCurrency = 'MYR';
        if (context.subAccountId) {
            const subConfig = await db.gLConfigurationSubAccount.findUnique({
                where: { subAccountId: context.subAccountId },
                select: { baseCurrency: true },
            });
            if (subConfig?.baseCurrency) baseCurrency = subConfig.baseCurrency;
        } else if (context.agencyId) {
            const agencyConfig = await db.gLConfiguration.findUnique({
                where: { agencyId: context.agencyId },
                select: { baseCurrency: true },
            });
            if (agencyConfig?.baseCurrency) baseCurrency = agencyConfig.baseCurrency;
        }

        // Post entry and update balances
        const updated = await db.$transaction(async (tx) => {
            // Mark as approved
            const approved = await tx.journalEntry.update({
                where: { id: entryId },
                data: {
                    status: JournalEntryStatus.APPROVED,
                    approvedAt: new Date(),
                    approvedBy: context.userId,
                    notes: notes,
                    updatedBy: context.userId,
                },
            });

            // Update account balances
            await updateAccountBalances(
                tx,
                entry.periodId,
                entry.Lines.map(line => ({
                    accountId: line.accountId,
                    debitAmount: line.debitAmount.toNumber(),
                    creditAmount: line.creditAmount.toNumber(),
                    currency: 'USD', // Assuming USD, adjust as needed
                })),
                context.userId,
                context
            );

            // Create OpenItems for control account lines (AR, AP, Bank reconciliation)
            const controlAccountLines = entry.Lines.filter(line => line.Account?.isControlAccount === true);
            
            for (const line of controlAccountLines) {
                const debit = new Decimal(line.debitAmount.toString()).toNumber();
                const credit = new Decimal(line.creditAmount.toString()).toNumber();
                const netAmount = debit - credit; // Positive = debit, Negative = credit

                await tx.openItem.create({
                    data: {
                        agencyId: context.agencyId!,
                        subAccountId: context.subAccountId,
                        accountId: line.accountId,
                        journalEntryId: entry.id,
                        journalLineId: line.id,
                        sourceModule: entry.sourceModule,
                        sourceId: entry.id,
                        sourceReference: entry.entryNumber,
                        reference: entry.reference || undefined,
                        assignment: line.subledgerReference || undefined,
                        text: line.description || entry.description,
                        itemDate: entry.entryDate,
                        itemType: 'JOURNAL',
                        dueDate: entry.entryDate, // Default due date, can be overridden
                        localCurrencyCode: baseCurrency,
                        localAmount: netAmount,
                        localRemainingAmount: netAmount,
                        documentCurrencyCode: entry.currencyCode || baseCurrency,
                        documentAmount: netAmount,
                        documentRemainingAmount: netAmount,
                        exchangeRate: entry.exchangeRate?.toNumber() || 1,
                        status: 'OPEN',
                        createdBy: context.userId,
                    },
                });
            }

            return approved;
        });

        // Audit log
        await logGLAudit({
            action: 'UPDATE',
            entityType: 'JournalEntry',
            entityId: entryId,
            agencyId: context.agencyId,
            subAccountId: context.subAccountId,
            description: `Journal entry ${entry.entryNumber} approved and posted`,
        });

        const basePath = context.subAccountId
            ? `/subaccount/${context.subAccountId}/fi/general-ledger/journal-entries`
            : `/agency/${context.agencyId}/fi/general-ledger/journal-entries`;
        revalidatePath(basePath);

        return { success: true, data: updated };
    } catch (error) {
        console.error('Error in approveJournalEntry:', error);
        return { success: false, error: 'Failed to approve journal entry' };
    }
};

/**
 * Reject Journal Entry
 */
export const rejectJournalEntry = async (
    entryId: string,
    reason: string
): Promise<ActionResult<any>> => {
    try {
        const context = await getContext();
        if (!context) {
            return { success: false, error: 'Unauthorized: No session found' };
        }

        const hasPermission = context.subAccountId
            ? await hasSubAccountPermission(context.subAccountId, 'fi.general_ledger.journal_entries.reject')
            : await hasAgencyPermission(context.agencyId!, 'fi.general_ledger.journal_entries.reject');

        if (!hasPermission) {
            return { success: false, error: 'Unauthorized: Missing permission to reject journal entries' };
        }

        // Get entry
        const entry = await db.journalEntry.findUnique({
            where: { id: entryId },
        });

        if (!entry) {
            return { success: false, error: 'Journal entry not found' };
        }

        if (entry.status !== JournalEntryStatus.PENDING_APPROVAL) {
            return { success: false, error: 'Can only reject entries pending approval' };
        }

        // Reject entry
        const updated = await db.journalEntry.update({
            where: { id: entryId },
            data: {
                status: JournalEntryStatus.REJECTED,
                rejectedAt: new Date(),
                rejectedBy: context.userId,
                rejectionReason: reason,
                updatedBy: context.userId,
            },
        });

        // Audit log
        await logGLAudit({
            action: 'UPDATE',
            entityType: 'JournalEntry',
            entityId: entryId,
            agencyId: context.agencyId,
            subAccountId: context.subAccountId,
            description: `Journal entry ${entry.entryNumber} rejected`,
            reason,
        });

        const basePath = context.subAccountId
            ? `/subaccount/${context.subAccountId}/fi/general-ledger/journal-entries`
            : `/agency/${context.agencyId}/fi/general-ledger/journal-entries`;
        revalidatePath(basePath);

        return { success: true, data: updated };
    } catch (error) {
        console.error('Error in rejectJournalEntry:', error);
        return { success: false, error: 'Failed to reject journal entry' };
    }
};

/**
 * Reverse Journal Entry
 */
export const reverseJournalEntry = async (
    entryId: string,
    reason: string,
    reversalDate: Date
): Promise<ActionResult<any>> => {
    try {
        const context = await getContext();
        if (!context) {
            return { success: false, error: 'Unauthorized: No session found' };
        }

        const hasPermission = context.subAccountId
            ? await hasSubAccountPermission(context.subAccountId, 'fi.general_ledger.journal_entries.reverse')
            : await hasAgencyPermission(context.agencyId!, 'fi.general_ledger.journal_entries.reverse');

        if (!hasPermission) {
            return { success: false, error: 'Unauthorized: Missing permission to reverse journal entries' };
        }

        // Get entry
        const entry = await db.journalEntry.findUnique({
            where: { id: entryId },
            include: { Lines: true, Period: true },
        });

        if (!entry) {
            return { success: false, error: 'Journal entry not found' };
        }

        if (entry.status !== JournalEntryStatus.APPROVED) {
            return { success: false, error: 'Can only reverse approved journal entries' };
        }

        if (entry.isReversal) {
            return { success: false, error: 'Entry has already been reversed' };
        }

        // Get reversal period
        const reversalPeriod = await db.financialPeriod.findFirst({
            where: context.subAccountId
                ? {
                    subAccountId: context.subAccountId,
                    startDate: { lte: reversalDate },
                    endDate: { gte: reversalDate },
                }
                : {
                    agencyId: context.agencyId,
                    subAccountId: null,
                    startDate: { lte: reversalDate },
                    endDate: { gte: reversalDate },
                },
        });

        if (!reversalPeriod) {
            return { success: false, error: 'No open period found for reversal date' };
        }

        if (reversalPeriod.status !== PeriodStatus.OPEN) {
            return { success: false, error: 'Reversal period must be open' };
        }

        // Get next entry number
        const lastEntry = await db.journalEntry.findFirst({
            where: context.subAccountId
                ? { subAccountId: context.subAccountId }
                : { agencyId: context.agencyId, subAccountId: null },
            orderBy: { entryNumber: 'desc' },
            select: { entryNumber: true },
        });

        const nextNumber = lastEntry ? parseInt(lastEntry.entryNumber, 10) + 1 : 1;

        // Create reversing entry
        const reversal = await db.$transaction(async (tx) => {
            // Create reversing entry
            const reversalEntry = await tx.journalEntry.create({
                data: {
                    entryNumber: `${nextNumber}`.padStart(6, '0'),
                    entryDate: reversalDate,
                    description: `Reversal of JE ${entry.entryNumber}: ${entry.description}`,
                    reference: entry.reference,
                    status: JournalEntryStatus.APPROVED,
                    entryType: entry.entryType,
                    periodId: reversalPeriod.id,
                    isReversal: true,
                    reversalOfId: entry.id,
                    agencyId: context.subAccountId ? null : context.agencyId,
                    subAccountId: context.subAccountId || null,
                    createdBy: context.userId,
                    updatedBy: context.userId,
                    approvedAt: new Date(),
                    approvedBy: context.userId,
                },
            });

            // Create reversing lines (swap debit/credit)
            for (const line of entry.Lines) {
                await tx.journalEntryLine.create({
                    data: {
                        journalEntryId: reversalEntry.id,
                        accountId: line.accountId,
                        description: line.description,
                        debitAmount: line.creditAmount.toNumber(), // Swap
                        creditAmount: line.debitAmount.toNumber(), // Swap 
                        exchangeRate: line.exchangeRate,
                        debitAmountBase: line.debitAmountBase.toNumber(), // Swap
                        creditAmountBase: line.creditAmountBase.toNumber(), // Swap
                        createdAt: new Date(),
                        lineNumber: line.lineNumber,
                    },
                });
            }

            // Mark original as reversed
            await tx.journalEntry.update({
                where: { id: entryId },
                data: {
                    isReversal: true,
                    reversedAt: new Date(),
                    reversedByUser: context.userId,

                },
            });

            // Update account balances for reversal period
            const reversalLines = entry.Lines.map((line) => ({
                accountId: line.accountId,
                debitAmount: line.creditAmount, // Swapped
                creditAmount: line.debitAmount, // Swapped
                currency: 'USD'
            }));

            await updateAccountBalances(
                tx,
                reversalPeriod.id,
                reversalLines.map(line => ({
                    ...line,
                    debitAmount: line.debitAmount.toNumber(),
                    creditAmount: line.creditAmount.toNumber(),
                })),
                context.userId,
                context
            );

            return reversalEntry;
        });

        // Audit log
        await logGLAudit({
            action: 'CREATE',
            entityType: 'JournalEntry',
            entityId: reversal.id,
            agencyId: context.agencyId,
            subAccountId: context.subAccountId,
            description: `Reversal entry ${reversal.entryNumber} created for JE ${entry.entryNumber}`,
            reason,
        });

        const basePath = context.subAccountId
            ? `/subaccount/${context.subAccountId}/fi/general-ledger/journal-entries`
            : `/agency/${context.agencyId}/fi/general-ledger/journal-entries`;
        revalidatePath(basePath);

        return { success: true, data: reversal };
    } catch (error) {
        console.error('Error in reverseJournalEntry:', error);
        return { success: false, error: 'Failed to reverse journal entry' };
    }
};
