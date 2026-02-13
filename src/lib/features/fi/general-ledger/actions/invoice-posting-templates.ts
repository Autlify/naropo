/**
 * Invoice Posting Templates Actions (FI-AP/AR)
 *
 * Storage: finance.IntegrationConnector (connectorId = "fi-invoice")
 * - Keeps schema evolution flexible (no frequent migrations)
 * - Provides SSoT config for invoice → journal-entry posting.
 */

'use server'

import 'server-only'

import { auth } from '@/auth'
import { ConnectorType } from '@/generated/prisma/client'
import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'

import { hasAgencyPermissionForUser } from '@/lib/features/iam/authz/permissions'
import {
  INVOICE_POSTING_TEMPLATES,
  invoicePostingTemplateSchema,
  storedInvoicePostingSchema,
  validateInvoicePostingTemplate,
  type InvoiceDocumentKind,
  type InvoicePostingTemplateInput,
  type StoredInvoicePosting,
} from '@/lib/schemas/fi/general-ledger/invoice-posting-templates'
import { ActionResult, errorResult, successResult } from '../core/errors'

const INVOICE_CONNECTOR_ID = 'fi-invoice' as const
const INVOICE_TEMPLATE_KEYS = {
  view: 'fi.configuration.invoice_templates.view',
  manage: 'fi.configuration.invoice_templates.manage',
} as const

async function requireSessionUserId(): Promise<string> {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) throw new Error('Unauthorized')
  return userId
}

async function canReadInvoiceTemplates(userId: string, agencyId: string): Promise<boolean> {
  const [canView, canManage] = await Promise.all([
    hasAgencyPermissionForUser({
      userId,
      agencyId,
      permissionKey: INVOICE_TEMPLATE_KEYS.view,
    }),
    hasAgencyPermissionForUser({
      userId,
      agencyId,
      permissionKey: INVOICE_TEMPLATE_KEYS.manage,
    }),
  ])

  return canView || canManage
}

async function canManageInvoiceTemplates(userId: string, agencyId: string): Promise<boolean> {
  return hasAgencyPermissionForUser({
    userId,
    agencyId,
    permissionKey: INVOICE_TEMPLATE_KEYS.manage,
  })
}

async function getStoredInvoicePosting(agencyId: string): Promise<StoredInvoicePosting> {
  const connector = await db.integrationConnector.findUnique({
    where: {
      agencyId_connectorId: {
        agencyId,
        connectorId: INVOICE_CONNECTOR_ID,
      },
    },
    select: { settings: true },
  })

  const raw = (connector?.settings ?? {}) as unknown
  return storedInvoicePostingSchema.parse(raw)
}

async function upsertStoredInvoicePosting(agencyId: string, userId: string, stored: StoredInvoicePosting) {
  await db.integrationConnector.upsert({
    where: {
      agencyId_connectorId: {
        agencyId,
        connectorId: INVOICE_CONNECTOR_ID,
      },
    },
    create: {
      agencyId,
      connectorId: INVOICE_CONNECTOR_ID,
      connectorType: ConnectorType.INTERNAL_MODULE,
      name: 'Invoice Templates (FI-AP/AR)',
      isEnabled: true,
      settings: stored as any,
      createdBy: userId,
    },
    update: {
      settings: stored as any,
    },
  })
}

// =============================================================================
// READ
// =============================================================================

export async function getInvoicePostingTemplates(
  agencyId: string
): Promise<
  ActionResult<{
    defaults: StoredInvoicePosting['defaults']
    system: typeof INVOICE_POSTING_TEMPLATES
    custom: Record<string, InvoicePostingTemplateInput>
  }>
> {
  try {
    const userId = await requireSessionUserId()
    if (!(await canReadInvoiceTemplates(userId, agencyId))) return errorResult('Permission denied')

    const stored = await getStoredInvoicePosting(agencyId)
    return successResult({
      defaults: stored.defaults,
      system: INVOICE_POSTING_TEMPLATES,
      custom: stored.templates ?? {},
    })
  } catch (err) {
    console.error('getInvoicePostingTemplates error:', err)
    return errorResult('Failed to load invoice posting templates')
  }
}

/**
 * Resolve the effective template by key.
 * Lookup order: custom templates → system templates.
 */
export async function resolveInvoicePostingTemplate(
  agencyId: string,
  templateKey: string
): Promise<ActionResult<InvoicePostingTemplateInput>> {
  try {
    const userId = await requireSessionUserId()
    if (!(await canReadInvoiceTemplates(userId, agencyId))) return errorResult('Permission denied')

    const stored = await getStoredInvoicePosting(agencyId)
    const custom = stored.templates?.[templateKey]
    const system = INVOICE_POSTING_TEMPLATES[templateKey]

    const tpl = custom ?? system
    if (!tpl) return errorResult('Template not found')
    return successResult(tpl)
  } catch (err) {
    console.error('resolveInvoicePostingTemplate error:', err)
    return errorResult('Failed to resolve template')
  }
}

/**
 * Resolve the default template for a document kind.
 */
export async function getDefaultInvoicePostingTemplate(
  agencyId: string,
  kind: InvoiceDocumentKind
): Promise<ActionResult<InvoicePostingTemplateInput>> {
  try {
    const userId = await requireSessionUserId()
    if (!(await canReadInvoiceTemplates(userId, agencyId))) return errorResult('Permission denied')

    const stored = await getStoredInvoicePosting(agencyId)
    const key = stored.defaults?.[kind] ?? `${kind}_STANDARD`

    const tpl = stored.templates?.[key] ?? INVOICE_POSTING_TEMPLATES[key]
    if (!tpl) return errorResult('Default template not found')

    return successResult(tpl)
  } catch (err) {
    console.error('getDefaultInvoicePostingTemplate error:', err)
    return errorResult('Failed to resolve default template')
  }
}

// =============================================================================
// WRITE
// =============================================================================

export async function setDefaultInvoicePostingTemplate(
  agencyId: string,
  kind: InvoiceDocumentKind,
  templateKey: string
): Promise<ActionResult<StoredInvoicePosting['defaults']>> {
  try {
    const userId = await requireSessionUserId()
    const canManage = await canManageInvoiceTemplates(userId, agencyId)
    if (!canManage) return errorResult('Permission denied')

    const stored = await getStoredInvoicePosting(agencyId)

    // Ensure template exists (custom or system)
    const exists = Boolean(stored.templates?.[templateKey] ?? INVOICE_POSTING_TEMPLATES[templateKey])
    if (!exists) return errorResult('Template not found')

    const next: StoredInvoicePosting = {
      ...stored,
      defaults: { ...(stored.defaults ?? ({} as any)), [kind]: templateKey },
    }

    await upsertStoredInvoicePosting(agencyId, userId, next)
    revalidatePath(`/agency/${agencyId}/fi/general-ledger/settings`)
    revalidatePath(`/agency/${agencyId}/fi/general-ledger/settings/posting-rules`)
    return successResult(next.defaults)
  } catch (err) {
    console.error('setDefaultInvoicePostingTemplate error:', err)
    return errorResult('Failed to set default template')
  }
}

export async function upsertCustomInvoicePostingTemplate(
  agencyId: string,
  input: InvoicePostingTemplateInput
): Promise<ActionResult<InvoicePostingTemplateInput>> {
  try {
    const userId = await requireSessionUserId()
    const canManage = await canManageInvoiceTemplates(userId, agencyId)
    if (!canManage) return errorResult('Permission denied')

    const parsed = invoicePostingTemplateSchema.parse(input)
    const validation = validateInvoicePostingTemplate(parsed)
    if (!validation.ok) return errorResult(validation.errors.join(' '))

    const stored = await getStoredInvoicePosting(agencyId)
    const next: StoredInvoicePosting = {
      ...stored,
      templates: {
        ...(stored.templates ?? {}),
        [parsed.key]: parsed,
      },
    }

    await upsertStoredInvoicePosting(agencyId, userId, next)
    revalidatePath(`/agency/${agencyId}/fi/general-ledger/settings`)

    return successResult(parsed)
  } catch (err) {
    console.error('upsertCustomInvoicePostingTemplate error:', err)
    return errorResult('Failed to save template')
  }
}

export async function deleteCustomInvoicePostingTemplate(
  agencyId: string,
  templateKey: string
): Promise<ActionResult<{ deleted: true }>> {
  try {
    const userId = await requireSessionUserId()
    const canManage = await canManageInvoiceTemplates(userId, agencyId)
    if (!canManage) return errorResult('Permission denied')

    const stored = await getStoredInvoicePosting(agencyId)
    if (!stored.templates?.[templateKey]) return errorResult('Custom template not found')

    const nextTemplates = { ...(stored.templates ?? {}) }
    delete nextTemplates[templateKey]

    // If any defaults point to this key, fallback to system standard.
    const nextDefaults = { ...(stored.defaults ?? ({} as any)) }
    for (const k of Object.keys(nextDefaults) as InvoiceDocumentKind[]) {
      if (nextDefaults[k] === templateKey) nextDefaults[k] = `${k}_STANDARD`
    }

    const next: StoredInvoicePosting = {
      ...stored,
      templates: nextTemplates,
      defaults: nextDefaults,
    }

    await upsertStoredInvoicePosting(agencyId, userId, next)
    revalidatePath(`/agency/${agencyId}/fi/general-ledger/settings`)

    return successResult({ deleted: true })
  } catch (err) {
    console.error('deleteCustomInvoicePostingTemplate error:', err)
    return errorResult('Failed to delete template')
  }
}
