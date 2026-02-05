import { db } from '@/lib/db'
import { stripe } from '@/lib/stripe'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'

/**
 * POST /api/stripe/subscription
 * 
 * Unified subscription management endpoint.
 * Handles create, update (upgrade/downgrade), and cancel actions.
 * 
 * Request body:
 * - action: 'create' | 'update' | 'cancel' - The action to perform
 * - customerId: string - Stripe customer ID
 * - agencyId: string - Agency ID to associate the subscription with
 * - priceId: string (for create/update) - Stripe price ID (real Stripe ID from constants.ts)
 * - coupon: string (optional, for create/update) - Coupon code to apply
 * - paymentMethodId: string (optional, for create) - Payment method ID to attach
 * - trialEnabled: boolean (optional, for create) - Whether to enable a trial period
 * - trialPeriodDays: number (optional, for create) - Number of days for the trial period
 * - prorationBehavior: 'create_prorations' | 'none' | 'always_invoice' (optional, for update) - Proration behavior
 * 
 * Returns:
 * - subscriptionId: string - The ID of the subscription
 * - clientSecret: string (if payment/setup required) - Client secret for payment or setup
 * - status: string - Subscription status
 * - action: string - The action that was performed
 * - message: string (optional) - Human-readable message
 */
export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { action, customerId, agencyId, priceId, coupon, paymentMethodId, trialEnabled, trialPeriodDays, prorationBehavior } = body

        // Price ID is now always the real Stripe ID (after sync script updates constants.ts)

        if (!action || !customerId || !agencyId) {
            return NextResponse.json(
                { error: 'action, customerId, and agencyId are required' },
                { status: 400 }
            )
        }

        // Validate agency exists and belongs to customer
        const agency = await db.agency.findUnique({
            where: { id: agencyId },
            include: { Subscription: true },
        })

        if (!agency) {
            return NextResponse.json({ error: 'Agency not found' }, { status: 404 })
        }

        if (agency.customerId !== customerId) {
            return NextResponse.json(
                { error: 'Agency does not belong to this customer' },
                { status: 403 }
            )
        }

        switch (action) {
            case 'create':
                return await handleCreate({
                    customerId,
                    agencyId,
                    priceId,
                    coupon,
                    paymentMethodId,
                    trialEnabled,
                    trialPeriodDays,
                    existingSubscription: agency.Subscription,
                })

            case 'update':
                return await handleUpdate({
                    customerId,
                    agencyId,
                    priceId,
                    coupon,
                    prorationBehavior,
                    existingSubscription: agency.Subscription,
                })

            case 'cancel':
                return await handleCancel({
                    agencyId,
                    existingSubscription: agency.Subscription,
                })

            default:
                return NextResponse.json(
                    { error: `Invalid action: ${action}. Must be 'create', 'update', or 'cancel'` },
                    { status: 400 }
                )
        }
    } catch (error) {
        console.error('🔴 Subscription action error:', error)
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        return NextResponse.json(
            { error: 'Failed to process subscription action', details: errorMessage },
            { status: 500 }
        )
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// CREATE - Create a new subscription
// ─────────────────────────────────────────────────────────────────────────────
async function handleCreate(params: {
    customerId: string
    agencyId: string
    priceId?: string
    coupon?: string
    paymentMethodId?: string
    trialEnabled?: boolean
    trialPeriodDays?: number
    existingSubscription: any
}) {
    const { customerId, agencyId, priceId, coupon, paymentMethodId, trialEnabled, trialPeriodDays, existingSubscription } = params

    if (!priceId) {
        return NextResponse.json({ error: 'priceId is required for create action' }, { status: 400 })
    }

    if (existingSubscription) {
        return NextResponse.json(
            { error: 'Agency already has a subscription. Use action=update to change plans.' },
            { status: 400 }
        )
    }

    // Attach payment method if provided
    if (paymentMethodId) {
        console.log('💳 Attaching payment method to customer:', paymentMethodId)
        try {
            await stripe.paymentMethods.attach(paymentMethodId, { customer: customerId })
            await stripe.customers.update(customerId, {
                invoice_settings: { default_payment_method: paymentMethodId },
            })
            console.log('✅ Payment method attached and set as default')
        } catch (error) {
            console.error('⚠️ Failed to attach payment method:', error)
            // Continue - payment method might already be attached
        }
    }

    console.log('✨ Creating new subscription for agency:', agencyId)

    const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: priceId }],
        payment_behavior: trialEnabled ? 'default_incomplete' : 'error_if_incomplete',
        payment_settings: {
            save_default_payment_method: 'on_subscription',
            payment_method_types: ['card'],
        },
        metadata: { agencyId },
        expand: ['latest_invoice.payment_intent', 'pending_setup_intent'],
        ...(coupon && { coupon }),
        ...(trialEnabled && trialPeriodDays && { trial_period_days: trialPeriodDays }),
    })

    console.log('📝 Subscription created:', {
        id: subscription.id,
        status: subscription.status,
        trialEnd: subscription.trial_end,
        agencyId,
    })

    // Handle trial subscriptions
    const hasTrial = subscription.trial_end && subscription.trial_end > Math.floor(Date.now() / 1000)
    if (hasTrial) {
        const setupIntent = subscription.pending_setup_intent as Stripe.SetupIntent | null
        if (setupIntent?.client_secret) {
            return NextResponse.json({
                subscriptionId: subscription.id,
                clientSecret: setupIntent.client_secret,
                status: subscription.status,
                action: 'create',
                requiresSetup: true,
                trialEnd: subscription.trial_end,
            })
        }
        return NextResponse.json({
            subscriptionId: subscription.id,
            status: subscription.status,
            action: 'create',
            message: `Trial started - free until ${new Date((subscription.trial_end || 0) * 1000).toLocaleDateString()}`,
            trialEnd: subscription.trial_end,
        })
    }

    // Handle immediate payment
    const latestInvoice = subscription.latest_invoice as Stripe.Invoice
    const paymentIntent = (latestInvoice as any)?.payment_intent as Stripe.PaymentIntent | null

    if (paymentIntent?.client_secret) {
        return NextResponse.json({
            subscriptionId: subscription.id,
            clientSecret: paymentIntent.client_secret,
            status: subscription.status,
            action: 'create',
            requiresSetup: false,
        })
    }

    if (latestInvoice?.status === 'paid' || latestInvoice?.amount_due === 0) {
        return NextResponse.json({
            subscriptionId: subscription.id,
            status: subscription.status,
            action: 'create',
            message: 'Subscription activated without payment',
        })
    }

    // Fallback SetupIntent
    const fallbackSetupIntent = await stripe.setupIntents.create({
        customer: customerId,
        payment_method_types: ['card'],
        usage: 'off_session',
    })

    return NextResponse.json({
        subscriptionId: subscription.id,
        clientSecret: fallbackSetupIntent.client_secret,
        status: subscription.status,
        action: 'create',
        requiresSetup: true,
    })
}

// ─────────────────────────────────────────────────────────────────────────────
// UPDATE - Upgrade or downgrade an existing subscription
// ─────────────────────────────────────────────────────────────────────────────
async function handleUpdate(params: {
    customerId: string
    agencyId: string
    priceId?: string
    coupon?: string
    prorationBehavior?: Stripe.SubscriptionUpdateParams.ProrationBehavior
    existingSubscription: any
}) {
    const { agencyId, priceId, coupon, prorationBehavior, existingSubscription } = params

    if (!priceId) {
        return NextResponse.json({ error: 'priceId is required for update action' }, { status: 400 })
    }

    if (!existingSubscription?.subscritiptionId) {
        return NextResponse.json(
            { error: 'No existing subscription found. Use action=create to start a subscription.' },
            { status: 400 }
        )
    }

    const stripeSubId = existingSubscription.subscritiptionId

    console.log('🔄 Updating subscription:', stripeSubId, 'to price:', priceId)

    // Get current subscription to find the subscription item
    const currentSub = await stripe.subscriptions.retrieve(stripeSubId)
    const subscriptionItemId = currentSub.items.data[0]?.id

    if (!subscriptionItemId) {
        return NextResponse.json({ error: 'Could not find subscription item to update' }, { status: 500 })
    }

    // Update subscription with new price
    const updatedSubscription = await stripe.subscriptions.update(stripeSubId, {
        items: [{ id: subscriptionItemId, price: priceId }],
        proration_behavior: prorationBehavior ?? 'create_prorations',
        metadata: { agencyId },
        expand: ['latest_invoice.payment_intent'],
        ...(coupon && { coupon }),
    })

    console.log('✅ Subscription updated:', {
        id: updatedSubscription.id,
        status: updatedSubscription.status,
        newPrice: priceId,
    })

    // Check if proration created an invoice that needs payment
    const latestInvoice = updatedSubscription.latest_invoice as Stripe.Invoice | null
    const paymentIntent = (latestInvoice as any)?.payment_intent as Stripe.PaymentIntent | null

    if (paymentIntent?.client_secret && paymentIntent.status === 'requires_payment_method') {
        return NextResponse.json({
            subscriptionId: updatedSubscription.id,
            clientSecret: paymentIntent.client_secret,
            status: updatedSubscription.status,
            action: 'update',
            message: 'Payment required for plan upgrade',
            requiresPayment: true,
        })
    }

    return NextResponse.json({
        subscriptionId: updatedSubscription.id,
        status: updatedSubscription.status,
        action: 'update',
        message: 'Subscription plan updated successfully',
        prorationApplied: prorationBehavior !== 'none',
    })
}

// ─────────────────────────────────────────────────────────────────────────────
// CANCEL - Cancel subscription at period end (no refund)
// ─────────────────────────────────────────────────────────────────────────────
async function handleCancel(params: {
    agencyId: string
    existingSubscription: any
}) {
    const { agencyId, existingSubscription } = params

    if (!existingSubscription?.subscritiptionId) {
        return NextResponse.json(
            { error: 'No existing subscription found to cancel' },
            { status: 400 }
        )
    }

    const stripeSubId = existingSubscription.subscritiptionId

    console.log('🚫 Cancelling subscription at period end:', stripeSubId)

    // Cancel at period end - no immediate refund
    const cancelledSubscription = await stripe.subscriptions.update(stripeSubId, {
        cancel_at_period_end: true,
        metadata: {
            agencyId,
            cancelledAt: new Date().toISOString(),
        },
    }) as Stripe.Subscription

    const periodEndTimestamp = cancelledSubscription.items.data[0]?.current_period_end || 0

    console.log('✅ Subscription scheduled for cancellation:', {
        id: cancelledSubscription.id,
        cancel_at_period_end: cancelledSubscription.cancel_at_period_end,
        current_period_end: periodEndTimestamp,
    })

    // Update database to reflect cancellation pending
    await db.subscription.update({
        where: { agencyId },
        data: {
            cancelAtPeriodEnd: true,
        },
    })

    const periodEndDate = new Date(periodEndTimestamp * 1000)

    return NextResponse.json({
        subscriptionId: cancelledSubscription.id,
        status: cancelledSubscription.status,
        action: 'cancel',
        cancelAtPeriodEnd: true,
        periodEndDate: periodEndDate.toISOString(),
        message: `Subscription will remain active until ${periodEndDate.toLocaleDateString()}. No refund will be issued.`,
    })
}

// ─────────────────────────────────────────────────────────────────────────────
// GET - Retrieve subscription status
// ─────────────────────────────────────────────────────────────────────────────
export async function GET(req: Request) {
    const url = new URL(req.url)
    const agencyId = url.searchParams.get('agencyId')

    if (!agencyId) {
        return NextResponse.json({ error: 'agencyId is required' }, { status: 400 })
    }

    const agency = await db.agency.findUnique({
        where: { id: agencyId },
        include: { Subscription: true },
    })

    if (!agency) {
        return NextResponse.json({ error: 'Agency not found' }, { status: 404 })
    }

    if (!agency.Subscription?.subscritiptionId) {
        return NextResponse.json({
            hasSubscription: false,
            agencyId,
        })
    }

    try {
        const stripeSub = await stripe.subscriptions.retrieve(agency.Subscription.subscritiptionId) as Stripe.Subscription

        const subItem = stripeSub.items.data[0]
        return NextResponse.json({
            hasSubscription: true,
            agencyId,
            subscription: {
                id: stripeSub.id,
                status: stripeSub.status,
                priceId: subItem?.price?.id,
                currentPeriodEnd: subItem?.current_period_end ? new Date(subItem.current_period_end * 1000).toISOString() : null,
                cancelAtPeriodEnd: stripeSub.cancel_at_period_end,
                trialEnd: stripeSub.trial_end ? new Date(stripeSub.trial_end * 1000).toISOString() : null,
            },
        })
    } catch (error) {
        console.error('Error retrieving subscription from Stripe:', error)
        return NextResponse.json({
            hasSubscription: true,
            agencyId,
            subscription: {
                id: agency.Subscription.subscritiptionId,
                status: agency.Subscription.status,
                priceId: agency.Subscription.priceId,
                currentPeriodEnd: agency.Subscription.currentPeriodEndDate?.toISOString(),
                cancelAtPeriodEnd: agency.Subscription.cancelAtPeriodEnd,
                error: 'Could not sync with Stripe',
            },
        })
    }
}
