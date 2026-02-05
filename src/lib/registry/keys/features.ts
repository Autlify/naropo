/**
 * @abstraction Platform Feature Keys
 * @description Type-safe feature key derivations from the KEYS registry.
 * Runtime entitlements should come from DB (EntitlementFeature/PlanFeature).
 * 
 * @namespace Autlify.Lib.Registry.Keys.Features
 * @module REGISTRY
 * @author Autlify Team
 * @created 2026-01-29
 */

import type { ModuleCode, SubModuleOf, ResourceOf, KEYS } from '@/lib/registry/keys/permissions'
 

/** Resource codes (e.g., 'account', 'subaccounts', 'team_member') */
export type FeatureCode = {
  [M in ModuleCode]: { 
    [S in SubModuleOf<M>]: ResourceOf<M, S> 
  }[SubModuleOf<M>]
}[ModuleCode];

/** Full resource keys (e.g., 'core.agency.account', 'core.billing.subscription') */
export type FeatureKey = {
  [M in ModuleCode]: {
    [S in SubModuleOf<M>]: `${M}.${S}.${ResourceOf<M, S>}`
  }[SubModuleOf<M>]
}[ModuleCode];

/** Resource types (uppercase, e.g., 'ACCOUNT', 'SUBACCOUNTS') */
export type FeatureType = Uppercase<FeatureCode>;

/** Feature value types for entitlements */
export type EntitlementValueType = 'BOOLEAN' | 'INTEGER' | 'DECIMAL' | 'STRING'


/** Feature scope for metering */
export type FeatureScope = 'AGENCY' | 'SUBACCOUNT'

/** 
 * Entitlement feature access helper.
 * Use to check if a feature is enabled for a given scope.
 */
export interface FeatureAccess {
  featureKey: FeatureKey
  isEnabled: boolean
  isUnlimited: boolean
  currentUsage?: number
  maxAllowed?: number
  remainingAllowance?: number
}

/**
 * Helper to format feature display name from key.
 * e.g., 'core.agency.subaccounts' -> 'Sub-Accounts'
 */
export function formatFeatureDisplayName(key: FeatureKey): string {
  const parts = key.split('.')
  const resource = parts[parts.length - 1]
  return resource
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

