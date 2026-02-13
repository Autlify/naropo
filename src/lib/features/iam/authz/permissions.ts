import 'server-only'

import { cache } from 'react'
import { db } from '@/lib/db'
import type { Permission } from '@/generated/prisma/client'
import type { ActionKey } from '@/lib/registry'
import { resolveEffectiveEntitlements } from '@/lib/features/org/billing/entitlements/resolve'
import { getPermissionCatalogSeeds } from '@/lib/features/iam/authz/permission-catalog'
import { isPermissionAssignable } from '@/lib/features/iam/authz/permission-entitlements'
import {
  getAgencyAccessSnapshot,
  getSubAccountAccessSnapshot,
  getAccessSnapshotForUser,
} from '@/lib/features/iam/authz/access-snapshot'
import { getAuthedUserIdCached as getAuthedUserIdFromSessionCached } from '@/lib/features/iam/authz/session'

type PermissionKey = ActionKey

const normalizeKey = (k: string) => k.trim()

// Backwards-compatible export. Prefer importing from `authz/session` directly.
export const getAuthedUserIdCached = getAuthedUserIdFromSessionCached

// Paid / add-on namespaces that must be entitlement-checked at runtime
const ENTITLEMENT_CHECK_PREFIXES = ['fi.', 'co.'] as const
const shouldCheckEntitlements = (key: string) =>
  ENTITLEMENT_CHECK_PREFIXES.some((p) => key.startsWith(p))

const getAgencyEntitlementsCached = cache(async (agencyId: string) =>
  resolveEffectiveEntitlements({ scope: 'AGENCY', agencyId, subAccountId: null })
)

const getSubAccountEntitlementsCached = cache(async (agencyId: string, subAccountId: string) =>
  resolveEffectiveEntitlements({ scope: 'SUBACCOUNT', agencyId, subAccountId })
)

const getSubAccountAgencyIdCached = cache(async (subAccountId: string) => {
  const sub = await db.subAccount.findUnique({
    where: { id: subAccountId },
    select: { agencyId: true },
  })
  return sub?.agencyId ?? null
})

const getAuthMembershipsForUserIdCached = cache(async (userId: string) => {
  const [agencyMemberships, subAccountMemberships] = await Promise.all([
    db.agencyMembership.findMany({
      where: { userId, isActive: true },
      select: {
        Agency: { select: { id: true, name: true, agencyLogo: true } },
      },
    }),
    db.subAccountMembership.findMany({
      where: { userId, isActive: true },
      select: {
        SubAccount: {
          select: { id: true, name: true, subAccountLogo: true, agencyId: true },
        },
      },
    }),
  ])

  return {
    AgencyMemberships: agencyMemberships,
    SubAccountMemberships: subAccountMemberships,
  }
})

export const getAuthUserMemberships = async () => {
  const userId = await getAuthedUserIdCached()
  if (!userId) return null
  return getAuthMembershipsForUserIdCached(userId)
}

const getActiveRoleIdsForUserCached = cache(async (userId: string): Promise<string[]> => {
  const [agencyRoles, subAccountRoles] = await Promise.all([
    db.agencyMembership.findMany({
      where: { userId, isActive: true },
      select: { roleId: true },
    }),
    db.subAccountMembership.findMany({
      where: { userId, isActive: true },
      select: { roleId: true },
    }),
  ])

  const roleIds = [...agencyRoles, ...subAccountRoles]
    .map((row) => row.roleId)
    .filter((roleId): roleId is string => Boolean(roleId))

  return Array.from(new Set(roleIds))
})

const getActiveRoleIdsForUser = async (userId: string): Promise<string[]> =>
  getActiveRoleIdsForUserCached(userId)

const getPermissionKeysForUserIdCached = cache(async (userId: string): Promise<PermissionKey[]> => {
  const roleIds = await getActiveRoleIdsForUser(userId)
  if (roleIds.length === 0) return []

  const rows = await db.rolePermission.findMany({
    where: { roleId: { in: roleIds }, granted: true },
    select: { Permission: { select: { key: true } } },
  })

  const unique = new Set<string>()
  for (const row of rows) unique.add(row.Permission.key)
  return Array.from(unique) as PermissionKey[]
})

export const getPermissionKeysForUserId = async (
  userId: string
): Promise<PermissionKey[]> => {
  return getPermissionKeysForUserIdCached(userId)
}

const getUserPermissionsByUserIdCached = cache(async (userId: string): Promise<Permission[]> => {
  const roleIds = await getActiveRoleIdsForUser(userId)
  if (roleIds.length === 0) return []

  const rolePermissions = await db.rolePermission.findMany({
    where: { roleId: { in: roleIds }, granted: true },
    select: { permissionId: true },
  })

  const permissionIds = Array.from(new Set(rolePermissions.map((rp) => rp.permissionId)))
  if (permissionIds.length === 0) return []

  const permissions = await db.permission.findMany({
    where: { id: { in: permissionIds } },
    orderBy: { key: 'asc' },
  })

  const unique = new Map<string, Permission>()
  for (const p of permissions) unique.set(p.key, p)
  return Array.from(unique.values())
})

export const getUserPermissions = async (): Promise<Permission[]> => {
  const userId = await getAuthedUserIdCached()
  if (!userId) return []
  return getUserPermissionsByUserIdCached(userId)
}

export const getUserPermissionKeys = async (): Promise<PermissionKey[]> => {
  const userId = await getAuthedUserIdCached()
  if (!userId) return []
  return getPermissionKeysForUserId(userId)
}

const getUserPermissionKeySetCached = cache(async () => {
  const keys = await getUserPermissionKeys()
  return new Set(keys)
})

export const hasPermission = async (permissionKey: PermissionKey): Promise<boolean> => {
  const key = normalizeKey(permissionKey) as PermissionKey
  const keys = await getUserPermissionKeySetCached()
  return keys.has(key)
}

/**
 * Scoped helpers (recommended for authz decisions).
 */
export const getAgencyPermissionKeys = async (
  agencyId: string
): Promise<PermissionKey[]> => {
  const snap = await getAgencyAccessSnapshot(agencyId)
  if (!snap) return []
  return (snap.permissionKeys || []).map((k) => k as PermissionKey)
}

export const getSubAccountPermissionKeys = async (
  subAccountId: string
): Promise<PermissionKey[]> => {
  const snap = await getSubAccountAccessSnapshot(subAccountId)
  if (!snap) return []
  return (snap.permissionKeys || []).map((k) => k as PermissionKey)
}

export const hasAgencyPermission = async (
  agencyId: string,
  permissionKey: PermissionKey
): Promise<boolean> => {
  const userId = await getAuthedUserIdCached()
  if (!userId) return false
  return hasAgencyPermissionForUser({ userId, agencyId, permissionKey })
}

export const hasSubAccountPermission = async (
  subAccountId: string,
  permissionKey: PermissionKey
): Promise<boolean> => {
  const userId = await getAuthedUserIdCached()
  if (!userId) return false
  return hasSubAccountPermissionForUser({ userId, subAccountId, permissionKey })
}

export const hasAgencyPermissionForUser = async (args: {
  userId: string
  agencyId: string
  permissionKey: PermissionKey
}): Promise<boolean> => {
  const key = normalizeKey(args.permissionKey) as PermissionKey

  const snapshot = await getAccessSnapshotForUser({
    userId: args.userId,
    scope: 'AGENCY',
    agencyId: args.agencyId,
  })
  if (!snapshot) return false

  const keySet = new Set((snapshot.permissionKeys || []).map((k) => k as PermissionKey))
  if (!keySet.has(key)) return false
  if (!shouldCheckEntitlements(key)) return true

  const entitlements = await getAgencyEntitlementsCached(args.agencyId)
  return isPermissionAssignable(key, entitlements)
}

export const hasSubAccountPermissionForUser = async (args: {
  userId: string
  subAccountId: string
  permissionKey: PermissionKey
  agencyId?: string
}): Promise<boolean> => {
  const key = normalizeKey(args.permissionKey) as PermissionKey

  const resolvedAgencyId = args.agencyId ?? (await getSubAccountAgencyIdCached(args.subAccountId))
  if (!resolvedAgencyId) return false

  const snapshot = await getAccessSnapshotForUser({
    userId: args.userId,
    scope: 'SUBACCOUNT',
    agencyId: resolvedAgencyId,
    subAccountId: args.subAccountId,
  })
  if (!snapshot) return false

  const keySet = new Set((snapshot.permissionKeys || []).map((k) => k as PermissionKey))
  if (!keySet.has(key)) return false
  if (!shouldCheckEntitlements(key)) return true

  const entitlements = await getSubAccountEntitlementsCached(resolvedAgencyId, args.subAccountId)
  return isPermissionAssignable(key, entitlements)
}

export const hasSubAccountPermissionWithAgency = async (
  agencyId: string,
  subAccountId: string,
  permissionKey: PermissionKey
): Promise<boolean> => {
  const userId = await getAuthedUserIdCached()
  if (!userId) return false
  return hasSubAccountPermissionForUser({
    userId,
    agencyId,
    subAccountId,
    permissionKey,
  })
}

// =============================================================================
// ENTITLED PERMISSIONS - For Role Management UI
// =============================================================================

/**
 * Get permissions available for role assignment based on (subscription + add-ons).
 *
 * Notes:
 * - Uses the permission registry as the source of truth (not membership usage),
 *   so the UI can show the full assignable catalog for custom roles.
 * - Applies entitlement gating via isPermissionAssignable().
 */
export type PermissionsByCategory = Record<string, Permission[]>

const PERMISSION_CATALOG_SEEDS = getPermissionCatalogSeeds()

const getEntitledPermissionsCached = cache(async (
  agencyId: string,
  scope: 'AGENCY' | 'SUBACCOUNT'
): Promise<PermissionsByCategory> => {
  const entitlements = await resolveEffectiveEntitlements({
    scope: scope === 'SUBACCOUNT' ? 'SUBACCOUNT' : 'AGENCY',
    agencyId,
    subAccountId: null,
  })

  const scopePrefixes =
    scope === 'AGENCY'
      ? ['org.agency.', 'org.billing.', 'org.apps.', 'org.experimental.', 'crm.', 'fi.', 'co.']
      : ['org.subaccount.', 'crm.', 'fi.', 'co.']

  const seeds = PERMISSION_CATALOG_SEEDS
    .filter((s) => scopePrefixes.some((p) => s.key.startsWith(p)))
    .filter((s) => isPermissionAssignable(s.key, entitlements))

  // Ensure DB contains all assignable keys (needed because RolePermission uses IDs).
  await db.permission.createMany({
    data: seeds.map((s) => ({
      key: s.key,
      name: s.name,
      description: s.description,
      category: s.category,
      isSystem: s.isSystem,
    })),
    skipDuplicates: true,
  })

  const permissions = await db.permission.findMany({
    where: { key: { in: seeds.map((s) => s.key) } },
    orderBy: [{ category: 'asc' }, { key: 'asc' }],
  })

  // Group by category
  const grouped: PermissionsByCategory = {}
  for (const perm of permissions) {
    if (!grouped[perm.category]) {
      grouped[perm.category] = []
    }
    grouped[perm.category].push(perm)
  }

  return grouped
})

export const getEntitledPermissions = async (
  agencyId: string,
  scope: 'AGENCY' | 'SUBACCOUNT'
): Promise<PermissionsByCategory> => {
  return getEntitledPermissionsCached(agencyId, scope)
}

/**
 * Get flat list of entitled permission keys (for validation).
 */
export const getEntitledPermissionKeys = async (
  agencyId: string,
  scope: 'AGENCY' | 'SUBACCOUNT'
): Promise<PermissionKey[]> => {
  const grouped = await getEntitledPermissions(agencyId, scope)
  return Object.values(grouped)
    .flat()
    .map((p) => p.key as PermissionKey)
}

/**
 * Validate that a set of permission keys are all entitled for this context.
 * Used when creating/updating custom roles to prevent assigning unsubscribed permissions.
 */
export const validatePermissionKeys = async (
  agencyId: string,
  scope: 'AGENCY' | 'SUBACCOUNT',
  permissionKeys: string[]
): Promise<{ valid: boolean; invalidKeys: string[] }> => {
  const entitled = await getEntitledPermissionKeys(agencyId, scope)
  const entitledSet = new Set(entitled)
  
  const invalidKeys = permissionKeys.filter((k) => !entitledSet.has(k as PermissionKey))
  
  return {
    valid: invalidKeys.length === 0,
    invalidKeys,
  }
}

// =============================================================================
// TEAM ACCESS - For TeamSwitcher UI
// =============================================================================

/**
 * Get user's accessible teams structured for TeamSwitcher
 * Returns agencies with their nested subaccounts that user has permission to access
 */
export const getUserAccessibleTeams = async () => {
  const user = await getAuthUserMemberships()
  if (!user) return []

  type TeamItem = {
    id: string
    name: string
    logo?: string
    type: 'agency' | 'subaccount'
    subaccounts?: TeamItem[]
  }

  const teams: TeamItem[] = []

  // Group subaccounts by agency
  const subAccountsByAgency = new Map<string, TeamItem[]>()
  
  for (const membership of user.SubAccountMemberships) {
    const subAccount = membership.SubAccount
    const agencyId = subAccount.agencyId
    
    const subAccountItem: TeamItem = {
      id: subAccount.id,
      name: subAccount.name,
      logo: subAccount.subAccountLogo || undefined,
      type: 'subaccount',
    }

    if (!subAccountsByAgency.has(agencyId)) {
      subAccountsByAgency.set(agencyId, [])
    }
    subAccountsByAgency.get(agencyId)!.push(subAccountItem)
  }

  // Build agency items with their subaccounts
  for (const membership of user.AgencyMemberships) {
    const agency = membership.Agency
    const agencySubaccounts = subAccountsByAgency.get(agency.id) || []

    teams.push({
      id: agency.id,
      name: agency.name,
      logo: agency.agencyLogo || undefined,
      type: 'agency',
      subaccounts: agencySubaccounts.length > 0 ? agencySubaccounts : undefined,
    })
  }

  return teams
}
