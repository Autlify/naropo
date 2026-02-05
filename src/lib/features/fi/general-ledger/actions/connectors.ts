/**
 * Integration Connectors Actions
 * FI-GL Module - Manage internal and external service connections
 * 
 * @namespace Autlify.Lib.Features.FI.GL.Actions.Connectors
 */

'use server'

import { ConnectorHealth, ConnectorType } from '@/generated/prisma/client'
import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { getGLContext } from '../core/context'
import { ActionResult, errorResult, successResult } from '../core/errors'
import { checkGLPermission } from '../core/permissions'
import { FI_CONFIG_KEYS } from '../core/utils'
import { logGLAudit } from './audit'

// =====================================================
// CONNECTOR DEFINITIONS
// =====================================================

export const AVAILABLE_CONNECTORS = {
  // Internal Module Connectors
  'fi-ar': {
    id: 'fi-ar',
    name: 'Accounts Receivable',
    type: 'INTERNAL_MODULE' as ConnectorType,
    description: 'Connect to FI-AR for customer invoice and payment posting',
    events: ['invoice.posted', 'payment.received', 'credit.issued'],
    requiredEntitlements: ['fi.ar_access'],
    configSchema: {},
  },
  'fi-ap': {
    id: 'fi-ap',
    name: 'Accounts Payable',
    type: 'INTERNAL_MODULE' as ConnectorType,
    description: 'Connect to FI-AP for vendor invoice and payment posting',
    events: ['invoice.received', 'payment.made', 'debit.issued'],
    requiredEntitlements: ['fi.ap_access'],
    configSchema: {},
  },
  'fi-bl': {
    id: 'fi-bl',
    name: 'Bank Ledger',
    type: 'INTERNAL_MODULE' as ConnectorType,
    description: 'Connect to FI-BL for bank reconciliation postings',
    events: ['statement.imported', 'reconciliation.completed'],
    requiredEntitlements: ['fi.bl_access'],
    configSchema: {},
  },
  'co-cca': {
    id: 'co-cca',
    name: 'Cost Center Accounting',
    type: 'INTERNAL_MODULE' as ConnectorType,
    description: 'Connect to CO-CCA for cost center allocation',
    events: ['allocation.completed', 'assessment.posted'],
    requiredEntitlements: ['co.cca_access'],
    configSchema: {},
  },

  // Exchange Rate Connectors
  frankfurter: {
    id: 'frankfurter',
    name: 'Frankfurter (ECB)',
    type: 'EXCHANGE_RATE' as ConnectorType,
    description: 'Free exchange rates from European Central Bank. Updated daily.',
    tier: 'free',
    rateLimit: null,
    baseUrl: 'https://api.frankfurter.app',
    requiredEntitlements: [],
    configSchema: {
      baseCurrency: { type: 'string', default: 'USD', description: 'Base currency for rates' },
      autoSync: { type: 'boolean', default: true, description: 'Sync rates daily' },
    },
  },
  'open-exchange-rates': {
    id: 'open-exchange-rates',
    name: 'Open Exchange Rates',
    type: 'EXCHANGE_RATE' as ConnectorType,
    description: 'Exchange rates with 1000 free requests/month. API key required.',
    tier: 'freemium',
    rateLimit: { requests: 1000, period: 'month' },
    baseUrl: 'https://openexchangerates.org/api',
    requiredEntitlements: [],
    configSchema: {
      apiKey: { type: 'string', required: true, secret: true },
      baseCurrency: { type: 'string', default: 'USD' },
      autoSync: { type: 'boolean', default: true },
    },
  },
  'exchangerate-api': {
    id: 'exchangerate-api',
    name: 'ExchangeRate-API',
    type: 'EXCHANGE_RATE' as ConnectorType,
    description: 'Free tier with 1500 requests/month. API key required.',
    tier: 'freemium',
    rateLimit: { requests: 1500, period: 'month' },
    baseUrl: 'https://v6.exchangerate-api.com/v6',
    requiredEntitlements: [],
    configSchema: {
      apiKey: { type: 'string', required: true, secret: true },
    },
  },

  // Payment Connector
  stripe: {
    id: 'stripe',
    name: 'Stripe',
    type: 'PAYMENT' as ConnectorType,
    description: 'Stripe payments with automatic GL posting',
    events: ['payment.received', 'payout.sent', 'fee.charged'],
    requiredEntitlements: [],
    configSchema: {
      autoPostPayments: { type: 'boolean', default: true },
      autoPostFees: { type: 'boolean', default: true },
      feeAccountId: { type: 'string', description: 'Account for Stripe fees' },
    },
  },
} as const

export type ConnectorId = keyof typeof AVAILABLE_CONNECTORS

// =====================================================
// SCHEMAS
// =====================================================

const connectorConfigSchema = z.object({
  connectorId: z.string(),
  name: z.string().optional(),
  isEnabled: z.boolean().default(true),
  settings: z.record(z.string(), z.any()).default({}),
  credentials: z.string().optional(), // Encrypted
  fieldMappings: z.array(z.object({
    sourceField: z.string(),
    targetField: z.string(),
    transform: z.string().optional(),
  })).default([]),
})

export type ConnectorConfigInput = z.infer<typeof connectorConfigSchema>

// =====================================================
// READ ACTIONS
// =====================================================

/**
 * Get all available connectors (definitions)
 */
export async function getAvailableConnectors(): Promise<ActionResult<typeof AVAILABLE_CONNECTORS>> {
  return successResult(AVAILABLE_CONNECTORS)
}

/**
 * Get configured connectors for agency
 */
export async function getConfiguredConnectors(): Promise<ActionResult<any[]>> {
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
    const connectors = await db.integrationConnector.findMany({
      where: { agencyId: context.agencyId! },
      orderBy: { createdAt: 'desc' },
    })

    // Merge with definitions
    const result = connectors.map((conn) => ({
      ...conn,
      definition: AVAILABLE_CONNECTORS[conn.connectorId as ConnectorId] ?? null,
      credentials: undefined, // Never return credentials
    }))

    return successResult(result)
  } catch (error) {
    console.error('Error fetching connectors:', error)
    return errorResult('Failed to fetch connectors')
  }
}

/**
 * Get a specific connector configuration
 */
export async function getConnectorConfig(
  connectorId: string
): Promise<ActionResult<any>> {
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
    const connector = await db.integrationConnector.findUnique({
      where: {
        agencyId_connectorId: {
          agencyId: context.agencyId!,
          connectorId,
        },
      },
    })

    if (!connector) {
      return successResult(null)
    }

    return successResult({
      ...connector,
      definition: AVAILABLE_CONNECTORS[connectorId as ConnectorId] ?? null,
      credentials: undefined,
    })
  } catch (error) {
    console.error('Error fetching connector config:', error)
    return errorResult('Failed to fetch connector config')
  }
}

// =====================================================
// CREATE/UPDATE ACTIONS
// =====================================================

/**
 * Enable/configure a connector
 */
export async function configureConnector(
  input: ConnectorConfigInput
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
    return errorResult('Permission denied: Cannot configure connectors')
  }

  const validation = connectorConfigSchema.safeParse(input)
  if (!validation.success) {
    return errorResult(`Validation error: ${validation.error.message}`)
  }

  const data = validation.data
  const definition = AVAILABLE_CONNECTORS[data.connectorId as ConnectorId]
  
  if (!definition) {
    return errorResult(`Unknown connector: ${data.connectorId}`)
  }

  try {
    const connector = await db.integrationConnector.upsert({
      where: {
        agencyId_connectorId: {
          agencyId: context.agencyId!,
          connectorId: data.connectorId,
        },
      },
      create: {
        agencyId: context.agencyId!,
        connectorId: data.connectorId,
        connectorType: definition.type,
        name: data.name ?? definition.name,
        isEnabled: data.isEnabled,
        settings: data.settings,
        credentials: data.credentials,
        fieldMappings: data.fieldMappings,
        healthStatus: 'UNKNOWN',
        createdBy: context.userId,
      },
      update: {
        name: data.name ?? definition.name,
        isEnabled: data.isEnabled,
        settings: data.settings,
        credentials: data.credentials ?? undefined,
        fieldMappings: data.fieldMappings,
      },
    })

    await logGLAudit({
      action: 'UPDATE',
      entityType: 'INTEGRATION_CONNECTOR',
      entityId: connector.id,
      description: `Configured connector: ${definition.name}`,
      agencyId: context.agencyId ?? undefined,
    })

    revalidatePath('/agency/[agencyId]/fi/general-ledger/settings')

    return successResult({
      ...connector,
      definition,
      credentials: undefined,
    })
  } catch (error) {
    console.error('Error configuring connector:', error)
    return errorResult('Failed to configure connector')
  }
}

/**
 * Toggle connector status
 */
export async function toggleConnector(
  connectorId: string,
  isEnabled: boolean
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

  try {
    const connector = await db.integrationConnector.update({
      where: {
        agencyId_connectorId: {
          agencyId: context.agencyId!,
          connectorId,
        },
      },
      data: { isEnabled },
    })

    await logGLAudit({
      action: 'UPDATE',
      entityType: 'INTEGRATION_CONNECTOR',
      entityId: connector.id,
      description: `${isEnabled ? 'Enabled' : 'Disabled'} connector: ${connector.name}`,
      agencyId: context.agencyId ?? undefined,
    })

    revalidatePath('/agency/[agencyId]/fi/general-ledger/settings')

    return successResult(connector)
  } catch (error) {
    console.error('Error toggling connector:', error)
    return errorResult('Failed to toggle connector')
  }
}

// =====================================================
// DELETE ACTIONS
// =====================================================

/**
 * Remove a connector configuration
 */
export async function removeConnector(connectorId: string): Promise<ActionResult<void>> {
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
    await db.integrationConnector.delete({
      where: {
        agencyId_connectorId: {
          agencyId: context.agencyId!,
          connectorId,
        },
      },
    })

    await logGLAudit({
      action: 'DELETE',
      entityType: 'INTEGRATION_CONNECTOR',
      entityId: connectorId,
      description: `Removed connector: ${connectorId}`,
      agencyId: context.agencyId ?? undefined,
    })

    revalidatePath('/agency/[agencyId]/fi/general-ledger/settings')

    return successResult(undefined)
  } catch (error) {
    console.error('Error removing connector:', error)
    return errorResult('Failed to remove connector')
  }
}

// =====================================================
// HEALTH CHECK ACTIONS
// =====================================================

/**
 * Check connector health
 */
export async function checkConnectorHealth(
  connectorId: string
): Promise<ActionResult<{ status: ConnectorHealth; message: string }>> {
  const contextResult = await getGLContext()
  if (!contextResult.success) {
    return errorResult(contextResult.error.error)
  }

  const { context } = contextResult
  const definition = AVAILABLE_CONNECTORS[connectorId as ConnectorId]
  
  if (!definition) {
    return errorResult(`Unknown connector: ${connectorId}`)
  }

  try {
    const connector = await db.integrationConnector.findUnique({
      where: {
        agencyId_connectorId: {
          agencyId: context.agencyId!,
          connectorId,
        },
      },
    })

    if (!connector) {
      return successResult({ status: 'UNKNOWN', message: 'Connector not configured' })
    }

    // Perform health check based on connector type
    let status: ConnectorHealth = 'HEALTHY'
    let message = 'Connection successful'

    if (definition.type === 'EXCHANGE_RATE') {
      // Test exchange rate API
      const result = await testExchangeRateConnector(connectorId, connector.settings as Record<string, any>)
      status = result.success ? 'HEALTHY' : 'ERROR'
      message = result.message
    } else if (definition.type === 'INTERNAL_MODULE') {
      // Internal modules are always healthy if enabled
      status = connector.isEnabled ? 'HEALTHY' : 'DEGRADED'
      message = connector.isEnabled ? 'Module connected' : 'Module disabled'
    }

    // Update health status
    await db.integrationConnector.update({
      where: { id: connector.id },
      data: {
        healthStatus: status,
        lastSync: new Date(),
        lastError: status === 'ERROR' ? message : null,
      },
    })

    return successResult({ status, message })
  } catch (error) {
    console.error('Error checking connector health:', error)
    return errorResult('Failed to check connector health')
  }
}

/**
 * Test exchange rate connector
 */
async function testExchangeRateConnector(
  connectorId: string,
  settings: Record<string, any>
): Promise<{ success: boolean; message: string }> {
  try {
    if (connectorId === 'frankfurter') {
      const response = await fetch('https://api.frankfurter.app/latest?from=USD&to=EUR')
      if (!response.ok) {
        return { success: false, message: `API error: ${response.status}` }
      }
      const data = await response.json()
      if (data.rates?.EUR) {
        return { success: true, message: `USD/EUR: ${data.rates.EUR}` }
      }
      return { success: false, message: 'Invalid response format' }
    }

    if (connectorId === 'open-exchange-rates') {
      const apiKey = settings.apiKey
      if (!apiKey) {
        return { success: false, message: 'API key required' }
      }
      const response = await fetch(
        `https://openexchangerates.org/api/latest.json?app_id=${apiKey}`
      )
      if (!response.ok) {
        return { success: false, message: `API error: ${response.status}` }
      }
      return { success: true, message: 'Connection successful' }
    }

    return { success: false, message: 'Unknown exchange rate provider' }
  } catch (error: any) {
    return { success: false, message: error.message ?? 'Connection failed' }
  }
}

// =====================================================
// EXCHANGE RATE ACTIONS
// =====================================================

/**
 * Get exchange rate from configured provider
 */
export async function getExchangeRate(
  from: string,
  to: string,
  date?: Date
): Promise<ActionResult<{ rate: number; provider: string; date: string }>> {
  const contextResult = await getGLContext()
  if (!contextResult.success) {
    return errorResult(contextResult.error.error)
  }

  const { context } = contextResult

  // Check cache first
  const rateDate = date ?? new Date()
  const cached = await db.exchangeRateCache.findFirst({
    where: {
      baseCurrency: from,
      targetCurrency: to,
      rateDate: {
        gte: new Date(rateDate.toDateString()),
        lt: new Date(new Date(rateDate).setDate(rateDate.getDate() + 1)),
      },
    },
  })

  if (cached) {
    return successResult({
      rate: Number(cached.rate),
      provider: cached.provider,
      date: cached.rateDate.toISOString().split('T')[0],
    })
  }

  // Get configured exchange rate connector
  const connector = await db.integrationConnector.findFirst({
    where: {
      agencyId: context.agencyId!,
      connectorType: 'EXCHANGE_RATE',
      isEnabled: true,
    },
  })

  // Default to Frankfurter if no connector configured
  const provider = connector?.connectorId ?? 'frankfurter'

  try {
    let rate: number | null = null
    const dateStr = rateDate.toISOString().split('T')[0]

    if (provider === 'frankfurter') {
      const response = await fetch(
        `https://api.frankfurter.app/${dateStr}?from=${from}&to=${to}`
      )
      if (response.ok) {
        const data = await response.json()
        rate = data.rates?.[to]
      }
    }

    if (rate === null) {
      return errorResult('Failed to fetch exchange rate')
    }

    // Cache the rate
    await db.exchangeRateCache.create({
      data: {
        baseCurrency: from,
        targetCurrency: to,
        rateDate: new Date(dateStr),
        rate,
        inverseRate: 1 / rate,
        provider,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      },
    })

    return successResult({
      rate,
      provider,
      date: dateStr,
    })
  } catch (error) {
    console.error('Error fetching exchange rate:', error)
    return errorResult('Failed to fetch exchange rate')
  }
}

/**
 * Sync exchange rates for common currency pairs
 */
export async function syncExchangeRates(
  baseCurrency: string = 'USD'
): Promise<ActionResult<{ synced: number; errors: string[] }>> {
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

  const commonCurrencies = ['EUR', 'GBP', 'MYR', 'SGD', 'JPY', 'AUD', 'CAD', 'CHF']
  let synced = 0
  const errors: string[] = []

  for (const currency of commonCurrencies) {
    if (currency === baseCurrency) continue

    const result = await getExchangeRate(baseCurrency, currency)
    if (result.success) {
      synced++
    } else {
      errors.push(`${baseCurrency}/${currency}: ${result.error}`)
    }
  }

  await logGLAudit({
    action: 'UPDATE',
    entityType: 'EXCHANGE_RATE',
    entityId: 'sync',
    description: `Synced ${synced} exchange rates for ${baseCurrency}`,
    agencyId: context.agencyId ?? undefined,
  })

  return successResult({ synced, errors })
}
