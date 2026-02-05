'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Loader2, CheckCircle, ArrowRight, ArrowLeft, Zap, Settings2, Receipt, Calculator } from 'lucide-react'
import { applyTemplate } from '@/lib/features/fi/general-ledger/actions/coa-template'
import { initializeGLConfiguration } from '@/lib/features/fi/general-ledger/actions/configuration'
import { createFinancialPeriod } from '@/lib/features/fi/general-ledger/actions/periods'
import { applyDefaultPostingRules } from '@/lib/features/fi/general-ledger/actions/posting-rule-templates'
import { TAX_PRESETS } from '@/lib/schemas/fi/general-ledger/tax'

type Props = {
  agencyId: string
}

type WizardStep = 'company' | 'coa' | 'periods' | 'tax' | 'posting' | 'review'
type SetupMode = 'express' | 'custom'

const steps: { id: WizardStep; title: string; description: string; optional?: boolean }[] = [
  { id: 'company', title: 'Company Info', description: 'Configure basic settings' },
  { id: 'coa', title: 'Chart of Accounts', description: 'Select a template' },
  { id: 'periods', title: 'Financial Periods', description: 'Set up periods' },
  { id: 'tax', title: 'Tax Settings', description: 'Configure tax accounts', optional: true },
  { id: 'posting', title: 'Posting Rules', description: 'Set default posting rules', optional: true },
  { id: 'review', title: 'Review & Finish', description: 'Confirm your settings' },
]

// Industry-specific business types for COA template selection
const BUSINESS_TYPES = [
  { id: 'standard', name: 'General Business', coaTemplate: 'standard' },
  { id: 'service', name: 'Professional Services', coaTemplate: 'service-business' },
  { id: 'agency', name: 'Agency / Creative', coaTemplate: 'agency' },
  { id: 'retail', name: 'Retail / Trading', coaTemplate: 'standard' },
  { id: 'manufacturing', name: 'Manufacturing', coaTemplate: 'standard' },
  { id: 'minimal', name: 'Simple / Minimal', coaTemplate: 'minimal' },
] as const

const GLSetupWizard = ({ agencyId }: Props) => {
  const router = useRouter()
  const [setupMode, setSetupMode] = useState<SetupMode | null>(null)
  const [currentStep, setCurrentStep] = useState<WizardStep>('company')
  const [isPending, startTransition] = useTransition()
  const [wizardData, setWizardData] = useState<{
    // Company settings
    baseCurrency: string
    fiscalYearStart: string
    fiscalYearEnd: string
    requireApproval: boolean
    // COA settings
    businessType: string
    coaTemplate: string
    // Period settings
    startYear: number
    numberOfYears: number
    // Tax settings
    enableTax: boolean
    taxPreset: string | null
    // Posting rules settings
    applyDefaultPostingRules: boolean
  }>({
    baseCurrency: 'USD',
    fiscalYearStart: '01-01',
    fiscalYearEnd: '12-31',
    requireApproval: true,
    businessType: 'standard',
    coaTemplate: 'standard',
    startYear: new Date().getFullYear(),
    numberOfYears: 2,
    enableTax: false,
    taxPreset: null,
    applyDefaultPostingRules: true,
  })

  // Get active steps based on mode
  const activeSteps = setupMode === 'express' 
    ? steps.filter(s => !s.optional)
    : steps

  const currentStepIndex = activeSteps.findIndex((s) => s.id === currentStep)
  const progress = ((currentStepIndex + 1) / activeSteps.length) * 100

  const goNext = () => {
    const nextIndex = Math.min(currentStepIndex + 1, activeSteps.length - 1)
    setCurrentStep(activeSteps[nextIndex].id)
  }

  const goPrev = () => {
    const prevIndex = Math.max(currentStepIndex - 1, 0)
    setCurrentStep(activeSteps[prevIndex].id)
  }

  const handleComplete = () => {
    startTransition(async () => {
      try {
        // 1. Initialize GL Configuration
        const configResult = await initializeGLConfiguration({
          baseCurrency: wizardData.baseCurrency,
          fiscalYearStart: wizardData.fiscalYearStart,
          fiscalYearEnd: wizardData.fiscalYearEnd,
          requireApproval: wizardData.requireApproval,
          useControlAccounts: true,
          autoPostingEnabled: false,
          allowFuturePeriodPost: false,
          allowClosedPeriodPost: false,
          consolidationEnabled: false,
          consolidationMethod: 'FULL',
          eliminateIntercompany: false,
          autoCreatePeriods: false,
          periodLockDays: 0,
          accountCodeFormat: '',
          accountCodeLength: 0,
          accountCodeSeparator: '',
          erpIntegrationEnabled: false,
          retainAuditDays: 0
        })

        if (!configResult.success) {
          toast.error(configResult.error)
          return
        }

        // 2. Apply COA Template
        const templateResult = await applyTemplate(wizardData.coaTemplate, {
          includeSystemAccounts: true,
        })

        if (!templateResult.success) {
          toast.error(templateResult.error)
          return
        }

        // 3. Create Financial Periods
        for (let year = wizardData.startYear; year < wizardData.startYear + wizardData.numberOfYears; year++) {
          for (let month = 1; month <= 12; month++) {
            const startDate = new Date(year, month - 1, 1)
            const endDate = new Date(year, month, 0)
            const periodsResult = await createFinancialPeriod({
              name: `${year}-${String(month).padStart(2, '0')}`,
              periodType: 'MONTH',
              fiscalYear: year,
              fiscalPeriod: month,
              startDate,
              endDate,
              isYearEnd: month === 12,
            })
            if (!periodsResult.success) {
              toast.error(periodsResult.error)
              return
            }
          }
        }

        // 4. Apply Default Posting Rules (if enabled)
        if (wizardData.applyDefaultPostingRules) {
          const postingResult = await applyDefaultPostingRules()
          if (!postingResult.success) {
            // Non-blocking - just show warning
            toast.warning('Posting rules setup incomplete. You can configure them in Settings.')
          }
        }

        toast.success('GL setup completed successfully!')
        router.push(`/agency/${agencyId}/fi/general-ledger`)
        router.refresh()
      } catch (error) {
        toast.error('Failed to complete GL setup')
      }
    })
  }

  // Express Setup Handler - applies all defaults
  const handleExpressSetup = () => {
    setSetupMode('express')
    setWizardData(prev => ({
      ...prev,
      requireApproval: true,
      coaTemplate: 'standard',
      numberOfYears: 2,
      enableTax: false,
      applyDefaultPostingRules: true,
    }))
  }

  // Show mode selection if not yet selected
  if (!setupMode) {
    return (
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>GL Setup Wizard</CardTitle>
          <CardDescription>
            Choose how you want to set up your General Ledger
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <button
            onClick={handleExpressSetup}
            className="w-full p-6 rounded-lg border-2 border-primary/20 hover:border-primary hover:bg-primary/5 transition-all text-left group"
          >
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                <Zap className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-lg">Express Setup</h3>
                  <Badge variant="secondary">Recommended</Badge>
                </div>
                <p className="text-muted-foreground mt-1">
                  Get started quickly with sensible defaults. Perfect for most businesses.
                  You can customize everything later.
                </p>
                <ul className="mt-3 text-sm text-muted-foreground space-y-1">
                  <li>• Standard chart of accounts</li>
                  <li>• Recommended posting rules applied</li>
                  <li>• 2 years of monthly periods</li>
                </ul>
              </div>
            </div>
          </button>

          <button
            onClick={() => setSetupMode('custom')}
            className="w-full p-6 rounded-lg border hover:border-primary/50 hover:bg-accent transition-all text-left"
          >
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-muted">
                <Settings2 className="h-6 w-6 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg">Custom Setup</h3>
                <p className="text-muted-foreground mt-1">
                  Full control over all settings including tax configuration and posting rules.
                </p>
              </div>
            </div>
          </button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>GL Setup Wizard</CardTitle>
            <CardDescription>
              Complete these steps to set up your General Ledger
            </CardDescription>
          </div>
          <Badge variant="outline" className="capitalize">
            {setupMode} setup
          </Badge>
        </div>
        <Progress value={progress} className="mt-4" />
        <div className="flex justify-between mt-2 text-sm text-muted-foreground">
          {activeSteps.map((step, idx) => (
            <span
              key={step.id}
              className={idx <= currentStepIndex ? 'text-primary font-medium' : ''}
            >
              {step.title}
            </span>
          ))}
        </div>
      </CardHeader>

      <CardContent>
        {currentStep === 'company' && (
          <CompanyStep
            data={wizardData}
            onUpdate={(data) => setWizardData((prev) => ({ ...prev, ...data }))}
          />
        )}
        {currentStep === 'coa' && (
          <COAStep
            data={wizardData}
            onUpdate={(data) => setWizardData((prev) => ({ ...prev, ...data }))}
          />
        )}
        {currentStep === 'periods' && (
          <PeriodsStep
            data={wizardData}
            onUpdate={(data) => setWizardData((prev) => ({ ...prev, ...data }))}
          />
        )}
        {currentStep === 'tax' && (
          <TaxStep
            data={wizardData}
            onUpdate={(data) => setWizardData((prev) => ({ ...prev, ...data }))}
          />
        )}
        {currentStep === 'posting' && (
          <PostingRulesStep
            data={wizardData}
            onUpdate={(data) => setWizardData((prev) => ({ ...prev, ...data }))}
          />
        )}
        {currentStep === 'review' && <ReviewStep data={wizardData} setupMode={setupMode} />}
      </CardContent>

      <CardFooter className="flex justify-between">
        <Button
          variant="outline"
          onClick={goPrev}
          disabled={currentStepIndex === 0 || isPending}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Previous
        </Button>

        {currentStep === 'review' ? (
          <Button onClick={handleComplete} disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Setting up...
              </>
            ) : (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Complete Setup
              </>
            )}
          </Button>
        ) : (
          <Button onClick={goNext} disabled={isPending}>
            Next
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}
GLSetupWizard.displayName = 'GLSetupWizard'
export { GLSetupWizard }

// ========== Step Components ==========

function CompanyStep({
  data,
  onUpdate,
}: {
  data: any
  onUpdate: (data: any) => void
}) {
  const currencies = [
    { code: 'USD', name: 'US Dollar' },
    { code: 'EUR', name: 'Euro' },
    { code: 'GBP', name: 'British Pound' },
    { code: 'MYR', name: 'Malaysian Ringgit' },
    { code: 'SGD', name: 'Singapore Dollar' },
  ]

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <label className="text-sm font-medium">Base Currency</label>
        <Select
          value={data.baseCurrency}
          onValueChange={(v) => onUpdate({ baseCurrency: v })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {currencies.map((c) => (
              <SelectItem key={c.code} value={c.code}>
                {c.code} - {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-sm text-muted-foreground">
          This will be your primary reporting currency
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Fiscal Year Start</label>
          <Input
            value={data.fiscalYearStart}
            onChange={(e) => onUpdate({ fiscalYearStart: e.target.value })}
            placeholder="01-01"
          />
          <p className="text-sm text-muted-foreground">Format: MM-DD</p>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Fiscal Year End</label>
          <Input
            value={data.fiscalYearEnd}
            onChange={(e) => onUpdate({ fiscalYearEnd: e.target.value })}
            placeholder="12-31"
          />
          <p className="text-sm text-muted-foreground">Format: MM-DD</p>
        </div>
      </div>

      <div className="flex items-center justify-between rounded-lg border p-4">
        <div className="space-y-0.5">
          <label className="text-sm font-medium">Require Approval</label>
          <p className="text-sm text-muted-foreground">
            Journal entries require approval before posting
          </p>
        </div>
        <Switch
          checked={data.requireApproval}
          onCheckedChange={(v) => onUpdate({ requireApproval: v })}
        />
      </div>
    </div>
  )
}

function COAStep({
  data,
  onUpdate,
}: {
  data: any
  onUpdate: (data: any) => void
}) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Select your business type to get an industry-appropriate chart of accounts
      </p>

      <RadioGroup
        value={data.businessType}
        onValueChange={(v) => {
          const businessType = BUSINESS_TYPES.find(b => b.id === v)
          onUpdate({ 
            businessType: v, 
            coaTemplate: businessType?.coaTemplate ?? 'standard' 
          })
        }}
        className="grid gap-3"
      >
        {BUSINESS_TYPES.map((t) => (
          <div key={t.id} className="flex items-center space-x-2">
            <RadioGroupItem value={t.id} id={t.id} />
            <label
              htmlFor={t.id}
              className="flex flex-1 cursor-pointer items-center justify-between rounded-lg border p-4 hover:bg-accent"
            >
              <div>
                <p className="font-medium">{t.name}</p>
                <p className="text-sm text-muted-foreground">
                  Uses {t.coaTemplate} template
                </p>
              </div>
            </label>
          </div>
        ))}
      </RadioGroup>
    </div>
  )
}

function PeriodsStep({
  data,
  onUpdate,
}: {
  data: any
  onUpdate: (data: any) => void
}) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <label className="text-sm font-medium">Starting Year</label>
        <Input
          type="number"
          value={data.startYear}
          onChange={(e) => onUpdate({ startYear: parseInt(e.target.value) })}
          min={2020}
          max={2030}
        />
        <p className="text-sm text-muted-foreground">
          The first year to create financial periods for
        </p>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Number of Years</label>
        <Select
          value={data.numberOfYears.toString()}
          onValueChange={(v) => onUpdate({ numberOfYears: parseInt(v) })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">1 Year (12 periods)</SelectItem>
            <SelectItem value="2">2 Years (24 periods)</SelectItem>
            <SelectItem value="3">3 Years (36 periods)</SelectItem>
            <SelectItem value="5">5 Years (60 periods)</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-sm text-muted-foreground">
          Monthly periods will be created for each year
        </p>
      </div>
    </div>
  )
}

function ReviewStep({ data, setupMode }: { data: any; setupMode: SetupMode | null }) {
  const businessType = BUSINESS_TYPES.find(b => b.id === data.businessType)
  const taxPreset = data.taxPreset ? TAX_PRESETS.find((p: { id: string; name: string }) => p.id === data.taxPreset) : null

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Please review your settings before completing the setup:
      </p>

      <div className="rounded-lg border p-4 space-y-3">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Setup Mode</span>
          <span className="font-medium capitalize">{setupMode}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Base Currency</span>
          <span className="font-medium">{data.baseCurrency}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Fiscal Year</span>
          <span className="font-medium">
            {data.fiscalYearStart} to {data.fiscalYearEnd}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Require Approval</span>
          <span className="font-medium">{data.requireApproval ? 'Yes' : 'No'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Business Type</span>
          <span className="font-medium">{businessType?.name ?? data.businessType}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">COA Template</span>
          <span className="font-medium capitalize">{data.coaTemplate.replace('-', ' ')}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Periods</span>
          <span className="font-medium">
            {data.startYear} - {data.startYear + data.numberOfYears - 1} ({data.numberOfYears * 12}{' '}
            periods)
          </span>
        </div>
        {setupMode === 'custom' && (
          <>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tax Setup</span>
              <span className="font-medium">
                {data.enableTax ? (taxPreset?.name ?? 'Custom') : 'Skipped'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Default Posting Rules</span>
              <span className="font-medium">{data.applyDefaultPostingRules ? 'Applied' : 'Skipped'}</span>
            </div>
          </>
        )}
      </div>

      <div className="rounded-lg bg-muted p-4">
        <p className="text-sm">
          <strong>Note:</strong> After setup, you can add more accounts and periods, but some
          settings like base currency cannot be changed after transactions are posted.
        </p>
      </div>
    </div>
  )
}

// ========== Tax Step Component ==========
function TaxStep({
  data,
  onUpdate,
}: {
  data: any
  onUpdate: (data: any) => void
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between rounded-lg border p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Receipt className="h-5 w-5 text-primary" />
          </div>
          <div className="space-y-0.5">
            <label className="text-sm font-medium">Enable Tax Management</label>
            <p className="text-sm text-muted-foreground">
              Set up tax accounts and posting configurations
            </p>
          </div>
        </div>
        <Switch
          checked={data.enableTax}
          onCheckedChange={(v) => onUpdate({ enableTax: v, taxPreset: v ? 'simple' : null })}
        />
      </div>

      {data.enableTax && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Select a tax preset to quickly configure tax accounts
          </p>

          <RadioGroup
            value={data.taxPreset ?? ''}
            onValueChange={(v) => onUpdate({ taxPreset: v })}
            className="grid gap-3"
          >
            {TAX_PRESETS.map((preset: { id: string; name: string; description: string }) => (
              <div key={preset.id} className="flex items-center space-x-2">
                <RadioGroupItem value={preset.id} id={`tax-${preset.id}`} />
                <label
                  htmlFor={`tax-${preset.id}`}
                  className="flex flex-1 cursor-pointer items-center justify-between rounded-lg border p-4 hover:bg-accent"
                >
                  <div>
                    <p className="font-medium">{preset.name}</p>
                    <p className="text-sm text-muted-foreground">{preset.description}</p>
                  </div>
                </label>
              </div>
            ))}
          </RadioGroup>

          <p className="text-sm text-muted-foreground">
            You can customize tax codes and accounts after setup in Settings → Tax Configuration
          </p>
        </div>
      )}
    </div>
  )
}

// ========== Posting Rules Step Component ==========
function PostingRulesStep({
  data,
  onUpdate,
}: {
  data: any
  onUpdate: (data: any) => void
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between rounded-lg border p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Calculator className="h-5 w-5 text-primary" />
          </div>
          <div className="space-y-0.5">
            <label className="text-sm font-medium">Apply Default Posting Rules</label>
            <p className="text-sm text-muted-foreground">
              Automatically configure rules for forex, rounding, and discrepancies
            </p>
          </div>
        </div>
        <Switch
          checked={data.applyDefaultPostingRules}
          onCheckedChange={(v) => onUpdate({ applyDefaultPostingRules: v })}
        />
      </div>

      {data.applyDefaultPostingRules && (
        <div className="rounded-lg border p-4 space-y-3">
          <p className="text-sm font-medium">Default rules that will be applied:</p>
          <ul className="text-sm text-muted-foreground space-y-2">
            <li className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>Forex Realized Gain/Loss posting</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>Forex Unrealized Gain/Loss posting</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>Payment discrepancy handling</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>Rounding difference allocation</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>Cash clearing rules</span>
            </li>
          </ul>
        </div>
      )}

      <p className="text-sm text-muted-foreground">
        You can customize posting rules after setup in Settings → Posting Rules
      </p>
    </div>
  )
}