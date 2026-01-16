import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import Stripe from 'stripe'

/**
 * POST /api/stripe/create-setup-intent
 * 
 * Creates a SetupIntent to collect payment method details without immediate charge.
 * This is used for setting up future payments or collecting payment methods
 * before subscription creation.
 * 
 * Request body:
 * - customerId: string (optional) - Stripe customer ID to attach the payment method to
 * 
 * Returns:
 * - clientSecret: string - The client secret for the SetupIntent
 * - setupIntentId: string - The ID of the created SetupIntent
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { customerId } = body

    if (!customerId) {
      return NextResponse.json(
        { error: 'customerId is required' },
        { status: 400 }
      )
    }

    console.log('🔧 Creating SetupIntent for customer:', customerId)

    // Create SetupIntent for collecting payment method
    const setupIntent = await stripe.setupIntents.create({
      customer: customerId,
      payment_method_types: ['card'],
      usage: 'off_session', // Allow charging when customer is not present
      metadata: {
        source: 'checkout',
      },
    })

    console.log('✅ SetupIntent created:', setupIntent.id)

    return NextResponse.json({
      clientSecret: setupIntent.client_secret,
      setupIntentId: setupIntent.id,
    })
  } catch (error) {
    console.error('❌ Error creating SetupIntent:', error)
    
    if (error instanceof Stripe.errors.StripeError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode || 500 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create payment setup' },
      { status: 500 }
    )
  }
}
