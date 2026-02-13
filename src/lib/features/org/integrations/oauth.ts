import 'server-only'

import { hmacSha256Hex, timingSafeEqualHex } from './crypto'

const DEFAULT_SECRET =
  process.env.INTEGRATIONS_OAUTH_STATE_SECRET ||
  process.env.NEXTAUTH_SECRET ||
  'dev_secret_change_me'

export function signOAuthState(payload: Record<string, any>, secret = DEFAULT_SECRET) {
  const json = JSON.stringify(payload)
  const sig = hmacSha256Hex(secret, json)
  const state = Buffer.from(json, 'utf8').toString('base64url') + '.' + sig
  return state
}

export function verifyOAuthState<T extends Record<string, any>>(
  state: string,
  secret = DEFAULT_SECRET
): T | null {
  const [b64, sig] = state.split('.', 2)
  if (!b64 || !sig) return null
  const json = Buffer.from(b64, 'base64url').toString('utf8')
  const expected = hmacSha256Hex(secret, json)
  if (!timingSafeEqualHex(expected, sig)) return null
  try {
    return JSON.parse(json) as T
  } catch {
    return null
  }
}
