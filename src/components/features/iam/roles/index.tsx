/* =============================================================================
 * ROLES MANAGEMENT CLIENT COMPONENT
 * 
 * UI STRUCTURE:
 * ┌──────────────────────────────────────────────────────────────────────────┐
 * │ PAGE LAYOUT (Line ~230)                                                  │
 * │  ├─ SYSTEM ROLES CARD (Line ~233)                                       │
 * │  │   └─ Table: Name | Scope | Permissions | Users                       │
 * │  │                                                                       │
 * │  ├─ CUSTOM ROLES CARD (Line ~304)                                       │
 * │  │   ├─ "Add Role" Button                                               │
 * │  │   └─ Table: Name | Scope | Permissions | Users | Actions (Edit/Del) │
 * │  │                                                                       │
 * │  ├─ CREATE/EDIT DIALOG (Line ~364)                                      │
 * │  │   ├─ Header: Title + Description                                     │
 * │  │   ├─ Form: Role Name Input + Search Input                            │
 * │  │   ├─ Permissions Tabs:                                               │
 * │  │   │   ├─ "Simplified" Tab (Line ~418) - Toggle groups None/Read/...  │
 * │  │   │   └─ "Advanced" Tab (Line ~498) - Individual checkboxes          │
 * │  │   └─ Footer: Cancel + Create/Update buttons                          │
 * │  │                                                                       │
 * │  └─ DELETE CONFIRMATION DIALOG (Line ~558)                              │
 * └──────────────────────────────────────────────────────────────────────────┘
 * ============================================================================= */

'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'

import {
  createRole,
  updateRole,
  deleteRole,
  getAvailablePermissions,
} from '@/lib/features/iam/authz/actions/roles'
import type { PermissionInfo, RoleWithPermissions } from '@/lib/features/iam/authz/role-permissions'
import {
  buildPermissionBundles,
  inferGroupLevel,
  type PermissionBundleLevel,
} from '@/lib/features/iam/authz/permission-bundles'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { DataTable, DataTableColumnHeader, } from '@/components/global/data-table'
import { ColumnDef } from '@tanstack/react-table'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Plus, Pencil, Trash2, Shield, Lock, Users, Loader2, Crown, ShieldCheck, Edit3, Eye } from 'lucide-react'
import { toast } from 'sonner'
import { ScrollArea } from '@/components/ui/scroll-area'

// Helper to get role type indicator based on role name
const getRoleIndicator = (roleName: string) => {
  const name = roleName.toUpperCase()
  if (name.includes('OWNER')) {
    return { icon: Crown, color: 'text-amber-500', label: 'Owner', bg: 'bg-amber-500/10' }
  }
  if (name.includes('ADMIN')) {
    return { icon: ShieldCheck, color: 'text-blue-500', label: 'Admin', bg: 'bg-blue-500/10' }
  }
  if (name.includes('EDITOR') || name.includes('USER')) {
    return { icon: Edit3, color: 'text-green-500', label: 'Editor', bg: 'bg-green-500/10' }
  }
  if (name.includes('VIEWER') || name.includes('GUEST')) {
    return { icon: Eye, color: 'text-slate-500', label: 'Viewer', bg: 'bg-slate-500/10' }
  }
  return { icon: Shield, color: 'text-purple-500', label: 'Custom', bg: 'bg-purple-500/10' }
}

const formatSystemRoleName = (roleName: string) =>
  roleName
    .toLowerCase()
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')

const renderPermissionCount = (role: RoleWithPermissions) => (
  <span className="text-muted-foreground text-sm">{role.Permissions.length} permissions</span>
)

const renderUserCount = (role: RoleWithPermissions) => {
  const count = role._count.AgencyMemberships + role._count.SubAccountMemberships
  return (
    <div className="flex items-center justify-end gap-1">
      <Users className="h-4 w-4 text-muted-foreground" />
      <span className="text-sm">{count}</span>
    </div>
  )
}

interface RolesClientProps {
  agencyId: string
  initialRoles: RoleWithPermissions[]
}

export function RolesClient({ agencyId, initialRoles }: RolesClientProps) {
  const [roles, setRoles] = useState<RoleWithPermissions[]>(initialRoles)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [editingRole, setEditingRole] = useState<RoleWithPermissions | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<RoleWithPermissions | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Form state
  const [formName, setFormName] = useState('')
  const [formPermissionIds, setFormPermissionIds] = useState<string[]>([])
  const [permissionCategories, setPermissionCategories] = useState<
    { category: string; permissions: PermissionInfo[] }[]
  >([])

  const [permissionTab, setPermissionTab] = useState<'simplified' | 'advanced'>('simplified')
  const [permSearch, setPermSearch] = useState('')

  // Load permissions for form
  useEffect(() => {
    async function loadPermissions() {
      const result = await getAvailablePermissions({ agencyId })
      if (result.success) {
        setPermissionCategories(result.data)
      }
    }
    loadPermissions()
  }, [agencyId])

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (editingRole) {
      setFormName(editingRole.name)
      setFormPermissionIds(editingRole.Permissions.map((p) => p.Permission.id))
    } else {
      setFormName('')
      setFormPermissionIds([])
    }
  }, [editingRole, isDialogOpen])

  const bundleCategories = useMemo(() => {
    return buildPermissionBundles(permissionCategories)
  }, [permissionCategories])

  const selectedIdSet = useMemo(() => new Set(formPermissionIds), [formPermissionIds])

  const applyGroupLevel = useCallback(
    (group: { allIds: string[]; idsByLevel: Record<PermissionBundleLevel, string[]> }, level: PermissionBundleLevel) => {
      setFormPermissionIds((prev) => {
        const set = new Set(prev)
        // remove all ids from this group
        for (const id of group.allIds) set.delete(id)
        // add the selected level ids
        for (const id of group.idsByLevel[level]) set.add(id)
        return Array.from(set)
      })
    },
    []
  )

  const handleOpenCreate = useCallback(() => {
    setEditingRole(null)
    setIsDialogOpen(true)
  }, [])

  const handleOpenEdit = useCallback((role: RoleWithPermissions) => {
    setEditingRole(role)
    setIsDialogOpen(true)
  }, [])

  const handleOpenDelete = useCallback((role: RoleWithPermissions) => {
    setDeleteTarget(role)
    setIsDeleteDialogOpen(true)
  }, [])

  const handleSubmit = async () => {
    if (!formName.trim()) {
      toast.error('Please enter a role name')
      return
    }
    if (formPermissionIds.length === 0) {
      toast.error('Please select at least one permission')
      return
    }

    setIsLoading(true)
    try {
      if (editingRole) {
        // Update existing role
        const result = await updateRole(editingRole.id, {
          name: formName,
          permissionIds: formPermissionIds,
        })
        if (result.success) {
          setRoles((prev) =>
            prev.map((r) => (r.id === editingRole.id ? result.data : r))
          )
          toast.success('Role updated successfully')
          setIsDialogOpen(false)
        } else {
          toast.error(result.error)
        }
      } else {
        // Create new role
        const result = await createRole(agencyId, {
          name: formName,
          permissionIds: formPermissionIds,
          scope: 'AGENCY',
        })
        if (result.success) {
          setRoles((prev) => [...prev, result.data])
          toast.success('Role created successfully')
          setIsDialogOpen(false)
        } else {
          toast.error(result.error)
        }
      }
    } catch {
      toast.error('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return

    setIsLoading(true)
    try {
      const result = await deleteRole(deleteTarget.id)
      if (result.success) {
        setRoles((prev) => prev.filter((r) => r.id !== deleteTarget.id))
        toast.success('Role deleted successfully')
        setIsDeleteDialogOpen(false)
      } else {
        toast.error(result.error)
      }
    } catch {
      toast.error('An unexpected error occurred')
    } finally {
      setIsLoading(false)
      setDeleteTarget(null)
    }
  }

  const togglePermission = (permissionId: string) => {
    setFormPermissionIds((prev) =>
      prev.includes(permissionId)
        ? prev.filter((id) => id !== permissionId)
        : [...prev, permissionId]
    )
  }

  const systemRoles = useMemo(() => roles.filter((r) => r.isSystem), [roles])
  const customRoles = useMemo(() => roles.filter((r) => !r.isSystem), [roles])

  const systemRoleColumns: ColumnDef<RoleWithPermissions>[] = useMemo(
    () => [
      {
        accessorKey: 'name',
        header: 'Name',
        cell: ({ row }) => {
          const role = row.original
          const indicator = getRoleIndicator(role.name)
          const RoleIcon = indicator.icon
          const displayName = formatSystemRoleName(role.name)
          return (
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{displayName}</span>
              <div className={`flex items-center justify-center h-5 w-5 rounded ${indicator.bg}`}>
                <RoleIcon className={`h-3 w-3 ${indicator.color}`} />
              </div>
              <span className={`text-[10px] ${indicator.color}`}>{indicator.label}</span>
            </div>
          )
        },
      },
      { accessorKey: 'scope', header: 'Scope', cell: ({ row }) => <Badge variant="outline">{row.original.scope}</Badge> },
      { accessorKey: 'permissions', header: 'Permissions', cell: ({ row }) => renderPermissionCount(row.original) },
      { accessorKey: 'users', header: () => <div className="text-right">Users</div>, cell: ({ row }) => renderUserCount(row.original) },
      {
        id: 'actions',
        header: () => <div className="text-right">Actions</div>,
        cell: () => (
          <div className="flex items-center justify-end mr-2">
            <Lock className="h-4 w-4" />
          </div>
        ),
      },
    ],
    []
  )
  /* ---------------------------------------------------------------------------
   * CUSTOM ROLES COLUMN DEFINITIONS (inside component for handler access)
   * --------------------------------------------------------------------------- */
  const customRolesColumns: ColumnDef<RoleWithPermissions>[] = useMemo(() => [
    {
      accessorKey: 'name',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
      cell: ({ row }) => <span className="font-medium text-sm">{row.original.name}</span>,
    },
    {
      accessorKey: 'scope',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Scope" />,
      cell: ({ row }) => <Badge variant="outline">{row.original.scope}</Badge>,
    },
    {
      accessorKey: 'permissions',
      header: 'Permissions',
      cell: ({ row }) => renderPermissionCount(row.original),
    },
    {
      accessorKey: 'users',
      header: () => <div className="text-right">Users</div>,
      cell: ({ row }) => renderUserCount(row.original),
    },
    {
      id: 'actions',
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }) => {
        const role = row.original
        const hasUsers = role._count.AgencyMemberships + role._count.SubAccountMemberships > 0
        return (
          <div className="flex items-center justify-end gap-2">
            <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(role)}>
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleOpenDelete(role)}
              disabled={hasUsers}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )
      },
    },
  ], [handleOpenEdit, handleOpenDelete])

  /* ---------------------------------------------------------------------------
   * MAIN PAGE LAYOUT - Contains all visible cards
   * --------------------------------------------------------------------------- */
  return (
    <div className="space-y-4 w-full h-full">

      {/* =====================================================================
       * SYSTEM ROLES CARD
       * - Displays predefined roles (AGENCY_OWNER, AGENCY_ADMIN, etc.)
       * - Read-only: users cannot edit these
       * - Shows: icon + name, scope badge, permission count, user count
       * ===================================================================== */}
      <Card className="shadow-lg">
        <CardHeader className="px-4 pb-4 sm:px-6 sm:pb-6">
          <CardTitle className="flex items-center gap-2 text-lg sm:gap-3 sm:text-xl">
            <div className="bg-primary/10 ring-primary/20 rounded-lg p-1.5 ring-1 sm:p-2">
              <Shield className="text-primary h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            System Roles
          </CardTitle>
          <CardDescription className="text-sm sm:text-base">
            Predefined roles that cannot be modified.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 px-4 sm:space-y-8 sm:px-6">
          <DataTable
            columns={systemRoleColumns}
            data={systemRoles}
            showSearch={false}
            showColumnToggle={false}
            showPagination={false}
          />
        </CardContent>
      </Card>

      {/* =====================================================================
       * CUSTOM ROLES CARD  
       * - User-created agency-specific roles
       * - Editable: Edit button opens dialog, Delete removes role
       * - "Add Role" button in header opens create dialog
       * ===================================================================== */}
      <Card className="shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between px-4 pb-4 sm:px-6 sm:pb-6">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg sm:gap-3 sm:text-xl">
              <div className="bg-primary/10 ring-primary/20 rounded-lg p-1.5 ring-1 sm:p-2">
                <Users className="text-primary h-4 w-4 sm:h-5 sm:w-5" />
              </div>
              Custom Roles
            </CardTitle>
            <CardDescription className="text-sm sm:text-base">
              Agency-specific roles you can create and manage.
            </CardDescription>
          </div>
          <Button size="sm" onClick={handleOpenCreate}>
            <Plus className="mr-2 h-3.5 w-3.5" />
            Add Role
          </Button>
        </CardHeader>
        <CardContent className="space-y-6 px-4 sm:space-y-8 sm:px-6">
          <DataTable
            columns={customRolesColumns}
            data={customRoles}
            showSearch={false}
            showColumnToggle={false}
            showPagination={false}
          />
        </CardContent>
      </Card>

      {/* =====================================================================
       * CREATE/EDIT ROLE DIALOG (Modal)
       * Opens when: "Add Role" clicked OR Edit icon clicked on custom role
       * 
       * DIALOG STRUCTURE:
       * ┌─ DialogHeader: Title + Description ─────────────────────────────┐
       * ├─ Role Name Input + Search Input ────────────────────────────────┤
       * ├─ Permissions Section ───────────────────────────────────────────┤
       * │   ├─ Tabs: [Simplified] [Advanced]                              │
       * │   ├─ Simplified Tab: ToggleGroups (None/Read/Write/Manage)      │
       * │   └─ Advanced Tab: Individual permission checkboxes             │
       * ├─ Selected count text ───────────────────────────────────────────┤
       * └─ DialogFooter: Cancel + Create/Update buttons ──────────────────┘
       * ===================================================================== */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-[min(960px,calc(100vw-2rem))] h-[min(860px,calc(100svh-2rem))] flex flex-col">
          <DialogHeader className="px-6 py-4 shrink-0">
            <DialogTitle>{editingRole ? 'Edit Role' : 'Create Role'}</DialogTitle>
            <DialogDescription>
              {editingRole
                ? 'Modify the role name and permissions.'
                : 'Create a new custom role with specific permissions.'}
            </DialogDescription>
          </DialogHeader>
          <div className="col-span-3 flex items-center space-x-4 px-4 mb-4">
            <div className="flex-1 min-w-0">
              <Label htmlFor="roleName">Role Name</Label>
              <Input
                id="roleName"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g., Finance Manager"
              />
            </div>
            <div className="max-w-[250px] flex-1">
              <Label htmlFor="permSearch">Search Permissions</Label>
              <Input
                id="permSearch"
                value={permSearch}
                onChange={(e) => setPermSearch(e.target.value)}
                placeholder="Search…"
              />
            </div>
          </div>

          <div className="flex-1 min-h-0 flex flex-col space-y-2 px-4">
            <div className="flex items-end justify-between gap-3 shrink-0">
              <div className="space-y-1">
                <Label>Permissions</Label>
                <p className="text-muted-foreground text-xs">
                  Use “Simplified” for faster setup (Read/Write/Manage). Switch to “Advanced” for custom granular keys.
                </p>
              </div>

            </div>

            {/* ---------------------------------------------------------
             * TABS: Simplified vs Advanced permission selection
             * --------------------------------------------------------- */}
            <Tabs value={permissionTab} onValueChange={(v) => setPermissionTab(v as any)} className="flex-1 min-h-0 flex flex-col">
              <TabsList className="grid w-full grid-cols-2 shrink-0">
                <TabsTrigger value="simplified">Simplified</TabsTrigger>
                <TabsTrigger value="advanced">Advanced</TabsTrigger>
              </TabsList>

              {/* -------------------------------------------------------
               * SIMPLIFIED TAB
               * Shows permission groups with None/Read/Write/Manage toggles
               * Grouped by category (e.g., "General Ledger", "IAM")
               * ------------------------------------------------------- */}
              <TabsContent value="simplified" className="flex-1 min-h-0 mt-2">
                <ScrollArea className="h-full rounded-md border p-4">
                  {bundleCategories.map((cat) => {
                    const visibleGroups = cat.groups.filter((g) => {
                      if (!permSearch.trim()) return true
                      const q = permSearch.trim().toLowerCase()
                      return (
                        g.label.toLowerCase().includes(q) ||
                        g.id.toLowerCase().includes(q)
                      )
                    })
                    if (visibleGroups.length === 0) return null

                    return (
                      <div key={cat.categoryLabel} className="mb-6 border-[0.5px] border-muted/50 rounded-md p-2">
                        <div className="mb-2 flex items-center justify-between">
                          <h4 className="text-sm font-semibold">{cat.categoryLabel}</h4>
                          <Badge variant="secondary" className="text-[11px]">
                            {visibleGroups.length} group(s)
                          </Badge>
                        </div>

                        <div className="space-y-2">
                          {visibleGroups.map((group) => {
                            const level = inferGroupLevel({ group, selectedIds: selectedIdSet })
                            const showCustom = level === 'custom'
                            // Format: "fi.general_ledger.accounts" -> "Accounts"
                            const parts = group.id.split('.')
                            const feature = parts[2] ?? parts[1] ?? group.id
                            const displayLabel = feature.replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase())

                            return (
                              <div
                                key={group.id}
                                className="flex items-center justify-between gap-3 rounded-md px-4 py-1"
                              >
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2">
                                    <p className="truncate text-sm font-medium">{displayLabel}</p>
                                    {showCustom && (
                                      <Badge variant="outline" className="text-[11px]">
                                        Custom
                                      </Badge>
                                    )}
                                  </div>
                                </div>

                                <ToggleGroup
                                  type="single"
                                  value={showCustom ? 'custom' : (level as any)}
                                  onValueChange={(v) => {
                                    if (!v || v === 'custom') return
                                    applyGroupLevel(group, v as PermissionBundleLevel)
                                  }}
                                  className="justify-end py-1"
                                >
                                  <ToggleGroupItem value="none" aria-label="None" size='sm' variant={'default'} className='border-[0.5px] text-[13px] font-semibold h-8 w-20 py-2'>
                                    None
                                  </ToggleGroupItem>
                                  <ToggleGroupItem
                                    value="read"
                                    aria-label="Read"
                                    disabled={!group.available.read} size="sm" variant={'default'} className='border-[0.5px] text-[13px] font-semibold h-8 w-20'
                                  >
                                    Read
                                  </ToggleGroupItem>
                                  <ToggleGroupItem
                                    value="write"
                                    aria-label="Write"
                                    disabled={!group.available.write} size="sm" variant={'default'} className='border-[0.5px]  text-[13px] font-semibold h-8 w-20'
                                  >
                                    Write
                                  </ToggleGroupItem>
                                  <ToggleGroupItem
                                    value="manage"
                                    aria-label="Manage"
                                    disabled={!group.available.manage} size="sm" variant={'default'} className='border-[0.5px]  text-[13px] font-semibold h-8 w-20'
                                  >
                                    Manage
                                  </ToggleGroupItem>
                                  {showCustom && (
                                    <ToggleGroupItem value="custom" aria-label="Custom" disabled size="sm" variant={'default'} className='border-[0.5px]  text-[13px] font-semibold h-8 w-20'>
                                      Custom
                                    </ToggleGroupItem>
                                  )}
                                </ToggleGroup>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}

                  {permissionCategories.length === 0 && (
                    <p className="text-muted-foreground text-sm">Loading permissions...</p>
                  )}

                  {permissionCategories.length > 0 && bundleCategories.every((c) => c.groups.length === 0) && (
                    <p className="text-muted-foreground text-sm">No permission groups available.</p>
                  )}
                </ScrollArea>
              </TabsContent>

              {/* -------------------------------------------------------
               * ADVANCED TAB
               * Shows individual permission checkboxes
               * Format: "Read Accounts", "Create JournalEntries", etc.
               * ------------------------------------------------------- */}
              <TabsContent value="advanced" className="flex-1 min-h-0 mt-2">
                <ScrollArea className="h-full rounded-md border p-4">
                  {permissionCategories.map((category) => {
                    const perms = category.permissions.filter((perm) => {
                      if (!permSearch.trim()) return true
                      const q = permSearch.trim().toLowerCase()
                      return (
                        perm.key.toLowerCase().includes(q) ||
                        (perm.key.split('.').pop() ?? '').toLowerCase().includes(q)
                      )
                    })
                    if (perms.length === 0) return null

                    return (
                      <div key={category.category} className="mb-4">
                        <h4 className="mb-2 font-medium text-sm">{category.category}</h4>
                        <div className="grid grid-cols-2 gap-2">
                          {perms.map((perm) => {
                            // Format: module.submodule.feature.action → action.feature
                            const parts = perm.key.split('.')
                            const action = parts.pop() ?? ''
                            const feature = parts.pop() ?? ''
                            const label = `${action.charAt(0).toUpperCase() + action.slice(1)} ${feature.charAt(0).toUpperCase() + feature.slice(1)}`

                            return (
                              <div key={perm.id} className="flex items-start space-x-2">
                                <Checkbox
                                  id={perm.id}
                                  checked={formPermissionIds.includes(perm.id)}
                                  onCheckedChange={() => togglePermission(perm.id)}
                                />
                                <Label
                                  htmlFor={perm.id}
                                  className="cursor-pointer text-sm font-normal leading-snug"
                                >
                                  <span className="text-sm font-normal">{label}</span>
                                </Label>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                  {permissionCategories.length === 0 && (
                    <p className="text-muted-foreground text-sm">Loading permissions...</p>
                  )}
                </ScrollArea>
              </TabsContent>
            </Tabs>

            <p className="text-muted-foreground text-xs shrink-0">Selected: {formPermissionIds.length} permission(s)</p>
          </div>


          <DialogFooter className="px-6 py-4 shrink-0">
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingRole ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* =====================================================================
       * DELETE CONFIRMATION DIALOG
       * Opens when: Delete icon clicked on a custom role (with 0 users)
       * Disabled if role has assigned users (AgencyMemberships > 0)
       * ===================================================================== */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Role</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the role &quot;{deleteTarget?.name}&quot;?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
