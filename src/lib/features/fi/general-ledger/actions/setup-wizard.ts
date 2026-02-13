'use server'

import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { initializeGLConfiguration } from './configuration'
import { applyTemplate } from './coa-template'
import { createFinancialPeriod } from './periods'
import { logGLAudit } from './audit'
import { PeriodType } from '../../../../../generated/prisma/enums'
import { getActionContext, hasContextPermission } from '@/lib/features/iam/authz/action-context'

// ========== Types ==========

type ActionResult<T> = {
  success: boolean
  data?: T
  error?: string
}

type SetupWizardStep =
  | 'company-info'
  | 'configuration'
  | 'chart-of-accounts'
  | 'financial-periods'
  | 'review'

type WizardState = {
  currentStep: SetupWizardStep
  completedSteps: SetupWizardStep[]
  data: {
    companyInfo?: {
      name: string
      industry?: string
      baseCurrency: string
      fiscalYearStart: string
      fiscalYearEnd: string
    }
    configuration?: {
      useControlAccounts: boolean
      requireApproval: boolean
      autoPostingEnabled: boolean
    }
    coaTemplate?: string
    periodsConfig?: {
      startYear: number
      numberOfYears: number
      periodType: 'MONTHLY' | 'QUARTERLY' | 'ANNUAL'
    }
  }
}

// ========== Helper Functions ==========

const getContext = getActionContext

// ========== Setup Wizard Actions ==========

export const initializeWizard = async (): Promise<ActionResult<WizardState>> => {
  try {
    const context = await getContext()
    if (!context) {
      return { success: false, error: 'Unauthorized: No session found' }
    }

    // Check if already setup
    const whereClause = context.subAccountId
      ? { subAccountId: context.subAccountId }
      : { agencyId: context.agencyId, subAccountId: null }

    const existingConfig = await db.gLConfiguration.findFirst({ where: whereClause })

    if (existingConfig) {
      return {
        success: false,
        error: 'GL is already configured. Use settings to modify.',
      }
    }

    const initialState: WizardState = {
      currentStep: 'company-info',
      completedSteps: [],
      data: {},
    }

    return { success: true, data: initialState }
  } catch (error) {
    console.error('Error initializing wizard:', error)
    return { success: false, error: 'Failed to initialize setup wizard' }
  }
}

export const saveWizardStep = async (
  step: SetupWizardStep,
  data: any
): Promise<ActionResult<WizardState>> => {
  try {
    const context = await getContext()
    if (!context) {
      return { success: false, error: 'Unauthorized: No session found' }
    }

    // Validate step data based on step type
    let validatedData: any

    switch (step) {
      case 'company-info':
        if (!data.baseCurrency || !data.fiscalYearStart || !data.fiscalYearEnd) {
          return { success: false, error: 'Missing required company information' }
        }
        validatedData = {
          companyInfo: {
            name: data.name,
            industry: data.industry,
            baseCurrency: data.baseCurrency,
            fiscalYearStart: data.fiscalYearStart,
            fiscalYearEnd: data.fiscalYearEnd,
          },
        }
        break

      case 'configuration':
        validatedData = {
          configuration: {
            useControlAccounts: data.useControlAccounts ?? true,
            requireApproval: data.requireApproval ?? true,
            autoPostingEnabled: data.autoPostingEnabled ?? false,
          },
        }
        break

      case 'chart-of-accounts':
        if (!data.templateId) {
          return { success: false, error: 'Please select a chart of accounts template' }
        }
        validatedData = {
          coaTemplate: data.templateId,
        }
        break

      case 'financial-periods':
        if (!data.startYear || !data.numberOfYears) {
          return { success: false, error: 'Missing period configuration' }
        }
        validatedData = {
          periodsConfig: {
            startYear: data.startYear,
            numberOfYears: data.numberOfYears,
            periodType: data.periodType ?? 'MONTHLY',
          },
        }
        break

      default:
        return { success: false, error: 'Invalid wizard step' }
    }

    // Return updated state (in real app, this would be stored in session/cache)
    const updatedState: WizardState = {
      currentStep: getNextStep(step),
      completedSteps: [step],
      data: validatedData,
    }

    return { success: true, data: updatedState }
  } catch (error) {
    console.error('Error saving wizard step:', error)
    return { success: false, error: 'Failed to save wizard step' }
  }
}

const getNextStep = (currentStep: SetupWizardStep): SetupWizardStep => {
  const steps: SetupWizardStep[] = [
    'company-info',
    'configuration',
    'chart-of-accounts',
    'financial-periods',
    'review',
  ]
  const currentIndex = steps.indexOf(currentStep)
  return steps[Math.min(currentIndex + 1, steps.length - 1)]
}

export const completeSetup = async (
  wizardData: WizardState['data']
): Promise<ActionResult<void>> => {
  try {
    const context = await getContext()
    if (!context) {
      return { success: false, error: 'Unauthorized: No session found' }
    }

    const hasPermission = await hasContextPermission(context, 'fi.general_ledger.settings.manage')

    if (!hasPermission) {
      return { success: false, error: 'Unauthorized: Missing permission' }
    }

    // Validate all required data is present
    if (!wizardData.companyInfo || !wizardData.coaTemplate || !wizardData.periodsConfig) {
      return { success: false, error: 'Incomplete setup data' }
    }

    // Execute setup in transaction
    await db.$transaction(async (tx) => {
      // 1. Create GL Configuration
      const configResult = await initializeGLConfiguration({
        baseCurrency: wizardData.companyInfo!.baseCurrency,
        fiscalYearStart: wizardData.companyInfo!.fiscalYearStart,
        fiscalYearEnd: wizardData.companyInfo!.fiscalYearEnd,
        useControlAccounts: wizardData.configuration?.useControlAccounts ?? true,
        requireApproval: wizardData.configuration?.requireApproval ?? true,
        autoPostingEnabled: wizardData.configuration?.autoPostingEnabled ?? false,
        allowFuturePeriodPost: true,
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
        throw new Error(configResult.error)
      }

      // 2. Apply COA Template
      const templateResult = await applyTemplate(wizardData.coaTemplate!, {
        includeSystemAccounts: true,
      })

      if (!templateResult.success) {
        throw new Error(templateResult.error)
      }

      // 3. Create Financial Periods
      for (let year = wizardData.periodsConfig!.startYear; year < wizardData.periodsConfig!.startYear + wizardData.periodsConfig!.numberOfYears; year++) {
        for (let month = 1; month <= 12; month++) {
          const startDate = new Date(year, month - 1, 1)
          const endDate = new Date(year, month, 0)
          const periodsResult = await createFinancialPeriod({
            name: `${year}-${String(month).padStart(2, '0')}`,
            periodType: 'MONTH' as PeriodType,
            fiscalYear: year,
            fiscalPeriod: month,
            startDate,
            endDate,
            isYearEnd: month === 12,
          })
          if (!periodsResult.success) {
            throw new Error(periodsResult.error)
          }
        }
      }
    }
    )


    await logGLAudit({
      action: 'CREATE',
      entityType: 'GLConfiguration',
      entityId: 'setup-wizard',
      agencyId: context.agencyId,
      subAccountId: context.subAccountId,
      description: 'Completed GL setup wizard',
    })

    revalidatePath(`/agency/${context.agencyId}/finance/gl`)

    return { success: true }
  } catch (error) {
    console.error('Error completing setup:', error)
    return { success: false, error: 'Failed to complete GL setup' }
  }
}
