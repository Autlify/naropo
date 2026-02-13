import 'server-only'

import type { EffectiveEntitlement } from '@/lib/features/org/billing/entitlements/types'
import type { FeatureKey, SubModuleKey } from '@/lib/registry'

export type PermissionEntitlementGate = {
  /** Permission key prefix.
   *
   * Standard:
   * - Prefer 3 segments (module.submodule.resource.)
   * - Otherwise 2 segments (module.submodule.)
   */
  prefix: `${SubModuleKey | FeatureKey}.`
  /** At least one of these entitlements must be enabled */
  requireAny?: FeatureKey[]
  /** All of these entitlements must be enabled */
  requireAll?: FeatureKey[]
  /**
   * Any-of groups where each group is an all-of requirement.
   * Useful when access can be satisfied via different bundles.
   *
   * Example: (A && B) || (C && D)
   */
  requireAnyAll?: FeatureKey[][]
}

/**
 * Map permission *namespaces* to entitlement feature keys.
 * This determines which permissions are assignable under a plan + add-ons.
 */
export const PERMISSION_ENTITLEMENT_GATES: PermissionEntitlementGate[] = [
  // ─────────────────────────────────────────────────────────
  // CORE AGENCY - Require a subscription to Agency module
  // ─────────────────────────────────────────────────────────
  // Agency account management entitlements
  { prefix: 'org.agency.', requireAny: ['org.agency.account'] },
  { prefix: 'org.billing.', requireAll: ['org.agency.account'] },

  // IAM / AuthZ management: allow if either Agency or Subaccount team-member bundle is available.
  {
    prefix: 'iam.authZ.',
    requireAnyAll: [
      ['org.agency.account'],
      ['org.subaccount.account'],
    ],
  },

  // CORE SUBACCOUNT - Require core.agency.subaccounts to create (agency level), core.subaccount.account to access/manage (subaccount level)
  { prefix: 'org.subaccount.', requireAny: ['org.agency.subaccounts', 'org.subaccount.account'] },

  // ─────────────────────────────────────────────────────────
  // APPS
  // ─────────────────────────────────────────────────────────
  { prefix: 'org.apps.', requireAny: ['org.apps.api_keys', 'org.apps.app', 'org.apps.webhooks'] },

  // ─────────────────────────────────────────────────────────
  // BILLING (feature-gated parts)
  // ─────────────────────────────────────────────────────────
  { prefix: 'org.billing.priority_support.', requireAny: ['org.billing.priority_support'] },
  // permissions live in core.billing.rebilling.* but entitlement is crm.customers.billing
  { prefix: 'org.billing.rebilling.', requireAny: ['crm.customers.billing'] },

  // ─────────────────────────────────────────────────────────
  // CRM
  // ─────────────────────────────────────────────────────────
  { prefix: 'crm.customers.contact.', requireAny: ['crm.customers.contact'] },
  { prefix: 'crm.customers.billing.', requireAny: ['crm.customers.billing'] },
  { prefix: 'crm.funnels.content.', requireAny: ['crm.funnels.content'] },

  // Pipelines: gate ALL pipeline resources (lane/ticket/tag) on pipeline entitlement
  { prefix: 'crm.pipelines.lane.', requireAny: ['crm.pipelines.lane'] },
  { prefix: 'crm.pipelines.ticket.', requireAny: ['crm.pipelines.lane'] },
  { prefix: 'crm.pipelines.tag.', requireAny: ['crm.pipelines.lane'] },

  { prefix: 'crm.media.file.', requireAny: ['crm.media.file'] },

  // ─────────────────────────────────────────────────────────
  // FI (paid add-on namespaces)
  // ─────────────────────────────────────────────────────────
  // Global FI configuration should only be assignable if *any* FI module is available.
  {
    prefix: 'fi.configuration.',
    requireAny: [
      'fi.general_ledger.settings',
      'fi.accounts_receivable.subledgers',
      'fi.accounts_payable.subledgers',
      'fi.bank_ledger.bank_accounts',
      'fi.controlling.cost_centers',
      'fi.advanced_reporting.financial_statements',
    ],
  },

  // Master data is shared across FI modules. Gate each domain by the owning module entitlement.
  { prefix: 'fi.master_data.accounts.', requireAny: ['fi.general_ledger.settings'] },
  { prefix: 'fi.master_data.customers.', requireAny: ['fi.accounts_receivable.subledgers'] },
  { prefix: 'fi.master_data.vendors.', requireAny: ['fi.accounts_payable.subledgers'] },
  { prefix: 'fi.master_data.banks.', requireAny: ['fi.bank_ledger.bank_accounts'] },

  // Submodule access toggles (gate entire FI submodule by its access entitlement)
  { prefix: 'fi.general_ledger.', requireAny: ['fi.general_ledger.settings'] },
  { prefix: 'fi.accounts_receivable.', requireAny: ['fi.accounts_receivable.subledgers'] },
  { prefix: 'fi.accounts_payable.', requireAny: ['fi.accounts_payable.subledgers'] },
  { prefix: 'fi.bank_ledger.', requireAny: ['fi.bank_ledger.bank_accounts'] },
  { prefix: 'fi.controlling.', requireAny: ['fi.controlling.cost_centers'] },
  {
    prefix: 'fi.advanced_reporting.',
    requireAny: ['fi.advanced_reporting.financial_statements'],
  },

  // CO - Controlling module (new structure)
  { prefix: 'co.cost_centers.', requireAny: ['co.cost_centers.master_data'] },
  { prefix: 'co.profit_centers.', requireAny: ['co.profit_centers.master_data'] },
  { prefix: 'co.internal_orders.', requireAny: ['co.internal_orders.master_data'] },
  { prefix: 'co.profitability.', requireAny: ['co.profitability.segments'] },
  { prefix: 'co.budgets.', requireAny: ['co.budgets.planning'] },
]

function validatePermissionEntitlementGates(gates: PermissionEntitlementGate[]): void {
  const seen = new Map<string, number>()
  for (const gate of gates) {
    const prev = seen.get(gate.prefix)
    if (prev !== undefined) {
      throw new Error(
        `[permission-entitlements] Duplicate gate prefix: "${gate.prefix}" (indexes ${prev} and ${gates.indexOf(
          gate
        )})`
      )
    }
    seen.set(gate.prefix, gates.indexOf(gate))

    const hasAny = !!gate.requireAny?.length
    const hasAll = !!gate.requireAll?.length
    const hasAnyAll = !!gate.requireAnyAll?.length
    if (!hasAny && !hasAll && !hasAnyAll) {
      throw new Error(`[permission-entitlements] Gate for "${gate.prefix}" has no requirements`)
    }
  }
}

if (process.env.NODE_ENV !== 'production') {
  validatePermissionEntitlementGates(PERMISSION_ENTITLEMENT_GATES)
}

function isPositiveQuantity(ent: EffectiveEntitlement): boolean {
  if (!ent.isEnabled) return false
  if (ent.isUnlimited) return true

  // Integer limits
  const intLimit = ent.maxInt ?? ent.includedInt ?? 0
  if (intLimit > 0) return true

  // Decimal limits
  const decLimit = parseFloat(ent.maxDec ?? ent.includedDec ?? '0')
  return Number.isFinite(decLimit) && decLimit > 0
}

function isEntitlementSatisfied(ent: EffectiveEntitlement | undefined): boolean {
  if (!ent) return false
  if (ent.valueType === 'BOOLEAN') return ent.isEnabled
  return isPositiveQuantity(ent)
}

function isGateSatisfied(
  gate: PermissionEntitlementGate,
  entitlements: Record<string, EffectiveEntitlement>
): boolean {
  if (gate.requireAll?.length) {
    for (const k of gate.requireAll) {
      if (!isEntitlementSatisfied(entitlements[k])) return false
    }
  }

  if (gate.requireAnyAll?.length) {
    const ok = gate.requireAnyAll.some((group) => group.every((k) => isEntitlementSatisfied(entitlements[k])))
    if (!ok) return false
  }

  if (gate.requireAny?.length) {
    return gate.requireAny.some((k) => isEntitlementSatisfied(entitlements[k]))
  }

  return true
}

/** Find the most specific gate (longest prefix) that matches a permission key */
export function getGateForPermissionKey(permissionKey: string): PermissionEntitlementGate | null {
  let best: PermissionEntitlementGate | null = null
  for (const gate of PERMISSION_ENTITLEMENT_GATES) {
    if (!permissionKey.startsWith(gate.prefix)) continue
    if (!best || gate.prefix.length > best.prefix.length) best = gate
  }
  return best
}

/** Returns true if permissionKey can be assigned given the effective entitlement map */
export function isPermissionAssignable(
  permissionKey: string,
  entitlements: Record<string, EffectiveEntitlement>
): boolean {
  const gate = getGateForPermissionKey(permissionKey)
  // Fail-closed for paid namespaces: if there's no matching gate, do NOT allow assignment.
  // This prevents leakage when new FI permissions are added but not yet mapped.
  if (!gate) {
    if (permissionKey.startsWith('fi.') || permissionKey.startsWith('co.')) return false
    return true
  }

  return isGateSatisfied(gate, entitlements)
}
