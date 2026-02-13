import { randomToken, sha256Hex, timingSafeEqualHex } from './crypto'

/**
 * Generates an API key with a non-secret prefix (stored in DB) and a secret token (shown once).
 *
 * Format: {keyPrefix}.{secret}
 */
export function generateIntegrationApiKey() {
  const keyPrefix = `ak_${randomToken(4)}` // ~8 hex chars with prefix
  const secret = randomToken(32)
  const apiKey = `${keyPrefix}.${secret}`
  const keyHash = sha256Hex(secret)
  return { apiKey, keyPrefix, keyHash }
}

export function verifyIntegrationApiKey(opts: {
  apiKey: string
  storedHash: string
  storedPrefix: string
}) {
  const [prefix, secret] = opts.apiKey.split('.', 2)
  if (!prefix || !secret) return false
  if (prefix !== opts.storedPrefix) return false
  const secretHash = sha256Hex(secret)
  return timingSafeEqualHex(secretHash, opts.storedHash)
}
