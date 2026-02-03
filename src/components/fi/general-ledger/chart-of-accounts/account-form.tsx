'use client'

import * as React from 'react'
import { useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Separator } from '@/components/ui/separator'

import {
  createAccountSchema,
  type CreateAccountInput,
} from '@/lib/schemas/fi/general-ledger/chart-of-accounts'
import {
  createAccount,
  updateAccount,
} from '@/lib/features/fi/general-ledger/actions/chart-of-accounts'
import type { 
    AccountFormValues,
    AccountFormProps, 
    AccountFormTriggerProps, 
    AccountCategory,
    NormalBalance,
    AccountType,
    SubledgerType,
} from '@/types/finance'

// ============================================================================
// Types
// ============================================================================

// Local form type matching schema output

// ============================================================================
// Constants
// ============================================================================

const ACCOUNT_TYPES: { value: AccountType; label: string }[] = [
  { value: 'ASSET', label: 'Asset' },
  { value: 'LIABILITY', label: 'Liability' },
  { value: 'EQUITY', label: 'Equity' },
  { value: 'REVENUE', label: 'Revenue' },
  { value: 'EXPENSE', label: 'Expense' },
] as const

const ACCOUNT_CATEGORIES: { value: AccountCategory; label: string; type: AccountType }[] = [
  { value: 'CURRENT_ASSET', label: 'Current Asset', type: 'ASSET' },
  { value: 'FIXED_ASSET', label: 'Fixed Asset', type: 'ASSET' },
  { value: 'OTHER_ASSET', label: 'Other Asset', type: 'ASSET' },
  { value: 'CURRENT_LIABILITY', label: 'Current Liability', type: 'LIABILITY' },
  { value: 'LONG_TERM_LIABILITY', label: 'Long-term Liability', type: 'LIABILITY' },
  { value: 'CAPITAL', label: 'Capital', type: 'EQUITY' },
  { value: 'RETAINED_EARNINGS_CAT', label: 'Retained Earnings', type: 'EQUITY' },
  { value: 'OPERATING_REVENUE', label: 'Operating Revenue', type: 'REVENUE' },
  { value: 'OTHER_REVENUE', label: 'Other Revenue', type: 'REVENUE' },
  { value: 'COST_OF_GOODS_SOLD', label: 'Cost of Goods Sold', type: 'EXPENSE' },
  { value: 'OPERATING_EXPENSE', label: 'Operating Expense', type: 'EXPENSE' },
  { value: 'OTHER_EXPENSE', label: 'Other Expense', type: 'EXPENSE' },
] as const

const SUBLEDGER_TYPES: { value: SubledgerType; label: string }[] = [
  { value: 'NONE', label: 'None' },
  { value: 'ACCOUNTS_RECEIVABLE', label: 'Accounts Receivable' },
  { value: 'ACCOUNTS_PAYABLE', label: 'Accounts Payable' },
  { value: 'INVENTORY', label: 'Inventory' },
  { value: 'FIXED_ASSETS', label: 'Fixed Assets' },
  { value: 'PAYROLL', label: 'Payroll' },
  { value: 'BANK', label: 'Bank' },
] as const

const NORMAL_BALANCE: { value: NormalBalance; label: string }[] = [
  { value: 'DEBIT', label: 'Debit' },
  { value: 'CREDIT', label: 'Credit' },
] as const

// ============================================================================
// Account Form Component
// ============================================================================

const AccountForm = ({
  mode,
  account,
  parentAccounts = [],
  onSuccess,
  onCancel,
}: AccountFormProps) => {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const form = useForm<AccountFormValues>({
    resolver: zodResolver(createAccountSchema) as never,
    defaultValues: {
      code: account?.code ?? '',
      name: account?.name ?? '',
      description: account?.description ?? '',
      parentAccountId: account?.parentAccountId ?? null,
      accountType: account?.accountType ?? 'ASSET',
      category: account?.category as AccountCategory | undefined,
      subcategory: account?.subcategory ?? '',
      isControlAccount: account?.isControlAccount ?? false,
      subledgerType: account?.subledgerType ?? 'NONE',
      controlAccountId: account?.controlAccountId ?? null,
      allowManualPosting: account?.allowManualPosting ?? true,
      requireApproval: account?.requireApproval ?? false,
      isPostingAccount: account?.isPostingAccount ?? true,
      isConsolidationEnabled: account?.isConsolidationEnabled ?? false,
      consolidationAccountCode: account?.consolidationAccountCode ?? '',
      currencyCode: account?.currencyCode,
      isMultiCurrency: account?.isMultiCurrency ?? false,
      normalBalance: account?.normalBalance ?? 'DEBIT',
      sortOrder: account?.sortOrder ?? 0,
    },
  })

  const watchedType = form.watch('accountType')
  const filteredCategories = ACCOUNT_CATEGORIES.filter(
    (cat) => cat.type === watchedType
  )

  const onSubmit = (data: AccountFormValues) => {
    startTransition(async () => {
      try {
        const result = mode === 'create'
          ? await createAccount(data)
          : await updateAccount({ id: account!.id, ...data })

        if (result.success) {
          toast.success(mode === 'create' ? 'Account created' : 'Account updated')
          router.refresh()
          onSuccess?.()
        } else {
          toast.error(result.error ?? 'Failed to save account')
        }
      } catch {
        toast.error('An error occurred')
      }
    })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Information */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium">Basic Information</h4>
          
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Account Code *</FormLabel>
                  <FormControl>
                    <Input placeholder="1000" {...field} />
                  </FormControl>
                  <FormDescription>Unique identifier (e.g., 1000, 1100-01)</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Account Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="Cash and Bank" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Account description..."
                    className="resize-none"
                    {...field}
                    value={field.value ?? ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Separator />

        {/* Classification */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium">Classification</h4>
          
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="accountType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Account Type *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {ACCOUNT_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    value={field.value ?? undefined}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {filteredCategories.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="parentAccountId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Parent Account</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    value={field.value ?? undefined}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="No parent (root)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="">No parent (root)</SelectItem>
                      {parentAccounts.map((acc) => (
                        <SelectItem key={acc.id} value={acc.id}>
                          {acc.code} - {acc.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>Group under another account</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="normalBalance"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Normal Balance</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {NORMAL_BALANCE.map((bal) => (
                        <SelectItem key={bal.value} value={bal.value}>
                          {bal.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <Separator />

        {/* Control Account Settings */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium">Control Account Settings</h4>
          
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="isControlAccount"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel>Control Account</FormLabel>
                    <FormDescription className="text-xs">
                      Links to a subledger
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="subledgerType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subledger Type</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {SUBLEDGER_TYPES.map((sub) => (
                        <SelectItem key={sub.value} value={sub.value}>
                          {sub.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <Separator />

        {/* Posting Behavior */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium">Posting Behavior</h4>
          
          <div className="grid grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="isPostingAccount"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel className="text-xs">Posting Account</FormLabel>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="allowManualPosting"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel className="text-xs">Allow Manual</FormLabel>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="requireApproval"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel className="text-xs">Require Approval</FormLabel>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {mode === 'create' ? 'Create Account' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </Form>
  )
}

// ============================================================================
// Account Form Trigger (Sheet wrapper)
// ============================================================================

const AccountFormTrigger = ({
  mode,
  account,
  parentAccounts,
  agencyId,
  trigger,
  onSuccess,
}: AccountFormTriggerProps) => {
  const [open, setOpen] = React.useState(false)

  const handleSuccess = () => {
    setOpen(false)
    onSuccess?.()
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {trigger ?? (
          <Button variant={mode === 'create' ? 'default' : 'outline'} size="sm">
            {mode === 'create' ? 'New Account' : 'Edit'}
          </Button>
        )}
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>
            {mode === 'create' ? 'Create New Account' : `Edit Account: ${account?.code}`}
          </SheetTitle>
          <SheetDescription>
            {mode === 'create'
              ? 'Add a new account to your Chart of Accounts'
              : 'Modify account details and settings'}
          </SheetDescription>
        </SheetHeader>
        <div className="mt-6">
          <AccountForm
            mode={mode}
            account={account}
            parentAccounts={parentAccounts}
            agencyId={agencyId}
            onSuccess={handleSuccess}
            onCancel={() => setOpen(false)}
          />
        </div>
      </SheetContent>
    </Sheet>
  )
}

export { AccountForm, AccountFormTrigger }
export type { AccountFormProps, AccountFormTriggerProps, AccountFormValues }
