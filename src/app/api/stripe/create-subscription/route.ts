import { db } from '@/lib/db'
import { stripe } from '@/lib/stripe'
import { NextResponse } from 'next/server'
import Stripe from 'stripe' 

/**
 * POST /api/stripe/create-subscription
 * 
 * Creates a Stripe subscription for a given customer and agency.
 * Handles payment method attachment, trial periods, and coupon codes.
 * 
 * Request body:
 * - customerId: string - Stripe customer ID
 * - priceId: string - Stripe price ID for the subscription (real Stripe ID from constants.ts)
 * - agencyId: string - Agency ID to associate the subscription with
 * - countryCode: string (optional) - Country code for tax purposes
 * - coupon: string (optional) - Coupon code to apply to the subscription
 * - paymentMethodId: string (optional) - Payment method ID to attach to the customer
 * - trialEnabled: boolean (optional) - Whether to enable a trial period
 * - trialPeriodDays: number (optional) - Number of days for the trial period
 * 
 * Returns:
 * - subscriptionId: string - The ID of the created subscription
 * - clientSecret: string (if payment required) - Client secret for payment or setup
 * - status: string - Subscription status
 * - requiresSetup: boolean (if applicable) - Whether further payment setup is required
 * - trialEnd: number (if trial enabled) - Timestamp when the trial ends
 */
export async function POST(req: Request) {
  const { customerId, priceId, agencyId, countryCode, coupon, paymentMethodId, trialEnabled, trialPeriodDays } = await req.json()
  
  // Price ID is now always the real Stripe ID (after sync script updates constants.ts)
  
  if (!customerId || !priceId || !agencyId) {
    return NextResponse.json(
      { error: 'Customer ID, Price ID, and Agency ID are required' },
      { status: 400 }
    )
  }

  // Validate agency exists and belongs to customer
  const agency = await db.agency.findUnique({
    where: { id: agencyId },
    include: { Subscription: true },
  })

  if (!agency) {
    return NextResponse.json(
      { error: 'Agency not found' },
      { status: 404 }
    )
  }

  if (agency.customerId !== customerId) {
    return NextResponse.json(
      { error: 'Agency does not belong to this customer' },
      { status: 403 }
    )
  }

  if (agency.Subscription) {
    return NextResponse.json(
      { error: 'Agency already has a subscription' },
      { status: 400 }
    )
  }

  try {
    // If paymentMethodId is provided, attach it to the customer as default
    if (paymentMethodId) {
      console.log('💳 Attaching payment method to customer:', paymentMethodId)
      
      try {
        await stripe.paymentMethods.attach(paymentMethodId, {
          customer: customerId,
        })
        
        // Set as default payment method
        await stripe.customers.update(customerId, {
          invoice_settings: {
            default_payment_method: paymentMethodId,
          },
        })
        
        console.log('✅ Payment method attached and set as default')
      } catch (error) {
        console.error('⚠️ Failed to attach payment method:', error)
        // Continue anyway - payment method might already be attached
      }
    }

    // Create new subscription for agency
    console.log('✨ Creating new subscription for agency:', agencyId)
    
    const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [
          { 
            price: priceId,
          },
        ], 
        payment_behavior: trialEnabled ? 'default_incomplete' : 'error_if_incomplete',
        payment_settings: { 
          save_default_payment_method: 'on_subscription',
          payment_method_types: ['card'],
        },
        // Store agencyId in metadata for webhook processing
        metadata: {
          agencyId: agencyId,
        },
        // Expand both payment_intent and pending_setup_intent to handle both scenarios
        expand: ['latest_invoice.payment_intent', 'pending_setup_intent'],
        // Apply coupon if provided
        ...(coupon && { coupon }),
        // Apply trial if enabled
        ...(trialEnabled && trialPeriodDays && {
          trial_period_days: trialPeriodDays,
        }),
      })
      
      console.log('\ud83d\udcdd Subscription created:', {
        id: subscription.id,
        status: subscription.status,
        trialEnd: subscription.trial_end,
        latestInvoiceId: subscription.latest_invoice,
        agencyId: agencyId
      })

    // Check if subscription has a trial period
    const hasTrial = subscription.trial_end && subscription.trial_end > Math.floor(Date.now() / 1000)
    
    if (hasTrial) {
      console.log('🎁 Trial detected - using SetupIntent for payment method collection')
      
      // For trials, use pending_setup_intent
      const setupIntent = subscription.pending_setup_intent as Stripe.SetupIntent | null
      
      if (setupIntent?.client_secret) {
        return NextResponse.json({
          subscriptionId: subscription.id,
          clientSecret: setupIntent.client_secret,
          status: subscription.status,
          requiresSetup: true,
          trialEnd: subscription.trial_end,
        })
      }
      
      // If no setup intent, subscription is active with trial
      return NextResponse.json({
        subscriptionId: subscription.id,
        status: subscription.status,
        message: `Trial started - free until ${new Date((subscription.trial_end || 0) * 1000).toLocaleDateString()}`,
        trialEnd: subscription.trial_end,
      })
    }

    // No trial - handle immediate payment scenarios
    const latestInvoice = subscription.latest_invoice as Stripe.Invoice
    
    console.log('🧻 Latest invoice details:', {
      id: latestInvoice?.id,
      status: latestInvoice?.status,
      amount_due: latestInvoice?.amount_due,
      has_payment_intent: !!(latestInvoice as any)?.payment_intent
    })
    
    if (!latestInvoice) {
      return NextResponse.json(
        { error: 'Failed to create invoice for subscription' },
        { status: 500 }
      )
    }

    // Handle different payment scenarios
    // Access payment_intent from expanded invoice (TypeScript doesn't know it's expanded)
    const paymentIntent = (latestInvoice as any).payment_intent as Stripe.PaymentIntent | null

    console.log('💳 PaymentIntent check:', {
      exists: !!paymentIntent,
      id: paymentIntent?.id,
      status: paymentIntent?.status,
      client_secret: !!paymentIntent?.client_secret
    })

    // Case 1: Invoice requires payment (has PaymentIntent with client_secret)
    if (paymentIntent?.client_secret) {
      console.log('🐳 Payment required - returning client_secret')
      return NextResponse.json({
        subscriptionId: subscription.id,
        clientSecret: paymentIntent.client_secret,
        status: subscription.status,
        requiresSetup: false,
      })
    }

    // Case 2: Invoice already paid or $0 (no payment needed)
    if (latestInvoice.status === 'paid' || latestInvoice.amount_due === 0) {
      console.log('✅ No payment required - invoice already settled')
      return NextResponse.json({
        subscriptionId: subscription.id,
        status: subscription.status,
        message: 'Subscription activated without payment',
      })
    }

    // Case 3: Payment required but no payment_intent (edge case)
    // This shouldn't happen with default_incomplete, but handle gracefully
    console.log('⚠️ Unexpected state - creating fallback SetupIntent')
    const fallbackSetupIntent = await stripe.setupIntents.create({
      customer: customerId,
      payment_method_types: ['card'],
      usage: 'off_session',
    })

    return NextResponse.json({
      subscriptionId: subscription.id,
      clientSecret: fallbackSetupIntent.client_secret,
      status: subscription.status,
      requiresSetup: true,
    })

  } catch (error) {
    console.error('🔴 Subscription creation/update error:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Failed to process subscription', details: errorMessage },
      { status: 500 }
    )
  }
}
