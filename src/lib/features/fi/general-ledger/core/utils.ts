/**
 * GL Utility Functions
 * Pure utility functions that don't require server context
 * Separated from server actions to avoid 'use server' restrictions
 * 
 * @namespace Autlify.Lib.Features.FI.GL.Core.Utils
 */

import type { GLContext } from './context'
import { KEYS } from '@/lib/registry/keys/permissions'

// ============================================================================
// Permission Keys (Re-exported from Registry - SSoT)
// ============================================================================

/** GL permission keys for journal entries, accounts, reports, etc. */
export const GL_PERMISSION_KEYS = KEYS.fi.general_ledger

/** FI Configuration permission keys for fiscal years, currencies, etc. */
export const FI_CONFIG_KEYS = KEYS.fi.configuration

/** FI Master Data permission keys for accounts, customers, vendors, banks */
export const FI_MASTER_DATA_KEYS = KEYS.fi.master_data

// ============================================================================
// Context Utilities
// ============================================================================

/**
 * Get the entity ID for database queries based on context
 * Returns the appropriate where clause for agency or subaccount
 */
export const getContextWhereClause = (context: GLContext) => {
  if (context.contextType === 'SUBACCOUNT' && context.subAccountId) {
    return { subAccountId: context.subAccountId }
  }
  return { agencyId: context.agencyId, subAccountId: null }
}

/**
 * Get the entity IDs for creating records based on context
 */
export const getContextCreateData = (context: GLContext) => {
  if (context.contextType === 'SUBACCOUNT' && context.subAccountId) {
    return { 
      agencyId: null,
      subAccountId: context.subAccountId,
    }
  }
  return { 
    agencyId: context.agencyId ?? null,
    subAccountId: null,
  }
}

/**
 * Check if context is for agency-only feature
 * Uses entitlement scope from registry to determine access
 * 
 * @param context - The GL context
 * @param feature - Feature name for error message
 * @returns boolean
 */
export const isAgencyOnlyFeature = (
  context: GLContext,
  _feature: string
): boolean => {
  // If in subaccount context, agency-only features are not available
  if (context.contextType === 'SUBACCOUNT') {
    return true
  }
  return false
}

/**
 * Require agency-only feature access
 * 
 * @param context - The GL context
 * @param feature - Feature name for error message
 * @throws Error if in subaccount context
 */
export const requireAgencyOnlyFeature = (
  context: GLContext,
  feature: string
): void => {
  if (context.contextType === 'SUBACCOUNT') {
    throw new Error(`${feature} is only available at Agency level`)
  }
  if (!context.agencyId) {
    throw new Error(`Agency context required for ${feature}`)
  }
}
