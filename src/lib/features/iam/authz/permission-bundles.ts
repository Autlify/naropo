/* =============================================================================
 * PERMISSION BUNDLES
 * Groups granular permissions into simplified Read/Write/Manage levels
 * 
 * FILE STRUCTURE:
 * ├─ TYPES (Lines ~8-30) ─────────────────────────────────────────────────────┤
 * │   PermissionBundleLevel, PermissionInfoLike, PermissionBundleGroup, etc.  │
 * ├─ ACTION SETS (Lines ~32-48) ──────────────────────────────────────────────┤
 * │   READ_ACTIONS, WRITE_ACTIONS, MANAGE_ACTIONS - classify actions by level │
 * ├─ HELPER FUNCTIONS (Lines ~50-80) ─────────────────────────────────────────┤
 * │   titleize(), inferBundleGroupId(), inferBundleGroupLabel(), actionOf()   │
 * ├─ buildPermissionBundles() (Lines ~82-160) ────────────────────────────────┤
 * │   Main function: transforms flat permissions into grouped categories      │
 * └─ inferGroupLevel() (Lines ~162-180) ──────────────────────────────────────┤
 *     Determines current level (none/read/write/manage/custom) from selection │
 * ============================================================================= */

import type { ActionKey } from '@/lib/registry'

/* ---------------------------------------------------------------------------
 * TYPES
 * --------------------------------------------------------------------------- */
export type PermissionBundleLevel = 'none' | 'read' | 'write' | 'manage'

export type PermissionInfoLike = {
  id: string
  key: ActionKey
  description?: string | null
}

export type PermissionBundleGroup = {
  /** A stable identifier based on key prefix (usually first 3 segments). */
  id: string
  /** Human label inferred from prefix. */
  label: string
  /** All permissions belonging to this group (DB IDs). */
  allIds: string[]
  /** Mapping from level -> permission IDs that should be granted for that level. */
  idsByLevel: Record<PermissionBundleLevel, string[]>
  /** Whether a level is meaningful for this group (non-empty mapping). */
  available: Record<PermissionBundleLevel, boolean>
}

export type PermissionBundleCategory = {
  /** Display label (already formatted by server for UI). */
  categoryLabel: string
  groups: PermissionBundleGroup[]
}

/* ---------------------------------------------------------------------------
 * ACTION CLASSIFICATION SETS
 * Used to categorize permission actions into Read/Write/Manage levels
 * --------------------------------------------------------------------------- */
const READ_ACTIONS = new Set(['view', 'read', 'list', 'get'])
const WRITE_ACTIONS = new Set([
  'create',
  'update',
  'delete',
  'invite',
  'remove',
  'assign',
  'revoke',
  'install',
  'uninstall',
  'consume',
  'close',
  'run',
  'simulate',
  'toggle',
])
const MANAGE_ACTIONS = new Set(['manage', 'admin', 'owner', 'configure'])

/* ---------------------------------------------------------------------------
 * HELPER FUNCTIONS
 * --------------------------------------------------------------------------- */

/** Convert snake_case/kebab-case to Title Case */
function titleize(s: string): string {
  return s
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

/**
 * Groups permission keys by their “resource prefix”.
 *
 * Example:
 *   core.billing.payment_methods.read  -> core.billing.payment_methods
 *   iam.authZ.roles.update             -> iam.authZ.roles
 */
export function inferBundleGroupId(permissionKey: ActionKey): string {
  const parts = String(permissionKey).split('.')
  if (parts.length <= 3) return parts.slice(0, 2).join('.')
  return parts.slice(0, 3).join('.')
}

/**
 * Generate human-readable label from group ID.
 * Example: "iam.authZ.roles" -> "Roles"
 *          "fi.general_ledger.accounts" -> "Accounts"
 */
export function inferBundleGroupLabel(groupId: string): string {
  const parts = groupId.split('.') 
  const resource = parts[2] ?? parts[1] ?? groupId
  return titleize(resource)
}

/** Extract action (last segment) from permission key */
function actionOf(permissionKey: ActionKey): string {
  const parts = String(permissionKey).split('.')

  return parts[parts.length - 1] ?? ''
}

/* ---------------------------------------------------------------------------
 * MAIN BUNDLE BUILDER
 * Transforms flat permission list into grouped categories with levels
 * --------------------------------------------------------------------------- */

/**
 * Build simplified permission bundles from an already entitlement-filtered catalog.
 *
 * Input shape matches `getAvailablePermissions()` result:
 *   [{ category: 'Billing', permissions: [{id, key}, ...] }]
 */
export function buildPermissionBundles(input: {
  category: string
  permissions: PermissionInfoLike[]
}[]): PermissionBundleCategory[] {
  const categories: PermissionBundleCategory[] = []

  for (const cat of input) {
    const groupsMap = new Map<string, PermissionInfoLike[]>()
    for (const perm of cat.permissions) {
      const gid = inferBundleGroupId(perm.key)
      const arr = groupsMap.get(gid) ?? []
      arr.push(perm) 
      groupsMap.set(gid, arr) // e.g., initialize if not present
    }

    const groups: PermissionBundleGroup[] = []
    for (const [groupId, perms] of groupsMap.entries()) {
      const byAction = {
        read: [] as PermissionInfoLike[],
        write: [] as PermissionInfoLike[],
        manage: [] as PermissionInfoLike[],
        other: [] as PermissionInfoLike[],
      }

      for (const perm of perms) {
        const a = actionOf(perm.key)
        if (MANAGE_ACTIONS.has(a)) byAction.manage.push(perm)
        else if (READ_ACTIONS.has(a)) byAction.read.push(perm)
        else if (WRITE_ACTIONS.has(a)) byAction.write.push(perm)
        else byAction.other.push(perm)
      }

      const all = perms
        .slice()
        .sort((a, b) => String(a.key).localeCompare(String(b.key)))
        .map((p) => p.id)

      const readIds = byAction.read
        .slice()
        .sort((a, b) => String(a.key).localeCompare(String(b.key)))
        .map((p) => p.id)

      const writeIds = [...byAction.read, ...byAction.write]
        .slice()
        .sort((a, b) => String(a.key).localeCompare(String(b.key)))
        .map((p) => p.id)

      // “manage” = everything in this group (including manage keys and “other”).
      const manageIds = all

      const idsByLevel: Record<PermissionBundleLevel, string[]> = {
        none: [],
        read: readIds,
        write: writeIds,
        manage: manageIds,
      }

      const available: Record<PermissionBundleLevel, boolean> = {
        none: true,
        read: readIds.length > 0,
        write: writeIds.length > 0,
        manage: manageIds.length > 0,
      }

      groups.push({
        id: groupId,
        label: inferBundleGroupLabel(groupId),
        allIds: all,
        idsByLevel,
        available,
      })
    }

    groups.sort((a, b) => a.id.localeCompare(b.id))
    categories.push({ categoryLabel: cat.category, groups })
  }

  return categories
}

/* ---------------------------------------------------------------------------
 * LEVEL INFERENCE
 * Determines what simplified level matches the current selection
 * --------------------------------------------------------------------------- */

/**
 * Infer the current simplified level for a group based on selected permission IDs.
 * If selection is partial (doesn't match a known level), returns 'custom'.
 */
export function inferGroupLevel(params: {
  group: PermissionBundleGroup
  selectedIds: Set<string>
}): PermissionBundleLevel | 'custom' {
  const { group, selectedIds } = params

  const hasAnyFromGroup = group.allIds.some((id) => selectedIds.has(id))
  if (!hasAnyFromGroup) return 'none'

  const eq = (a: string[]) => a.every((id) => selectedIds.has(id))

  if (group.idsByLevel.manage.length && eq(group.idsByLevel.manage)) return 'manage'
  if (group.idsByLevel.write.length && eq(group.idsByLevel.write)) return 'write'
  if (group.idsByLevel.read.length && eq(group.idsByLevel.read)) return 'read'

  return 'custom'
}
