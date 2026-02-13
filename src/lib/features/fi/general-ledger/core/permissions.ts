/**
 * GL Permissions Helper
 * Uses registry as Single Source of Truth for permissions
 * 
 * @namespace Autlify.Lib.Features.FI.GL.Core.Permissions
 */

'use server'

import {
    hasAgencyPermission,
    hasSubAccountPermission
} from '@/lib/features/iam/authz/permissions'
import type { ActionKey } from '@/lib/registry'
import type { GLContext } from './context'
import { GL_PERMISSION_KEYS, FI_CONFIG_KEYS, FI_MASTER_DATA_KEYS } from './utils'

// Note: Permission key constants are now in ./utils.ts
// Import them from '../core' or '../core/utils' in action files

/** Permission check result */
export interface PermissionCheckResult {
    allowed: boolean
    reason?: string
}

/**
 * Check if context has a specific GL permission
 * Automatically routes to agency or subaccount check based on context
 * 
 * @param context - The GL context
 * @param permissionKey - The permission key to check
 * @returns Promise<boolean>
 */
export const checkGLPermission = async (
    context: GLContext,
    permissionKey: ActionKey
): Promise<boolean> => {
    if (context.contextType === 'SUBACCOUNT' && context.subAccountId) {
        return hasSubAccountPermission(context.subAccountId, permissionKey)
    }

    if (context.agencyId) {
        return hasAgencyPermission(context.agencyId, permissionKey)
    }

    return false
}

/**
 * Check permission and return detailed result
 * 
 * @param context - The GL context
 * @param permissionKey - The permission key to check
 * @returns Promise<PermissionCheckResult>
 */
export const checkGLPermissionWithReason = async (
    context: GLContext,
    permissionKey: ActionKey
): Promise<PermissionCheckResult> => {
    const allowed = await checkGLPermission(context, permissionKey)

    if (!allowed) {
        return {
            allowed: false,
            reason: `Missing permission: ${permissionKey}`,
        }
    }

    return { allowed: true }
}

/**
 * Require permission or throw error
 * 
 * @param context - The GL context
 * @param permissionKey - The permission key to check
 * @throws Error if permission denied
 */
export const requireGLPermission = async (
    context: GLContext,
    permissionKey: ActionKey
): Promise<void> => {
    const allowed = await checkGLPermission(context, permissionKey)

    if (!allowed) {
        throw new Error(`Unauthorized: Missing permission ${permissionKey}`)
    }
}

/**
 * Check multiple permissions (all required)
 * 
 * @param context - The GL context
 * @param permissionKeys - Array of permission keys
 * @returns Promise<boolean>
 */
export const checkGLPermissions = async (
    context: GLContext,
    permissionKeys: ActionKey[]
): Promise<boolean> => {
    const results = await Promise.all(
        permissionKeys.map(key => checkGLPermission(context, key))
    )
    return results.every(Boolean)
}

// Note: isAgencyOnlyFeature and requireAgencyOnlyFeature
// have been moved to ./utils.ts to avoid 'use server' restrictions

// ============================================================
// Convenience permission check functions using registry keys
// Single Source of Truth: KEYS.fi.{configuration, master_data, general_ledger}
// ============================================================

// ─────────────────────────────────────────────────────────────────────────
// FI Master Data Permissions (fi.master_data.*)
// ─────────────────────────────────────────────────────────────────────────

// Accounts (Chart of Accounts) - now under master_data
export const canViewAccounts = async (ctx: GLContext) =>
    checkGLPermission(ctx, FI_MASTER_DATA_KEYS.accounts.view)

export const canManageAccounts = async (ctx: GLContext) =>
    checkGLPermission(ctx, FI_MASTER_DATA_KEYS.accounts.manage)

// Customer Master Data
export const canViewCustomers = async (ctx: GLContext) =>
    checkGLPermission(ctx, FI_MASTER_DATA_KEYS.customers.view)

export const canManageCustomers = async (ctx: GLContext) =>
    checkGLPermission(ctx, FI_MASTER_DATA_KEYS.customers.manage)

// Vendor Master Data
export const canViewVendors = async (ctx: GLContext) =>
    checkGLPermission(ctx, FI_MASTER_DATA_KEYS.vendors.view)

export const canManageVendors = async (ctx: GLContext) =>
    checkGLPermission(ctx, FI_MASTER_DATA_KEYS.vendors.manage)

// Bank Master Data
export const canViewBanks = async (ctx: GLContext) =>
    checkGLPermission(ctx, FI_MASTER_DATA_KEYS.banks.view)

export const canManageBanks = async (ctx: GLContext) =>
    checkGLPermission(ctx, FI_MASTER_DATA_KEYS.banks.manage)

// ─────────────────────────────────────────────────────────────────────────
// FI Configuration Permissions (fi.configuration.*)
// ─────────────────────────────────────────────────────────────────────────

// Chart of Accounts Configuration
export const canViewCOAConfig = async (ctx: GLContext) =>
    checkGLPermission(ctx, FI_MASTER_DATA_KEYS.accounts.view)

export const canManageCOAConfig = async (ctx: GLContext) =>
    checkGLPermission(ctx, FI_MASTER_DATA_KEYS.accounts.manage)

// Fiscal Years (replaces periods)
export const canViewFiscalYears = async (ctx: GLContext) => 
    checkGLPermission(ctx, FI_CONFIG_KEYS.fiscal_years.view)

export const canManageFiscalYears = async (ctx: GLContext) => 
    checkGLPermission(ctx, FI_CONFIG_KEYS.fiscal_years.manage)

// Currencies (replaces currency)
export const canViewCurrencies = async (ctx: GLContext) => 
    checkGLPermission(ctx, FI_CONFIG_KEYS.currencies.view)

export const canManageCurrencies = async (ctx: GLContext) => 
    checkGLPermission(ctx, FI_CONFIG_KEYS.currencies.manage)

// Tax Settings (replaces tax)
export const canViewTaxSettings = async (ctx: GLContext) =>
    checkGLPermission(ctx, FI_CONFIG_KEYS.tax_settings.view)

export const canManageTaxSettings = async (ctx: GLContext) =>
    checkGLPermission(ctx, FI_CONFIG_KEYS.tax_settings.manage)

// Tolerances
export const canViewTolerances = async (ctx: GLContext) =>
    checkGLPermission(ctx, FI_CONFIG_KEYS.tolerances.view)

export const canManageTolerances = async (ctx: GLContext) =>
    checkGLPermission(ctx, FI_CONFIG_KEYS.tolerances.manage)

// Number Ranges
export const canViewNumberRanges = async (ctx: GLContext) =>
    checkGLPermission(ctx, FI_CONFIG_KEYS.number_ranges.view)

export const canManageNumberRanges = async (ctx: GLContext) =>
    checkGLPermission(ctx, FI_CONFIG_KEYS.number_ranges.manage)

// Posting Rules
export const canViewPostingRules = async (ctx: GLContext) => 
    checkGLPermission(ctx, FI_CONFIG_KEYS.posting_rules.view)

export const canManagePostingRules = async (ctx: GLContext) => 
    checkGLPermission(ctx, FI_CONFIG_KEYS.posting_rules.manage)

// ─────────────────────────────────────────────────────────────────────────
// GL Transaction Permissions (fi.general_ledger.*)
// ─────────────────────────────────────────────────────────────────────────

// Settings
export const canViewSettings = async (ctx: GLContext) =>
    checkGLPermission(ctx, GL_PERMISSION_KEYS.settings.view)

export const canManageSettings = async (ctx: GLContext) =>
    checkGLPermission(ctx, GL_PERMISSION_KEYS.settings.manage)

// Journal Entries
export const canViewJournals = async (ctx: GLContext) =>
    checkGLPermission(ctx, GL_PERMISSION_KEYS.journal_entries.read)

export const canCreateJournals = async (ctx: GLContext) =>
    checkGLPermission(ctx, GL_PERMISSION_KEYS.journal_entries.create)

export const canApproveJournals = async (ctx: GLContext) =>
    checkGLPermission(ctx, GL_PERMISSION_KEYS.journal_entries.approve)

// Reports
export const canViewReports = async (ctx: GLContext) => 
    checkGLPermission(ctx, GL_PERMISSION_KEYS.reports.view)

export const canGenerateReports = async (ctx: GLContext) => 
    checkGLPermission(ctx, GL_PERMISSION_KEYS.reports.generate)

export const canApproveReports = async (ctx: GLContext) => 
    checkGLPermission(ctx, GL_PERMISSION_KEYS.reports.approve)

// Consolidation (agency-only)
export const canViewConsolidation = async (ctx: GLContext) =>
    checkGLPermission(ctx, GL_PERMISSION_KEYS.consolidation.view)

export const canManageConsolidation = async (ctx: GLContext) =>
    checkGLPermission(ctx, GL_PERMISSION_KEYS.consolidation.manage)

// Year-End Closing
export const canViewYearEnd = async (ctx: GLContext) =>
    checkGLPermission(ctx, GL_PERMISSION_KEYS.year_end.view)

export const canManageYearEnd = async (ctx: GLContext) =>
    checkGLPermission(ctx, GL_PERMISSION_KEYS.year_end.manage)

export const canCloseYearEnd = async (ctx: GLContext) =>
    checkGLPermission(ctx, GL_PERMISSION_KEYS.year_end.close)

// Reconciliation
export const canViewReconciliation = async (ctx: GLContext) => 
    checkGLPermission(ctx, GL_PERMISSION_KEYS.reconciliation.view)

export const canManageReconciliation = async (ctx: GLContext) => 
    checkGLPermission(ctx, GL_PERMISSION_KEYS.reconciliation.manage)

export const canClearReconciliation = async (ctx: GLContext) => 
    checkGLPermission(ctx, GL_PERMISSION_KEYS.reconciliation.clear)