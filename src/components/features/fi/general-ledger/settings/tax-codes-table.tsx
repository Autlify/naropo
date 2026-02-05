'use client'

/**
 * Tax Codes Table Component
 * Display and manage tax codes
 */

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'
import { MoreHorizontal, Pencil, Trash2, Star, StarOff } from 'lucide-react'
import type { TaxType } from '@/lib/schemas/fi/general-ledger/tax'

interface TaxCode {
  code: string
  name: string
  description?: string
  rate: number
  type: TaxType
  accountId: string
  isDefault?: boolean
  isActive?: boolean
}

interface Account {
  id: string
  code: string
  name: string
}

interface TaxCodesTableProps {
  taxCodes: TaxCode[]
  accounts: Account[]
  canEdit: boolean
  agencyId: string
}

const TYPE_COLORS: Record<TaxType, string> = {
  INPUT: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  OUTPUT: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  WITHHOLDING: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
  EXEMPT: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
}

export function TaxCodesTable({
  taxCodes,
  accounts,
  canEdit,
  agencyId,
}: TaxCodesTableProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [deleteCode, setDeleteCode] = useState<string | null>(null)

  const getAccountName = (accountId: string) => {
    const account = accounts.find(a => a.id === accountId)
    return account ? `${account.code} - ${account.name}` : accountId
  }

  const handleSetDefault = async (code: string) => {
    if (!canEdit) return

    startTransition(async () => {
      // TODO: Implement set default tax code action
      toast.success(`${code} set as default`)
      router.refresh()
    })
  }

  const handleDelete = async () => {
    if (!deleteCode || !canEdit) return

    startTransition(async () => {
      // TODO: Implement delete tax code action
      toast.success('Tax code deleted')
      setDeleteCode(null)
      router.refresh()
    })
  }

  if (taxCodes.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No tax codes configured yet.</p>
        {canEdit && (
          <p className="text-sm mt-2">
            Add a tax code or apply a template to get started.
          </p>
        )}
      </div>
    )
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Code</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Type</TableHead>
            <TableHead className="text-right">Rate</TableHead>
            <TableHead>Account</TableHead>
            <TableHead className="text-center">Default</TableHead>
            <TableHead className="text-center">Active</TableHead>
            <TableHead className="w-10"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {taxCodes.map((taxCode) => (
            <TableRow key={taxCode.code} className={isPending ? 'opacity-50' : ''}>
              <TableCell>
                <span className="font-mono font-medium">{taxCode.code}</span>
              </TableCell>
              <TableCell>
                <div>
                  <div className="font-medium">{taxCode.name}</div>
                  {taxCode.description && (
                    <div className="text-xs text-muted-foreground">
                      {taxCode.description}
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="secondary" className={TYPE_COLORS[taxCode.type]}>
                  {taxCode.type}
                </Badge>
              </TableCell>
              <TableCell className="text-right font-mono">
                {taxCode.rate.toFixed(2)}%
              </TableCell>
              <TableCell>
                <span className="text-sm">{getAccountName(taxCode.accountId)}</span>
              </TableCell>
              <TableCell className="text-center">
                {taxCode.isDefault ? (
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 mx-auto" />
                ) : (
                  <StarOff className="h-4 w-4 text-muted-foreground/30 mx-auto" />
                )}
              </TableCell>
              <TableCell className="text-center">
                <Switch
                  checked={taxCode.isActive !== false}
                  disabled={!canEdit || isPending}
                />
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" disabled={isPending}>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => router.push(
                        `/agency/${agencyId}/fi/general-ledger/settings/tax/codes/${taxCode.code}`
                      )}
                    >
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    {!taxCode.isDefault && (
                      <DropdownMenuItem onClick={() => handleSetDefault(taxCode.code)}>
                        <Star className="mr-2 h-4 w-4" />
                        Set as Default
                      </DropdownMenuItem>
                    )}
                    {canEdit && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => setDeleteCode(taxCode.code)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteCode} onOpenChange={() => setDeleteCode(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Tax Code</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this tax code? 
              Existing transactions using this code will not be affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
