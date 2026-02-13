import 'server-only'

import { cache } from 'react'
import { db } from '@/lib/db'
import type { RoleScope } from '@/generated/prisma/client'
import type { ActionKey } from '@/lib/registry'

export type PermissionInfo = {
  id: string
  key: ActionKey
  description: string | null
}

export type RoleWithPermissions = {
  id: string
  name: string
  agencyId: string | null
  subAccountId: string | null
  scope: RoleScope
  isSystem: boolean
  createdAt: Date
  updatedAt: Date
  Permissions: { Permission: PermissionInfo; granted: boolean }[]
  _count: { AgencyMemberships: number; SubAccountMemberships: number }
}

export type RoleBase = Omit<RoleWithPermissions, 'Permissions'>
type RolePermissions = RoleWithPermissions['Permissions']

export const roleSelect = {
  id: true,
  name: true,
  agencyId: true,
  subAccountId: true,
  scope: true,
  isSystem: true,
  createdAt: true,
  updatedAt: true,
  _count: {
    select: { AgencyMemberships: true, SubAccountMemberships: true },
  },
}

const fetchRolePermissionsByRoleIdsCached = cache(
  async (roleIdsKey: string): Promise<Map<string, RolePermissions>> => {
    const roleIds = roleIdsKey.length ? roleIdsKey.split(',') : []
    if (roleIds.length === 0) return new Map()

    const rows = await db.rolePermission.findMany({
      where: { roleId: { in: roleIds } },
      select: {
        roleId: true,
        granted: true,
        Permission: { select: { id: true, key: true, description: true } },
      },
    })

    const map = new Map<string, RolePermissions>()
    for (const row of rows) {
      const list = map.get(row.roleId) ?? []
      list.push({ Permission: row.Permission as PermissionInfo, granted: row.granted })
      map.set(row.roleId, list)
    }

    for (const list of map.values()) {
      list.sort((a, b) => String(a.Permission.key).localeCompare(String(b.Permission.key)))
    }

    return map
  }
)

export async function fetchRolePermissionsByRoleIds(
  roleIds: string[]
): Promise<Map<string, RolePermissions>> {
  const uniqueRoleIds = Array.from(new Set(roleIds.filter(Boolean))).sort()
  if (uniqueRoleIds.length === 0) return new Map()
  return fetchRolePermissionsByRoleIdsCached(uniqueRoleIds.join(','))
}

const getGrantedPermissionKeysForRoleCached = cache(
  async (roleId: string): Promise<ActionKey[]> => {
    const rows = await db.rolePermission.findMany({
      where: { roleId, granted: true },
      select: { Permission: { select: { key: true } } },
    })

    const unique = new Set<string>()
    for (const row of rows) unique.add(row.Permission.key)
    return Array.from(unique) as ActionKey[]
  }
)

export async function getGrantedPermissionKeysForRole(roleId: string): Promise<ActionKey[]> {
  if (!roleId) return []
  return getGrantedPermissionKeysForRoleCached(roleId)
}

export function attachPermissions(
  roles: RoleBase[],
  permissionsMap: Map<string, RolePermissions>
): RoleWithPermissions[] {
  return roles.map((role) => ({
    ...role,
    Permissions: permissionsMap.get(role.id) ?? [],
  }))
}

export async function getRoleWithPermissions(roleId: string): Promise<RoleWithPermissions | null> {
  const role = await db.role.findUnique({
    where: { id: roleId },
    select: roleSelect,
  })

  if (!role) return null

  const permissionsMap = await fetchRolePermissionsByRoleIds([roleId])
  return attachPermissions([role as RoleBase], permissionsMap)[0] ?? null
}

export async function hydrateRolesWithPermissions(roles: RoleBase[]): Promise<RoleWithPermissions[]> {
  const permissionsMap = await fetchRolePermissionsByRoleIds(roles.map((r) => r.id))
  return attachPermissions(roles, permissionsMap)
}
