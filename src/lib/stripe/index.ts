import Stripe from 'stripe'

// Create Stripe client only when API key is available (not during build)
function createStripeClient(): Stripe {
  const apiKey = process.env.STRIPE_SECRET_KEY
  
  if (!apiKey) {
    console.warn('[stripe] STRIPE_SECRET_KEY not set, returning proxy (build mode)')
    return new Proxy({} as Stripe, {
      get(target, prop) {
        if (prop === 'then') return undefined
        return () => {
          throw new Error('Stripe not available: STRIPE_SECRET_KEY is not configured')
        }
      }
    }) as Stripe
  }
  
  return new Stripe(apiKey, {
    apiVersion: '2026-01-28.clover',
    appInfo: {
      name: 'Autlify App',
      version: '0.1.0',
    },
  })
}

export const stripe = createStripeClient()

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


