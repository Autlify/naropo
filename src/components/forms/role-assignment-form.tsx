'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Role, Permission } from '@/generated/prisma/client'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Shield, CheckCircle, Lock, Loader2 } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { updateAgencyMemberRole } from '@/lib/queries'

const FormSchema = z.object({
  roleId: z.string().min(1, 'Please select a role'),
})

type FormValues = z.infer<typeof FormSchema>

interface RoleWithPermissions extends Role {
  Permissions: Array<{
    Permission: Permission
  }>
}

interface RoleAssignmentFormProps {
  userId: string
  agencyId: string
  currentRole?: Role | null
  availableRoles: RoleWithPermissions[]
  onSuccess?: () => void
}

export default function RoleAssignmentForm({
  userId,
  agencyId,
  currentRole,
  availableRoles,
  onSuccess,
}: RoleAssignmentFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [selectedRolePermissions, setSelectedRolePermissions] = useState<Permission[]>([])

  const form = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      roleId: currentRole?.id || '',
    },
  })

  // Update permissions when role changes
  useEffect(() => {
    const selectedRoleId = form.watch('roleId')
    if (selectedRoleId) {
      const role = availableRoles.find((r) => r.id === selectedRoleId)
      if (role) {
        setSelectedRolePermissions(
          role.Permissions.map((p) => p.Permission)
        )
      }
    }
  }, [form.watch('roleId'), availableRoles])

  const onSubmit = async (values: FormValues) => {
    try {
      setIsLoading(true)
      
      await updateAgencyMemberRole(userId, agencyId, values.roleId)

      toast({
        title: 'Role Updated',
        description: 'The user role has been successfully updated.',
      })

      router.refresh()
      if (onSuccess) onSuccess()
    } catch (error: any) {
      console.error('Error updating role:', error)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to update user role. Please try again.',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getRoleBadgeColor = (roleName: string) => {
    switch (roleName) {
      case 'AGENCY_OWNER':
        return 'bg-emerald-500 text-white'
      case 'AGENCY_ADMIN':
        return 'bg-orange-400 text-white'
      case 'AGENCY_USER':
        return 'bg-blue-500 text-white'
      default:
        return 'bg-gray-500 text-white'
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Current Role Display */}
        {currentRole && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Current Role</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge className={getRoleBadgeColor(currentRole.name)}>
                {currentRole.name}
              </Badge>
            </CardContent>
          </Card>
        )}

        {/* Role Selection */}
        <FormField
          control={form.control}
          name="roleId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Assign New Role</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
                disabled={isLoading}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {availableRoles.map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4" />
                        <span>{role.name}</span>
                        {role.isSystem && (
                          <Badge variant="outline" className="ml-2 text-xs">
                            System
                          </Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                Choose the role that defines this user's permissions within the agency.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Role Description */}
        {form.watch('roleId') && (
          <>
            <Separator />
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Lock className="w-5 h-5 text-muted-foreground" />
                  <CardTitle className="text-lg">Role Permissions</CardTitle>
                </div>
                <CardDescription>
                  This role grants the following permissions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[200px] w-full pr-4">
                  {selectedRolePermissions.length > 0 ? (
                    <div className="space-y-2">
                      {selectedRolePermissions.map((permission) => (
                        <div
                          key={permission.id}
                          className="flex items-start gap-3 p-3 rounded-lg border bg-muted/50"
                        >
                          <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">
                              {permission.key}
                            </p>
                            {permission.description && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {permission.description}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center p-6">
                      <Lock className="w-12 h-12 text-muted-foreground mb-3 opacity-50" />
                      <p className="text-sm text-muted-foreground">
                        No permissions configured for this role
                      </p>
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-4">
          <Button
            type="submit"
            disabled={isLoading || !form.watch('roleId')}
            className="flex-1"
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLoading ? 'Updating...' : 'Update Role'}
          </Button>
        </div>
      </form>
    </Form>
  )
}
