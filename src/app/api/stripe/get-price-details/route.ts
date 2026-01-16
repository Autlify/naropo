import { stripe } from '@/lib/stripe'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'

/**
 * Get Price details including trial period configuration
 * This helps determine the payment flow before creating a subscription
 */
export async function POST(req: Request) {
  try {
    const { priceId } = await req.json()

    if (!priceId) {
      return NextResponse.json(
        { error: 'Price ID is required' },
        { status: 400 }
      )
    }

    // Fetch price details with product expanded
    const price = await stripe.prices.retrieve(priceId, {
      expand: ['product'],
    })

    const product = price.product as Stripe.Product

    // Check for trial period in product metadata or recurring configuration
    const hasTrial = product.metadata?.trial_period_days || price.recurring?.trial_period_days
    const trialDays = hasTrial ? parseInt(hasTrial.toString(), 10) : 0

    return NextResponse.json({
      priceId: price.id,
      amount: price.unit_amount,
      currency: price.currency,
      recurring: price.recurring,
      hasTrial: trialDays > 0,
      trialDays,
      productName: product.name,
      productDescription: product.description,
    })
  } catch (error) {
    console.error('🔴 Error fetching price details:', error)
    return NextResponse.json(
      { error: 'Failed to fetch price details' },
      { status: 500 }
    )
  }
}
