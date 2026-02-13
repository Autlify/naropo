'use server'

import { stripe } from '@/lib/stripe'
import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import type Stripe from 'stripe'

type ActionResult<T = void> =
    | { success: true; data: T }
    | { success: false; error: string }

/**
 * Update a subscription's plan for 'upgrade', 'cancel', or 'update' actions
 */
export const updateSubscriptionPlan = async (
    agencyId: string,
    stripeSubscriptionId: string,
    /** No Refund or Prorated Refund */
    action: 'upgrade' | 'downgrade' | 'cancel' | 'update',
    priceId?: string
): Promise<ActionResult> => {
    /** Downgrade/Cancel: No Refund or Prorated Refund, Cancel on Period End */
    try {
        // Get subscription from DB by Stripe subscription ID
        const dbSub = await db.subscription.findUnique({
            where: { subscritiptionId: stripeSubscriptionId, agencyId },
        })
        if (!dbSub) {
            return { success: false, error: 'Subscription not found' }
        }

        // Fetch subscription from Stripe
        const stripeSub = await stripe.subscriptions.retrieve(stripeSubscriptionId)
        if (!stripeSub || stripeSub.status === 'canceled') {
            return { success: false, error: 'Subscription not found or already canceled' }
        }

        let updatedSubscription: Stripe.Subscription
        if (action === 'cancel') {
            // Cancel subscription at period end
            updatedSubscription = await stripe.subscriptions.update(stripeSubscriptionId, {
                cancel_at_period_end: true,
            })
        } else if (priceId) {
            const itemId = stripeSub.items.data[0]?.id
            if (!itemId) throw new Error('Could not find a subscription item to update.')

            if (action === 'upgrade') {
                // Upgrade subscription immediately
                updatedSubscription = await stripe.subscriptions.update(stripeSubscriptionId, {
                    cancel_at_period_end: false,
                    proration_behavior: 'create_prorations',
                    items: [
                        {
                            id: itemId,
                            price: priceId!,
                        },
                    ],
                    expand: ['latest_invoice.payment_intent'],
                    metadata: { agencyId }
                })
            } else {
                // Downgrade or Update subscription at period end
                updatedSubscription = await stripe.subscriptions.update(stripeSubscriptionId, {
                    cancel_at_period_end: false,
                    proration_behavior: 'none',
                    items: [
                        {
                            id: itemId,
                            price: priceId!,
                        },
                    ],
                    expand: ['latest_invoice.payment_intent'],
                    metadata: { agencyId }
                })
            }
        } else {
            return { success: false, error: 'Price ID is required for this action' }
        }

        const periodEnd = updatedSubscription.items.data[0]?.current_period_end

        // Update subscription in DB
        const updatedDb = await db.subscription.update({
            where: { agencyId },
            data: {
                priceId,
                status: String(updatedSubscription.status).toUpperCase() as any,
                cancelAtPeriodEnd: Boolean(updatedSubscription.cancel_at_period_end),
                currentPeriodEndDate: periodEnd ? new Date(periodEnd * 1000) : dbSub.currentPeriodEndDate,
            },
        })

        // Revalidate billing page
        revalidatePath(`/agency/${agencyId}/billing/subscription`)
        return { success: true, data: undefined }
    } catch (error) {
        console.error('Error updating subscription plan:', error)
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to update subscription plan',
        }
    }
}


/**
 * Sync subscription status from Stripe to DB
 */
export const syncSubscriptionStatus = async (
    agencyId: string,
    subscriptionId: string
): Promise<ActionResult> => {
    try {
        if (!subscriptionId) {
            return { success: false, error: 'Stripe subscription ID is required' }
        }
        // Fetch subscription from Stripe
        const stripeSub = await stripe.subscriptions.retrieve(subscriptionId) as Stripe.Subscription
        if (!stripeSub) {
            return { success: false, error: 'Subscription not found in Stripe' }
        }

        // Determine correct period end from subscription (use any cast for Stripe API compatibility)
        const stripeSubAny = stripeSub as any
        const periodEnd = stripeSubAny.current_period_end

        // Map Stripe status to DB status
        // Stripe statuses: active, past_due, unpaid, canceled, incomplete, incomplete_expired, trialing, paused
        let dbStatus = stripeSub.status.toUpperCase()

        // Check if trial has ended - if trialing but trial_end is in the past, update to ACTIVE
        const now = Math.floor(Date.now() / 1000)
        if (stripeSub.status === 'trialing' && stripeSub.trial_end && stripeSub.trial_end < now) {
            dbStatus = 'ACTIVE'
        }

        // Update subscription in DB using the Stripe subscription ID field
        await db.subscription.updateMany({
            where: { agencyId, subscritiptionId: subscriptionId },
            data: {
                status: dbStatus as any,
                cancelAtPeriodEnd: Boolean(stripeSub.cancel_at_period_end),
                currentPeriodEndDate: periodEnd ? new Date(periodEnd * 1000) : undefined,
                priceId: stripeSub.items.data[0]?.price?.id ?? undefined,
            },
        })

        return { success: true, data: undefined }
    } catch (error) {
        console.error('Error syncing subscription status:', error)
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to sync subscription status',
        }
    }
}

/**
 * List invoices for a customer
 */
export const listInvoices = async (
    customerId: string,
    limit: number = 25
): Promise<ActionResult<Stripe.Invoice[]>> => {
    try {
        if (!customerId) {
            return { success: false, error: 'Customer ID is required' }
        }

        const invoices = await stripe.invoices.list({
            customer: customerId,
            limit,
        })

        return { success: true, data: invoices.data }
    } catch (error) {
        console.error('Error listing invoices:', error)
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to list invoices',
        }
    }
}

/**
 * List dunning invoices (open + uncollectible) for a customer
 */
export const listDunningInvoices = async (
    customerId: string,
    limit: number = 25
): Promise<ActionResult<Stripe.Invoice[]>> => {
    try {
        if (!customerId) {
            return { success: false, error: 'Customer ID is required' }
        }

        const [openInvoices, uncollectibleInvoices] = await Promise.all([
            stripe.invoices.list({ customer: customerId, status: 'open', limit }),
            stripe.invoices.list({ customer: customerId, status: 'uncollectible', limit }),
        ])

        const combined = [...openInvoices.data, ...uncollectibleInvoices.data]
            .sort((a, b) => (b.created ?? 0) - (a.created ?? 0))

        return { success: true, data: combined }
    } catch (error) {
        console.error('Error listing dunning invoices:', error)
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to list dunning invoices',
        }
    }
}

/**
 * Subscription data for client-side display
 */
export interface SubscriptionData {
    customerId: string | null
    subscriptionId: string | null
    priceId: string | null
    status: string | null
    cancelAtPeriodEnd: boolean
    currentPeriodEndDate: string | null
    trialEndedAt: string | null
    defaultPaymentMethod: string | null
    state: string
}

/**
 * Get subscription data for display in billing UI
 */
export const getSubscriptionData = async (
    agencyId: string
): Promise<ActionResult<SubscriptionData>> => {
    try {
        if (!agencyId) {
            return { success: false, error: 'Agency ID is required' }
        }

        // Fetch agency with subscription from DB
        const agency = await db.subscription.findFirst({
            where: { agencyId },
            include: {
                Agency: {
                    select: { customerId: true },
                },
            },
        })

        if (!agency) {
            return {
                success: true,
                data: {
                    customerId: null,
                    subscriptionId: null,
                    priceId: null,
                    status: null,
                    cancelAtPeriodEnd: false,
                    currentPeriodEndDate: null,
                    trialEndedAt: null,
                    defaultPaymentMethod: null,
                    state: 'INACTIVE',
                },
            }
        }

        const customerId = agency.Agency?.customerId ?? null
        let defaultPaymentMethod: string | null = null

        // Fetch default payment method from Stripe if customer exists
        if (customerId) {
            try {
                const customer = await stripe.customers.retrieve(customerId) as Stripe.Customer
                const defaultPmId = customer?.invoice_settings?.default_payment_method as string | null

                if (defaultPmId) {
                    const pm = await stripe.paymentMethods.retrieve(defaultPmId)
                    const brand = pm?.card?.brand?.toUpperCase() ?? 'CARD'
                    const last4 = pm?.card?.last4 ?? ''
                    defaultPaymentMethod = last4 ? `${brand} •••• ${last4}` : brand
                }
            } catch {
                // Ignore payment method lookup failures
            }
        }

        // Compute billing state
        const status = agency.status?.toUpperCase() ?? 'INACTIVE'
        let state = 'INACTIVE'
        if (status === 'ACTIVE') state = 'ACTIVE'
        else if (status === 'TRIALING') state = 'TRIALING'
        else if (status === 'PAST_DUE' || status === 'UNPAID') state = 'PAST_DUE'
        else if (status === 'CANCELED' || status === 'CANCELLED') state = 'CANCELLED'

        return {
            success: true,
            data: {
                customerId,
                subscriptionId: agency.subscritiptionId,
                priceId: agency.priceId,
                status: agency.status,
                cancelAtPeriodEnd: agency.cancelAtPeriodEnd ?? false,
                currentPeriodEndDate: agency.currentPeriodEndDate?.toISOString() ?? null,
                trialEndedAt: agency.trialEndedAt?.toISOString() ?? null,
                defaultPaymentMethod,
                state,
            },
        }
    } catch (error) {
        console.error('Error getting subscription data:', error)
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to get subscription data',
        }
    }
}
