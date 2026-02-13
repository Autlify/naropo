import 'server-only'

import crypto from 'node:crypto'

/**
 * Generate a Stripe idempotency key with a stable prefix and hashed payload.
 *
 * - Deterministic for the same logical operation (prevents duplicate customers/accounts on retries)
 * - Short (Stripe has length limits)
 * - Avoids leaking raw PII inside the idempotency key
 */
export function makeStripeIdempotencyKey(
  prefix: string,
  parts: Array<string | null | undefined>
): string {
  const payload = parts
    .map((p) => (p ?? '').trim())
    .filter(Boolean)
    .join(':')

  const hash = crypto
    .createHash('sha256')
    .update(`${prefix}:${payload}`)
    .digest('hex')
    .slice(0, 32)

  // Keep it readable + clearly namespaced
  return `autlify:${prefix}:${hash}`
}
