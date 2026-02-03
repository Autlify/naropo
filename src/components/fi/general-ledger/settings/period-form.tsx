'use client'

import * as React from 'react'
import { useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { Loader2, Calendar, Plus, Pencil } from 'lucide-react'
import { format } from 'date-fns'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Calendar as CalendarComponent } from '@/components/ui/calendar'
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
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

import {
    createPeriodSchema,
    type CreatePeriodInput,
} from '@/lib/schemas/fi/general-ledger/period'
import {
    createFinancialPeriod,
    updateFinancialPeriod,
} from '@/lib/features/fi/general-ledger/actions/periods'
import type { FiscalPeriodType, FiscalPeriod, FiscalPeriodFormProps, FiscalPeriodFormTriggerProps, FiscalPeriodFormValues } from '@/types/finance'

// ============================================================================
// Types
// ============================================================================

const PERIOD_TYPES: { value: FiscalPeriodType; label: string }[] = [
    { value: 'MONTH', label: 'Month' },
    { value: 'QUARTER', label: 'Quarter' },
    { value: 'HALF_YEAR', label: 'Half Year' },
    { value: 'YEAR', label: 'Year' },
    { value: 'CUSTOM', label: 'Custom' },
] as const

const MONTHS = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' },
] as const

const currentYear = new Date().getFullYear()
const FISCAL_YEARS = Array.from({ length: 10 }, (_, i) => currentYear - 2 + i)

// ============================================================================
// Fiscal Period Form Component
// ============================================================================

const FiscalPeriodForm = ({
    mode,
    period,
    onSuccess,
    onCancel,
}: FiscalPeriodFormProps) => {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()

    const form = useForm<FiscalPeriodFormValues>({
        resolver: zodResolver(createPeriodSchema) as never,
        defaultValues: {
            name: period?.name ?? '',
            shortName: period?.shortName ?? undefined,
            periodType: period?.periodType ?? 'MONTH',
            fiscalYear: period?.fiscalYear ?? currentYear,
            fiscalPeriod: period?.fiscalPeriod ?? 1,
            startDate: period?.startDate ?? new Date(currentYear, 0, 1),
            endDate: period?.endDate ?? new Date(currentYear, 0, 31),
            isYearEnd: period?.isYearEnd ?? false,
            notes: period?.notes ?? undefined,
        },
    })

    const watchedPeriodType = form.watch('periodType')
    const watchedFiscalPeriod = form.watch('fiscalPeriod')
    const watchedFiscalYear = form.watch('fiscalYear')

    // Auto-generate name based on period type and fiscal period
    React.useEffect(() => {
        if (mode === 'create') {
            let name = ''
            let shortName = ''

            switch (watchedPeriodType) {
                case 'MONTH':
                    const month = MONTHS.find(m => m.value === watchedFiscalPeriod)
                    name = `${month?.label ?? 'Month'} ${watchedFiscalYear}`
                    shortName = `${month?.label?.slice(0, 3) ?? 'Mon'}-${String(watchedFiscalYear).slice(-2)}`
                    break
                case 'QUARTER':
                    name = `Q${watchedFiscalPeriod} FY${watchedFiscalYear}`
                    shortName = `Q${watchedFiscalPeriod}-${String(watchedFiscalYear).slice(-2)}`
                    break
                case 'HALF_YEAR':
                    name = `H${watchedFiscalPeriod} FY${watchedFiscalYear}`
                    shortName = `H${watchedFiscalPeriod}-${String(watchedFiscalYear).slice(-2)}`
                    break
                case 'YEAR':
                    name = `FY${watchedFiscalYear}`
                    shortName = `FY${String(watchedFiscalYear).slice(-2)}`
                    break
                default:
                    name = `Period ${watchedFiscalPeriod} FY${watchedFiscalYear}`
                    shortName = `P${watchedFiscalPeriod}-${String(watchedFiscalYear).slice(-2)}`
            }

            form.setValue('name', name)
            form.setValue('shortName', shortName)
        }
    }, [watchedPeriodType, watchedFiscalPeriod, watchedFiscalYear, mode, form])

    const onSubmit = (data: FiscalPeriodFormValues) => {
        startTransition(async () => {
            try {
                const payload: CreatePeriodInput = {
                    ...data,
                    startDate: data.startDate,
                    endDate: data.endDate,
                }

                const result = mode === 'create'
                    ? await createFinancialPeriod(payload)
                    : await updateFinancialPeriod({ id: period!.id, ...payload })

                if (result.success) {
                    toast.success(mode === 'create' ? 'Period created' : 'Period updated')
                    router.refresh()
                    onSuccess?.()
                } else {
                    toast.error(result.error ?? 'Failed to save period')
                }
            } catch {
                toast.error('An error occurred')
            }
        })
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Period Type & Fiscal Year */}
                <div className="space-y-4">
                    <h4 className="text-sm font-medium">Period Configuration</h4>

                    <div className="grid grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="periodType"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Period Type *</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select type" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {PERIOD_TYPES.map((type) => (
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
                            name="fiscalYear"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Fiscal Year *</FormLabel>
                                    <Select
                                        onValueChange={(v) => field.onChange(parseInt(v))}
                                        value={String(field.value)}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select year" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {FISCAL_YEARS.map((year) => (
                                                <SelectItem key={year} value={String(year)}>
                                                    {year}
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
                            name="fiscalPeriod"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Period Number *</FormLabel>
                                    <Select
                                        onValueChange={(v) => field.onChange(parseInt(v))}
                                        value={String(field.value)}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select period" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {watchedPeriodType === 'MONTH' && MONTHS.map((month) => (
                                                <SelectItem key={month.value} value={String(month.value)}>
                                                    {month.label}
                                                </SelectItem>
                                            ))}
                                            {watchedPeriodType === 'QUARTER' && [1, 2, 3, 4].map((q) => (
                                                <SelectItem key={q} value={String(q)}>
                                                    Quarter {q}
                                                </SelectItem>
                                            ))}
                                            {watchedPeriodType === 'HALF_YEAR' && [1, 2].map((h) => (
                                                <SelectItem key={h} value={String(h)}>
                                                    Half {h}
                                                </SelectItem>
                                            ))}
                                            {watchedPeriodType === 'YEAR' && (
                                                <SelectItem value="1">Full Year</SelectItem>
                                            )}
                                            {watchedPeriodType === 'CUSTOM' && Array.from({ length: 12 }, (_, i) => i + 1).map((p) => (
                                                <SelectItem key={p} value={String(p)}>
                                                    Period {p}
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
                            name="isYearEnd"
                            render={({ field }) => (
                                <FormItem className="flex items-center justify-between rounded-lg border p-3 mt-6">
                                    <div className="space-y-0.5">
                                        <FormLabel>Year-End Period</FormLabel>
                                        <FormDescription className="text-xs">
                                            Triggers year-end closing
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
                    </div>
                </div>

                <Separator />

                {/* Name & Short Name */}
                <div className="space-y-4">
                    <h4 className="text-sm font-medium">Period Identity</h4>

                    <div className="grid grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Period Name *</FormLabel>
                                    <FormControl>
                                        <Input placeholder="January 2026" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="shortName"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Short Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Jan-26" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                </div>

                <Separator />

                {/* Date Range */}
                <div className="space-y-4">
                    <h4 className="text-sm font-medium">Date Range</h4>

                    <div className="grid grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="startDate"
                            render={({ field }) => (
                                <FormItem className="flex flex-col">
                                    <FormLabel>Start Date *</FormLabel>
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
                                                    {field.value ? format(field.value, 'PPP') : 'Pick a date'}
                                                    <Calendar className="ml-auto h-4 w-4 opacity-50" />
                                                </Button>
                                            </FormControl>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                            <CalendarComponent
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
                            name="endDate"
                            render={({ field }) => (
                                <FormItem className="flex flex-col">
                                    <FormLabel>End Date *</FormLabel>
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
                                                    {field.value ? format(field.value, 'PPP') : 'Pick a date'}
                                                    <Calendar className="ml-auto h-4 w-4 opacity-50" />
                                                </Button>
                                            </FormControl>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                            <CalendarComponent
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
                    </div>
                </div>

                <Separator />

                {/* Notes */}
                <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Notes</FormLabel>
                            <FormControl>
                                <Textarea
                                    placeholder="Optional notes about this period..."
                                    className="resize-none"
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-4">
                    {onCancel && (
                        <Button type="button" variant="outline" onClick={onCancel}>
                            Cancel
                        </Button>
                    )}
                    <Button type="submit" disabled={isPending}>
                        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {mode === 'create' ? 'Create Period' : 'Save Changes'}
                    </Button>
                </div>
            </form>
        </Form>
    )
}

// ============================================================================
// Period Form Trigger (Sheet wrapper)
// ============================================================================

const FiscalPeriodFormTrigger = ({
    mode,
    period,
    trigger,
    onSuccess,
}: FiscalPeriodFormTriggerProps) => {
    const [open, setOpen] = React.useState(false)

    const handleSuccess = () => {
        setOpen(false)
        onSuccess?.()
    }

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                {trigger ?? (
                    <Button variant={mode === 'create' ? 'default' : 'ghost'} size={mode === 'create' ? 'sm' : 'icon'}>
                        {mode === 'create' ? (
                            <>
                                <Plus className="mr-2 h-4 w-4" />
                                New Period
                            </>
                        ) : (
                            <Pencil className="h-4 w-4" />
                        )}
                    </Button>
                )}
            </SheetTrigger>
            <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
                <SheetHeader>
                    <SheetTitle>
                        {mode === 'create' ? 'Create Financial Period' : `Edit Period: ${period?.name}`}
                    </SheetTitle>
                    <SheetDescription>
                        {mode === 'create'
                            ? 'Define a new financial period for accounting'
                            : 'Modify period details'}
                    </SheetDescription>
                </SheetHeader>
                <div className="mt-6">
                    <FiscalPeriodForm
                        mode={mode}
                        period={period}
                        onSuccess={handleSuccess}
                        onCancel={() => setOpen(false)}
                    />
                </div>
            </SheetContent>
        </Sheet>
    )
}

export { FiscalPeriodForm ,FiscalPeriodFormTrigger }
export type { FiscalPeriodFormProps, FiscalPeriodFormTriggerProps  }
