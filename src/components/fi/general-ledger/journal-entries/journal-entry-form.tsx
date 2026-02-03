'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { format } from 'date-fns'
import { CalendarIcon, Plus, Trash2, Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Calendar } from '@/components/ui/calendar'
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { createJournalEntry } from '@/lib/features/fi/general-ledger/actions/journal-entries'
import type { JournalEntryFormProps, JournalEntryLine, JournalEntryFormValues, SubledgerType } from '@/types/finance'

// Form schema (simplified from full schema)
const formSchema = z.object({
  periodId: z.string().uuid({ message: 'Please select a period' }),
  entryDate: z.date(),
  entryType: z.enum(['NORMAL', 'ADJUSTMENT', 'REVERSAL']),
  description: z.string().min(1, 'Description is required').max(1000),
  notes: z.string().max(2000).optional(),
  currencyCode: z.string().length(3),
  exchangeRate: z.number().positive(),
  lines: z.array(z.object({
    lineNumber: z.number().int().min(1),
    accountId: z.string().uuid({ message: 'Please select an account' }),
    description: z.string().max(500).optional(),
    debitAmount: z.number().min(0),
    creditAmount: z.number().min(0),
    dimension1: z.string().optional(), // Cost center
    dimension2: z.string().optional(), // Department
  })).min(2, 'At least 2 lines required'),
})

type FormSchemaValues = z.infer<typeof formSchema>


export function JournalEntryForm({ agencyId, accounts, periods }: JournalEntryFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<FormSchemaValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      periodId: '',
      entryDate: new Date(),
      entryType: 'NORMAL',
      description: '',
      notes: '',
      currencyCode: 'MYR',
      exchangeRate: 1,
      lines: [
        {
          lineNumber: 1,
          accountId: '',
          description: '',
          debitAmount: 0,
          creditAmount: 0,
          dimension1: undefined,
          dimension2: undefined,
        },
        {
          lineNumber: 2,
          accountId: '',
          description: '',
          debitAmount: 0,
          creditAmount: 0,
          dimension1: undefined,
          dimension2: undefined,
        },
      ],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'lines',
  })

  const watchedLines = form.watch('lines')

  // Calculate totals
  const totalDebit = watchedLines.reduce((sum, line) => sum + (line.debitAmount || 0), 0)
  const totalCredit = watchedLines.reduce((sum, line) => sum + (line.creditAmount || 0), 0)
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01
  const difference = totalDebit - totalCredit

  const addLine = () => {
    const nextLineNumber = fields.length + 1
    append({
      lineNumber: nextLineNumber,
      accountId: '',
      description: '',
      debitAmount: 0,
      creditAmount: 0,
    })
  }

  const removeLine = (index: number) => {
    if (fields.length <= 2) {
      toast.error('Minimum 2 lines required for double-entry')
      return
    }
    remove(index)
    // Re-number lines
    const currentLines = form.getValues('lines')
    currentLines.forEach((_, i) => {
      form.setValue(`lines.${i}.lineNumber`, i + 1)
    })
  }

  const onSubmit = async (values: FormSchemaValues) => {
    if (!isBalanced) {
      toast.error('Entry is not balanced. Total debits must equal total credits.')
      return
    }

    setIsSubmitting(true)

    try {
      const payload: JournalEntryFormValues = {
        ...(values as unknown as JournalEntryFormValues),
        entryDate: values.entryDate.toISOString(),
      }

      const result = await createJournalEntry({
        periodId: values.periodId,
        entryDate: values.entryDate,
        entryType: values.entryType,
        sourceModule: 'MANUAL',
        description: values.description,
        currencyCode: values.currencyCode,
        exchangeRate: values.exchangeRate,
        lines: values.lines.map((line) => ({
          lineNumber: line.lineNumber || 0,
          accountId: line.accountId || '',
          description: line.description || undefined,
          debitAmount: line.debitAmount || 0,
          creditAmount: line.creditAmount || 0,
          dimension1: line.dimension1 || undefined,
          dimension2: line.dimension2 || undefined,

          // Required by the backend/types but not captured in this simplified form.
          subledgerType: 'NONE' as SubledgerType,
          isIntercompany: false,
        })),
      })

      if (result.success) {
        toast.success('Journal entry created successfully')
        startTransition(() => {
          router.push(`/agency/${agencyId}/fi/general-ledger/journal-entries`)
          router.refresh()
        })
      } else {
        toast.error(result.error ?? 'Failed to create journal entry')
      }
    } catch {
      toast.error('An unexpected error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Header Fields */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <FormField
            control={form.control}
            name="periodId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Period *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select period" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {periods.map((period) => (
                      <SelectItem key={period.id} value={period.id}>
                        {period.name}
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
            name="entryDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Entry Date *</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full pl-3 text-left font-normal',
                          !field.value && 'text-muted-foreground'
                        )}
                      >
                        {field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="entryType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Entry Type</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="NORMAL">Normal</SelectItem>
                    <SelectItem value="ADJUSTMENT">Adjustment</SelectItem>
                    <SelectItem value="REVERSAL">Reversal</SelectItem>
                  </SelectContent>
                </Select>
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
              <FormLabel>Description *</FormLabel>
              <FormControl>
                <Input placeholder="Enter journal entry description" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Additional notes (optional)"
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Separator />

        {/* Journal Lines */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-medium">Journal Lines</h3>
              <p className="text-xs text-muted-foreground">
                Add debit and credit entries. Total must balance.
              </p>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={addLine}>
              <Plus className="h-4 w-4 mr-2" />
              Add Line
            </Button>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead className="min-w-[200px]">Account</TableHead>
                  <TableHead className="min-w-[150px]">Description</TableHead>
                  <TableHead className="w-32 text-right">Debit</TableHead>
                  <TableHead className="w-32 text-right">Credit</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fields.map((field, index) => (
                  <TableRow key={field.id}>
                    <TableCell className="font-medium">{index + 1}</TableCell>
                    <TableCell>
                      <FormField
                        control={form.control}
                        name={`lines.${index}.accountId`}
                        render={({ field: accountField }) => (
                          <FormItem className="space-y-0">
                            <Select onValueChange={accountField.onChange} value={accountField.value}>
                              <FormControl>
                                <SelectTrigger className="h-9">
                                  <SelectValue placeholder="Select account" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {accounts.map((account) => (
                                  <SelectItem key={account?.id} value={account?.id!}>
                                    {account?.code} - {account?.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </TableCell>
                    <TableCell>
                      <FormField
                        control={form.control}
                        name={`lines.${index}.description`}
                        render={({ field: descField }) => (
                          <FormItem className="space-y-0">
                            <FormControl>
                              <Input
                                className="h-9"
                                placeholder="Line description"
                                {...descField}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </TableCell>
                    <TableCell>
                      <FormField
                        control={form.control}
                        name={`lines.${index}.debitAmount`}
                        render={({ field: debitField }) => (
                          <FormItem className="space-y-0">
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                className="h-9 text-right"
                                placeholder="0.00"
                                {...debitField}
                                onChange={(e) => {
                                  const value = parseFloat(e.target.value) || 0
                                  debitField.onChange(value)
                                  // If debit is entered, clear credit
                                  if (value > 0) {
                                    form.setValue(`lines.${index}.creditAmount`, 0)
                                  }
                                }}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </TableCell>
                    <TableCell>
                      <FormField
                        control={form.control}
                        name={`lines.${index}.creditAmount`}
                        render={({ field: creditField }) => (
                          <FormItem className="space-y-0">
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                className="h-9 text-right"
                                placeholder="0.00"
                                {...creditField}
                                onChange={(e) => {
                                  const value = parseFloat(e.target.value) || 0
                                  creditField.onChange(value)
                                  // If credit is entered, clear debit
                                  if (value > 0) {
                                    form.setValue(`lines.${index}.debitAmount`, 0)
                                  }
                                }}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeLine(index)}
                        disabled={fields.length <= 2}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={3} className="text-right font-medium">
                    Totals
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {totalDebit.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {totalCredit.toFixed(2)}
                  </TableCell>
                  <TableCell />
                </TableRow>
                <TableRow>
                  <TableCell colSpan={3} className="text-right">
                    Balance Status
                  </TableCell>
                  <TableCell colSpan={2} className="text-center">
                    {isBalanced ? (
                      <Badge variant="default" className="bg-green-600">
                        Balanced
                      </Badge>
                    ) : (
                      <Badge variant="destructive">
                        Unbalanced ({difference > 0 ? '+' : ''}{difference.toFixed(2)})
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell />
                </TableRow>
              </TableFooter>
            </Table>
          </div>
        </div>

        <Separator />

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(`/agency/${agencyId}/fi/general-ledger/journal-entries`)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting || !isBalanced}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Entry
          </Button>
        </div>
      </form>
    </Form>
  )
}
