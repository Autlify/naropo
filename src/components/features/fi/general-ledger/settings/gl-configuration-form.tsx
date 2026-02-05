'use client'

import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import {
    updateGLConfiguration,
    updateBaseCurrency,
    updateFiscalYear,
    updateApprovalSettings,
    updateConsolidationSettings,
    updateAccountCodeFormat,
    updateERPIntegration,
    updateSubAccountConfiguration,
} from '@/lib/features/fi/general-ledger/actions/configuration'
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Loader2 } from 'lucide-react'

type SettingsSection =
    | 'accountCode'
    | 'controlAccounts'
    | 'audit'
    | 'fiscalYear'
    | 'currency'
    | 'consolidation'
    | 'posting'
    | 'erp'
    | 'subAccountConfig'

type Props = {
    section: SettingsSection
    initialData: Record<string, any>
    disabled?: boolean
}

// ========== Schemas ==========

const accountCodeSchema = z.object({
    accountCodeFormat: z.string().min(1, 'Format is required'),
    accountCodeLength: z.number().min(4).max(16),
})

const controlAccountsSchema = z.object({
    useControlAccounts: z.boolean(),
})

const auditSchema = z.object({
    retainAuditDays: z.number().min(90).max(3650),
})

const fiscalYearSchema = z.object({
    fiscalYearStart: z.string().regex(/^\d{2}-\d{2}$/, 'Use MM-DD format'),
    fiscalYearEnd: z.string().regex(/^\d{2}-\d{2}$/, 'Use MM-DD format'),
    autoCreatePeriods: z.boolean(),
    periodLockDays: z.number().min(0).max(30),
})

const currencySchema = z.object({
    baseCurrency: z.string().length(3, 'Must be 3-letter currency code'),
})

const consolidationSchema = z.object({
    consolidationMethod: z.enum(['FULL', 'PROPORTIONAL', 'EQUITY']),
    eliminateIntercompany: z.boolean(),
})

const postingSchema = z.object({
    requireApproval: z.boolean(),
    approvalThreshold: z.number().min(0).optional(),
    autoPostingEnabled: z.boolean(),
    allowFuturePeriodPost: z.boolean(),
    allowClosedPeriodPost: z.boolean(),
})

const subAccountConfigSchema = z.object({
    isIndependent: z.boolean(),
    baseCurrency: z.string().length(3).optional(),
    fiscalYearStart: z.string().regex(/^\d{2}-\d{2}$/).optional(),
    fiscalYearEnd: z.string().regex(/^\d{2}-\d{2}$/).optional(),
    requireApproval: z.boolean().optional(),
    approvalThreshold: z.number().min(0).optional(),
    autoPostingEnabled: z.boolean().optional(),
    accountCodeFormat: z.string().optional(),
    accountCodeLength: z.number().min(4).max(16).optional(),
})

const erpSchema = z.object({
    erpIntegrationEnabled: z.boolean(),
    erpSystemType: z.string().optional(),
    erpApiUrl: z.string().url().optional().or(z.literal('')),
})

const schemas: Record<SettingsSection, z.ZodSchema> = {
    accountCode: accountCodeSchema,
    controlAccounts: controlAccountsSchema,
    audit: auditSchema,
    fiscalYear: fiscalYearSchema,
    currency: currencySchema,
    consolidation: consolidationSchema,
    posting: postingSchema,
    erp: erpSchema,
    subAccountConfig: subAccountConfigSchema,
}

// ========== Component ==========

const GLSettingsForm = ({ section, initialData, disabled }: Props) => {
    const [isPending, startTransition] = useTransition()

    const schema = schemas[section as SettingsSection]

    const form = useForm({
        resolver: zodResolver(schema as any),
        defaultValues: initialData,
    })

    const onSubmit = (data: any) => {
        startTransition(async () => {
            try {
                let result

                switch (section) {
                    case 'accountCode':
                        result = await updateAccountCodeFormat(data)
                        break
                    case 'fiscalYear':
                        result = await updateFiscalYear(data.fiscalYearStart, data.fiscalYearEnd)
                        if (result.success) {
                            result = await updateGLConfiguration({
                                autoCreatePeriods: data.autoCreatePeriods,
                                periodLockDays: data.periodLockDays,
                            })
                        }
                        break
                    case 'currency':
                        result = await updateBaseCurrency(data.baseCurrency)
                        break
                    case 'consolidation':
                        result = await updateConsolidationSettings(data)
                        break
                    case 'posting':
                        result = await updateApprovalSettings(data)
                        break
                    case 'erp':
                        result = await updateERPIntegration(data)
                        break
                    case 'subAccountConfig':
                        result = await updateSubAccountConfiguration(data)
                        break
                    default:
                        result = await updateGLConfiguration(data)
                }

                if (result.success) {
                    toast.success('Settings updated successfully')
                } else {
                    toast.error(result.error ?? 'Failed to update settings')
                }
            } catch (error) {
                toast.error('An error occurred while updating settings')
            }
        })
    }

    // Render form based on section
    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                {section === 'accountCode' && <AccountCodeFields form={form} disabled={disabled} />}
                {section === 'controlAccounts' && <ControlAccountsFields form={form} disabled={disabled} />}
                {section === 'audit' && <AuditFields form={form} disabled={disabled} />}
                {section === 'fiscalYear' && <FiscalYearFields form={form} disabled={disabled} />}
                {section === 'currency' && <CurrencyFields form={form} disabled={disabled} />}
                {section === 'consolidation' && <ConsolidationFields form={form} disabled={disabled} />}
                {section === 'posting' && <PostingFields form={form} disabled={disabled} />}
                {section === 'erp' && <ERPFields form={form} disabled={disabled} />}
                {section === 'subAccountConfig' && <SubAccountConfigFields form={form} disabled={disabled} />}

                <Button type="submit" disabled={disabled || isPending}>
                    {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Changes
                </Button>
            </form>
        </Form>
    )
}

GLSettingsForm.displayName = 'GLSettingsForm'
export { GLSettingsForm }

// ========== Field Components ==========

function AccountCodeFields({ form, disabled }: { form: any; disabled?: boolean }) {
    return (
        <>
            <FormField
                control={form.control}
                name="accountCodeFormat"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Account Code Format</FormLabel>
                        <FormControl>
                            <Input {...field} placeholder="####-####" disabled={disabled} />
                        </FormControl>
                        <FormDescription>
                            Use # for digits, - or . as separators (e.g., ####-####)
                        </FormDescription>
                        <FormMessage />
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="accountCodeLength"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Account Code Length</FormLabel>
                        <FormControl>
                            <Input
                                type="number"
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value))}
                                disabled={disabled}
                            />
                        </FormControl>
                        <FormDescription>Number of digits (4-16)</FormDescription>
                        <FormMessage />
                    </FormItem>
                )}
            />
        </>
    )
}

function ControlAccountsFields({ form, disabled }: { form: any; disabled?: boolean }) {
    return (
        <FormField
            control={form.control}
            name="useControlAccounts"
            render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                        <FormLabel className="text-base">Use Control Accounts</FormLabel>
                        <FormDescription>
                            Enable control accounts for AR, AP, and other subledgers
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
    )
}

function AuditFields({ form, disabled }: { form: any; disabled?: boolean }) {
    return (
        <FormField
            control={form.control}
            name="retainAuditDays"
            render={({ field }) => (
                <FormItem>
                    <FormLabel>Audit Trail Retention (Days)</FormLabel>
                    <FormControl>
                        <Input
                            type="number"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                            disabled={disabled}
                        />
                    </FormControl>
                    <FormDescription>
                        Number of days to retain audit trail records (90-3650)
                    </FormDescription>
                    <FormMessage />
                </FormItem>
            )}
        />
    )
}

function FiscalYearFields({ form, disabled }: { form: any; disabled?: boolean }) {
    return (
        <>
            <div className="grid grid-cols-2 gap-4">
                <FormField
                    control={form.control}
                    name="fiscalYearStart"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Fiscal Year Start</FormLabel>
                            <FormControl>
                                <Input {...field} placeholder="01-01" disabled={disabled} />
                            </FormControl>
                            <FormDescription>Format: MM-DD</FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="fiscalYearEnd"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Fiscal Year End</FormLabel>
                            <FormControl>
                                <Input {...field} placeholder="12-31" disabled={disabled} />
                            </FormControl>
                            <FormDescription>Format: MM-DD</FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
            <FormField
                control={form.control}
                name="autoCreatePeriods"
                render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                            <FormLabel className="text-base">Auto-Create Periods</FormLabel>
                            <FormDescription>Automatically create periods for new fiscal years</FormDescription>
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
                name="periodLockDays"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Period Lock (Days After Close)</FormLabel>
                        <FormControl>
                            <Input
                                type="number"
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value))}
                                disabled={disabled}
                            />
                        </FormControl>
                        <FormDescription>Days after month-end before period is locked</FormDescription>
                        <FormMessage />
                    </FormItem>
                )}
            />
        </>
    )
}

function CurrencyFields({ form, disabled }: { form: any; disabled?: boolean }) {
    const currencies = [
        { code: 'USD', name: 'US Dollar' },
        { code: 'EUR', name: 'Euro' },
        { code: 'GBP', name: 'British Pound' },
        { code: 'JPY', name: 'Japanese Yen' },
        { code: 'CAD', name: 'Canadian Dollar' },
        { code: 'AUD', name: 'Australian Dollar' },
        { code: 'CHF', name: 'Swiss Franc' },
        { code: 'CNY', name: 'Chinese Yuan' },
        { code: 'SGD', name: 'Singapore Dollar' },
        { code: 'MYR', name: 'Malaysian Ringgit' },
    ]

    return (
        <FormField
            control={form.control}
            name="baseCurrency"
            render={({ field }) => (
                <FormItem>
                    <FormLabel>Base Currency</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={disabled}>
                        <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Select currency" />
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            {currencies.map((c) => (
                                <SelectItem key={c.code} value={c.code}>
                                    {c.code} - {c.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <FormDescription>
                        This cannot be changed after transactions are posted
                    </FormDescription>
                    <FormMessage />
                </FormItem>
            )}
        />
    )
}

function ConsolidationFields({ form, disabled }: { form: any; disabled?: boolean }) {
    return (
        <>
            <FormField
                control={form.control}
                name="consolidationMethod"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Consolidation Method</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value} disabled={disabled}>
                            <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select method" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                <SelectItem value="FULL">Full Consolidation</SelectItem>
                                <SelectItem value="PROPORTIONAL">Proportional Consolidation</SelectItem>
                                <SelectItem value="EQUITY">Equity Method</SelectItem>
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="eliminateIntercompany"
                render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                            <FormLabel className="text-base">Eliminate Intercompany</FormLabel>
                            <FormDescription>
                                Automatically eliminate intercompany transactions during consolidation
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
        </>
    )
}

function PostingFields({ form, disabled }: { form: any; disabled?: boolean }) {
    const requireApproval = form.watch('requireApproval')

    return (
        <>
            <FormField
                control={form.control}
                name="requireApproval"
                render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                            <FormLabel className="text-base">Require Approval</FormLabel>
                            <FormDescription>
                                Journal entries require approval before posting
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
            {requireApproval && (
                <FormField
                    control={form.control}
                    name="approvalThreshold"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Approval Threshold Amount</FormLabel>
                            <FormControl>
                                <Input
                                    type="number"
                                    {...field}
                                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                    disabled={disabled}
                                    placeholder="0.00"
                                />
                            </FormControl>
                            <FormDescription>
                                Entries above this amount require approval (0 = all entries)
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            )}
            <FormField
                control={form.control}
                name="autoPostingEnabled"
                render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                            <FormLabel className="text-base">Auto-Posting</FormLabel>
                            <FormDescription>
                                Automatically post approved entries
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
                name="allowFuturePeriodPost"
                render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                            <FormLabel className="text-base">Allow Future Period Posting</FormLabel>
                            <FormDescription>
                                Allow posting to periods that haven&apos;t started
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
                name="allowClosedPeriodPost"
                render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                            <FormLabel className="text-base">Allow Closed Period Posting</FormLabel>
                            <FormDescription>
                                Allow posting to closed periods (requires special permission)
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
        </>
    )
}

function ERPFields({ form, disabled }: { form: any; disabled?: boolean }) {
    const erpEnabled = form.watch('erpIntegrationEnabled')

    return (
        <>
            <FormField
                control={form.control}
                name="erpIntegrationEnabled"
                render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                            <FormLabel className="text-base">Enable ERP Integration</FormLabel>
                            <FormDescription>
                                Connect to external ERP systems for data sync
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
            {erpEnabled && (
                <>
                    <FormField
                        control={form.control}
                        name="erpSystemType"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>ERP System</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value} disabled={disabled}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select ERP system" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="SAP">SAP</SelectItem>
                                        <SelectItem value="ORACLE">Oracle</SelectItem>
                                        <SelectItem value="NETSUITE">NetSuite</SelectItem>
                                        <SelectItem value="DYNAMICS">Microsoft Dynamics</SelectItem>
                                        <SelectItem value="QUICKBOOKS">QuickBooks</SelectItem>
                                        <SelectItem value="XERO">Xero</SelectItem>
                                        <SelectItem value="OTHER">Other</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="erpApiUrl"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>API URL</FormLabel>
                                <FormControl>
                                    <Input {...field} placeholder="https://api.erp-system.com" disabled={disabled} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </>
            )}
        </>
    )
}

/**
 * SubAccount Configuration Fields (SKB1 Pattern)
 * Allows SubAccounts to have independent GL settings or inherit from Agency
 */
function SubAccountConfigFields({ form, disabled }: { form: any; disabled?: boolean }) {
    const isIndependent = form.watch('isIndependent')
    const requireApproval = form.watch('requireApproval')

    const currencies = [
        { code: 'USD', name: 'US Dollar' },
        { code: 'EUR', name: 'Euro' },
        { code: 'GBP', name: 'British Pound' },
        { code: 'JPY', name: 'Japanese Yen' },
        { code: 'CAD', name: 'Canadian Dollar' },
        { code: 'AUD', name: 'Australian Dollar' },
        { code: 'CHF', name: 'Swiss Franc' },
        { code: 'CNY', name: 'Chinese Yuan' },
        { code: 'SGD', name: 'Singapore Dollar' },
        { code: 'MYR', name: 'Malaysian Ringgit' },
    ]

    return (
        <>
            {/* Independence Toggle - Main Switch */}
            <FormField
                control={form.control}
                name="isIndependent"
                render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border border-primary/20 bg-primary/5 p-4">
                        <div className="space-y-0.5">
                            <FormLabel className="text-base font-semibold">Independent Configuration</FormLabel>
                            <FormDescription>
                                Enable to use separate GL settings for this SubAccount (like SAP SKA1/SKB1 pattern).
                                When disabled, settings are inherited from Agency with optional overrides.
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

            {/* Show full configuration when independent, or subset for overrides */}
            <div className={`space-y-4 ${!isIndependent ? 'opacity-75' : ''}`}>
                <div className="text-sm text-muted-foreground mb-2">
                    {isIndependent 
                        ? '✓ Full independent configuration (not inherited from Agency)'
                        : '↳ Override settings (empty fields inherit from Agency)'}
                </div>

                {/* Currency Section */}
                <FormField
                    control={form.control}
                    name="baseCurrency"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Base Currency {!isIndependent && '(Override)'}</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value} disabled={disabled}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder={isIndependent ? 'Select currency' : 'Use Agency currency'} />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {currencies.map((c) => (
                                        <SelectItem key={c.code} value={c.code}>
                                            {c.code} - {c.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormDescription>
                                {isIndependent 
                                    ? 'Base currency for this SubAccount'
                                    : 'Leave empty to use Agency base currency'}
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Fiscal Year Section */}
                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="fiscalYearStart"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Fiscal Year Start</FormLabel>
                                <FormControl>
                                    <Input {...field} placeholder="01-01" disabled={disabled} />
                                </FormControl>
                                <FormDescription>Format: MM-DD</FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="fiscalYearEnd"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Fiscal Year End</FormLabel>
                                <FormControl>
                                    <Input {...field} placeholder="12-31" disabled={disabled} />
                                </FormControl>
                                <FormDescription>Format: MM-DD</FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                {/* Approval Settings */}
                <FormField
                    control={form.control}
                    name="requireApproval"
                    render={({ field }) => (
                        <FormItem className="flex items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                                <FormLabel className="text-base">Require Approval</FormLabel>
                                <FormDescription>
                                    Journal entries require approval before posting
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

                {requireApproval && (
                    <FormField
                        control={form.control}
                        name="approvalThreshold"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Approval Threshold Amount</FormLabel>
                                <FormControl>
                                    <Input
                                        type="number"
                                        {...field}
                                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                        disabled={disabled}
                                        placeholder="0.00"
                                    />
                                </FormControl>
                                <FormDescription>
                                    Entries above this amount require approval (0 = all entries)
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                )}

                {/* Auto-Posting */}
                <FormField
                    control={form.control}
                    name="autoPostingEnabled"
                    render={({ field }) => (
                        <FormItem className="flex items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                                <FormLabel className="text-base">Auto-Posting</FormLabel>
                                <FormDescription>
                                    Automatically post approved entries
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

                {/* Account Code Format - Only for independent */}
                {isIndependent && (
                    <>
                        <FormField
                            control={form.control}
                            name="accountCodeFormat"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Account Code Format</FormLabel>
                                    <FormControl>
                                        <Input {...field} placeholder="####-####" disabled={disabled} />
                                    </FormControl>
                                    <FormDescription>
                                        Use # for digits, - or . as separators
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="accountCodeLength"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Account Code Length</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="number"
                                            {...field}
                                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                                            disabled={disabled}
                                        />
                                    </FormControl>
                                    <FormDescription>Number of digits (4-16)</FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </>
                )}
            </div>
        </>
    )
}