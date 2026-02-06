import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import Stripe from 'stripe'
import { auth } from '@/auth'
import {db} from '@/lib/db'

/**
 * POST /api/stripe/create-setup-intent
 * 
 * Creates a SetupIntent to collect payment method details without immediate charge.
 * This is used for setting up future payments or collecting payment methods
 * before subscription creation.
 * 
 * If no customerId is provided, creates a new Stripe customer first.
 * 
 * Request body:
 * - customerId: string (optional) - Stripe customer ID to attach the payment method to
 * 
 * Returns:
 * - clientSecret: string - The client secret for the SetupIntent
 * - setupIntentId: string - The ID of the created SetupIntent
 * - customerId: string - The customer ID (existing or newly created)
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await req.json()
    let { customerId } = body

    // CRITICAL: Check if user has an agency with customerId first
    // This fixes the issue where existing users have their Stripe customer on Agency table, not User table
    if (!customerId) {
      const agencyMembership = await db.agencyMembership.findFirst({
        where: { userId: session.user.id },
        include: { Agency: { select: { customerId: true } } },
      })
      
      if (agencyMembership?.Agency?.customerId) {
        customerId = agencyMembership.Agency.customerId
        console.log('✅ Using agency customerId:', customerId)
      }
    }

    // If still no customerId, create a new Stripe customer
    if (!customerId) {
      console.log('🔧 No customerId provided, creating new Stripe customer...')
      
      // Get user details for customer creation
      const user = await db.user.findUnique({
        where: { id: session.user.id },
        select: { email: true, name: true, firstName: true, lastName: true },
      })

      if (!user?.email) {
        return NextResponse.json(
          { error: 'User email not found' },
          { status: 400 }
        )
      }

      // Create Stripe customer
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || undefined,
        metadata: {
          userId: session.user.id,
        },
      })

      customerId = customer.id
      console.log('✅ Created Stripe customer:', customerId)

      // Update user with customerId
      await db.user.update({
        where: { id: session.user.id },
        data: { customerId },
      })
    }

    console.log('🔧 Creating SetupIntent for customer:', customerId)

    // Create SetupIntent for collecting payment method
    const setupIntent = await stripe.setupIntents.create({
      customer: customerId,
      payment_method_types: ['card'],
      usage: 'off_session', // Allow charging when customer is not present
      metadata: {
        source: 'checkout',
        userId: session.user.id,
      },
    })

    console.log('✅ SetupIntent created:', setupIntent.id)

    return NextResponse.json({
      clientSecret: setupIntent.client_secret,
      setupIntentId: setupIntent.id,
      customerId,
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
