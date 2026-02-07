import Stripe from 'stripe'

// Lazy initialization to prevent build-time errors when STRIPE_SECRET_KEY is not available
let _stripe: Stripe | null = null

function createStripeClient(): Stripe {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY environment variable is not set')
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2026-01-28.clover',
    appInfo: {
      name: 'Autlify App',
      version: '0.1.0',
    },
  })
}

// Use proxy to defer Stripe client creation until first use (runtime only)
export const stripe: Stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    if (!_stripe) {
      _stripe = createStripeClient()
    }
    return Reflect.get(_stripe, prop)
  },
})

/**
 * NOTE: The resolvePriceId/getStripePriceId helpers have been removed.
 * 
 * After running `bun scripts/sync-stripe-catalog.ts`, the constants.ts file
 * is automatically updated with real Stripe price IDs. This eliminates the
 * need for runtime price ID resolution.
 * 
 * If you need to use a price ID, import it directly from constants.ts:
 * 
 * ```ts
 * import { prices } from '@/lib/constants'
 * const starterMonthlyPrice = prices.find(p => p.nickname === 'Starter' && p.recurring?.interval === 'month')
 * // Use starterMonthlyPrice.id directly - it's already the Stripe ID
 * ```
 */


