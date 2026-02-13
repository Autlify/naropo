import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import Stripe from 'stripe'
import { auth } from '@/auth'
import {db} from '@/lib/db'
import { makeStripeIdempotencyKey } from '@/lib/stripe/idempotency'

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

    const body = await req.json().catch(() => ({}))
    let { customerId } = body as { customerId?: string }

    // Do not trust client-provided customerId.
    // Only allow using a customerId that belongs to the current user (user.customerId)
    // or any agency the user is a member of (agency.customerId).
    const userRecord = await db.user.findUnique({
      where: { id: session.user.id },
      select: { email: true, name: true, firstName: true, lastName: true, customerId: true },
    })

    const memberships = await db.agencyMembership.findMany({
      where: { userId: session.user.id },
      include: { Agency: { select: { customerId: true } } },
    })

    const allowedCustomerIds = new Set<string>([
      ...(userRecord?.customerId ? [userRecord.customerId] : []),
      ...memberships.map((m) => m.Agency?.customerId).filter(Boolean) as string[],
    ])

    if (customerId && !allowedCustomerIds.has(customerId)) {
      console.warn('⚠️ Ignoring untrusted customerId from client')
      customerId = undefined
    }

    // CRITICAL: Check if user has an agency with customerId first
    // This fixes the issue where existing users have their Stripe customer on Agency table, not User table
    if (!customerId) {
      // Prefer agency-level customerId (workspace billing identity) if present.
      const agencyCustomerId = memberships.find((m) => m.Agency?.customerId)?.Agency?.customerId
      if (agencyCustomerId) {
        customerId = agencyCustomerId
        console.log('✅ Using agency customerId:', customerId)
      }
    }

    // If still no customerId, create a new Stripe customer
    if (!customerId) {
      console.log('🔧 No customerId provided, creating new Stripe customer...')
      
      // Get user details for customer creation
      if (!userRecord?.email) {
        return NextResponse.json(
          { error: 'User email not found' },
          { status: 400 }
        )
      }

      // Create Stripe customer
      const idem = makeStripeIdempotencyKey('customer_create', ['user', session.user.id])
      const customer = await stripe.customers.create(
        {
          email: userRecord.email,
          name:
            userRecord.name ||
            `${userRecord.firstName || ''} ${userRecord.lastName || ''}`.trim() ||
            undefined,
          metadata: {
            userId: session.user.id,
          },
        },
        { idempotencyKey: idem }
      )

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
