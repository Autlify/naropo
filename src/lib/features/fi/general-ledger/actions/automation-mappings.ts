/**
 * Automation Account Mappings Actions
 * FI-GL Module - Manage debit/credit account pairs for automatic postings
 * 
 * @namespace Autlify.Lib.Features.FI.GL.Actions.AutomationMappings
 */

'use server'

import { AutomationCategory } from '@/generated/prisma/client'
import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { getGLContext } from '../core/context'
import { getContextCreateData } from '../core/utils'
import { ActionResult, errorResult, successResult } from '../core/errors'
import { checkGLPermission } from '../core/permissions'
import { FI_CONFIG_KEYS } from '../core/utils'
import { logGLAudit } from './audit'

// =====================================================
// SCHEMAS
// =====================================================

const automationMappingSchema = z.object({
  category: z.nativeEnum(AutomationCategory),
  subcategory: z.string().min(1).max(100),
  debitAccountId: z.string().uuid(),
  creditAccountId: z.string().uuid(),
  tolerance: z.number().min(0).optional(),
  templateId: z.string().optional(),
  isCustom: z.boolean().default(true),
})

const updateMappingSchema = automationMappingSchema.partial().extend({
  id: z.string().uuid(),
})

export type AutomationMappingInput = z.infer<typeof automationMappingSchema>
export type UpdateMappingInput = z.infer<typeof updateMappingSchema>

// =====================================================
// INDUSTRY TEMPLATES
// =====================================================

export const INDUSTRY_ACCOUNT_TEMPLATES = {
  'agency-creative': {
    id: 'agency-creative',
    name: 'Agency / Creative Services',
    description: 'Advertising agencies, design studios, creative firms',
    coaTemplate: 'agency',
    suggestedMappings: {
      forex: {
        realizedGain: { code: '7100', name: 'Forex Gain - Realized', type: 'REVENUE' },
        realizedLoss: { code: '8100', name: 'Forex Loss - Realized', type: 'EXPENSE' },
        unrealizedGain: { code: '7110', name: 'Forex Gain - Unrealized', type: 'REVENUE' },
        unrealizedLoss: { code: '8110', name: 'Forex Loss - Unrealized', type: 'EXPENSE' },
      },
      discrepancy: {
        rounding: { code: '8200', name: 'Rounding Difference', type: 'EXPENSE' },
        payment: { code: '8210', name: 'Payment Discrepancy', type: 'EXPENSE' },
      },
      operations: {
        salesRevenue: { code: '4100', name: 'Service Revenue', type: 'REVENUE' },
        cogs: { code: '5100', name: 'Direct Project Costs', type: 'EXPENSE' },
      },
      clearing: {
        cash: { code: '1110', name: 'Cash Clearing', type: 'ASSET' },
        tax: { code: '2200', name: 'Tax Clearing', type: 'LIABILITY' },
      },
    },
  },
  'retail-trading': {
    id: 'retail-trading',
    name: 'Retail / Trading',
    description: 'Retail stores, wholesale, e-commerce',
    coaTemplate: 'standard',
    suggestedMappings: {
      forex: {
        realizedGain: { code: '7100', name: 'Forex Gain - Realized', type: 'REVENUE' },
        realizedLoss: { code: '8100', name: 'Forex Loss - Realized', type: 'EXPENSE' },
        unrealizedGain: { code: '7110', name: 'Forex Gain - Unrealized', type: 'REVENUE' },
        unrealizedLoss: { code: '8110', name: 'Forex Loss - Unrealized', type: 'EXPENSE' },
      },
      discrepancy: {
        rounding: { code: '8200', name: 'Rounding Difference', type: 'EXPENSE' },
        payment: { code: '8210', name: 'Payment Discrepancy', type: 'EXPENSE' },
      },
      operations: {
        salesRevenue: { code: '4000', name: 'Sales Revenue', type: 'REVENUE' },
        cogs: { code: '5000', name: 'Cost of Goods Sold', type: 'EXPENSE' },
      },
      clearing: {
        cash: { code: '1110', name: 'Cash Clearing', type: 'ASSET' },
        tax: { code: '2200', name: 'Tax Clearing', type: 'LIABILITY' },
        inventory: { code: '1400', name: 'Inventory Clearing', type: 'ASSET' },
      },
    },
  },
  'professional-services': {
    id: 'professional-services',
    name: 'Professional Services',
    description: 'Consulting, legal, accounting firms',
    coaTemplate: 'service-business',
    suggestedMappings: {
      forex: {
        realizedGain: { code: '7100', name: 'Forex Gain - Realized', type: 'REVENUE' },
        realizedLoss: { code: '8100', name: 'Forex Loss - Realized', type: 'EXPENSE' },
        unrealizedGain: { code: '7110', name: 'Forex Gain - Unrealized', type: 'REVENUE' },
        unrealizedLoss: { code: '8110', name: 'Forex Loss - Unrealized', type: 'EXPENSE' },
      },
      discrepancy: {
        rounding: { code: '8200', name: 'Rounding Difference', type: 'EXPENSE' },
        payment: { code: '8210', name: 'Payment Discrepancy', type: 'EXPENSE' },
      },
      operations: {
        salesRevenue: { code: '4100', name: 'Professional Fees', type: 'REVENUE' },
        cogs: { code: '5100', name: 'Direct Labor Costs', type: 'EXPENSE' },
      },
      clearing: {
        cash: { code: '1110', name: 'Cash Clearing', type: 'ASSET' },
        tax: { code: '2200', name: 'Tax Clearing', type: 'LIABILITY' },
      },
    },
  },
  minimal: {
    id: 'minimal',
    name: 'Minimal / Simple',
    description: 'Simple bookkeeping for small businesses',
    coaTemplate: 'minimal',
    suggestedMappings: {
      forex: {
        realizedGain: { code: '7000', name: 'Other Income', type: 'REVENUE' },
        realizedLoss: { code: '8000', name: 'Other Expense', type: 'EXPENSE' },
      },
      discrepancy: {
        rounding: { code: '8000', name: 'Other Expense', type: 'EXPENSE' },
      },
      operations: {
        salesRevenue: { code: '4000', name: 'Revenue', type: 'REVENUE' },
        cogs: { code: '5000', name: 'Expenses', type: 'EXPENSE' },
      },
      clearing: {
        cash: { code: '1100', name: 'Cash', type: 'ASSET' },
      },
    },
  },
} as const

export type IndustryTemplateKey = keyof typeof INDUSTRY_ACCOUNT_TEMPLATES

// =====================================================
// READ ACTIONS
// =====================================================

/**
 * Get all automation mappings for the current context
 */
export async function getAutomationMappings(): Promise<ActionResult<any[]>> {
  const contextResult = await getGLContext()
  if (!contextResult.success) {
    return errorResult(contextResult.error.error)
  }

  const { context } = contextResult
  const hasPermission = await checkGLPermission(
    context,
    FI_CONFIG_KEYS.posting_rules.view
  )
  if (!hasPermission) {
    return errorResult('Permission denied')
  }

  try {
    const whereClause = context.subAccountId
      ? { subAccountId: context.subAccountId }
      : { agencyId: context.agencyId, subAccountId: null }

    const mappings = await db.automationAccountMapping.findMany({
      where: whereClause,
      include: {
        DebitAccount: { select: { id: true, code: true, name: true, accountType: true } },
        CreditAccount: { select: { id: true, code: true, name: true, accountType: true } },
      },
      orderBy: [{ category: 'asc' }, { subcategory: 'asc' }],
    })

    return successResult(mappings)
  } catch (error) {
    console.error('Error fetching automation mappings:', error)
    return errorResult('Failed to fetch automation mappings')
  }
}

/**
 * Get mappings by category
 */
export async function getMappingsByCategory(
  category: AutomationCategory
): Promise<ActionResult<any[]>> {
  const contextResult = await getGLContext()
  if (!contextResult.success) {
    return errorResult(contextResult.error.error)
  }

  const { context } = contextResult
  const hasPermission = await checkGLPermission(
    context,
    FI_CONFIG_KEYS.posting_rules.view
  )
  if (!hasPermission) {
    return errorResult('Permission denied')
  }

  try {
    const whereClause = context.subAccountId
      ? { subAccountId: context.subAccountId, category }
      : { agencyId: context.agencyId, subAccountId: null, category }

    const mappings = await db.automationAccountMapping.findMany({
      where: whereClause,
      include: {
        DebitAccount: { select: { id: true, code: true, name: true, accountType: true } },
        CreditAccount: { select: { id: true, code: true, name: true, accountType: true } },
      },
      orderBy: { subcategory: 'asc' },
    })

    return successResult(mappings)
  } catch (error) {
    console.error('Error fetching mappings by category:', error)
    return errorResult('Failed to fetch mappings')
  }
}

/**
 * Get industry templates
 */
export async function getIndustryTemplates(): Promise<ActionResult<typeof INDUSTRY_ACCOUNT_TEMPLATES>> {
  return successResult(INDUSTRY_ACCOUNT_TEMPLATES)
}

// =====================================================
// CREATE ACTIONS
// =====================================================

/**
 * Create a single automation mapping
 */
export async function createAutomationMapping(
  input: AutomationMappingInput
): Promise<ActionResult<any>> {
  const contextResult = await getGLContext()
  if (!contextResult.success) {
    return errorResult(contextResult.error.error)
  }

  const { context } = contextResult
  const hasPermission = await checkGLPermission(
    context,
    FI_CONFIG_KEYS.posting_rules.manage
  )
  if (!hasPermission) {
    return errorResult('Permission denied: Cannot manage automation mappings')
  }

  // Validate input
  const validation = automationMappingSchema.safeParse(input)
  if (!validation.success) {
    return errorResult(`Validation error: ${validation.error.message}`)
  }

  const data = validation.data

  // Verify accounts exist
  const [debitAccount, creditAccount] = await Promise.all([
    db.chartOfAccount.findUnique({ where: { id: data.debitAccountId } }),
    db.chartOfAccount.findUnique({ where: { id: data.creditAccountId } }),
  ])

  if (!debitAccount) {
    return errorResult('Debit account not found')
  }
  if (!creditAccount) {
    return errorResult('Credit account not found')
  }

  try {
    const contextData = getContextCreateData(context)

    const mapping = await db.automationAccountMapping.create({
      data: {
        ...contextData,
        category: data.category,
        subcategory: data.subcategory,
        debitAccountId: data.debitAccountId,
        creditAccountId: data.creditAccountId,
        tolerance: data.tolerance,
        templateId: data.templateId,
        isCustom: data.isCustom,
        createdBy: context.userId,
      },
      include: {
        DebitAccount: { select: { id: true, code: true, name: true } },
        CreditAccount: { select: { id: true, code: true, name: true } },
      },
    })

    await logGLAudit({
      action: 'CREATE',
      entityType: 'AUTOMATION_MAPPING',
      entityId: mapping.id,
      description: `Created ${data.category} mapping: ${data.subcategory}`,
      agencyId: context.agencyId ?? undefined,
      subAccountId: context.subAccountId ?? undefined,
    })

    revalidatePath('/agency/[agencyId]/fi/general-ledger/settings')

    return successResult(mapping)
  } catch (error: any) {
    if (error.code === 'P2002') {
      return errorResult('Mapping for this category/subcategory already exists')
    }
    console.error('Error creating automation mapping:', error)
    return errorResult('Failed to create automation mapping')
  }
}

/**
 * Apply industry template mappings
 */
export async function applyIndustryTemplate(
  templateId: IndustryTemplateKey,
  overwrite: boolean = false
): Promise<ActionResult<{ created: number; skipped: number; errors: string[] }>> {
  const contextResult = await getGLContext()
  if (!contextResult.success) {
    return errorResult(contextResult.error.error)
  }

  const { context } = contextResult
  const hasPermission = await checkGLPermission(
    context,
    FI_CONFIG_KEYS.posting_rules.manage
  )
  if (!hasPermission) {
    return errorResult('Permission denied')
  }

  const template = INDUSTRY_ACCOUNT_TEMPLATES[templateId]
  if (!template) {
    return errorResult(`Template not found: ${templateId}`)
  }

  const contextData = getContextCreateData(context)
  const whereClause = context.subAccountId
    ? { subAccountId: context.subAccountId }
    : { agencyId: context.agencyId, subAccountId: null }

  let created = 0
  let skipped = 0
  const errors: string[] = []

  // Process each category
  for (const [categoryKey, subcategories] of Object.entries(template.suggestedMappings)) {
    const category = categoryKey.toUpperCase() as AutomationCategory

    for (const [subcategory, accountDefRaw] of Object.entries(subcategories as Record<string, { code: string; name: string }>)) {
      const accountDef = accountDefRaw as { code: string; name: string }
      // Find matching accounts by code
      const account = await db.chartOfAccount.findFirst({
        where: {
          ...whereClause,
          code: accountDef.code,
          isArchived: false,
        },
      })

      if (!account) {
        errors.push(`Account ${accountDef.code} (${accountDef.name}) not found for ${category}.${subcategory}`)
        continue
      }

      // Check if mapping exists
      const existing = await db.automationAccountMapping.findFirst({
        where: {
          ...whereClause,
          category,
          subcategory,
        },
      })

      if (existing && !overwrite) {
        skipped++
        continue
      }

      try {
        if (existing && overwrite) {
          await db.automationAccountMapping.update({
            where: { id: existing.id },
            data: {
              debitAccountId: account.id,
              creditAccountId: account.id,
              templateId: templateId,
              isCustom: false,
            },
          })
        } else {
          await db.automationAccountMapping.create({
            data: {
              ...contextData,
              category,
              subcategory,
              debitAccountId: account.id,
              creditAccountId: account.id,
              templateId: templateId,
              isCustom: false,
              createdBy: context.userId,
            },
          })
        }
        created++
      } catch (error) {
        errors.push(`Failed to create mapping for ${category}.${subcategory}`)
      }
    }
  }

  await logGLAudit({
    action: 'CREATE',
    entityType: 'AUTOMATION_MAPPING',
    entityId: 'bulk',
    description: `Applied industry template: ${template.name} (${created} created, ${skipped} skipped)`,
    agencyId: context.agencyId ?? undefined,
    subAccountId: context.subAccountId ?? undefined,
  })

  revalidatePath('/agency/[agencyId]/fi/general-ledger/settings')

  return successResult({ created, skipped, errors })
}

// =====================================================
// UPDATE ACTIONS
// =====================================================

/**
 * Update an automation mapping
 */
export async function updateAutomationMapping(
  input: UpdateMappingInput
): Promise<ActionResult<any>> {
  const contextResult = await getGLContext()
  if (!contextResult.success) {
    return errorResult(contextResult.error.error)
  }

  const { context } = contextResult
  const hasPermission = await checkGLPermission(
    context,
    FI_CONFIG_KEYS.posting_rules.manage
  )
  if (!hasPermission) {
    return errorResult('Permission denied')
  }

  const validation = updateMappingSchema.safeParse(input)
  if (!validation.success) {
    return errorResult(`Validation error: ${validation.error.message}`)
  }

  const { id, ...updateData } = validation.data

  try {
    const mapping = await db.automationAccountMapping.update({
      where: { id },
      data: {
        ...updateData,
        isCustom: true, // Mark as custom when modified
      },
      include: {
        DebitAccount: { select: { id: true, code: true, name: true } },
        CreditAccount: { select: { id: true, code: true, name: true } },
      },
    })

    await logGLAudit({
      action: 'UPDATE',
      entityType: 'AUTOMATION_MAPPING',
      entityId: id,
      description: `Updated ${mapping.category} mapping: ${mapping.subcategory}`,
      agencyId: context.agencyId ?? undefined,
      subAccountId: context.subAccountId ?? undefined,
    })

    revalidatePath('/agency/[agencyId]/fi/general-ledger/settings')

    return successResult(mapping)
  } catch (error) {
    console.error('Error updating automation mapping:', error)
    return errorResult('Failed to update automation mapping')
  }
}

/**
 * Toggle mapping active status
 */
export async function toggleMappingStatus(
  id: string,
  isActive: boolean
): Promise<ActionResult<any>> {
  return updateAutomationMapping({ id, isActive } as any)
}

// =====================================================
// DELETE ACTIONS
// =====================================================

/**
 * Delete an automation mapping
 */
export async function deleteAutomationMapping(id: string): Promise<ActionResult<void>> {
  const contextResult = await getGLContext()
  if (!contextResult.success) {
    return errorResult(contextResult.error.error)
  }

  const { context } = contextResult
  const hasPermission = await checkGLPermission(
    context,
    FI_CONFIG_KEYS.posting_rules.manage
  )
  if (!hasPermission) {
    return errorResult('Permission denied')
  }

  try {
    const mapping = await db.automationAccountMapping.findUnique({
      where: { id },
    })

    if (!mapping) {
      return errorResult('Mapping not found')
    }

    await db.automationAccountMapping.delete({
      where: { id },
    })

    await logGLAudit({
      action: 'DELETE',
      entityType: 'AUTOMATION_MAPPING',
      entityId: id,
      description: `Deleted ${mapping.category} mapping: ${mapping.subcategory}`,
      agencyId: context.agencyId ?? undefined,
      subAccountId: context.subAccountId ?? undefined,
    })

    revalidatePath('/agency/[agencyId]/fi/general-ledger/settings')

    return successResult(undefined)
  } catch (error) {
    console.error('Error deleting automation mapping:', error)
    return errorResult('Failed to delete automation mapping')
  }
}

/**
 * Delete all mappings for a category
 */
export async function deleteMappingsByCategory(
  category: AutomationCategory
): Promise<ActionResult<{ deleted: number }>> {
  const contextResult = await getGLContext()
  if (!contextResult.success) {
    return errorResult(contextResult.error.error)
  }

  const { context } = contextResult
  const hasPermission = await checkGLPermission(
    context,
    FI_CONFIG_KEYS.posting_rules.manage
  )
  if (!hasPermission) {
    return errorResult('Permission denied')
  }

  try {
    const whereClause = context.subAccountId
      ? { subAccountId: context.subAccountId, category }
      : { agencyId: context.agencyId, subAccountId: null, category }

    const result = await db.automationAccountMapping.deleteMany({
      where: whereClause,
    })

    await logGLAudit({
      action: 'DELETE',
      entityType: 'AUTOMATION_MAPPING',
      entityId: 'bulk',
      description: `Deleted all ${category} mappings (${result.count} total)`,
      agencyId: context.agencyId ?? undefined,
      subAccountId: context.subAccountId ?? undefined,
    })

    revalidatePath('/agency/[agencyId]/fi/general-ledger/settings')

    return successResult({ deleted: result.count })
  } catch (error) {
    console.error('Error deleting mappings by category:', error)
    return errorResult('Failed to delete mappings')
  }
}

// =====================================================
// HELPER FUNCTIONS
// =====================================================

/**
 * Get recommended accounts for a category
 */
export async function getRecommendedAccountsForCategory(
  category: AutomationCategory
): Promise<ActionResult<any[]>> {
  const contextResult = await getGLContext()
  if (!contextResult.success) {
    return errorResult(contextResult.error.error)
  }

  const { context } = contextResult
  const whereClause = context.subAccountId
    ? { subAccountId: context.subAccountId, isArchived: false }
    : { agencyId: context.agencyId, subAccountId: null, isArchived: false }

  try {
    let accountTypes: string[] = []

    switch (category) {
      case 'FOREX':
        accountTypes = ['REVENUE', 'EXPENSE']
        break
      case 'DISCREPANCY':
        accountTypes = ['EXPENSE']
        break
      case 'OPERATIONS':
        accountTypes = ['REVENUE', 'EXPENSE']
        break
      case 'CLEARING':
        accountTypes = ['ASSET', 'LIABILITY']
        break
      case 'TAX':
        accountTypes = ['ASSET', 'LIABILITY']
        break
      case 'INVENTORY':
        accountTypes = ['ASSET', 'EXPENSE']
        break
    }

    const accounts = await db.chartOfAccount.findMany({
      where: {
        ...whereClause,
        accountType: { in: accountTypes as any },
      },
      select: {
        id: true,
        code: true,
        name: true,
        accountType: true,
        category: true,
      },
      orderBy: { code: 'asc' },
    })

    return successResult(accounts)
  } catch (error) {
    console.error('Error getting recommended accounts:', error)
    return errorResult('Failed to get recommended accounts')
  }
}
