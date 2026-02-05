/**
 * Posting Rule Templates Action
 * FI-GL Module - Quick setup with pre-built posting rules
 * 
 * @namespace Autlify.Lib.Features.FI.GL.Actions.PostingRuleTemplates
 */

'use server'

import type { SourceModule } from '@/generated/prisma/client'
import { db } from '@/lib/db'
import { POSTING_RULE_TEMPLATES, type PostingRuleTemplateKey } from '@/lib/schemas/fi/general-ledger/posting-rules'
import { revalidatePath } from 'next/cache'
import { getGLContext } from '../core/context'
import { getContextCreateData } from '../core/utils'
import {
    ActionResult,
    errorResult,
    successResult,
} from '../core/errors'
import { checkGLPermission } from '../core/permissions'
import { FI_CONFIG_KEYS, FI_MASTER_DATA_KEYS } from '../core/utils'
import { logGLAudit } from './audit'

/** Template application input */
interface ApplyTemplateInput {
  templateKey: PostingRuleTemplateKey
  debitAccountId: string
  creditAccountId: string
  // Override defaults
  priority?: number
  autoPost?: boolean
}

/**
 * Get all available posting rule templates
 */
export const getPostingRuleTemplates = async (): Promise<ActionResult<typeof POSTING_RULE_TEMPLATES>> => {
  const contextResult = await getGLContext()
  if (!contextResult.success) {
    return errorResult(contextResult.error.error)
  }

  const hasPermission = await checkGLPermission(
    contextResult.context,
    FI_CONFIG_KEYS.posting_rules.view
  )
  if (!hasPermission) {
    return errorResult('Permission denied')
  }

  return successResult(POSTING_RULE_TEMPLATES)
}

/**
 * Apply a posting rule template
 */
export const applyPostingRuleTemplate = async (
  input: ApplyTemplateInput
): Promise<ActionResult<any>> => {
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
    return errorResult('Permission denied: Cannot create posting rules')
  }

  const template = POSTING_RULE_TEMPLATES[input.templateKey]
  if (!template) {
    return errorResult(`Template not found: ${input.templateKey}`)
  }

  try {
    // Check for existing rule with same code
    const contextData = getContextCreateData(context)
    const existing = await db.postingRule.findFirst({
      where: {
        code: template.code,
        ...contextData,
      },
    })

    if (existing) {
      return errorResult(`Rule with code ${template.code} already exists`)
    }

    // Create the rule from template
    // Note: Store category and tolerance in conditions JSON
    const conditions = {
      category: template.category,
      tolerance: 'tolerance' in template ? template.tolerance : undefined,
    }

    const rule = await db.postingRule.create({
      data: {
        code: template.code,
        name: template.name,
        description: template.description,
        sourceModule: template.sourceModule as SourceModule,
        debitAccountId: input.debitAccountId,
        creditAccountId: input.creditAccountId,
        amountType: template.amountType,
        priority: input.priority ?? template.priority,
        autoPost: input.autoPost ?? template.autoPost,
        isActive: true,
        conditions,
        ...contextData,
        createdBy: context.userId,
      },
      include: {
        DebitAccount: { select: { id: true, code: true, name: true } },
        CreditAccount: { select: { id: true, code: true, name: true } },
      },
    })

    // Audit log
    await logGLAudit({
      action: 'CREATE',
      entityType: 'POSTING_RULE',
      entityId: rule.id,
      description: `Created posting rule from template: ${template.name}`,
      agencyId: context.agencyId ?? undefined,
      subAccountId: context.subAccountId ?? undefined,
    })

    revalidatePath('/agency/[agencyId]/fi/general-ledger/settings/posting-rules')

    return successResult(rule)
  } catch (error) {
    console.error('Error applying posting rule template:', error)
    return errorResult('Failed to apply template')
  }
}

/**
 * Apply multiple templates at once (Quick Setup)
 * Can be called with no arguments to use auto-detected accounts
 */
export const applyDefaultPostingRules = async (
  accountMappings?: {
    roundingAccountId?: string
    discrepancyAccountId?: string
    forexGainAccountId?: string
    forexLossAccountId?: string
    cashClearingAccountId?: string
    taxClearingAccountId?: string
  }
): Promise<ActionResult<{ created: number; skipped: number }>> => {
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
    return errorResult('Permission denied: Cannot create posting rules')
  }

  try {
    const contextData = getContextCreateData(context)
    let created = 0
    let skipped = 0

    // If no account mappings provided, try to find suitable accounts
    const mappings = accountMappings ?? {}

    // Only apply templates for which we have accounts
    const templatesToApply: Array<{
      key: PostingRuleTemplateKey
      debitAccountId: string
      creditAccountId: string
    }> = []

    // Add rounding if account provided
    if (mappings.roundingAccountId) {
      templatesToApply.push({
        key: 'ROUNDING',
        debitAccountId: mappings.roundingAccountId,
        creditAccountId: mappings.roundingAccountId,
      })
    }

    // Add payment discrepancy if account provided
    if (mappings.discrepancyAccountId) {
      templatesToApply.push({
        key: 'PAYMENT_DISCREPANCY',
        debitAccountId: mappings.discrepancyAccountId,
        creditAccountId: mappings.discrepancyAccountId,
      })
    }

    // Add forex if accounts provided
    if (mappings.forexGainAccountId && mappings.forexLossAccountId) {
      templatesToApply.push({
        key: 'FOREX_REALIZED',
        debitAccountId: mappings.forexLossAccountId,
        creditAccountId: mappings.forexGainAccountId,
      })
    }

    // Add cash clearing if account provided
    if (mappings.cashClearingAccountId) {
      templatesToApply.push({
        key: 'CASH_CLEARING',
        debitAccountId: mappings.cashClearingAccountId,
        creditAccountId: mappings.cashClearingAccountId,
      })
    }

    // Add tax clearing if account provided
    if (mappings.taxClearingAccountId) {
      templatesToApply.push({
        key: 'TAX_CLEARING',
        debitAccountId: mappings.taxClearingAccountId,
        creditAccountId: mappings.taxClearingAccountId,
      })
    }

    // Apply each template
    for (const templateConfig of templatesToApply) {
      const template = POSTING_RULE_TEMPLATES[templateConfig.key]

      // Check if already exists
      const existing = await db.postingRule.findFirst({
        where: {
          code: template.code,
          ...contextData,
        },
      })

      if (existing) {
        skipped++
        continue
      }

      // Store category and tolerance in conditions JSON
      const conditions = {
        category: template.category,
        tolerance: 'tolerance' in template ? template.tolerance : undefined,
      }

      // Create rule
      await db.postingRule.create({
        data: {
          code: template.code,
          name: template.name,
          description: template.description,
          sourceModule: template.sourceModule as SourceModule,
          debitAccountId: templateConfig.debitAccountId,
          creditAccountId: templateConfig.creditAccountId,
          amountType: template.amountType,
          priority: template.priority,
          autoPost: template.autoPost,
          isActive: true,
          conditions,
          ...contextData,
          createdBy: context.userId,
        },
      })

      created++
    }

    // Audit log
    await logGLAudit({
      action: 'CREATE',
      entityType: 'POSTING_RULE',
      entityId: 'bulk',
      description: `Applied ${created} default posting rules (${skipped} skipped)`,
      agencyId: context.agencyId ?? undefined,
      subAccountId: context.subAccountId ?? undefined,
    })

    revalidatePath('/agency/[agencyId]/fi/general-ledger/settings/posting-rules')

    return successResult({ created, skipped })
  } catch (error) {
    console.error('Error applying default posting rules:', error)
    return errorResult('Failed to apply default rules')
  }
}

/**
 * Get recommended accounts for posting rule templates
 */
export const getRecommendedAccounts = async (): Promise<
  ActionResult<{
    roundingAccounts: Array<{ id: string; code: string; name: string }>
    discrepancyAccounts: Array<{ id: string; code: string; name: string }>
    forexAccounts: Array<{ id: string; code: string; name: string }>
    clearingAccounts: Array<{ id: string; code: string; name: string }>
  }>
> => {
  const contextResult = await getGLContext()
  if (!contextResult.success) {
    return errorResult(contextResult.error.error)
  }

  const { context } = contextResult

  const hasPermission = await checkGLPermission(
    context,
    FI_MASTER_DATA_KEYS.accounts.view
  )
  if (!hasPermission) {
    return errorResult('Permission denied')
  }

  try {
    const whereClause = context.contextType === 'SUBACCOUNT' && context.subAccountId
      ? { subAccountId: context.subAccountId, isArchived: false }
      : { agencyId: context.agencyId, subAccountId: null, isArchived: false }

    // Fetch accounts
    const accounts = await db.chartOfAccount.findMany({
      where: whereClause,
      select: { id: true, code: true, name: true, accountType: true, category: true },
    })

    // Filter by suitable account types and names
    // AccountType: ASSET, LIABILITY, EQUITY, REVENUE, EXPENSE
    // AccountCategory: CURRENT_ASSET, FIXED_ASSET, OTHER_ASSET, CURRENT_LIABILITY, etc.
    const roundingAccounts = accounts.filter(
      a => a.accountType === 'EXPENSE' || a.name.toLowerCase().includes('rounding')
    )
    const discrepancyAccounts = accounts.filter(
      a => a.accountType === 'EXPENSE' || a.name.toLowerCase().includes('discrepancy')
    )
    const forexAccounts = accounts.filter(
      a => 
        a.accountType === 'REVENUE' || 
        a.accountType === 'EXPENSE' ||
        a.name.toLowerCase().includes('forex') ||
        a.name.toLowerCase().includes('exchange')
    )
    const clearingAccounts = accounts.filter(
      a => 
        a.accountType === 'ASSET' || 
        a.accountType === 'LIABILITY' ||
        a.name.toLowerCase().includes('clearing')
    )

    return successResult({
      roundingAccounts,
      discrepancyAccounts,
      forexAccounts,
      clearingAccounts,
    })
  } catch (error) {
    console.error('Error getting recommended accounts:', error)
    return errorResult('Failed to get recommended accounts')
  }
}
