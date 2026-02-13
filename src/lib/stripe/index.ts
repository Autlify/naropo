import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? '', {
  apiVersion: '2026-01-28.clover',
  appInfo: {
    name: 'Autlify App',
    version: '0.1.0',
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


