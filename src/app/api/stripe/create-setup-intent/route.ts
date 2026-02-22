import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import Stripe from 'stripe'
import { db } from '@/lib/db'
import { getOrCreateStripeCustomer, type CustomerScope } from '@/lib/stripe/customer'
import { withErrorHandler, requireAuth } from '@/lib/api'

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
export const POST = withErrorHandler(async (req: Request) => {
  const session = await requireAuth()
  const userId = session.user.id

  const body = await req.json().catch(() => ({}))
  let { customerId } = body as { customerId?: string }

  // Do not trust client-provided customerId.
  // Only allow using a customerId that belongs to the current user (user.customerId)
  // or any agency the user is a member of (agency.customerId).
  const userRecord = await db.user.findUnique({
    where: { id: userId },
    select: { email: true, name: true, firstName: true, lastName: true, customerId: true },
  })

  const memberships = await db.agencyMembership.findMany({
    where: { userId },
    include: { Agency: { select: { id: true, customerId: true } } },
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
    const membershipWithAgencyCustomer = memberships.find((m) => m.Agency?.customerId)
    if (membershipWithAgencyCustomer?.Agency?.customerId) {
      customerId = membershipWithAgencyCustomer.Agency.customerId
      console.log('✅ Using agency customerId:', customerId)
    }
  }

  // If still no customerId, create a new Stripe customer
  if (!customerId) {
    console.log('🔧 No customerId provided, creating new Stripe customer...')
    
    // Determine scope: prefer first agency if available, otherwise user-level
    const scope: CustomerScope = memberships[0]?.Agency?.id
      ? { level: 'agency', agencyId: memberships[0].Agency.id }
      : { level: 'user', userId }
    
    customerId = await getOrCreateStripeCustomer(
      scope,
      userId,
      userRecord?.email,
      userRecord?.name || `${userRecord?.firstName || ''} ${userRecord?.lastName || ''}`.trim() || undefined
    )
    
    console.log('✅ Created/retrieved Stripe customer:', customerId)
  }

  console.log('🔧 Creating SetupIntent for customer:', customerId)

  // Create SetupIntent for collecting payment method
  const setupIntent = await stripe.setupIntents.create({
    customer: customerId,
    payment_method_types: ['card'],
    usage: 'off_session', // Allow charging when customer is not present
    metadata: {
      source: 'checkout',
      userId,
    },
  })

  console.log('✅ SetupIntent created:', setupIntent.id)

  return NextResponse.json({
    clientSecret: setupIntent.client_secret,
    setupIntentId: setupIntent.id,
    customerId,
  })
})
