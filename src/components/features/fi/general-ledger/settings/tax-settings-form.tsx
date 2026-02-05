'use client'

/**
 * Tax Settings Form Component
 * Form sections for tax configuration
 */

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
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
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { updateGLConfiguration } from '@/lib/features/fi/general-ledger/actions/configuration'

interface Account {
  id: string
  code: string
  name: string
  category: string
}

interface TaxSettingsFormProps {
  section: 'general' | 'vatAccounts' | 'withholdingAccounts' | 'clearingAccounts'
  initialData: Record<string, any>
  accounts?: Account[]
  disabled?: boolean
}

// Schema for each section
const generalSchema = z.object({
  enabled: z.boolean(),
  taxPeriod: z.enum(['MONTHLY', 'QUARTERLY', 'ANNUAL']),
  autoApplyDefaultTax: z.boolean(),
  requireTaxOnInvoice: z.boolean(),
  calculateTaxInclusive: z.boolean(),
})

const vatAccountsSchema = z.object({
  inputVATAccountId: z.string().nullable(),
  outputVATAccountId: z.string().nullable(),
})

const withholdingAccountsSchema = z.object({
  withholdingTaxAccountId: z.string().nullable(),
})

const clearingAccountsSchema = z.object({
  taxClearingAccountId: z.string().nullable(),
  taxPayableAccountId: z.string().nullable(),
  taxReceivableAccountId: z.string().nullable(),
})

export function TaxSettingsForm({
  section,
  initialData,
  accounts = [],
  disabled = false,
}: TaxSettingsFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // Get schema for section
  const schemas = {
    general: generalSchema,
    vatAccounts: vatAccountsSchema,
    withholdingAccounts: withholdingAccountsSchema,
    clearingAccounts: clearingAccountsSchema,
  } as const

  const currentSchema = schemas[section]

  // Use 'any' for dynamic form handling across different schema types
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const form = useForm<any>({
    resolver: zodResolver(currentSchema),
    defaultValues: initialData,
  })

  const onSubmit = (data: any) => {
    startTransition(async () => {
      try {
        // Build tax settings update
        const taxSettingsUpdate = { ...data }

        const result = await updateGLConfiguration({
          taxSettings: taxSettingsUpdate,
        })

        if (result.success) {
          toast.success('Tax settings updated')
          router.refresh()
        } else {
          toast.error(result.error || 'Failed to update settings')
        }
      } catch (error) {
        toast.error('An error occurred')
      }
    })
  }

  // Render based on section
  if (section === 'general') {
    return (
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="enabled"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between rounded-lg border p-3">
                <div className="space-y-0.5">
                  <FormLabel>Enable Tax Management</FormLabel>
                  <FormDescription>
                    Track tax accounts and codes
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    disabled={disabled}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="taxPeriod"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tax Period</FormLabel>
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={disabled}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="MONTHLY">Monthly</SelectItem>
                    <SelectItem value="QUARTERLY">Quarterly</SelectItem>
                    <SelectItem value="ANNUAL">Annual</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>
                  How often you file tax returns
                </FormDescription>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="autoApplyDefaultTax"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between rounded-lg border p-3">
                <div className="space-y-0.5">
                  <FormLabel>Auto-apply Default Tax</FormLabel>
                  <FormDescription>
                    Automatically apply default tax code to new transactions
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    disabled={disabled}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="calculateTaxInclusive"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between rounded-lg border p-3">
                <div className="space-y-0.5">
                  <FormLabel>Tax-Inclusive Calculation</FormLabel>
                  <FormDescription>
                    Calculate tax from tax-inclusive amounts
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    disabled={disabled}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <Button type="submit" disabled={disabled || isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </form>
      </Form>
    )
  }

  // Account selection sections
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {Object.keys(initialData).map((fieldName) => (
          <FormField
            key={fieldName}
            control={form.control}
            name={fieldName}
            render={({ field }) => (
              <FormItem>
                <FormLabel>{formatFieldLabel(fieldName)}</FormLabel>
                <Select
                  value={field.value || ''}
                  onValueChange={(v) => field.onChange(v || null)}
                  disabled={disabled}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select account" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {accounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.code} - {account.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        ))}

        <Button type="submit" disabled={disabled || isPending}>
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Changes
        </Button>
      </form>
    </Form>
  )
}

function formatFieldLabel(fieldName: string): string {
  const labels: Record<string, string> = {
    inputVATAccountId: 'Input VAT Account',
    outputVATAccountId: 'Output VAT Account',
    withholdingTaxAccountId: 'Withholding Tax Account',
    taxClearingAccountId: 'Tax Clearing Account',
    taxPayableAccountId: 'Tax Payable Account',
    taxReceivableAccountId: 'Tax Receivable Account',
  }
  return labels[fieldName] || fieldName
}
