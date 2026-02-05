import { stripe } from '@/lib/stripe'
import { StripeCustomerType } from '@/lib/types'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { db } from '@/lib/db'
import { auth } from '@/auth'

/**
 * GET /api/stripe/customer
 * Search for existing customer by email
 */
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url)
        const email = searchParams.get('email')

        if (!email) {
            return NextResponse.json(
                { error: 'Email parameter is required' },
                { status: 400 }
            )
        }

        // Search for existing customer
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

        const customer = await stripe.customers.create({
            email,
            name,
            phone,
            individual_name,
            business_name,
            address,
            shipping,
            metadata: cleanMetadata
            
        })
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
