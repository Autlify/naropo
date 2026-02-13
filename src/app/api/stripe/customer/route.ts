import { stripe } from '@/lib/stripe'
import { StripeCustomerType } from '@/lib/types'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { db } from '@/lib/db'
import { auth } from '@/auth'
import { makeStripeIdempotencyKey } from '@/lib/stripe/idempotency'

/**
 * GET /api/stripe/customer
 * 
 * Retrieve customer data and payment methods.
 * Supports two lookup modes:
 * 
 * 1. By email: GET /api/stripe/customer?email=user@example.com
 *    - Searches Stripe for customer by email
 *    - Returns basic customer data
 * 
 * 2. By agencyId: GET /api/stripe/customer?agencyId=agency_xxx
 *    - Looks up agency's customerId from database
 *    - Returns full customer data + payment methods
 *    - Used for checkout forms that need existing billing info
 */
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url)
        const email = searchParams.get('email')
        const agencyId = searchParams.get('agencyId')

        // Mode 1: Search by email
        if (email) {
            const existingCustomer = await stripe.customers.search({
                query: `email:'${email}'`,
                limit: 1,
            })

            if (existingCustomer.data.length > 0) {
                console.log('✅ Found existing Stripe customer:', existingCustomer.data[0].id)
                return NextResponse.json({
                    customer: existingCustomer.data[0],
                    exists: true,
                })
            }

            console.log('ℹ️ No customer found for email:', email)
            return NextResponse.json({
                customer: null,
                exists: false,
            })
        }

        // Mode 2: Lookup by agencyId - returns full billing data
        if (agencyId) {
            // Get agency with customerId
            const agency = await db.agency.findUnique({
                where: { id: agencyId },
                select: { customerId: true, name: true },
            })

            if (!agency) {
                return NextResponse.json(
                    { error: 'Agency not found' },
                    { status: 404 }
                )
            }

            if (!agency.customerId) {
                // No customer yet - return empty data
                return NextResponse.json({
                    exists: false,
                    customerId: null,
                    customer: null,
                    paymentMethods: [],
                })
            }

            try {
                // Fetch customer from Stripe
                const customer = await stripe.customers.retrieve(agency.customerId) as Stripe.Customer

                if (customer.deleted) {
                    return NextResponse.json({
                        exists: false,
                        customerId: agency.customerId,
                        customer: null,
                        paymentMethods: [],
                        error: 'Customer has been deleted in Stripe',
                    })
                }

                // Fetch payment methods
                const paymentMethodsResponse = await stripe.paymentMethods.list({
                    customer: agency.customerId,
                    type: 'card',
                })

                // Get default payment method
                const defaultPaymentMethod = typeof customer.invoice_settings?.default_payment_method === 'string'
                    ? customer.invoice_settings.default_payment_method
                    : customer.invoice_settings?.default_payment_method?.id || null

                // Format customer data
                const customerData = {
                    id: customer.id,
                    email: customer.email ?? null,
                    name: customer.name ?? null,
                    phone: customer.phone ?? null,
                    address: customer.address ? {
                        line1: customer.address.line1 ?? null,
                        line2: customer.address.line2 ?? null,
                        city: customer.address.city ?? null,
                        state: customer.address.state ?? null,
                        postal_code: customer.address.postal_code ?? null,
                        country: customer.address.country ?? null,
                    } : null,
                    metadata: customer.metadata as Record<string, string>,
                }

                // Format payment methods
                const paymentMethods = paymentMethodsResponse.data.map(pm => ({
                    id: pm.id,
                    card: pm.card ? {
                        cardholder_name: pm.billing_details?.name || null,
                        brand: pm.card.brand,
                        last4: pm.card.last4,
                        exp_month: pm.card.exp_month,
                        exp_year: pm.card.exp_year,
                        isDefault: pm.id === defaultPaymentMethod,
                    } : null,
                }))

                console.log('✅ Fetched billing data for agency:', agencyId, '- Customer:', customer.id, '- Payment methods:', paymentMethods.length)

                return NextResponse.json({
                    exists: true,
                    customerId: agency.customerId,
                    customer: customerData,
                    paymentMethods,
                })
            } catch (stripeError) {
                console.error('🔴 Error fetching Stripe customer:', stripeError)
                return NextResponse.json({
                    exists: false,
                    customerId: agency.customerId,
                    customer: null,
                    paymentMethods: [],
                    error: 'Failed to fetch customer from Stripe',
                })
            }
        }

        // No valid lookup parameter
        return NextResponse.json(
            { error: 'Either email or agencyId parameter is required' },
            { status: 400 }
        )
    } catch (error) {
        console.error('🔴 Error searching customer:', error)
        return NextResponse.json(
            { error: 'Failed to search customer' },
            { status: 500 }
        )
    }
}

/**
 * POST /api/stripe/customer
 * Create new Stripe customer or return existing
 * 
 * Request body:
 * - email: string - Customer email (required)
 * - name: string - Customer name (required)
 * - phone?: string - Phone number
 * - business_name?: string - Business name
 * - individual_name?: string - Individual name
 * - address: object - Billing address (required)
 * - shipping: object - Shipping address (required)
 * - metadata?: object - Additional metadata
 * - userId?: string - User ID to update with customerId (inline update, replaces /api/user/update-customer)
 * 
 * Returns:
 * - customerId: string - The created Stripe customer ID
 * - userUpdated?: boolean - Whether the user was updated (if userId provided)
 */
export async function POST(req: Request) {
    const body = JSON.stringify(await req.json())
    console.log('🔍 Raw body received:', body)
    const { email, name, phone, business_name, individual_name, address, shipping, metadata, userId } = JSON.parse(body) as StripeCustomerType & { userId?: string }

    console.log('🔍 Parsed values:', { email, name, phone, individual_name, business_name, address, shipping, metadata, userId })

    if (!email || !name || !address || !shipping) {
        console.log('❌ Validation failed:', { email, name, address, shipping })
        return new NextResponse('Missing data', {
            status: 400,
        })
    }
    try {
        // Filter out undefined values from metadata (Stripe only accepts string | number | null)
        const cleanMetadata = metadata
            ? Object.fromEntries(
                Object.entries(metadata).filter(([_, v]) => v !== undefined)
            ) as Record<string, string>
            : {}

        const idem = makeStripeIdempotencyKey('customer_create', [
            'api_customer',
            userId || '',
            email,
        ])

        const customer = await stripe.customers.create(
            {
                email,
                name,
                phone,
                individual_name,
                business_name,
                address,
                shipping,
                metadata: cleanMetadata,
            },
            { idempotencyKey: idem }
        )
        console.log('✅ Stripe customer created:', customer.id, 'with metadata:', cleanMetadata)

        // If userId provided, update user with customerId inline (replaces /api/user/update-customer)
        let userUpdated = false
        if (userId) {
            try {
                // Verify session if available
                const session = await auth()
                
                // Only update if session user matches or no session (internal call)
                if (!session?.user?.id || session.user.id === userId) {
                    await db.user.update({
                        where: { id: userId },
                        data: { customerId: customer.id },
                    })
                    console.log('✅ User customerId updated inline:', userId, '->', customer.id)
                    userUpdated = true
                } else {
                    console.warn('⚠️ Session user mismatch, skipping user update:', session.user.id, '!=', userId)
                }
            } catch (userError) {
                console.error('⚠️ Failed to update user customerId (non-blocking):', userError)
                // Non-blocking - customer was still created successfully
            }
        }

        return Response.json({ 
            customerId: customer.id,
            ...(userId && { userUpdated }),
        })
    } catch (error) {
        console.log('🔴 Error', error)
        return new NextResponse('Internal Server Error', { status: 500 })
    }
}

/**
 * PATCH /api/stripe/customer
 * Update existing Stripe customer
 */
export async function PATCH(req: Request) {
    try {
        const { customerId, name, email, address, shipping, metadata } = await req.json()

        if (!customerId) {
            return NextResponse.json(
                { error: 'Customer ID is required' },
                { status: 400 }
            )
        }

        // Clean metadata
        const cleanMetadata = metadata
            ? Object.fromEntries(
                Object.entries(metadata).filter(([_, v]) => v !== undefined)
            )
            : undefined

        // Update customer
        const updates: any = {}
        if (name !== undefined) updates.name = name
        if (email !== undefined) updates.email = email
        if (address !== undefined) updates.address = address
        if (shipping !== undefined) updates.shipping = shipping
        if (cleanMetadata) updates.metadata = cleanMetadata

        const customer = await stripe.customers.update(customerId, updates)

        console.log('✅ Updated Stripe customer:', customer.id)
        return NextResponse.json({
            customer,
            updated: true,
        })
    } catch (error) {
        console.error('🔴 Error updating customer:', error)
        return NextResponse.json(
            { error: 'Failed to update customer' },
            { status: 500 }
        )
    }
}
