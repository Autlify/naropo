'use server'

import { db } from '@/lib/db'
import { auth } from '@/auth'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import type { RoleScope } from '@/generated/prisma/client'
import { resolveEffectiveEntitlements } from '@/lib/features/org/billing/entitlements/resolve'
import { getPermissionCatalogSeeds } from '@/lib/features/iam/authz/permission-catalog'
import { isPermissionAssignable } from '@/lib/features/iam/authz/permission-entitlements'
import { invalidateAccessSnapshotsByRoleId } from '@/lib/features/iam/authz/access-snapshot'
import {
  type PermissionInfo,
  type RoleWithPermissions,
  type RoleBase,
  roleSelect,
  fetchRolePermissionsByRoleIds,
  attachPermissions,
  getRoleWithPermissions,
} from '@/lib/features/iam/authz/role-permissions'
import type { ActionKey } from '@/lib/registry'

// ============================================================================
// TYPES
// ============================================================================

export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string }

// ============================================================================
// ENTITLEMENT VALIDATION (Server-side)
// ============================================================================

async function getAssignablePermissionSeeds(args: {
  agencyId: string
  subAccountId: string | null
  scope: 'AGENCY' | 'SUBACCOUNT'
}) {
  const entitlements = await resolveEffectiveEntitlements({
    scope: args.scope,
    agencyId: args.agencyId,
    subAccountId: args.subAccountId,
  })

  const seeds = getPermissionCatalogSeeds()
  return seeds.filter((s) => isPermissionAssignable(s.key, entitlements))
}

async function getAssignablePermissionKeySet(args: {
  agencyId: string
  subAccountId: string | null
  scope: 'AGENCY' | 'SUBACCOUNT'
}): Promise<Set<ActionKey>> {
  const assignableSeeds = await getAssignablePermissionSeeds(args)
  return new Set(assignableSeeds.map((s) => s.key))
}

async function validatePermissionIdsEntitled(params: {
  agencyId: string
  subAccountId: string | null
  scope: 'AGENCY' | 'SUBACCOUNT'
  permissionIds: string[]
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const rows = await db.permission.findMany({
    where: { id: { in: params.permissionIds } },
    select: { id: true, key: true },
  })

  if (rows.length !== params.permissionIds.length) {
    return { ok: false, error: 'One or more selected permissions are invalid.' }
  }

  const assignable = await getAssignablePermissionKeySet({
    agencyId: params.agencyId,
    subAccountId: params.subAccountId,
    scope: params.scope,
  })

  const invalid = rows
    .map((r) => r.key as ActionKey)
    .filter((k) => !assignable.has(k))

  if (invalid.length) {
    // Keep message short; don't leak internal pricing details.
    return { ok: false, error: 'Some selected permissions are not available under your current plan/add-ons.' }
  }

  return { ok: true }
}

// ============================================================================
// SCHEMAS
// ============================================================================

const createRoleSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50),
  permissionIds: z.array(z.string()).min(1, 'At least one permission required'),
  scope: z.enum(['AGENCY', 'SUBACCOUNT']).default('AGENCY'),
})

const updateRoleSchema = z.object({
  name: z.string().min(2).max(50).optional(),
  permissionIds: z.array(z.string()).optional(),
})

// ============================================================================
// QUERIES
// ============================================================================

function groupPermissionsByCategory(permissions: PermissionInfo[]) {
  const grouped = new Map<string, PermissionInfo[]>()
  for (const perm of permissions) {
    const parts = perm.key.split('.')
    const category = parts.slice(0, 2).join('.')
    const list = grouped.get(category) ?? []
    list.push(perm)
    grouped.set(category, list)
  }

  return Array.from(grouped.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([category, perms]) => ({
      category: formatCategory(category),
      permissions: perms,
    }))
}

/**
 * List all roles for an agency (system roles + custom agency roles)
 */
export async function listRoles(agencyId: string): Promise<ActionResult<RoleWithPermissions[]>> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' }
    }

    const roles = await db.role.findMany({
      where: {
        OR: [
          { isSystem: true }, // All system roles (shared)
          { agencyId: agencyId }, // Agency-specific custom roles
        ],
      },
      select: roleSelect,
      orderBy: [
        { isSystem: 'desc' }, // System roles first
        { name: 'asc' },
      ],
    })

    const permissionsMap = await fetchRolePermissionsByRoleIds(roles.map((r) => r.id))
    return { success: true, data: attachPermissions(roles as RoleBase[], permissionsMap) }
  } catch (error) {
    console.error('Error listing roles:', error)
    return { success: false, error: 'Failed to load roles' }
  }
}

/**
 * Get a single role by ID
 */
export async function getRole(roleId: string): Promise<ActionResult<RoleWithPermissions>> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' }
    }

    const role = await getRoleWithPermissions(roleId)

    if (!role) {
      return { success: false, error: 'Role not found' }
    }

    return { success: true, data: role }
  } catch (error) {
    console.error('Error getting role:', error)
    return { success: false, error: 'Failed to load role' }
  }
}

/**
 * List all available permissions from database
 */
export async function listPermissions(): Promise<ActionResult<PermissionInfo[]>> {
  try {
    const permissions = await db.permission.findMany({
      orderBy: { key: 'asc' },
    })
    return { success: true, data: permissions as PermissionInfo[] }
  } catch (error) {
    console.error('Error listing permissions:', error)
    return { success: false, error: 'Failed to load permissions' }
  }
}

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Create a new custom role for an agency
 */
export async function createRole(
  agencyId: string,
  data: z.infer<typeof createRoleSchema>
): Promise<ActionResult<RoleWithPermissions>> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' }
    }

    // Validate input
    const validated = createRoleSchema.safeParse(data)
    if (!validated.success) {
      return { success: false, error: validated.error.issues[0]?.message ?? 'Invalid input' }
    }

    // Check for duplicate name in this agency
    const existing = await db.role.findFirst({
      where: {
        name: validated.data.name,
        OR: [{ isSystem: true }, { agencyId }],
      },
    })

    if (existing) {
      return { success: false, error: 'A role with this name already exists' }
    }

    // Server-side entitlement validation (do not rely only on UI filtering).
    const entitlementCheck = await validatePermissionIdsEntitled({
      agencyId,
      subAccountId: null,
      scope: validated.data.scope as any,
      permissionIds: validated.data.permissionIds,
    })
    if (!entitlementCheck.ok) {
      return { success: false, error: entitlementCheck.error }
    }

    // TODO: Check plan limits for custom roles
    // const customRoleCount = await db.role.count({ where: { agencyId, isSystem: false } })
    // if (customRoleCount >= plan.maxCustomRoles) {
    //   return { success: false, error: 'Custom role limit reached' }
    // }

    // Create role with permissions in transaction
    const roleId = await db.$transaction(async (tx) => {
      const newRole = await tx.role.create({
        data: {
          name: validated.data.name,
          scope: validated.data.scope as RoleScope,
          isSystem: false,
          agencyId,
        },
      })

      // Create permission assignments
      await tx.rolePermission.createMany({
        data: validated.data.permissionIds.map((permissionId) => ({
          roleId: newRole.id,
          permissionId,
          granted: true,
        })),
      })

      return newRole.id
    })

    const role = await getRoleWithPermissions(roleId)
    if (!role) {
      return { success: false, error: 'Failed to create role' }
    }

    revalidatePath(`/agency/${agencyId}/settings/roles`)
    return { success: true, data: role as RoleWithPermissions }
  } catch (error) {
    console.error('Error creating role:', error)
    return { success: false, error: 'Failed to create role' }
  }
}

/**
 * Update a custom role (system roles cannot be modified)
 */
export async function updateRole(
  roleId: string,
  data: z.infer<typeof updateRoleSchema>
): Promise<ActionResult<RoleWithPermissions>> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' }
    }

    // Get existing role
    const existingRole = await db.role.findUnique({
      where: { id: roleId },
      select: {
        id: true,
        name: true,
        agencyId: true,
        subAccountId: true,
        scope: true,
        isSystem: true,
      },
    })

    if (!existingRole) {
      return { success: false, error: 'Role not found' }
    }

    // Block modification of system roles
    if (existingRole.isSystem) {
      return { success: false, error: 'System roles cannot be modified' }
    }

    // Validate input
    const validated = updateRoleSchema.safeParse(data)
    if (!validated.success) {
      return { success: false, error: validated.error.issues[0]?.message ?? 'Invalid input' }
    }

    // Server-side entitlement validation (do not rely only on UI filtering).
    if (validated.data.permissionIds) {
      if (!existingRole.agencyId) {
        return { success: false, error: 'Missing agency context' }
      }

      const entitlementCheck = await validatePermissionIdsEntitled({
        agencyId: existingRole.agencyId,
        subAccountId: existingRole.subAccountId ?? null,
        scope: existingRole.scope as any,
        permissionIds: validated.data.permissionIds,
      })

      if (!entitlementCheck.ok) {
        return { success: false, error: entitlementCheck.error }
      }
    }

    // Check for duplicate name if changing name
    if (validated.data.name && validated.data.name !== existingRole.name) {
      const duplicate = await db.role.findFirst({
        where: {
          name: validated.data.name,
          OR: [{ isSystem: true }, { agencyId: existingRole.agencyId }],
          NOT: { id: roleId },
        },
      })

      if (duplicate) {
        return { success: false, error: 'A role with this name already exists' }
      }
    }

    // Update role in transaction
    await db.$transaction(async (tx) => {
      // Update name if provided
      if (validated.data.name) {
        await tx.role.update({
          where: { id: roleId },
          data: { name: validated.data.name },
        })
      }

      // Update permissions if provided
      if (validated.data.permissionIds) {
        // Delete existing permissions
        await tx.rolePermission.deleteMany({
          where: { roleId },
        })

        // Create new permissions
        await tx.rolePermission.createMany({
          data: validated.data.permissionIds.map((permissionId) => ({
            roleId,
            permissionId,
            granted: true,
          })),
        })
      }
    })

    const role = await getRoleWithPermissions(roleId)
    if (!role) {
      return { success: false, error: 'Failed to update role' }
    }

    if (validated.data.permissionIds) {
      await invalidateAccessSnapshotsByRoleId(roleId)
    }

    revalidatePath(`/agency/${existingRole.agencyId}/settings/roles`)
    return { success: true, data: role }
  } catch (error) {
    console.error('Error updating role:', error)
    return { success: false, error: 'Failed to update role' }
  }
}

/**
 * Delete a custom role (system roles cannot be deleted)
 */
export async function deleteRole(roleId: string): Promise<ActionResult> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' }
    }

    // Get existing role
    const existingRole = await db.role.findUnique({
      where: { id: roleId },
      include: {
        _count: {
          select: { AgencyMemberships: true, SubAccountMemberships: true },
        },
      },
    })

    if (!existingRole) {
      return { success: false, error: 'Role not found' }
    }

    // Block deletion of system roles
    if (existingRole.isSystem) {
      return { success: false, error: 'System roles cannot be deleted' }
    }

    // Check if role is in use
    const totalAssignments = existingRole._count.AgencyMemberships + existingRole._count.SubAccountMemberships
    if (totalAssignments > 0) {
      return {
        success: false,
        error: `Cannot delete role: ${totalAssignments} user(s) are assigned to this role`,
      }
    }

    // Delete role (RolePermission cascade deletes)
    await db.role.delete({
      where: { id: roleId },
    })

    await invalidateAccessSnapshotsByRoleId(existingRole.id)

    revalidatePath(`/agency/${existingRole.agencyId}/settings/roles`)
    return { success: true, data: undefined }
  } catch (error) {
    console.error('Error deleting role:', error)
    return { success: false, error: 'Failed to delete role' }
  }
}

// ============================================================================
// PERMISSION REGISTRY (Grouped for UI)
// ============================================================================

/**
 * Get available permissions organized by category (for role form).
 * 
 * - If a context is provided (agencyId or subAccountId), filters by (subscription + add-ons) entitlements.
 * - If called without args, falls back to all permissions currently present in DB.
 */
export async function getAvailablePermissions(
  ctx?: AvailablePermissionsContext | string
): Promise<ActionResult<{ category: string; permissions: PermissionInfo[] }[]>> {
  try {
    if (typeof ctx === 'string') {
      // convenience: getAvailablePermissions(subAccountId)
      return getAvailablePermissionsForSubAccount(ctx)
    }
    if (ctx?.agencyId || ctx?.subAccountId) {
      return getAvailablePermissionsForContext(ctx)
    }

    // Backwards-compatible default: return all permissions from DB if no context is provided.
    const permissions = await db.permission.findMany({ orderBy: { key: 'asc' } })
    return { success: true, data: groupPermissionsByCategory(permissions as PermissionInfo[]) }
  } catch (error) {
    console.error('Error getting permissions:', error)
    return { success: false, error: 'Failed to load permissions' }
  }
}

export type AvailablePermissionsContext = {
  agencyId?: string
  subAccountId?: string | null
}

/**
 * Context-aware permission catalog:
 * Returns only permissions that are assignable under (subscription + add-ons) for the given scope.
 */
export async function getAvailablePermissionsForContext(
  ctx: AvailablePermissionsContext
): Promise<ActionResult<{ category: string; permissions: PermissionInfo[] }[]>> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' }
    }

    let agencyId = ctx.agencyId ?? null
    const subAccountId = ctx.subAccountId ?? null
    if (!agencyId && subAccountId) {
      const sa = await db.subAccount.findUnique({
        where: { id: subAccountId },
        select: { agencyId: true },
      })
      agencyId = sa?.agencyId ?? null
    }

    if (!agencyId) {
      return { success: false, error: 'Missing agency context' }
    }

    const scope = subAccountId ? ('SUBACCOUNT' as any) : ('AGENCY' as any)
    // Start from registry catalog to avoid “membership-used only” key gaps.
    const assignableSeeds = await getAssignablePermissionSeeds({
      scope,
      agencyId,
      subAccountId,
    })
    if (assignableSeeds.length === 0) {
      return { success: true, data: [] }
    }
    const assignableKeys = assignableSeeds.map((s) => s.key)

    // Ensure DB has the assignable keys so UI can work with permission IDs.
    await db.permission.createMany({
      data: assignableSeeds.map((s) => ({
        key: s.key,
        name: s.name,
        description: s.description,
        category: s.category,
        isSystem: s.isSystem,
      })),
      skipDuplicates: true,
    })

    const permissions = await db.permission.findMany({
      where: { key: { in: assignableKeys } },
      orderBy: { key: 'asc' },
    })

    return { success: true, data: groupPermissionsByCategory(permissions as PermissionInfo[]) }
  } catch (error) {
    console.error('Error getting context-aware permissions:', error)
    return { success: false, error: 'Failed to load permissions' }
  }
}

export async function getAvailablePermissionsForAgency(
  agencyId: string
): Promise<ActionResult<{ category: string; permissions: PermissionInfo[] }[]>> {
  return getAvailablePermissionsForContext({ agencyId, subAccountId: null })
}

export async function getAvailablePermissionsForSubAccount(
  subAccountId: string
): Promise<ActionResult<{ category: string; permissions: PermissionInfo[] }[]>> {
  return getAvailablePermissionsForContext({ subAccountId })
}

function formatCategory(key: string): string {
  const map: Record<string, string> = {
    'org.agency': 'Core - Agency',
    'org.subaccount': 'Core - SubAccounts',
    'org.billing': 'Billing',
    'org.apps': 'Apps',
    crm: 'CRM',
    fi: 'FI',
    'fi.general_ledger': 'FI - General Ledger',
    'fi.accounts_receivable': 'FI - Accounts Receivable',
    'fi.accounts_payable': 'FI - Accounts Payable',
    'fi.bank_ledger': 'FI - Bank Ledger',
    'co.controlling': 'FI - Controlling',
    'fi.advanced_reporting': 'FI - Advanced Reporting',
    co: 'CO - Controlling',
    'co.cost_centers': 'CO - Cost Centers',
    'co.profit_centers': 'CO - Profit Centers',
    'co.internal_orders': 'CO - Internal Orders',
    'co.profitability': 'CO - Profitability Analysis',
    'co.budgets': 'CO - Budgeting',
    iam: 'IAM - Security',
  }
  return map[key] ?? key.replace(/\./g, ' - ').replace(/\b\w/g, (c) => c.toUpperCase())
}
