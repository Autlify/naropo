'use client'

import clsx from 'clsx'
import { ColumnDef } from '@tanstack/react-table'
import {
  Agency,
  AgencySidebarOption,
  Prisma,
  Role,
  SubAccount,
  SubAccountMembership,
  User,
} from '@/generated/prisma/client'
import Image from 'next/image'

import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Copy, Edit, MoreHorizontal, Trash, UserCog } from 'lucide-react'
import { useModal } from '@/providers/modal-provider'
import UserDetails from '@/components/forms/user-details'
import RoleAssignmentForm from '@/components/forms/role-assignment-form'

import { deleteUser, getUser, hasPermission, getRolesByScope } from '@/lib/queries'
import { useToast } from '@/components/ui/use-toast'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { UsersWithAgencySubAccountPermissionsSidebarOptions } from '@/lib/types'
import CustomModal from '@/components/global/custom-modal'

export const columns: ColumnDef<UsersWithAgencySubAccountPermissionsSidebarOptions>[] =
  [
    {
      accessorKey: 'id',
      header: '',
      cell: () => {
        return null
      },
    },
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => {
        const avatarUrl = row.getValue('avatarUrl') as string
        return (
          <div className="flex items-center gap-4">
            <div className="h-11 w-11 relative flex-none">
              <Image
                src={avatarUrl || '/assets/autlify-logo.svg'}
                fill
                className="rounded-full object-cover"
                alt="avatar image"
              />
            </div>
            <span>{row.getValue('name')}</span>
          </div>
        )
      },
    },
    {
      accessorKey: 'avatarUrl',
      header: '',
      cell: () => {
        return null
      },
    },
    { accessorKey: 'email', header: 'Email' },

    {
      accessorKey: 'SubAccount',
      header: 'Owned Accounts',
      cell: ({ row }) => {
        const agencyMembership = row.original?.AgencyMemberships?.[0]
        const isAgencyOwner = agencyMembership?.Role?.name === 'AGENCY_OWNER'
        const subAccountMemberships = row.original?.SubAccountMemberships?.filter(
          (m: SubAccountMembership) => m.isActive
        ) || []

        if (isAgencyOwner)
          return (
            <div className="flex flex-col items-start">
              <div className="flex flex-col gap-2">
                <Badge className="bg-slate-600 whitespace-nowrap">
                  Agency - {agencyMembership?.Agency?.name || 'Unknown'}
                </Badge>
              </div>
            </div>
          )
        return (
          <div className="flex flex-col items-start">
            <div className="flex flex-col gap-2">
              {subAccountMemberships?.length ? (
                subAccountMemberships.map((membership: any) => (
                  <Badge
                    key={membership.id}
                    className="bg-slate-600 w-fit whitespace-nowrap"
                  >
                    Sub Account - {membership.SubAccount?.name || 'Unknown'}
                  </Badge>
                ))
              ) : (
                <div className="text-muted-foreground">No Access Yet</div>
              )}
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: 'role',
      header: 'Role',
      cell: ({ row }) => {
        const agencyMembership = row.original?.AgencyMemberships?.[0]
        const subAccountMembership = row.original?.SubAccountMemberships?.[0]
        const role = agencyMembership?.Role?.name || subAccountMembership?.Role?.name || 'NO_ROLE'
        return (
          <Badge
            className={clsx({
              'bg-emerald-500': role === 'AGENCY_OWNER',
              'bg-orange-400': role === 'AGENCY_ADMIN',
              'bg-primary': role === 'SUBACCOUNT_USER',
              'bg-muted': role === 'SUBACCOUNT_GUEST',
            })}
          >
            {role}
          </Badge>
        )
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const rowData = row.original

        return <CellActions rowData={rowData} />
      },
    },
  ]

interface CellActionsProps {
  rowData: UsersWithAgencySubAccountPermissionsSidebarOptions
}

const CellActions: React.FC<CellActionsProps> = ({ rowData }) => {
  const { data, setOpen } = useModal()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [canManageTeam, setCanManageTeam] = useState(false)
  const router = useRouter()
  
  useEffect(() => {
    const checkPermission = async () => {
      const hasManagePermission = await hasPermission('org.agency.team_member.remove')
      setCanManageTeam(hasManagePermission)
    }
    checkPermission()
  }, [])
  
  if (!rowData) return
  
  const agencyMembership = rowData.AgencyMemberships?.[0]
  if (!agencyMembership) return
  
  const isAgencyOwner = agencyMembership?.Role?.name === 'AGENCY_OWNER'

  return (
    <AlertDialog>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="h-8 w-8 p-0"
          >
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuItem
            className="flex gap-2"
            onClick={() => navigator.clipboard.writeText(rowData?.email)}
          >
            <Copy size={15} /> Copy Email
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="flex gap-2"
            onClick={() => {
              setOpen(
                <CustomModal
                  subheading="You can change permissions only when the user has an owned subaccount"
                  title="Edit User Details"
                >
                  <UserDetails
                    type="agency"
                    id={agencyMembership?.Agency?.id || null}
                    subAccounts={agencyMembership?.Agency?.SubAccount}
                  />
                </CustomModal>,
                async () => {
                  return { user: await getUser(rowData?.id) }
                }
              )
            }}
          >
            <Edit size={15} />
            Edit Details
          </DropdownMenuItem>
          {canManageTeam && !isAgencyOwner && (
            <DropdownMenuItem
              className="flex gap-2"
              onClick={async () => {
                // Fetch available roles (system + agency-scoped)
                const roles = await getRolesByScope('AGENCY', agencyMembership?.Agency?.id)
                
                setOpen(
                  <CustomModal
                    subheading="Assign a new role to change the user's permissions within this agency"
                    title="Change User Role"
                  >
                    <RoleAssignmentForm
                      userId={rowData.id}
                      agencyId={agencyMembership?.Agency?.id || ''}
                      currentRole={agencyMembership?.Role}
                      availableRoles={roles}
                      onSuccess={() => {
                        router.refresh()
                        setOpen(null)
                      }}
                    />
                  </CustomModal>
                )
              }}
            >
              <UserCog size={15} />
              Change Role
            </DropdownMenuItem>
          )}
          {canManageTeam && !isAgencyOwner && (
            <AlertDialogTrigger asChild>
              <DropdownMenuItem
                className="flex gap-2"
                onClick={() => {}}
              >
                <Trash size={15} /> Remove User
              </DropdownMenuItem>
            </AlertDialogTrigger>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="text-left">
            Are you absolutely sure?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-left">
            This action cannot be undone. This will permanently delete the user
            and related data.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex items-center">
          <AlertDialogCancel className="mb-2">Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={loading}
            className="bg-destructive hover:bg-destructive"
            onClick={async () => {
              setLoading(true)
              await deleteUser(rowData.id)
              toast({
                title: 'Deleted User',
                description:
                  'The user has been deleted from this agency they no longer have access to the agency',
              })
              setLoading(false)
              router.refresh()
            }}
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
