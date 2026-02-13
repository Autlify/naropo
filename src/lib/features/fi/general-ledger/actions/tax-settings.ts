/**
 * Tax Settings & Codes (FI-TAX)
 *
 * Storage model (best-practice for flexibility):
 * - Persist tax configuration inside finance.IntegrationConnector as a dedicated connector (connectorId = "fi-tax").
 * - This keeps GLConfiguration schema clean and avoids migrations every time FI-TAX evolves.
 *
 * Notes:
 * - This module intentionally does NOT provide any jurisdiction-specific tax advice.
 * - It only provides a configurable engine (codes + posting accounts + behaviors).
 */

'use server'

import 'server-only'

import { auth } from '@/auth'
import { ConnectorType } from '@/generated/prisma/client'
import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { hasAgencyPermissionForUser } from '@/lib/features/iam/authz/permissions'
import {
  taxSettingsSchema,
  taxCodeSchema,
  TAX_TEMPLATES,
  type TaxSettingsInput,
  type TaxTemplateKey,
} from '@/lib/schemas/fi/general-ledger/tax'
import { ActionResult, errorResult, successResult } from '../core/errors'

const TAX_CONNECTOR_ID = 'fi-tax' as const
const TAX_SETTINGS_KEYS = {
  view: 'fi.configuration.tax_settings.view',
  manage: 'fi.configuration.tax_settings.manage',
} as const

// We store all tax configuration under `settings.tax`.
const StoredTaxSchema = z
  .object({
    schemaVersion: z.number().int().min(1).default(1),
    // Use a function default so TypeScript sees a full TaxSettings object (output type),
    // while still allowing the underlying schema defaults to populate values from `{}`.
    tax: taxSettingsSchema.default(() => taxSettingsSchema.parse({})),
  })
  // Avoid running `taxSettingsSchema.parse({})` at module initialization.
  .default(() => ({ schemaVersion: 1, tax: taxSettingsSchema.parse({}) }))

type StoredTax = z.infer<typeof StoredTaxSchema>

async function requireSessionUserId(): Promise<string> {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) throw new Error('Unauthorized')
  return userId
}

async function canReadTaxSettings(userId: string, agencyId: string): Promise<boolean> {
  const [canView, canManage] = await Promise.all([
    hasAgencyPermissionForUser({
      userId,
      agencyId,
      permissionKey: TAX_SETTINGS_KEYS.view,
    }),
    hasAgencyPermissionForUser({
      userId,
      agencyId,
      permissionKey: TAX_SETTINGS_KEYS.manage,
    }),
  ])

  return canView || canManage
}

async function canManageTaxSettings(userId: string, agencyId: string): Promise<boolean> {
  return hasAgencyPermissionForUser({
    userId,
    agencyId,
    permissionKey: TAX_SETTINGS_KEYS.manage,
  })
}

async function getStoredTax(agencyId: string): Promise<StoredTax> {
  const connector = await db.integrationConnector.findUnique({
    where: {
      agencyId_connectorId: {
        agencyId,
        connectorId: TAX_CONNECTOR_ID,
      },
    },
    select: { settings: true },
  })

  const raw = (connector?.settings ?? {}) as unknown
  return StoredTaxSchema.parse(raw)
}

async function upsertStoredTax(agencyId: string, userId: string, stored: StoredTax) {
  await db.integrationConnector.upsert({
    where: {
      agencyId_connectorId: {
        agencyId,
        connectorId: TAX_CONNECTOR_ID,
      },
    },
    create: {
      agencyId,
      connectorId: TAX_CONNECTOR_ID,
      connectorType: ConnectorType.INTERNAL_MODULE,
      name: 'Tax (FI-TAX)',
      isEnabled: true,
      settings: stored as any,
      createdBy: userId,
    },
    update: {
      settings: stored as any,
    },
  })
}

function normalizeTaxCodes(codes: any[]): any[] {
  // Ensure: only one default, stable ordering
  const parsed = codes.map((c) => taxCodeSchema.parse(c))

  // If multiple defaults -> keep first.
  let defaultSeen = false
  for (const c of parsed) {
    if (c.isDefault) {
      if (defaultSeen) c.isDefault = false
      defaultSeen = true
    }
  }
  // If no default but has entries -> set first.
  if (!defaultSeen && parsed.length > 0) parsed[0].isDefault = true

  // Stable sort: default first, then code.
  parsed.sort((a, b) => {
    if (a.isDefault && !b.isDefault) return -1
    if (!a.isDefault && b.isDefault) return 1
    return String(a.code).localeCompare(String(b.code))
  })

  return parsed
}

// =============================================================================
// READ
// =============================================================================

export async function getTaxSettings(agencyId: string): Promise<ActionResult<TaxSettingsInput>> {
  try {
    const userId = await requireSessionUserId()
    if (!(await canReadTaxSettings(userId, agencyId))) return errorResult('Permission denied')

    const stored = await getStoredTax(agencyId)
    return successResult(stored.tax)
  } catch (err) {
    console.error('getTaxSettings error:', err)
    return errorResult('Failed to load tax settings')
  }
}

// =============================================================================
// UPDATE SETTINGS
// =============================================================================

const updateTaxSettingsSchema = taxSettingsSchema.partial()
export type UpdateTaxSettingsInput = z.infer<typeof updateTaxSettingsSchema>

export async function updateTaxSettings(
  agencyId: string,
  patch: UpdateTaxSettingsInput
): Promise<ActionResult<TaxSettingsInput>> {
  try {
    const userId = await requireSessionUserId()
    const canManage = await canManageTaxSettings(userId, agencyId)
    if (!canManage) return errorResult('Permission denied')

    const stored = await getStoredTax(agencyId)
    const next: StoredTax = {
      ...stored,
      tax: taxSettingsSchema.parse({
        ...stored.tax,
        ...updateTaxSettingsSchema.parse(patch),
      }),
    }

    next.tax.taxCodes = normalizeTaxCodes(next.tax.taxCodes as any) as any

    await upsertStoredTax(agencyId, userId, next)
    revalidatePath(`/agency/${agencyId}/fi/general-ledger/settings`)
    revalidatePath(`/agency/${agencyId}/fi/general-ledger/settings/tax`)
    return successResult(next.tax)
  } catch (err) {
    console.error('updateTaxSettings error:', err)
    return errorResult('Failed to update tax settings')
  }
}

// =============================================================================
// TAX CODES
// =============================================================================

const upsertTaxCodeSchema = taxCodeSchema
export type UpsertTaxCodeInput = z.infer<typeof upsertTaxCodeSchema>

export async function upsertTaxCode(
  agencyId: string,
  input: UpsertTaxCodeInput
): Promise<ActionResult<TaxSettingsInput>> {
  try {
    const userId = await requireSessionUserId()
    const canManage = await canManageTaxSettings(userId, agencyId)
    if (!canManage) return errorResult('Permission denied')

    const stored = await getStoredTax(agencyId)
    const code = String(input.code).trim()
    const parsed = upsertTaxCodeSchema.parse({ ...input, code })

    const codes = [...(stored.tax.taxCodes ?? [])] as any[]
    const idx = codes.findIndex((c) => String(c.code).toLowerCase() === code.toLowerCase())

    if (idx >= 0) {
      codes[idx] = { ...codes[idx], ...parsed }
    } else {
      codes.push(parsed)
    }

    // Default uniqueness enforcement
    if (parsed.isDefault) {
      for (const c of codes) {
        if (String(c.code).toLowerCase() !== code.toLowerCase()) c.isDefault = false
      }
    }

    const next: StoredTax = {
      ...stored,
      tax: {
        ...stored.tax,
        taxCodes: normalizeTaxCodes(codes) as any,
      },
    }

    await upsertStoredTax(agencyId, userId, next)
    revalidatePath(`/agency/${agencyId}/fi/general-ledger/settings/tax`)
    return successResult(next.tax)
  } catch (err) {
    console.error('upsertTaxCode error:', err)
    return errorResult('Failed to save tax code')
  }
}

export async function deleteTaxCode(
  agencyId: string,
  code: string
): Promise<ActionResult<TaxSettingsInput>> {
  try {
    const userId = await requireSessionUserId()
    const canManage = await canManageTaxSettings(userId, agencyId)
    if (!canManage) return errorResult('Permission denied')

    const stored = await getStoredTax(agencyId)
    const nextCodes = (stored.tax.taxCodes ?? []).filter(
      (c: any) => String(c.code).toLowerCase() !== String(code).toLowerCase()
    )

    const next: StoredTax = {
      ...stored,
      tax: {
        ...stored.tax,
        taxCodes: normalizeTaxCodes(nextCodes as any) as any,
      },
    }

    await upsertStoredTax(agencyId, userId, next)
    revalidatePath(`/agency/${agencyId}/fi/general-ledger/settings/tax`)
    return successResult(next.tax)
  } catch (err) {
    console.error('deleteTaxCode error:', err)
    return errorResult('Failed to delete tax code')
  }
}

export async function setDefaultTaxCode(
  agencyId: string,
  code: string
): Promise<ActionResult<TaxSettingsInput>> {
  try {
    const userId = await requireSessionUserId()
    const canManage = await canManageTaxSettings(userId, agencyId)
    if (!canManage) return errorResult('Permission denied')

    const stored = await getStoredTax(agencyId)
    const nextCodes = (stored.tax.taxCodes ?? []).map((c: any) => ({
      ...c,
      isDefault: String(c.code).toLowerCase() === String(code).toLowerCase(),
    }))

    const next: StoredTax = {
      ...stored,
      tax: {
        ...stored.tax,
        taxCodes: normalizeTaxCodes(nextCodes as any) as any,
      },
    }

    await upsertStoredTax(agencyId, userId, next)
    revalidatePath(`/agency/${agencyId}/fi/general-ledger/settings/tax`)
    return successResult(next.tax)
  } catch (err) {
    console.error('setDefaultTaxCode error:', err)
    return errorResult('Failed to set default tax code')
  }
}

export async function setTaxCodeActive(
  agencyId: string,
  code: string,
  isActive: boolean
): Promise<ActionResult<TaxSettingsInput>> {
  try {
    const userId = await requireSessionUserId()
    const canManage = await canManageTaxSettings(userId, agencyId)
    if (!canManage) return errorResult('Permission denied')

    const stored = await getStoredTax(agencyId)
    const nextCodes = (stored.tax.taxCodes ?? []).map((c: any) => {
      if (String(c.code).toLowerCase() !== String(code).toLowerCase()) return c
      return { ...c, isActive }
    })

    const next: StoredTax = {
      ...stored,
      tax: {
        ...stored.tax,
        taxCodes: normalizeTaxCodes(nextCodes as any) as any,
      },
    }

    await upsertStoredTax(agencyId, userId, next)
    revalidatePath(`/agency/${agencyId}/fi/general-ledger/settings/tax`)
    return successResult(next.tax)
  } catch (err) {
    console.error('setTaxCodeActive error:', err)
    return errorResult('Failed to update tax code status')
  }
}

// =============================================================================
// TEMPLATES
// =============================================================================

export async function applyTaxTemplate(
  agencyId: string,
  templateKey: TaxTemplateKey
): Promise<ActionResult<TaxSettingsInput>> {
  try {
    const userId = await requireSessionUserId()
    const canManage = await canManageTaxSettings(userId, agencyId)
    if (!canManage) return errorResult('Permission denied')

    const template = TAX_TEMPLATES[templateKey]
    if (!template) return errorResult('Template not found')

    const stored = await getStoredTax(agencyId)

    const baseCodes = template.codes.map((c, idx) =>
      taxCodeSchema.parse({
        code: c.code,
        name: c.name,
        description: template.description,
        rate: 0,
        type: c.type,
        accountId: stored.tax.inputVATAccountId ?? stored.tax.outputVATAccountId ?? null,
        isDefault: idx === 0,
        isActive: true,
      })
    )

    const next: StoredTax = {
      ...stored,
      tax: {
        ...stored.tax,
        taxCodes: normalizeTaxCodes(baseCodes as any) as any,
        enabled: templateKey === 'NONE' ? false : true,
      },
    }

    await upsertStoredTax(agencyId, userId, next)
    revalidatePath(`/agency/${agencyId}/fi/general-ledger/settings/tax`)
    return successResult(next.tax)
  } catch (err) {
    console.error('applyTaxTemplate error:', err)
    return errorResult('Failed to apply template')
  }
}
