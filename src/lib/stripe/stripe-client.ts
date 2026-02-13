import { loadStripe, type Stripe } from '@stripe/stripe-js'

/**
 * IMPORTANT:
 * Stripe.js must be initialized with the correct `stripeAccount` when using Connect.
 * We keep a cache per connected account to avoid returning a Stripe instance bound
 * to a different account (which can cause embedded checkout to hard-refresh / reset).
 */
const stripePromiseByAccount: Record<string, Promise<Stripe | null>> = {}

export const getStripe = (connectedAccountId?: string) => {
  const key = connectedAccountId?.trim() || '__platform__'
  if (!stripePromiseByAccount[key]) {
    stripePromiseByAccount[key] = loadStripe(
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? '',
      connectedAccountId ? { stripeAccount: connectedAccountId } : undefined
    )
  }
  return stripePromiseByAccount[key]
}

