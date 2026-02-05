/**
 * Template Service
 * FI-GL Module - System and custom template management
 * 
 * @namespace Autlify.Lib.Features.FI.GL.Actions.Templates
 */

'use server'

import { TemplateCategory, TemplateSource } from '@/generated/prisma/client'
import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { getGLContext } from '../core/context'
import { ActionResult, errorResult, successResult } from '../core/errors'
import { checkGLPermission } from '../core/permissions'
import { FI_CONFIG_KEYS } from '../core/utils'
import { logGLAudit } from './audit'

// =====================================================
// SYSTEM TEMPLATES (Static Definitions)
// =====================================================

export const SYSTEM_TEMPLATES = {
  // Journal Upload Templates
  'journal-upload-basic': {
    id: 'journal-upload-basic',
    category: 'JOURNAL_UPLOAD' as TemplateCategory,
    source: 'SYSTEM' as TemplateSource,
    name: 'Basic Journal Upload',
    description: 'Standard journal entry upload with core fields',
    version: '1.0.0',
    requiredEntitlements: [],
    schema: {
      columns: [
        { key: 'entryDate', header: 'Entry Date', required: true, type: 'date' },
        { key: 'accountCode', header: 'Account Code', required: true, type: 'string' },
        { key: 'description', header: 'Description', required: true, type: 'string' },
        { key: 'debitAmount', header: 'Debit', required: false, type: 'number' },
        { key: 'creditAmount', header: 'Credit', required: false, type: 'number' },
        { key: 'reference', header: 'Reference', required: false, type: 'string' },
      ],
    },
    data: {
      examples: [
        { entryDate: '2026-02-01', accountCode: '1100', description: 'Cash deposit', debitAmount: 1000, creditAmount: 0, reference: 'DEP-001' },
        { entryDate: '2026-02-01', accountCode: '4000', description: 'Cash deposit', debitAmount: 0, creditAmount: 1000, reference: 'DEP-001' },
      ],
    },
  },

  'journal-upload-multicurrency': {
    id: 'journal-upload-multicurrency',
    category: 'JOURNAL_UPLOAD' as TemplateCategory,
    source: 'SYSTEM' as TemplateSource,
    name: 'Multi-Currency Journal Upload',
    description: 'Journal upload with currency and exchange rate columns',
    version: '1.0.0',
    requiredEntitlements: ['fi.gl_multi_currency'],
    schema: {
      columns: [
        { key: 'entryDate', header: 'Entry Date', required: true, type: 'date' },
        { key: 'accountCode', header: 'Account Code', required: true, type: 'string' },
        { key: 'description', header: 'Description', required: true, type: 'string' },
        { key: 'debitAmount', header: 'Debit', required: false, type: 'number' },
        { key: 'creditAmount', header: 'Credit', required: false, type: 'number' },
        { key: 'currency', header: 'Currency', required: false, type: 'string' },
        { key: 'exchangeRate', header: 'Exchange Rate', required: false, type: 'number' },
        { key: 'reference', header: 'Reference', required: false, type: 'string' },
      ],
    },
    data: { examples: [] },
  },

  'journal-upload-costcenter': {
    id: 'journal-upload-costcenter',
    category: 'JOURNAL_UPLOAD' as TemplateCategory,
    source: 'SYSTEM' as TemplateSource,
    name: 'Journal Upload with Cost Centers',
    description: 'Journal upload including cost center allocation',
    version: '1.0.0',
    requiredEntitlements: ['co.cca_access'],
    schema: {
      columns: [
        { key: 'entryDate', header: 'Entry Date', required: true, type: 'date' },
        { key: 'accountCode', header: 'Account Code', required: true, type: 'string' },
        { key: 'description', header: 'Description', required: true, type: 'string' },
        { key: 'debitAmount', header: 'Debit', required: false, type: 'number' },
        { key: 'creditAmount', header: 'Credit', required: false, type: 'number' },
        { key: 'costCenter', header: 'Cost Center', required: false, type: 'string' },
        { key: 'reference', header: 'Reference', required: false, type: 'string' },
      ],
    },
    data: { examples: [] },
  },

  'journal-upload-full': {
    id: 'journal-upload-full',
    category: 'JOURNAL_UPLOAD' as TemplateCategory,
    source: 'SYSTEM' as TemplateSource,
    name: 'Full Journal Upload',
    description: 'Complete journal upload with all optional fields',
    version: '1.0.0',
    requiredEntitlements: [],
    schema: {
      columns: [
        { key: 'entryDate', header: 'Entry Date', required: true, type: 'date' },
        { key: 'accountCode', header: 'Account Code', required: true, type: 'string' },
        { key: 'description', header: 'Description', required: true, type: 'string' },
        { key: 'debitAmount', header: 'Debit', required: false, type: 'number' },
        { key: 'creditAmount', header: 'Credit', required: false, type: 'number' },
        { key: 'currency', header: 'Currency', required: false, type: 'string', entitlement: 'fi.gl_multi_currency' },
        { key: 'exchangeRate', header: 'Exchange Rate', required: false, type: 'number', entitlement: 'fi.gl_multi_currency' },
        { key: 'costCenter', header: 'Cost Center', required: false, type: 'string', entitlement: 'co.cca_access' },
        { key: 'profitCenter', header: 'Profit Center', required: false, type: 'string', entitlement: 'co.pca_access' },
        { key: 'taxCode', header: 'Tax Code', required: false, type: 'string', entitlement: 'fi.tax_management' },
        { key: 'projectCode', header: 'Project', required: false, type: 'string', entitlement: 'pm.project_accounting' },
        { key: 'reference', header: 'Reference', required: false, type: 'string' },
      ],
    },
    data: { examples: [] },
  },

  // Chart of Accounts Templates
  'coa-standard': {
    id: 'coa-standard',
    category: 'CHART_OF_ACCOUNTS' as TemplateCategory,
    source: 'SYSTEM' as TemplateSource,
    name: 'Standard Chart of Accounts',
    description: 'General purpose COA suitable for most businesses',
    version: '1.0.0',
    requiredEntitlements: [],
    schema: { format: 'json' },
    data: { templateKey: 'standard' },
  },

  'coa-agency': {
    id: 'coa-agency',
    category: 'CHART_OF_ACCOUNTS' as TemplateCategory,
    source: 'SYSTEM' as TemplateSource,
    name: 'Agency/Creative Services COA',
    description: 'COA for advertising agencies and creative firms',
    version: '1.0.0',
    requiredEntitlements: [],
    schema: { format: 'json' },
    data: { templateKey: 'agency' },
  },

  'coa-service-business': {
    id: 'coa-service-business',
    category: 'CHART_OF_ACCOUNTS' as TemplateCategory,
    source: 'SYSTEM' as TemplateSource,
    name: 'Professional Services COA',
    description: 'COA for consulting, legal, accounting firms',
    version: '1.0.0',
    requiredEntitlements: [],
    schema: { format: 'json' },
    data: { templateKey: 'service-business' },
  },

  'coa-minimal': {
    id: 'coa-minimal',
    category: 'CHART_OF_ACCOUNTS' as TemplateCategory,
    source: 'SYSTEM' as TemplateSource,
    name: 'Minimal COA',
    description: 'Simple COA for small businesses',
    version: '1.0.0',
    requiredEntitlements: [],
    schema: { format: 'json' },
    data: { templateKey: 'minimal' },
  },
} as const

export type SystemTemplateKey = keyof typeof SYSTEM_TEMPLATES

// =====================================================
// SCHEMAS
// =====================================================

const templateSchema = z.object({
  category: z.nativeEnum(TemplateCategory),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  version: z.string().default('1.0.0'),
  schema: z.record(z.string(), z.any()),
  data: z.record(z.string(), z.any()).optional(),
  requiredEntitlements: z.array(z.string()).default([]),
  isPublic: z.boolean().default(false),
})

const updateTemplateSchema = templateSchema.partial().extend({
  id: z.string().uuid(),
})

export type TemplateInput = z.infer<typeof templateSchema>
export type UpdateTemplateInput = z.infer<typeof updateTemplateSchema>

// =====================================================
// COLUMN DEFINITIONS
// =====================================================

export interface TemplateColumn {
  key: string
  header: string
  required: boolean
  type: 'string' | 'number' | 'date' | 'select'
  validation?: string
  entitlement?: string
  examples?: string[]
}

export const JOURNAL_TEMPLATE_COLUMNS: TemplateColumn[] = [
  { key: 'entryDate', header: 'Entry Date', required: true, type: 'date' },
  { key: 'accountCode', header: 'Account Code', required: true, type: 'string' },
  { key: 'description', header: 'Description', required: true, type: 'string' },
  { key: 'debitAmount', header: 'Debit', required: false, type: 'number' },
  { key: 'creditAmount', header: 'Credit', required: false, type: 'number' },
  { key: 'reference', header: 'Reference', required: false, type: 'string' },
  { key: 'currency', header: 'Currency', required: false, type: 'string', entitlement: 'fi.gl_multi_currency' },
  { key: 'exchangeRate', header: 'Exchange Rate', required: false, type: 'number', entitlement: 'fi.gl_multi_currency' },
  { key: 'costCenter', header: 'Cost Center', required: false, type: 'string', entitlement: 'co.cca_access' },
  { key: 'profitCenter', header: 'Profit Center', required: false, type: 'string', entitlement: 'co.pca_access' },
  { key: 'taxCode', header: 'Tax Code', required: false, type: 'string', entitlement: 'fi.tax_management' },
  { key: 'projectCode', header: 'Project', required: false, type: 'string', entitlement: 'pm.project_accounting' },
]

// =====================================================
// READ ACTIONS
// =====================================================

/**
 * Get system templates
 */
export async function getSystemTemplates(
  category?: TemplateCategory
): Promise<ActionResult<any[]>> {
  const templates = Object.values(SYSTEM_TEMPLATES)
  
  if (category) {
    return successResult(templates.filter((t) => t.category === category))
  }
  
  return successResult(templates)
}

/**
 * Get custom templates for agency
 */
export async function getCustomTemplates(
  category?: TemplateCategory
): Promise<ActionResult<any[]>> {
  const contextResult = await getGLContext()
  if (!contextResult.success) {
    return errorResult(contextResult.error.error)
  }

  const { context } = contextResult

  try {
    const where: any = { agencyId: context.agencyId }
    if (category) where.category = category

    const templates = await db.template.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })

    return successResult(templates)
  } catch (error) {
    console.error('Error fetching custom templates:', error)
    return errorResult('Failed to fetch templates')
  }
}

/**
 * Get all available templates (system + custom)
 */
export async function getAvailableTemplates(
  category?: TemplateCategory,
  entitlements?: string[]
): Promise<ActionResult<any[]>> {
  const contextResult = await getGLContext()
  if (!contextResult.success) {
    // Return only system templates if no context
    const systemResult = await getSystemTemplates(category)
    return systemResult
  }

  const { context } = contextResult

  // Get system templates
  const systemTemplates = Object.values(SYSTEM_TEMPLATES)
    .filter((t) => !category || t.category === category)
    .filter((t) => {
      // Filter by entitlements if provided
      if (!entitlements || t.requiredEntitlements.length === 0) return true
      return t.requiredEntitlements.every((e) => entitlements.includes(e))
    })
    .map((t) => ({ ...t, isSystem: true }))

  // Get custom templates
  try {
    const where: any = {
      OR: [
        { agencyId: context.agencyId },
        { isPublic: true },
      ],
      isActive: true,
    }
    if (category) where.category = category

    const customTemplates = await db.template.findMany({
      where,
      orderBy: { usageCount: 'desc' },
    })

    const all = [
      ...systemTemplates,
      ...customTemplates.map((t) => ({ ...t, isSystem: false })),
    ]

    return successResult(all)
  } catch (error) {
    console.error('Error fetching templates:', error)
    return successResult(systemTemplates)
  }
}

/**
 * Get template by ID
 */
export async function getTemplate(id: string): Promise<ActionResult<any>> {
  // Check system templates first
  const systemTemplate = SYSTEM_TEMPLATES[id as SystemTemplateKey]
  if (systemTemplate) {
    return successResult({ ...systemTemplate, isSystem: true })
  }

  // Check custom templates
  try {
    const template = await db.template.findUnique({
      where: { id },
    })

    if (!template) {
      return errorResult('Template not found')
    }

    return successResult({ ...template, isSystem: false })
  } catch (error) {
    console.error('Error fetching template:', error)
    return errorResult('Failed to fetch template')
  }
}

// =====================================================
// CREATE ACTIONS
// =====================================================

/**
 * Create a custom template
 */
export async function createTemplate(
  input: TemplateInput
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
    return errorResult('Permission denied: Cannot create templates')
  }

  const validation = templateSchema.safeParse(input)
  if (!validation.success) {
    return errorResult(`Validation error: ${validation.error.message}`)
  }

  const data = validation.data

  try {
    const template = await db.template.create({
      data: {
        agencyId: context.agencyId,
        category: data.category,
        name: data.name,
        description: data.description,
        version: data.version,
        source: 'CUSTOM',
        schema: data.schema,
        data: data.data,
        requiredEntitlements: data.requiredEntitlements,
        isPublic: data.isPublic,
        createdBy: context.userId,
      },
    })

    await logGLAudit({
      action: 'CREATE',
      entityType: 'TEMPLATE',
      entityId: template.id,
      description: `Created template: ${data.name}`,
      agencyId: context.agencyId ?? undefined,
    })

    revalidatePath('/agency/[agencyId]/fi/general-ledger/settings')

    return successResult(template)
  } catch (error) {
    console.error('Error creating template:', error)
    return errorResult('Failed to create template')
  }
}

/**
 * Duplicate a template
 */
export async function duplicateTemplate(
  id: string,
  newName?: string
): Promise<ActionResult<any>> {
  const contextResult = await getGLContext()
  if (!contextResult.success) {
    return errorResult(contextResult.error.error)
  }

  const { context } = contextResult

  // Get source template
  const sourceResult = await getTemplate(id)
  if (!sourceResult.success) {
    return errorResult(sourceResult.error ?? 'Template not found')
  }

  const source = sourceResult.data

  // Create copy
  return createTemplate({
    category: source.category,
    name: newName ?? `${source.name} (Copy)`,
    description: source.description,
    version: '1.0.0',
    schema: source.schema,
    data: source.data,
    requiredEntitlements: source.requiredEntitlements ?? [],
    isPublic: false,
  })
}

// =====================================================
// UPDATE ACTIONS
// =====================================================

/**
 * Update a custom template
 */
export async function updateTemplate(
  input: UpdateTemplateInput
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

  const validation = updateTemplateSchema.safeParse(input)
  if (!validation.success) {
    return errorResult(`Validation error: ${validation.error.message}`)
  }

  const { id, ...updateData } = validation.data

  try {
    // Verify ownership
    const existing = await db.template.findUnique({ where: { id } })
    if (!existing) {
      return errorResult('Template not found')
    }
    if (existing.agencyId !== context.agencyId) {
      return errorResult('Cannot modify templates owned by other agencies')
    }

    const template = await db.template.update({
      where: { id },
      data: updateData,
    })

    await logGLAudit({
      action: 'UPDATE',
      entityType: 'TEMPLATE',
      entityId: id,
      description: `Updated template: ${template.name}`,
      agencyId: context.agencyId ?? undefined,
    })

    revalidatePath('/agency/[agencyId]/fi/general-ledger/settings')

    return successResult(template)
  } catch (error) {
    console.error('Error updating template:', error)
    return errorResult('Failed to update template')
  }
}

/**
 * Increment template usage count
 */
export async function recordTemplateUsage(id: string): Promise<ActionResult<void>> {
  // Check if system template
  if (SYSTEM_TEMPLATES[id as SystemTemplateKey]) {
    return successResult(undefined) // System templates don't track usage
  }

  try {
    await db.template.update({
      where: { id },
      data: {
        usageCount: { increment: 1 },
        lastUsed: new Date(),
      },
    })
    return successResult(undefined)
  } catch (error) {
    // Non-critical, don't fail
    return successResult(undefined)
  }
}

// =====================================================
// DELETE ACTIONS
// =====================================================

/**
 * Delete a custom template
 */
export async function deleteTemplate(id: string): Promise<ActionResult<void>> {
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
    // Verify ownership
    const existing = await db.template.findUnique({ where: { id } })
    if (!existing) {
      return errorResult('Template not found')
    }
    if (existing.agencyId !== context.agencyId) {
      return errorResult('Cannot delete templates owned by other agencies')
    }

    await db.template.delete({ where: { id } })

    await logGLAudit({
      action: 'DELETE',
      entityType: 'TEMPLATE',
      entityId: id,
      description: `Deleted template: ${existing.name}`,
      agencyId: context.agencyId ?? undefined,
    })

    revalidatePath('/agency/[agencyId]/fi/general-ledger/settings')

    return successResult(undefined)
  } catch (error) {
    console.error('Error deleting template:', error)
    return errorResult('Failed to delete template')
  }
}

// =====================================================
// TEMPLATE GENERATION
// =====================================================

/**
 * Generate dynamic template based on entitlements
 */
export async function generateDynamicTemplate(
  category: TemplateCategory,
  entitlements: string[]
): Promise<ActionResult<{ columns: TemplateColumn[]; name: string }>> {
  if (category !== 'JOURNAL_UPLOAD') {
    return errorResult('Dynamic generation only supported for JOURNAL_UPLOAD')
  }

  // Filter columns based on entitlements
  const columns = JOURNAL_TEMPLATE_COLUMNS.filter((col) => {
    if (!col.entitlement) return true
    return entitlements.includes(col.entitlement)
  })

  return successResult({
    columns,
    name: 'Journal Upload Template',
  })
}

/**
 * Get template columns for download
 */
export async function getTemplateColumns(
  templateId: string,
  entitlements?: string[]
): Promise<ActionResult<TemplateColumn[]>> {
  const templateResult = await getTemplate(templateId)
  if (!templateResult.success) {
    return errorResult(templateResult.error ?? 'Template not found')
  }

  const template = templateResult.data
  const schema = template.schema as any

  if (!schema.columns) {
    return errorResult('Template has no column definitions')
  }

  let columns = schema.columns as TemplateColumn[]

  // Filter by entitlements if provided
  if (entitlements) {
    columns = columns.filter((col) => {
      if (!col.entitlement) return true
      return entitlements.includes(col.entitlement)
    })
  }

  return successResult(columns)
}
