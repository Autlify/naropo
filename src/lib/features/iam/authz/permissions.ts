import 'server-only'

import { auth } from '@/auth'
import { db } from '@/lib/db'
import type { Permission } from '@/generated/prisma/client'
import type { ActionKey } from '@/lib/registry'
import { resolveEffectiveEntitlements } from '@/lib/features/core/billing/entitlements/resolve'
import { getPermissionCatalogSeeds } from '@/lib/features/iam/authz/permission-catalog'
import { isPermissionAssignable } from '@/lib/features/iam/authz/permission-entitlements'

type PermissionKey = ActionKey

const normalizeKey = (k: string) => k.trim()

export const getAuthUserMemberships = async () => {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return null

  return db.user.findUnique({
    where: { id: userId },
    include: {
      AgencyMemberships: {
        where: { isActive: true },
        include: {
          Agency: true,
          Role: {
            include: {
              Permissions: {
                where: { granted: true },
                include: { Permission: true },
              },
            },
          },
        },
      },
      SubAccountMemberships: {
        where: { isActive: true },
        include: {
          SubAccount: true,
          Role: {
            include: {
              Permissions: {
                where: { granted: true },
                include: { Permission: true },
              },
            },
          },
        },
      },
    },
  })
}

export const getUserPermissions = async (): Promise<Permission[]> => {
  const user = await getAuthUserMemberships()
  if (!user) return []

  const agencyPerms = user.AgencyMemberships.flatMap((m) =>
    m.Role.Permissions.map((rp) => rp.Permission)
  )
  const subPerms = user.SubAccountMemberships.flatMap((m) =>
    m.Role.Permissions.map((rp) => rp.Permission)
  )

  const unique: Record<string, Permission> = {}
  for (const p of [...agencyPerms, ...subPerms]) {
    unique[p.key] = p
  }

  return Object.keys(unique).map((k) => unique[k])
}

export const getUserPermissionKeys = async (): Promise<PermissionKey[]> => {
  const perms = await getUserPermissions()
  // DB stores strings but we trust seeded permission keys match ActionKey
  return perms.map((p) => p.key as PermissionKey)
}

export const hasPermission = async (permissionKey: PermissionKey): Promise<boolean> => {
  const key = normalizeKey(permissionKey) as PermissionKey
  const keys = await getUserPermissionKeys()
  return keys.includes(key)
}

/**
 * Scoped helpers (recommended for authz decisions).
 */
export const getAgencyPermissionKeys = async (
  agencyId: string
): Promise<PermissionKey[]> => {
  const user = await getAuthUserMemberships()
  if (!user) return []

  const membership = user.AgencyMemberships.find((m) => m.agencyId === agencyId)
  if (!membership) return []

  // DB stores strings but we trust seeded permission keys match ActionKey
  return membership.Role.Permissions.map((rp) => rp.Permission.key as PermissionKey)
}

export const getSubAccountPermissionKeys = async (
  subAccountId: string
): Promise<PermissionKey[]> => {
  const user = await getAuthUserMemberships()
  if (!user) return []

  const membership = user.SubAccountMemberships.find(
    (m) => m.subAccountId === subAccountId
  )
  if (!membership) return []

  // DB stores strings but we trust seeded permission keys match ActionKey
  return membership.Role.Permissions.map((rp) => rp.Permission.key as PermissionKey)
}

export const hasAgencyPermission = async (
  agencyId: string,
  permissionKey: PermissionKey
): Promise<boolean> => {
  const key = normalizeKey(permissionKey) as PermissionKey
  const keys = await getAgencyPermissionKeys(agencyId)
  return keys.includes(key)
}

export const hasSubAccountPermission = async (
  subAccountId: string,
  permissionKey: PermissionKey
): Promise<boolean> => {
  const key = normalizeKey(permissionKey) as PermissionKey
  const keys = await getSubAccountPermissionKeys(subAccountId)
  return keys.includes(key)
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

export const getEntitledPermissions = async (
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
      ? ['core.agency.', 'core.billing.', 'core.apps.', 'core.experimental.', 'crm.', 'fi.']
      : ['core.subaccount.', 'crm.', 'fi.']

  const seeds = getPermissionCatalogSeeds()
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
