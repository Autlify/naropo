import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { db } from '@/lib/db'
import { auth } from '@/auth'
import { makeStripeIdempotencyKey } from '@/lib/stripe/idempotency'
import { getAppOrigin } from '@/lib/core/runtime/origins'

/**
 * POST /api/stripe/credits/checkout
 * Creates a Stripe checkout session for purchasing credits
 * 
 * Body:
 * - agencyId: string
 * - featureKey: string
 * - credits: number
 * - priceId?: string (optional - use predefined credit price)
 * 
 * Returns:
 * - url: string (Stripe checkout URL)
 */
export async function POST(req: NextRequest) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await req.json()
        const { agencyId, subAccountId, featureKey, credits, priceId } = body
        const scope = subAccountId ? 'SUBACCOUNT' : 'AGENCY'

        if (!agencyId || !featureKey || !credits) {
            return NextResponse.json(
                { error: 'Missing required fields: agencyId, featureKey, credits' },
                { status: 400 }
            )
        }

        const creditAmount = Math.max(1, Math.floor(Number(credits) || 0))
        if (creditAmount <= 0) {
            return NextResponse.json({ error: 'Invalid credit amount' }, { status: 400 })
        }

        // Get agency for customer ID
        const agency = await db.agency.findUnique({
            where: { id: agencyId },
            select: { id: true, customerId: true, name: true, companyEmail: true },
        })

        if (!agency) {
            return NextResponse.json({ error: 'Agency not found' }, { status: 404 })
        }

        let customerId = agency.customerId

        // Create customer if not exists
        if (!customerId) {
            const idem = makeStripeIdempotencyKey('customer_create', ['agency', agencyId])
            const customer = await stripe.customers.create(
                {
                    email: agency.companyEmail || undefined,
                    name: agency.name,
                    metadata: { agencyId: agency.id },
                },
                { idempotencyKey: idem }
            )
            customerId = customer.id

            await db.agency.update({
                where: { id: agencyId },
                data: { customerId },
            })
        }

        // Calculate price based on credits (e.g., $0.01 per credit, minimum $1)
        // This can be customized per feature or use a predefined Stripe Price
        const pricePerCredit = 1 // cents
        const totalAmount = Math.max(100, creditAmount * pricePerCredit) // minimum $1

        const baseUrl = getAppOrigin({ headers: req.headers as any })
        const successUrl = `${baseUrl}/agency/${agencyId}/billing/credits?session_id={CHECKOUT_SESSION_ID}`
        const cancelUrl = `${baseUrl}/agency/${agencyId}/billing/credits`

        // Create checkout session
        const checkoutSession = await stripe.checkout.sessions.create({
            customer: customerId,
            mode: 'payment',
            payment_method_types: ['card'],
            ...(priceId
                ? {
                    // Use predefined Stripe Price for credits
                    line_items: [{ price: priceId, quantity: creditAmount }],
                }
                : {
                    // Create ad-hoc price
                    line_items: [
                        {
                            price_data: {
                                // Keep currency consistent with the unified /api/stripe/checkout flow.
                                currency: 'myr',
                                unit_amount: pricePerCredit,
                                product_data: {
                                    name: `${featureKey} Credits`,
                                    description: `${creditAmount} credits for ${featureKey}`,
                                },
                            },
                            quantity: creditAmount,
                        },
                    ],
                }),
            metadata: {
                // Legacy route, but emit metadata compatible with the unified checkout + webhook handlers.
                checkoutType: 'credits',
                type: 'credit_purchase',
                agencyId,
                subAccountId: subAccountId || '',
                scope,
                scopeLevel: subAccountId ? 'subAccount' : 'agency',
                featureKey,
                credits: String(creditAmount),
            },
            success_url: successUrl,
            cancel_url: cancelUrl,
        })

        return NextResponse.json({
            ok: true,
            url: checkoutSession.url,
            sessionId: checkoutSession.id,
        })
    } catch (error) {
        console.error('[STRIPE_CREDITS_CHECKOUT]', error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to create checkout session' },
            { status: 500 }
        )
    }
}
