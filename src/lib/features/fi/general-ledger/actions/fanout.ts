/**
 * Fanout Service
 * FI-GL Module - Cross-module posting and event handling
 * 
 * Uses EVENT_KEYS from registry as Single Source of Truth
 * 
 * @namespace Autlify.Lib.Features.FI.GL.Actions.Fanout
 */

'use server'

import { FanoutStatus } from '@/generated/prisma/client'
import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { getGLContext } from '../core/context'
import { ActionResult, errorResult, successResult } from '../core/errors'
import { checkGLPermission } from '../core/permissions'
import { FI_CONFIG_KEYS } from '../core/utils'
import { logGLAudit } from './audit'
import { executePostingRules } from './posting-rules'
import { getTriggerType } from '@/lib/registry/events/trigger-mappings'

// =====================================================
// SCHEMAS
// =====================================================

const moduleEventSchema = z.object({
    id: z.string().uuid(),
    timestamp: z.date().default(() => new Date()),
    source: z.object({
        module: z.string(),
        version: z.string().default('1.0.0'),
    }),
    type: z.string(),
    entity: z.object({
        type: z.string(),
        id: z.string(),
    }),
    data: z.object({
        amount: z.number(),
        currency: z.string().default('USD'),
        accountId: z.string().optional(),
        costCenterId: z.string().optional(),
        reference: z.string(),
        description: z.string(),
        metadata: z.record(z.string(), z.any()).default({}),
    }),
    context: z.object({
        agencyId: z.string(),
        subAccountId: z.string().optional(),
        userId: z.string(),
    }),
})

export type ModuleEvent = z.infer<typeof moduleEventSchema>

// =====================================================
// FANOUT SERVICE
// =====================================================

/**
 * Process a module event and trigger GL postings
 */
export async function processEvent(
    event: ModuleEvent
): Promise<ActionResult<{
    success: boolean
    entriesCreated: number
    journalEntryIds: string[]
    errors: string[]
}>> {
    // Validate event
    const validation = moduleEventSchema.safeParse(event)
    if (!validation.success) {
        return errorResult(`Invalid event: ${validation.error.message}`)
    }

    const validEvent = validation.data

    // Create fanout log
    const fanoutLog = await db.fanoutLog.create({
        data: {
            agencyId: validEvent.context.agencyId,
            eventId: validEvent.id,
            eventType: validEvent.type,
            sourceModule: validEvent.source.module,
            entityType: validEvent.entity.type,
            entityId: validEvent.entity.id,
            status: 'PROCESSING',
        },
    })

    try {
        // Map event type to trigger type using registry helper
        const triggerType = getTriggerType(validEvent.type)

        // Prepare trigger data
        const triggerData = {
            eventId: validEvent.id,
            amount: validEvent.data.amount,
            currency: validEvent.data.currency,
            reference: validEvent.data.reference,
            description: validEvent.data.description,
            accountId: validEvent.data.accountId,
            costCenterId: validEvent.data.costCenterId,
            entityType: validEvent.entity.type,
            entityId: validEvent.entity.id,
            ...validEvent.data.metadata,
        }

        // Execute posting rules
        const result = await executePostingRules(triggerType, triggerData)

        if (!result.success) {
            // Update fanout log with error
            await db.fanoutLog.update({
                where: { id: fanoutLog.id },
                data: {
                    status: 'FAILED',
                    errorMessage: result.error,
                    processedAt: new Date(),
                },
            })

            return successResult({
                success: false,
                entriesCreated: 0,
                journalEntryIds: [],
                errors: [result.error ?? 'Unknown error'],
            })
        }

        const entriesCreated = result.data?.entriesCreated ?? 0
        const errors = result.data?.errors ?? []

        // Determine status
        let status: FanoutStatus = 'SUCCESS'
        if (entriesCreated === 0 && errors.length === 0) {
            status = 'SKIPPED'
        } else if (errors.length > 0 && entriesCreated > 0) {
            status = 'PARTIAL'
        } else if (errors.length > 0 && entriesCreated === 0) {
            status = 'FAILED'
        }

        // Update fanout log
        await db.fanoutLog.update({
            where: { id: fanoutLog.id },
            data: {
                status,
                entriesCreated,
                errorMessage: errors.length > 0 ? errors.join('; ') : null,
                processedAt: new Date(),
            },
        })

        return successResult({
            success: status === 'SUCCESS' || status === 'PARTIAL',
            entriesCreated,
            journalEntryIds: [], // TODO: Get from executePostingRules result
            errors,
        })
    } catch (error: any) {
        // Update fanout log with error
        await db.fanoutLog.update({
            where: { id: fanoutLog.id },
            data: {
                status: 'FAILED',
                errorMessage: error.message ?? 'Unknown error',
                processedAt: new Date(),
            },
        })

        console.error('Fanout processing error:', error)
        return errorResult(`Fanout failed: ${error.message}`)
    }
}

/**
 * Emit an event from a module (convenience wrapper)
 */
export async function emitEvent(
    module: string,
    eventType: string,
    entity: { type: string; id: string },
    data: {
        amount: number
        currency?: string
        reference: string
        description: string
        accountId?: string
        costCenterId?: string
        metadata?: Record<string, unknown>
    }
): Promise<ActionResult<any>> {
    const contextResult = await getGLContext()
    if (!contextResult.success) {
        return errorResult(contextResult.error.error)
    }

    const { context } = contextResult

    const event: ModuleEvent = {
        id: crypto.randomUUID(),
        timestamp: new Date(),
        source: {
            module,
            version: '1.0.0',
        },
        type: eventType,
        entity,
        data: {
            amount: data.amount,
            currency: data.currency ?? 'USD',
            reference: data.reference,
            description: data.description,
            accountId: data.accountId,
            costCenterId: data.costCenterId,
            metadata: data.metadata ?? {},
        },
        context: {
            agencyId: context.agencyId!,
            subAccountId: context.subAccountId ?? undefined,
            userId: context.userId,
        },
    }

    return processEvent(event)
}

// =====================================================
// READ ACTIONS
// =====================================================

/**
 * Get fanout logs
 */
export async function getFanoutLogs(options?: {
    status?: FanoutStatus
    eventType?: string
    entityType?: string
    entityId?: string
    limit?: number
    offset?: number
}): Promise<ActionResult<{ logs: any[]; total: number }>> {
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
        const where: any = { agencyId: context.agencyId }

        if (options?.status) where.status = options.status
        if (options?.eventType) where.eventType = options.eventType
        if (options?.entityType) where.entityType = options.entityType
        if (options?.entityId) where.entityId = options.entityId

        const [logs, total] = await Promise.all([
            db.fanoutLog.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                take: options?.limit ?? 50,
                skip: options?.offset ?? 0,
                include: {
                    Connector: { select: { id: true, name: true, connectorType: true } },
                },
            }),
            db.fanoutLog.count({ where }),
        ])

        return successResult({ logs, total })
    } catch (error) {
        console.error('Error fetching fanout logs:', error)
        return errorResult('Failed to fetch fanout logs')
    }
}

/**
 * Get fanout status for an entity
 */
export async function getEntityFanoutStatus(
    entityType: string,
    entityId: string
): Promise<ActionResult<any[]>> {
    const contextResult = await getGLContext()
    if (!contextResult.success) {
        return errorResult(contextResult.error.error)
    }

    const { context } = contextResult

    try {
        const logs = await db.fanoutLog.findMany({
            where: {
                agencyId: context.agencyId!,
                entityType,
                entityId,
            },
            orderBy: { createdAt: 'desc' },
        })

        return successResult(logs)
    } catch (error) {
        console.error('Error fetching entity fanout status:', error)
        return errorResult('Failed to fetch fanout status')
    }
}

// =====================================================
// RETRY ACTIONS
// =====================================================

/**
 * Retry a failed fanout
 */
export async function retryFanout(fanoutId: string): Promise<ActionResult<any>> {
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
        const log = await db.fanoutLog.findUnique({
            where: { id: fanoutId },
        })

        if (!log) {
            return errorResult('Fanout log not found')
        }

        if (log.status !== 'FAILED' && log.status !== 'PARTIAL') {
            return errorResult('Only failed or partial fanouts can be retried')
        }

        if (log.retryCount >= 3) {
            return errorResult('Maximum retry attempts reached')
        }

        // Update retry count
        await db.fanoutLog.update({
            where: { id: fanoutId },
            data: {
                retryCount: log.retryCount + 1,
                lastRetry: new Date(),
                status: 'PENDING',
            },
        })

        // Re-process (reconstruct event from log)
        const event: ModuleEvent = {
            id: log.eventId,
            timestamp: new Date(),
            source: {
                module: log.sourceModule,
                version: '1.0.0',
            },
            type: log.eventType,
            entity: {
                type: log.entityType,
                id: log.entityId,
            },
            data: {
                amount: 0, // Will be fetched from posting rules
                currency: 'USD',
                reference: `RETRY-${fanoutId}`,
                description: `Retry of ${log.eventType}`,
                metadata: {},
            },
            context: {
                agencyId: log.agencyId,
                userId: context.userId,
            },
        }

        const result = await processEvent(event)

        await logGLAudit({
            action: 'UPDATE',
            entityType: 'FANOUT',
            entityId: fanoutId,
            description: `Retried fanout: ${log.eventType}`,
            agencyId: context.agencyId ?? undefined,
        })

        return result
    } catch (error) {
        console.error('Error retrying fanout:', error)
        return errorResult('Failed to retry fanout')
    }
}

/**
 * Retry all failed fanouts
 */
export async function retryAllFailed(): Promise<ActionResult<{
    attempted: number
    succeeded: number
    failed: number
}>> {
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
        const failedLogs = await db.fanoutLog.findMany({
            where: {
                agencyId: context.agencyId!,
                status: { in: ['FAILED', 'PARTIAL'] },
                retryCount: { lt: 3 },
            },
            take: 100, // Limit batch size
        })

        let attempted = 0
        let succeeded = 0
        let failed = 0

        for (const log of failedLogs) {
            attempted++
            const result = await retryFanout(log.id)
            if (result.success && result.data?.success) {
                succeeded++
            } else {
                failed++
            }
        }

        revalidatePath('/agency/[agencyId]/fi/general-ledger/settings')

        return successResult({ attempted, succeeded, failed })
    } catch (error) {
        console.error('Error retrying all failed:', error)
        return errorResult('Failed to retry fanouts')
    }
}

// =====================================================
// STRIPE INTEGRATION
// =====================================================

/**
 * Process Stripe payment for GL posting
 */
export async function processStripePayment(
    payment: {
        id: string
        amount: number
        currency: string
        fee: number
        netAmount: number
        customerId?: string
        invoiceId?: string
        metadata?: Record<string, any>
    },
    agencyId: string,
    userId: string
): Promise<ActionResult<any>> {
    // Emit payment received event
    const paymentResult = await emitEventDirect({
        id: crypto.randomUUID(),
        timestamp: new Date(),
        source: { module: 'stripe', version: '1.0.0' },
        type: 'stripe.payment.received',
        entity: { type: 'Payment', id: payment.id },
        data: {
            amount: payment.netAmount / 100, // Convert from cents
            currency: payment.currency.toUpperCase(),
            reference: payment.id,
            description: `Stripe payment ${payment.id}`,
            metadata: {
                grossAmount: payment.amount / 100,
                fee: payment.fee / 100,
                customerId: payment.customerId,
                invoiceId: payment.invoiceId,
                ...payment.metadata,
            },
        },
        context: { agencyId, userId },
    })

    // Emit fee event if there's a fee
    if (payment.fee > 0) {
        await emitEventDirect({
            id: crypto.randomUUID(),
            timestamp: new Date(),
            source: { module: 'stripe', version: '1.0.0' },
            type: 'stripe.fee.charged',
            entity: { type: 'Payment', id: payment.id },
            data: {
                amount: payment.fee / 100,
                currency: payment.currency.toUpperCase(),
                reference: `${payment.id}-FEE`,
                description: `Stripe processing fee for ${payment.id}`,
                metadata: { paymentId: payment.id },
            },
            context: { agencyId, userId },
        })
    }

    return paymentResult
}

/**
 * Direct event emission (without context check)
 */
async function emitEventDirect(event: ModuleEvent): Promise<ActionResult<any>> {
    return processEvent(event)
}
