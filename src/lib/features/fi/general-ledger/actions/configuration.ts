/**
 * GL Configuration Server Actions
 * FI-GL Module - Configuration management actions
 */

'use server';

import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import {
    glConfigurationSchema,
    updateGLConfigurationSchema,
    type GLConfigurationInput,
    type UpdateGLConfigurationInput
} from '@/lib/schemas/fi/general-ledger/configuration';
import { logGLAudit } from './audit';
import { ConsolidationMethod } from '../../../../../generated/prisma/enums';
import { getActionContext, hasContextPermission, type ActionContext } from '@/lib/features/iam/authz/action-context';

type ActionResult<T> = {
    success: boolean
    data?: T
    error?: string
}

type ConfigContext = ActionContext



const getContext = getActionContext
const checkPermission = hasContextPermission

/**
 * Get GL Configuration for an agency
 */

export const getGLConfiguration = async (): Promise<ActionResult<any>> => {
    try {
        const context = await getContext()
        if (!context) {
            return { success: false, error: 'Unauthorized: No session found' }
        }

        if (!context.agencyId) {
            return { success: false, error: 'Agency context required' }
        }

        const hasPermission = await checkPermission(context, 'fi.general_ledger.settings.view')
        if (!hasPermission) {
            return { success: false, error: 'Unauthorized: Missing permission' }
        }

        let config = await db.gLConfiguration.findFirst({
            where: { agencyId: context.agencyId },
        })

        // If no config exists, return defaults
        if (!config) {
            config = {
                id: '',
                agencyId: context.agencyId ?? null,
                subAccountId: context.subAccountId ?? null,
                baseCurrency: 'USD',
                fiscalYearEnd: '12-31',
                fiscalYearStart: '01-01',
                useControlAccounts: true,
                requireApproval: true,
                autoPostingEnabled: false,
                allowFuturePeriodPost: false,
                allowClosedPeriodPost: false,
                consolidationMethod: ConsolidationMethod.FULL,
                eliminateIntercompany: true,
                autoCreatePeriods: true,
                periodLockDays: 5,
                accountCodeFormat: '####-####',
                accountCodeLength: 8,
                erpIntegrationEnabled: false,
                erpSystemType: null,
                erpApiUrl: null,
                erpApiKey: null,
                retainAuditDays: 2555,
                createdAt: new Date(),
                updatedAt: new Date(),
                updatedBy: null,
            } as any
        }

        return { success: true, data: config }
    } catch (error) {
        console.error('Error fetching GL configuration:', error)
        return { success: false, error: 'Failed to fetch GL configuration' }
    }
}

/**
 * Initialize GL Configuration for an agency (first-time setup)
 */
export const initializeGLConfiguration = async (
    input: GLConfigurationInput
): Promise<ActionResult<{ id: string }>> => {
    try {
        const context = await getContext()
        if (!context) {
            return { success: false, error: 'Unauthorized: No session found' }
        }

        if (!context.agencyId) {
            return { success: false, error: 'Agency context required' }
        }

        const hasPermission = await checkPermission(context, 'fi.general_ledger.settings.manage')
        if (!hasPermission) {
            return { success: false, error: 'Unauthorized: Missing permission' }
        }

        const validated = glConfigurationSchema.safeParse(input)
        if (!validated.success) {
            return { success: false, error: validated.error.message }
        }

        const data = validated.data

        // Check if config already exists
        const existing = await db.gLConfiguration.findFirst({
            where: { agencyId: context.agencyId },
        })

        if (existing) {
            return { success: false, error: 'GL configuration already exists. Use update instead.' }
        }

        const config = await db.gLConfiguration.create({
            data: {
                ...data,
                agencyId: context.agencyId ?? null,
                updatedBy: context.userId,
            },
        })

        await logGLAudit({
            action: 'CREATE',
            entityType: 'GLConfiguration',
            entityId: config.id,
            agencyId: context.agencyId,
            subAccountId: context.subAccountId,
            description: 'Initialized GL configuration',
        })

        revalidatePath(`/agency/${context.agencyId}/fi/general-ledger/settings`)

        return { success: true, data: { id: config.id } }
    } catch (error) {
        console.error('Error initializing GL configuration:', error)
        return { success: false, error: 'Failed to initialize GL configuration' }
    }
}


/**
 * Update GL Configuration
 */

export const updateGLConfiguration = async (
    input: UpdateGLConfigurationInput
): Promise<ActionResult<void>> => {
    try {
        const context = await getContext()
        if (!context) {
            return { success: false, error: 'Unauthorized: No session found' }
        }

        const hasPermission = await checkPermission(context, 'fi.general_ledger.settings.manage')
        if (!hasPermission) {
            return { success: false, error: 'Unauthorized: Missing permission' }
        }

        const validated = updateGLConfigurationSchema.safeParse(input)
        if (!validated.success) {
            return { success: false, error: validated.error.issues[0].message }
        }

        const data = validated.data

        // Get existing config
        let config = await db.gLConfiguration.findFirst({
            where: context.subAccountId
                ? { Agency: { SubAccount: { some: { id: context.subAccountId } } } }
                : { agencyId: context.agencyId },
        })

        const previousValues = config ? { ...config } : null

        if (config) {
            // Update existing
            await db.gLConfiguration.update({
                where: { id: config.id },
                data: {
                    ...data,
                    updatedBy: context.userId,
                },
            })
        } else {
            // Create new with defaults merged
            config = await db.gLConfiguration.create({
                data: {
                    baseCurrency: 'USD',
                    fiscalYearEnd: '12-31',
                    fiscalYearStart: '01-01',
                    useControlAccounts: true,
                    requireApproval: true,
                    autoPostingEnabled: false,
                    allowFuturePeriodPost: false,
                    allowClosedPeriodPost: false,
                    consolidationMethod: ConsolidationMethod.FULL,
                    eliminateIntercompany: true,
                    autoCreatePeriods: true,
                    periodLockDays: 5,
                    accountCodeFormat: '####-####',
                    accountCodeLength: 8,
                    retainAuditDays: 2555,
                    ...data,
                    agencyId: context.agencyId || '',
                    ...context.subAccountId ? { subAccountId: context.subAccountId } : {},
                    updatedBy: context.userId,
                },
            })
        }

        await logGLAudit({
            action: 'UPDATE',
            entityType: 'GLConfiguration',
            entityId: config.id,
            agencyId: context.agencyId,
            subAccountId: context.subAccountId,
            previousValues: previousValues as any,
            newValues: data as any,
            description: 'Updated GL configuration',
        })

        revalidatePath(`/agency/${context.agencyId}/finance/gl/settings`)

        return { success: true }
    } catch (error) {
        console.error('Error updating GL configuration:', error)
        return { success: false, error: 'Failed to update GL configuration' }
    }
}

/**
 * Create GL Configuration for an agency (first-time setup)
 */
export const createGLConfiguration = async (
    input: GLConfigurationInput
): Promise<ActionResult<any>> => {
    try {
        const context = await getContext();
        if (!context) {
            return { success: false, error: 'Unauthorized: No session found' };
        }

        if (!context.agencyId) {
            return { success: false, error: 'Agency context required' };
        }

        // Check permission
        const hasPermission = await checkPermission(context, 'fi.general_ledger.settings.manage');
        if (!hasPermission) {
            return { success: false, error: 'Unauthorized: Missing permission to edit GL settings' };
        }

        // Validate input
        const validated = glConfigurationSchema.safeParse(input);
        if (!validated.success) {
            return { success: false, error: validated.error.issues[0].message };
        }

        // Check if configuration already exists
        const existing = await db.gLConfiguration.findUnique({
            where: { agencyId: context.agencyId },
        });

        if (existing) {
            return { success: false, error: 'GL configuration already exists. Use update instead.' };
        }

        // Create configuration
        const config = await db.gLConfiguration.create({
            data: {
                ...validated.data,
                agencyId: context.agencyId,
                updatedBy: context.userId,
            },
        });

        // Audit log
        await logGLAudit({
            action: 'CREATE',
            entityType: 'GLConfiguration',
            entityId: config.id,
            agencyId: context.agencyId,
            description: 'GL Configuration created',
        });

        revalidatePath(`/agency/${context.agencyId}/fi/general-ledger`);

        return { success: true, data: config };
    } catch (error) {
        console.error('Error in createGLConfiguration:', error);
        return { success: false, error: 'Failed to create GL configuration' };
    }
};


/**
 * Initialize GL module for an agency (creates default configuration + system accounts)
 */
export const initializeGLModule = async (): Promise<ActionResult<any>> => {
    try {
        const context = await getContext();
        if (!context) {
            return { success: false, error: 'Unauthorized: No session found' };
        }

        if (!context.agencyId) {
            return { success: false, error: 'Agency context required' };
        }

        // Check permission
        const hasPermission = await checkPermission(context, 'fi.general_ledger.settings.manage');
        if (!hasPermission) {
            return { success: false, error: 'Unauthorized: Missing permission to initialize GL module' };
        }

        // Check if already initialized
        const existing = await db.gLConfiguration.findUnique({
            where: { agencyId: context.agencyId },
        });

        if (existing) {
            return { success: false, error: 'GL module already initialized for this agency' };
        }

        // Create default configuration
        const config = await db.gLConfiguration.create({
            data: {
                agencyId: context.agencyId,
                baseCurrency: 'USD',
                fiscalYearEnd: '12-31',
                fiscalYearStart: '01-01',
                useControlAccounts: true,
                requireApproval: true,
                autoPostingEnabled: false,
                allowFuturePeriodPost: false,
                allowClosedPeriodPost: false,
                consolidationEnabled: false,
                consolidationMethod: 'FULL',
                eliminateIntercompany: true,
                autoCreatePeriods: true,
                periodLockDays: 5,
                accountCodeFormat: '####-####',
                accountCodeLength: 8,
                accountCodeSeparator: '-',
                retainAuditDays: 2555,
                updatedBy: context.userId,
            },
        });

        // Create system accounts (retained earnings, suspense, etc.)
        const systemAccounts = await createSystemAccounts(context.agencyId, context.userId);

        // Audit log
        await logGLAudit({
            action: 'CREATE',
            entityType: 'GLConfiguration',
            entityId: config.id,
            agencyId: context.agencyId,
            description: 'GL Module initialized with default configuration and system accounts',
        });

        revalidatePath(`/agency/${context.agencyId}/fi/general-ledger`);

        return {
            success: true,
            data: {
                configuration: config,
                systemAccounts
            }
        };
    } catch (error) {
        console.error('Error in initializeGLModule:', error);
        return { success: false, error: 'Failed to initialize GL module' };
    }
};

/**
 * Helper: Create system accounts
 */
async function createSystemAccounts(agencyId: string, userId: string) {
    const systemAccountsData = [
        {
            code: '9999-0000',
            name: 'Retained Earnings',
            accountType: 'EQUITY' as const,
            category: 'RETAINED_EARNINGS_CAT' as const,
            isSystemAccount: true,
            isSystemManaged: true,
            systemAccountType: 'RETAINED_EARNINGS' as const,
            normalBalance: 'CREDIT',
            allowManualPosting: false,
        },
        {
            code: '9999-9999',
            name: 'Suspense Account',
            accountType: 'ASSET' as const,
            category: 'CURRENT_ASSET' as const,
            isSystemAccount: true,
            systemAccountType: 'SUSPENSE' as const,
            isSuspenseAccount: true,
            normalBalance: 'DEBIT',
            allowManualPosting: true,
        },
        {
            code: '9999-9998',
            name: 'Opening Balance Control',
            accountType: 'EQUITY' as const,
            isSystemAccount: true,
            isSystemManaged: true,
            systemAccountType: 'OPENING_BALANCE_CONTROL' as const,
            isOpeningBalControl: true,
            normalBalance: 'CREDIT',
            allowManualPosting: false,
        },
    ];

    const accounts = await db.$transaction(
        systemAccountsData.map((account) =>
            db.chartOfAccount.create({
                data: {
                    ...account,
                    agencyId,
                    createdBy: userId,
                    updatedBy: userId,
                    path: `/${account.code}/`,
                    level: 0,
                },
            })
        )
    );

    return accounts;
}

// ========== Specific Setting Updates ==========

/**
 * Update base currency (only allowed if no posted transactions exist)
 */
export const updateBaseCurrency = async (
    currencyCode: string
): Promise<ActionResult<void>> => {
    try {
        const context = await getContext()
        if (!context) {
            return { success: false, error: 'Unauthorized: No session found' }
        }

        const hasPermission = await checkPermission(context, 'fi.general_ledger.settings.manage')
        if (!hasPermission) {
            return { success: false, error: 'Unauthorized: Missing permission' }
        }

        // Validate currency code format
        if (!/^[A-Z]{3}$/.test(currencyCode)) {
            return { success: false, error: 'Invalid currency code format. Must be 3 uppercase letters.' }
        }

        // Check if any transactions exist (can't change base currency after transactions)
        const transactionCount = await db.journalEntry.count({
            where: {
                ...(context.subAccountId
                    ? { subAccountId: context.subAccountId }
                    : { agencyId: context.agencyId, subAccountId: null }),
                status: 'POSTED',
            },
        })

        if (transactionCount > 0) {
            return {
                success: false,
                error: 'Cannot change base currency after transactions have been posted',
            }
        }

        await updateGLConfiguration({ baseCurrency: currencyCode })

        return { success: true }
    } catch (error) {
        console.error('Error updating base currency:', error)
        return { success: false, error: 'Failed to update base currency' }
    }
}

/**
 * Update fiscal year settings
 */
export const updateFiscalYear = async (
    fiscalYearStart: string,
    fiscalYearEnd: string
): Promise<ActionResult<void>> => {
    try {
        const context = await getContext();
        if (!context) {
            return { success: false, error: 'Unauthorized: No session found' };
        }

        if (!context.agencyId) {
            return { success: false, error: 'Agency context required' };
        }

        const hasPermission = await checkPermission(context, 'fi.general_ledger.settings.manage');
        if (!hasPermission) {
            return { success: false, error: 'Unauthorized: Missing permission' };
        }

        // Validate date format (MM-DD)
        const dateRegex = /^(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
        if (!dateRegex.test(fiscalYearStart) || !dateRegex.test(fiscalYearEnd)) {
            return { success: false, error: 'Invalid date format. Use MM-DD format (e.g., 01-01, 12-31).' };
        }

        await updateGLConfiguration({ fiscalYearStart, fiscalYearEnd });

        await logGLAudit({
            action: 'UPDATE',
            entityType: 'GLConfiguration',
            entityId: context.agencyId,
            agencyId: context.agencyId,
            description: `Updated fiscal year: ${fiscalYearStart} to ${fiscalYearEnd}`,
        });

        return { success: true };
    } catch (error) {
        console.error('Error updating fiscal year:', error);
        return { success: false, error: 'Failed to update fiscal year' };
    }
};

/**
 * Update approval workflow settings
 */
export const updateApprovalSettings = async (input: {
    requireApproval: boolean;
    autoPostingEnabled: boolean;
    allowFuturePeriodPost: boolean;
    allowClosedPeriodPost: boolean;
}): Promise<ActionResult<void>> => {
    try {
        const context = await getContext();
        if (!context) {
            return { success: false, error: 'Unauthorized: No session found' };
        }

        if (!context.agencyId) {
            return { success: false, error: 'Agency context required' };
        }

        const hasPermission = await checkPermission(context, 'fi.general_ledger.settings.manage');
        if (!hasPermission) {
            return { success: false, error: 'Unauthorized: Missing permission' };
        }

        await updateGLConfiguration(input);

        await logGLAudit({
            action: 'UPDATE',
            entityType: 'GLConfiguration',
            entityId: context.agencyId,
            agencyId: context.agencyId,
            description: 'Updated approval settings',
            newValues: input,
        });

        return { success: true };
    } catch (error) {
        console.error('Error updating approval settings:', error);
        return { success: false, error: 'Failed to update approval settings' };
    }
};

/**
 * Update consolidation settings (agency-level only)
 */
export const updateConsolidationSettings = async (input: {
    consolidationEnabled?: boolean;
    consolidationMethod?: ConsolidationMethod;
    eliminateIntercompany?: boolean;
}): Promise<ActionResult<void>> => {
    try {
        const context = await getContext();
        if (!context) {
            return { success: false, error: 'Unauthorized: No session found' };
        }

        if (!context.agencyId) {
            return { success: false, error: 'Agency context required' };
        }

        // Only agency level can update consolidation settings
        if (context.subAccountId) {
            return { success: false, error: 'Consolidation settings can only be configured at agency level' };
        }

        const hasPermission = await checkPermission(context, 'fi.general_ledger.settings.manage');
        if (!hasPermission) {
            return { success: false, error: 'Unauthorized: Missing permission' };
        }

        await updateGLConfiguration(input);

        await logGLAudit({
            action: 'UPDATE',
            entityType: 'GLConfiguration',
            entityId: context.agencyId,
            agencyId: context.agencyId,
            description: 'Updated consolidation settings',
            newValues: input,
        });

        return { success: true };
    } catch (error) {
        console.error('Error updating consolidation settings:', error);
        return { success: false, error: 'Failed to update consolidation settings' };
    }
};

/**
 * Update account code format (only allowed if no accounts exist)
 */
export const updateAccountCodeFormat = async (input: {
    accountCodeFormat: string;
    accountCodeLength: number;
    accountCodeSeparator?: string;
}): Promise<ActionResult<void>> => {
    try {
        const context = await getContext();
        if (!context) {
            return { success: false, error: 'Unauthorized: No session found' };
        }

        if (!context.agencyId) {
            return { success: false, error: 'Agency context required' };
        }

        const hasPermission = await checkPermission(context, 'fi.general_ledger.settings.manage');
        if (!hasPermission) {
            return { success: false, error: 'Unauthorized: Missing permission' };
        }

        // Validate format contains only valid characters (# for digits, - or . as separators)
        if (!/^[#\-\.]+$/.test(input.accountCodeFormat)) {
            return {
                success: false,
                error: 'Invalid account code format. Use # for digits and - or . as separators.',
            };
        }

        // Validate length matches format
        const digitCount = (input.accountCodeFormat.match(/#/g) || []).length;
        if (digitCount !== input.accountCodeLength) {
            return {
                success: false,
                error: `Account code length (${input.accountCodeLength}) must match format digit count (${digitCount})`,
            };
        }

        // Check if any non-system accounts exist (can't change format after accounts created)
        const accountCount = await db.chartOfAccount.count({
            where: {
                agencyId: context.agencyId,
                isSystemAccount: false,
            },
        });

        if (accountCount > 0) {
            return {
                success: false,
                error: 'Cannot change account code format after accounts have been created',
            };
        }

        await updateGLConfiguration(input);

        await logGLAudit({
            action: 'UPDATE',
            entityType: 'GLConfiguration',
            entityId: context.agencyId,
            agencyId: context.agencyId,
            description: `Updated account code format to ${input.accountCodeFormat}`,
            newValues: input,
        });

        return { success: true };
    } catch (error) {
        console.error('Error updating account code format:', error);
        return { success: false, error: 'Failed to update account code format' };
    }
};

/**
 * Update ERP integration settings
 */
export const updateERPIntegration = async (input: {
    erpIntegrationEnabled: boolean;
    erpSystemType?: string | null;
    erpApiUrl?: string | null;
    erpApiKey?: string | null;
}): Promise<ActionResult<void>> => {
    try {
        const context = await getContext();
        if (!context) {
            return { success: false, error: 'Unauthorized: No session found' };
        }

        if (!context.agencyId) {
            return { success: false, error: 'Agency context required' };
        }

        const hasPermission = await checkPermission(context, 'fi.general_ledger.settings.manage');
        if (!hasPermission) {
            return { success: false, error: 'Unauthorized: Missing permission' };
        }

        // If enabling, validate required fields
        if (input.erpIntegrationEnabled) {
            if (!input.erpSystemType) {
                return { success: false, error: 'ERP system type is required when enabling integration' };
            }
            if (!input.erpApiUrl) {
                return { success: false, error: 'ERP API URL is required when enabling integration' };
            }
        }

        await updateGLConfiguration(input);

        await logGLAudit({
            action: 'UPDATE',
            entityType: 'GLConfiguration',
            entityId: context.agencyId,
            agencyId: context.agencyId,
            description: input.erpIntegrationEnabled
                ? `Enabled ERP integration with ${input.erpSystemType}`
                : 'Disabled ERP integration',
        });

        return { success: true };
    } catch (error) {
        console.error('Error updating ERP integration:', error);
        return { success: false, error: 'Failed to update ERP integration' };
    }
};

// ========== Configuration Status ==========

/**
 * Get GL module setup status (for setup wizard)
 */
export const getGLSetupStatus = async (): Promise<ActionResult<{
    isConfigured: boolean;
    hasAccounts: boolean;
    hasPeriods: boolean;
    hasSystemAccounts: boolean;
    setupSteps: {
        step: string;
        completed: boolean;
        description: string;
    }[];
}>> => {
    try {
        const context = await getContext();
        if (!context) {
            return { success: false, error: 'Unauthorized: No session found' };
        }

        if (!context.agencyId) {
            return { success: false, error: 'Agency context required' };
        }

        const whereClause = { agencyId: context.agencyId };

        const [config, accountCount, periodCount, systemAccountCount] = await Promise.all([
            db.gLConfiguration.findFirst({ where: whereClause }),
            db.chartOfAccount.count({ where: whereClause }),
            db.financialPeriod.count({ where: whereClause }),
            db.chartOfAccount.count({
                where: {
                    ...whereClause,
                    isSystemAccount: true,
                },
            }),
        ]);

        const isConfigured = !!config;
        const hasAccounts = accountCount > 0;
        const hasPeriods = periodCount > 0;
        const hasSystemAccounts = systemAccountCount >= 3; // Minimum 3 system accounts (Retained Earnings, Suspense, Opening Balance)

        const setupSteps = [
            {
                step: 'configuration',
                completed: isConfigured,
                description: 'Configure GL settings (base currency, fiscal year, etc.)',
            },
            {
                step: 'system-accounts',
                completed: hasSystemAccounts,
                description: 'Create required system accounts (Retained Earnings, Suspense, etc.)',
            },
            {
                step: 'chart-of-accounts',
                completed: hasAccounts && accountCount > systemAccountCount,
                description: 'Set up Chart of Accounts',
            },
            {
                step: 'financial-periods',
                completed: hasPeriods,
                description: 'Create financial periods',
            },
        ];

        return {
            success: true,
            data: {
                isConfigured,
                hasAccounts,
                hasPeriods,
                hasSystemAccounts,
                setupSteps,
            },
        };
    } catch (error) {
        console.error('Error fetching GL setup status:', error);
        return { success: false, error: 'Failed to fetch GL setup status' };
    }
};

// ========================================
// SUBACCOUNT-LEVEL CONFIGURATION (SKB1 Pattern)
// ========================================

/**
 * Get SubAccount-level GL Configuration (SKB1)
 * Returns SubAccount-specific config or inherited Agency config
 */
export const getSubAccountConfiguration = async (
    subAccountId?: string
): Promise<ActionResult<any>> => {
    try {
        const context = await getContext();
        if (!context) {
            return { success: false, error: 'Unauthorized: No session found' };
        }

        const targetSubAccountId = subAccountId ?? context.subAccountId;
        if (!targetSubAccountId) {
            return { success: false, error: 'SubAccount context required' };
        }

        const hasPermission = await checkPermission(context, 'fi.general_ledger.settings.view');
        if (!hasPermission) {
            return { success: false, error: 'Unauthorized: Missing permission' };
        }

        // Get SubAccount config
        const subAccountConfig = await db.gLConfigurationSubAccount.findUnique({
            where: { subAccountId: targetSubAccountId },
            include: {
                AgencyConfig: true,
                SubAccount: { select: { name: true, agencyId: true } },
            },
        });

        // If SubAccount has independent config, return it
        if (subAccountConfig?.isIndependent) {
            return {
                success: true,
                data: {
                    ...subAccountConfig,
                    configLevel: 'SUBACCOUNT',
                    isIndependent: true,
                },
            };
        }

        // Otherwise, get Agency config and merge with SubAccount overrides
        const agencyConfig = await db.gLConfiguration.findFirst({
            where: { agencyId: subAccountConfig?.SubAccount?.agencyId ?? context.agencyId },
        });

        if (!agencyConfig) {
            return { success: false, error: 'Agency GL configuration not found' };
        }

        // Merge: SubAccount overrides take precedence
        const mergedConfig = {
            ...agencyConfig,
            ...(subAccountConfig && {
                baseCurrency: subAccountConfig.baseCurrency ?? agencyConfig.baseCurrency,
                fiscalYearStart: subAccountConfig.fiscalYearStart ?? agencyConfig.fiscalYearStart,
                fiscalYearEnd: subAccountConfig.fiscalYearEnd ?? agencyConfig.fiscalYearEnd,
                useControlAccounts: subAccountConfig.useControlAccounts ?? agencyConfig.useControlAccounts,
                requireApproval: subAccountConfig.requireApproval ?? agencyConfig.requireApproval,
                approvalThreshold: subAccountConfig.approvalThreshold ?? agencyConfig.approvalThreshold,
                autoPostingEnabled: subAccountConfig.autoPostingEnabled ?? agencyConfig.autoPostingEnabled,
                allowFuturePeriodPost: subAccountConfig.allowFuturePeriodPost ?? agencyConfig.allowFuturePeriodPost,
                allowClosedPeriodPost: subAccountConfig.allowClosedPeriodPost ?? agencyConfig.allowClosedPeriodPost,
                autoCreatePeriods: subAccountConfig.autoCreatePeriods ?? agencyConfig.autoCreatePeriods,
                periodLockDays: subAccountConfig.periodLockDays ?? agencyConfig.periodLockDays,
                accountCodeFormat: subAccountConfig.accountCodeFormat ?? agencyConfig.accountCodeFormat,
                accountCodeLength: subAccountConfig.accountCodeLength ?? agencyConfig.accountCodeLength,
                retainAuditDays: subAccountConfig.retainAuditDays ?? agencyConfig.retainAuditDays,
            }),
            configLevel: subAccountConfig ? 'INHERITED_WITH_OVERRIDES' : 'INHERITED',
            isIndependent: false,
            subAccountConfigId: subAccountConfig?.id,
        };

        return { success: true, data: mergedConfig };
    } catch (error) {
        console.error('Error fetching SubAccount GL configuration:', error);
        return { success: false, error: 'Failed to fetch SubAccount GL configuration' };
    }
};

/**
 * Create or Update SubAccount-level GL Configuration (SKB1)
 */
export const updateSubAccountConfiguration = async (
    input: {
        subAccountId?: string;
        isIndependent?: boolean;
        baseCurrency?: string;
        fiscalYearStart?: string;
        fiscalYearEnd?: string;
        useControlAccounts?: boolean;
        requireApproval?: boolean;
        approvalThreshold?: number;
        autoPostingEnabled?: boolean;
        allowFuturePeriodPost?: boolean;
        allowClosedPeriodPost?: boolean;
        autoCreatePeriods?: boolean;
        periodLockDays?: number;
        accountCodeFormat?: string;
        accountCodeLength?: number;
        retainAuditDays?: number;
        consolidationAccountMapping?: Record<string, string>;
    }
): Promise<ActionResult<any>> => {
    try {
        const context = await getContext();
        if (!context) {
            return { success: false, error: 'Unauthorized: No session found' };
        }

        const targetSubAccountId = input.subAccountId ?? context.subAccountId;
        if (!targetSubAccountId) {
            return { success: false, error: 'SubAccount context required' };
        }

        const hasPermission = await checkPermission(context, 'fi.general_ledger.settings.manage');
        if (!hasPermission) {
            return { success: false, error: 'Unauthorized: Missing permission' };
        }

        // Get Agency config ID for linking
        const subAccount = await db.subAccount.findUnique({
            where: { id: targetSubAccountId },
            select: { agencyId: true },
        });

        if (!subAccount) {
            return { success: false, error: 'SubAccount not found' };
        }

        const agencyConfig = await db.gLConfiguration.findFirst({
            where: { agencyId: subAccount.agencyId },
        });

        const { subAccountId: _, ...updateData } = input;

        // Upsert SubAccount config
        const config = await db.gLConfigurationSubAccount.upsert({
            where: { subAccountId: targetSubAccountId },
            update: {
                ...updateData,
                updatedBy: context.userId,
            },
            create: {
                subAccountId: targetSubAccountId,
                agencyConfigId: agencyConfig?.id,
                isIndependent: input.isIndependent ?? false,
                ...updateData,
            },
        });

        await logGLAudit({
            action: 'UPDATE',
            entityType: 'GLConfigurationSubAccount',
            entityId: config.id,
            agencyId: context.agencyId,
            subAccountId: targetSubAccountId,
            description: `Updated SubAccount GL configuration`,
        });

        revalidatePath(`/agency/${context.agencyId}/fi/general-ledger/settings`);

        return { success: true, data: config };
    } catch (error) {
        console.error('Error updating SubAccount GL configuration:', error);
        return { success: false, error: 'Failed to update SubAccount GL configuration' };
    }
};

/**
 * Toggle SubAccount independence mode
 * When independent, SubAccount uses its own full configuration (like SAP SKA1)
 * When not independent, SubAccount inherits from Agency with optional overrides
 */
export const toggleSubAccountIndependence = async (
    subAccountId?: string,
    isIndependent?: boolean
): Promise<ActionResult<{ isIndependent: boolean }>> => {
    try {
        const context = await getContext();
        if (!context) {
            return { success: false, error: 'Unauthorized: No session found' };
        }

        const targetSubAccountId = subAccountId ?? context.subAccountId;
        if (!targetSubAccountId) {
            return { success: false, error: 'SubAccount context required' };
        }

        const hasPermission = await checkPermission(context, 'fi.general_ledger.settings.manage');
        if (!hasPermission) {
            return { success: false, error: 'Unauthorized: Missing permission' };
        }

        // Get current state
        const existing = await db.gLConfigurationSubAccount.findUnique({
            where: { subAccountId: targetSubAccountId },
        });

        const newIndependentState = isIndependent ?? !(existing?.isIndependent ?? false);

        // Get Agency config for linking
        const subAccount = await db.subAccount.findUnique({
            where: { id: targetSubAccountId },
            select: { agencyId: true },
        });

        const agencyConfig = await db.gLConfiguration.findFirst({
            where: { agencyId: subAccount?.agencyId },
        });

        // Upsert with new state
        const config = await db.gLConfigurationSubAccount.upsert({
            where: { subAccountId: targetSubAccountId },
            update: {
                isIndependent: newIndependentState,
                updatedBy: context.userId,
            },
            create: {
                subAccountId: targetSubAccountId,
                agencyConfigId: agencyConfig?.id,
                isIndependent: newIndependentState,
            },
        });

        await logGLAudit({
            action: 'UPDATE',
            entityType: 'GLConfigurationSubAccount',
            entityId: config.id,
            agencyId: context.agencyId,
            subAccountId: targetSubAccountId,
            description: `Toggled SubAccount independence to: ${newIndependentState}`,
        });

        revalidatePath(`/agency/${context.agencyId}/fi/general-ledger/settings`);

        return { success: true, data: { isIndependent: newIndependentState } };
    } catch (error) {
        console.error('Error toggling SubAccount independence:', error);
        return { success: false, error: 'Failed to toggle SubAccount independence' };
    }
};

/**
 * Get effective configuration (resolves SubAccount vs Agency)
 * Use this when you need the actual config to apply for operations
 */
export const getEffectiveConfiguration = async (): Promise<ActionResult<any>> => {
    try {
        const context = await getContext();
        if (!context) {
            return { success: false, error: 'Unauthorized: No session found' };
        }

        // If in SubAccount context, get SubAccount config (with inheritance)
        if (context.subAccountId) {
            return getSubAccountConfiguration(context.subAccountId);
        }

        // Otherwise, get Agency config
        return getGLConfiguration();
    } catch (error) {
        console.error('Error fetching effective configuration:', error);
        return { success: false, error: 'Failed to fetch effective configuration' };
    }
};
