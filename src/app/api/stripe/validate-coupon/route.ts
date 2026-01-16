import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'

/**
 * Validate and retrieve coupon details
 */
export async function POST(req: Request) {
  try {
    const { code } = await req.json()

    if (!code) {
      return NextResponse.json({ error: 'Coupon code is required' }, { status: 400 })
    }

    // Retrieve coupon from Stripe
    const coupon = await stripe.coupons.retrieve(code.toUpperCase())

    if (!coupon.valid) {
      return NextResponse.json({ error: 'Coupon is no longer valid' }, { status: 400 })
    }

    return NextResponse.json({
      coupon: {
        id: coupon.id,
        percent_off: coupon.percent_off,
        amount_off: coupon.amount_off,
        currency: coupon.currency,
        duration: coupon.duration,
        duration_in_months: coupon.duration_in_months,
      },
    })
  } catch (error: any) {
    console.error('Coupon validation error:', error)
    
    if (error.type === 'StripeInvalidRequestError') {
      return NextResponse.json({ error: 'Invalid coupon code' }, { status: 404 })
    }

    return NextResponse.json(
      { error: 'Failed to validate coupon' },
      { status: 500 }
    )
  }
}
