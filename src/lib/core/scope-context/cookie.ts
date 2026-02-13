/**
 * Scope Context Cookie Handler
 * 
 * Manages reading/writing the scope context cookie with HMAC signing.
 * The cookie stores a compact version of the context for staleness detection.
 */

import 'server-only'

import crypto from 'crypto'
import { cookies } from 'next/headers'
import type { ScopeContext, CompactScopeContext } from './types'
import { compactify, encodeCompact, decodeCompact, expandCompact } from './encode'

// Cookie name - extends the existing context-token pattern
export const SCOPE_CONTEXT_COOKIE = 'autlify.scope-context'

// Use AUTH_SECRET for signing (same as NextAuth)
const getSigningKey = (): string => {
  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET
  if (!secret) throw new Error('AUTH_SECRET is required for scope context cookies')
  return secret
}

/**
 * Sign a payload with HMAC-SHA256
 */
function signPayload(payload: string): string {
  const hmac = crypto.createHmac('sha256', getSigningKey())
  hmac.update(payload)
  return hmac.digest('base64url')
}

/**
 * Verify and parse a signed cookie value
 * Returns null if signature invalid or expired
 */
function verifyAndParse(cookieValue: string): CompactScopeContext | null {
  const parts = cookieValue.split('.')
  if (parts.length !== 2) return null
  
  const [payload, signature] = parts
  const expectedSig = signPayload(payload)
  const a = Buffer.from(signature)
  const b = Buffer.from(expectedSig)
  if (a.length !== b.length) return null
  
  // Constant-time comparison to prevent timing attacks
  if (!crypto.timingSafeEqual(a, b)) {
    return null
  }
  
  const compact = decodeCompact(payload)
  if (!compact) return null
  
  // Check expiry
  if (compact.exp < Date.now()) {
    return null
  }
  
  return compact
}

/**
 * Read the scope context cookie
 * Returns null if not present, invalid, or expired
 */
export async function readScopeContextCookie(): Promise<{
  compact: CompactScopeContext
  partial: Partial<ScopeContext>
} | null> {
  const cookieStore = await cookies()
  const cookie = cookieStore.get(SCOPE_CONTEXT_COOKIE)
  if (!cookie?.value) return null
  
  const compact = verifyAndParse(cookie.value)
  if (!compact) return null
  
  return {
    compact,
    partial: expandCompact(compact),
  }
}

/**
 * Write the scope context cookie from a full context
 */
export async function writeScopeContextCookie(ctx: ScopeContext): Promise<void> {
  const compact = compactify(ctx)
  const payload = encodeCompact(compact)
  const signature = signPayload(payload)
  const value = `${payload}.${signature}`
  
  const cookieStore = await cookies()
  cookieStore.set(SCOPE_CONTEXT_COOKIE, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    // Cookie expires when the context expires
    expires: new Date(ctx.expiresAt),
  })
}

/**
 * Clear the scope context cookie
 */
export async function clearScopeContextCookie(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(SCOPE_CONTEXT_COOKIE)
}

/**
 * Check if the cached cookie context matches current hashes
 * Used to detect if permissions/entitlements have changed
 */
export function isContextStale(
  cached: { permissionHash: string; entitlementHash: string },
  current: { permissionHash: string; entitlementHash: string }
): boolean {
  return cached.permissionHash !== current.permissionHash || 
         cached.entitlementHash !== current.entitlementHash
}
