import 'server-only'

import { auth } from '@/auth'
import { db } from '@/lib/db'
import type { Permission } from '@/generated/prisma/client'

type PermissionKey = string

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
  return perms.map((p) => p.key)
}

export const hasPermission = async (permissionKey: string): Promise<boolean> => {
  const key = normalizeKey(permissionKey)
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

  return membership.Role.Permissions.map((rp) => rp.Permission.key)
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

  return membership.Role.Permissions.map((rp) => rp.Permission.key)
}

export const hasAgencyPermission = async (
  agencyId: string,
  permissionKey: string
): Promise<boolean> => {
  const key = normalizeKey(permissionKey)
  const keys = await getAgencyPermissionKeys(agencyId)
  return keys.includes(key)
}

export const hasSubAccountPermission = async (
  subAccountId: string,
  permissionKey: string
): Promise<boolean> => {
  const key = normalizeKey(permissionKey)
  const keys = await getSubAccountPermissionKeys(subAccountId)
  return keys.includes(key)
}
