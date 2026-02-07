'use client'
import {
  AuthUserWithAgencySigebarOptionsSubAccounts,
  UserWithPermissionsAndSubAccounts,
} from '@/lib/types'
import { useModal } from '@/providers/modal-provider'
import { SubAccount, User } from '@/generated/prisma/client'
import React, { useEffect, useState } from 'react'
import { useToast } from '../ui/use-toast'
import { useRouter } from 'next/navigation'
import {
  changeUserPermissions,
  getAuthUserDetails,
  getUserMemberships,
  saveActivityLogsNotification,
  updateUser,
  hasPermission,
} from '@/lib/queries'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../ui/card'

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import FileUpload from '../global/file-upload'
import { Input } from '../ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select'
import { Button } from '../ui/button'
import Loading from '../global/loading'
import { Separator } from '../ui/separator'
import { Switch } from '../ui/switch'
import { v4 } from 'uuid'

type Props = {
  id: string | null
  type: 'agency' | 'subaccount'
  userData?: Partial<User>
  subAccounts?: SubAccount[]
}

const UserDetails = ({ id, type, subAccounts, userData }: Props) => {
  const [subAccountPermissions, setSubAccountsPermissions] =
    useState<UserWithPermissionsAndSubAccounts | null>(null)

  const { data, setClose } = useModal()
  const [roleState, setRoleState] = useState('')
  const [loadingPermissions, setLoadingPermissions] = useState(false)
  const [authUserData, setAuthUserData] =
    useState<AuthUserWithAgencySigebarOptionsSubAccounts | null>(null)
  const [canManageTeam, setCanManageTeam] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  //Get authUSerDtails

  useEffect(() => {
    if (data.user) {
      const fetchDetails = async () => {
        const response = await getAuthUserDetails()
        if (response) setAuthUserData(response)
        
        // Check permission to manage team
        const hasManagePermission = await hasPermission('core.agency.team_member.invite')
        setCanManageTeam(hasManagePermission)
      }
      fetchDetails()
    }
  }, [data])

  const userDataSchema = z.object({
    name: z.string().min(1),
    email: z.string().email(),
    avatarUrl: z.string().nullable().optional(),
  })

  const form = useForm<z.infer<typeof userDataSchema>>({
    resolver: zodResolver(userDataSchema),
    mode: 'onChange',
    defaultValues: {
      name: (userData ? userData.name : data?.user?.name) || '',
      email: (userData ? userData.email : data?.user?.email) || '',
      avatarUrl: userData ? (userData.avatarUrl ?? undefined) : (data?.user?.avatarUrl ?? undefined),
    },
  })

  useEffect(() => {
    if (!data.user) return
    const getPermissions = async () => {
      if (!data.user) return
      const permission = await getUserMemberships(data.user.id)
      setSubAccountsPermissions(permission)
    }
    getPermissions()
  }, [data, form])

  const onChangePermission = async (
    subAccountId: string,
    val: boolean,
    membershipId: string | undefined
  ) => {
    if (!data.user?.id) return
    setLoadingPermissions(true)
    
    // Get the role ID for SUBACCOUNT_USER (or appropriate role)
    const roleId = subAccountPermissions?.SubAccountMemberships?.find(
      (m) => m.subAccountId === subAccountId
    )?.roleId
    
    if (!roleId) {
      toast({
        variant: 'destructive',
        title: 'Failed',
        description: 'Could not find role for permission update',
      })
      setLoadingPermissions(false)
      return
    }
    
    const response = await changeUserPermissions(
      data.user.id,
      roleId,
      'subaccount',
      undefined,
      subAccountId
    )
    
    const agencyMembership = authUserData?.AgencyMemberships?.[0]
    if (type === 'agency' && agencyMembership) {
      await saveActivityLogsNotification({
        agencyId: agencyMembership.agencyId,
        description: `Gave ${userData?.name} access to | ${
          subAccountPermissions?.SubAccountMemberships?.find(
            (m) => m.subAccountId === subAccountId
          )?.SubAccount?.name
        } `,
        subaccountId: subAccountId,
      })
    }

    if (response) {
      toast({
        title: 'Success',
        description: 'The request was successfull',
      })
    } else {
      toast({
        variant: 'destructive',
        title: 'Failed',
        description: 'Could not update permissions',
      })
    }
    router.refresh()
    setLoadingPermissions(false)
  }

  const onSubmit = async (values: z.infer<typeof userDataSchema>) => {
    if (!id) return
    
    const formData = form.getValues()
    
    if (userData || data?.user) {
      const updatedUser = await updateUser(formData)
      
      // Log activity for all subaccounts user has access to
      const agencyMembership = authUserData?.AgencyMemberships?.[0]
      if (agencyMembership) {
        const accessibleSubAccounts = agencyMembership.Agency.SubAccount.filter((subacc) =>
          authUserData.SubAccountMemberships?.some(
            (m) => m.subAccountId === subacc.id && m.isActive
          )
        )
        
        accessibleSubAccounts.forEach(async (subaccount) => {
          await saveActivityLogsNotification({
            agencyId: undefined,
            description: `Updated ${userData?.name} information`,
            subaccountId: subaccount.id,
          })
        })
      }

      if (updatedUser) {
        toast({
          title: 'Success',
          description: 'Update User Information',
        })
        setClose()
        router.refresh()
      } else {
        toast({
          variant: 'destructive',
          title: 'Oppse!',
          description: 'Could not update user information',
        })
      }
    } else {
      console.log('Error could not submit')
    }
  }

  return (
    <Card className="w-full bg-gradient-to-br from-muted/20 to-transparent border-border/50">
      <CardHeader>
        <CardTitle className="text-xl font-semibold">User Details</CardTitle>
        <CardDescription className="text-sm">Add or update your information</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4"
          >
            <FormField
              disabled={form.formState.isSubmitting}
              control={form.control}
              name="avatarUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Profile picture</FormLabel>
                  <FormControl>
                    <FileUpload
                      apiEndpoint="avatar"
                      value={field.value || undefined}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              disabled={form.formState.isSubmitting}
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormLabel>User full name</FormLabel>
                  <FormControl>
                    <Input
                      required
                      placeholder="Full Name"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              disabled={form.formState.isSubmitting}
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      readOnly={form.formState.isSubmitting}
                      placeholder="Email"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              disabled={form.formState.isSubmitting}
              type="submit"
            >
              {form.formState.isSubmitting ? <Loading /> : 'Save User Details'}
            </Button>
            {canManageTeam && (
              <div>
                <Separator className="my-4" />
                <FormLabel> User Permissions</FormLabel>
                <FormDescription className="mb-4">
                  You can give Sub Account access to team member by turning on
                  access control for each Sub Account. This is only visible to
                  agency owners
                </FormDescription>
                <div className="flex flex-col gap-4">
                  {subAccounts?.map((subAccount) => {
                    const subAccountMembership =
                      subAccountPermissions?.SubAccountMemberships?.find(
                        (m) => m.subAccountId === subAccount.id
                      )
                    return (
                      <div
                        key={subAccount.id}
                        className="flex items-center justify-between rounded-lg border p-4"
                      >
                        <div>
                          <p>{subAccount.name}</p>
                        </div>
                        <Switch
                          disabled={loadingPermissions}
                          checked={subAccountMembership?.isActive}
                          onCheckedChange={(permission) => {
                            onChangePermission(
                              subAccount.id,
                              permission,
                              subAccountMembership?.id
                            )
                          }}
                        />
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}

export default UserDetails
