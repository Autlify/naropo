/**
 * Scope Context Encoding
 * 
 * Converts between full ScopeContext and compact token format.
 * Uses simple JSON + base64 encoding (no encryption needed - data is not secret)
 * Signing is handled separately in cookie.ts
 */

import type { ScopeContext, CompactScopeContext } from './types'

/**
 * Compact a full ScopeContext into minimal format for cookie storage
 */
export function compactify(ctx: ScopeContext): CompactScopeContext {
  return {
    v: ctx.version,
    u: ctx.userId,
    s: ctx.scope === 'AGENCY' ? 0 : 1,
    a: ctx.agencyId,
    sa: ctx.subAccountId,
    r: ctx.roleId,
    o: ctx.isOwner,
    ad: ctx.isAdmin,
    ph: ctx.permissionHash,
    eh: ctx.entitlementHash,
    p: ctx.planId,
    exp: ctx.expiresAt,
  }
}

/**
 * Expand a compact context back to partial ScopeContext
 * Note: This only recovers the hashes, not full permission/entitlement lists
 * Full data must be loaded from cache/DB
 */
export function expandCompact(compact: CompactScopeContext): Partial<ScopeContext> {
  return {
    version: compact.v,
    userId: compact.u,
    scope: compact.s === 0 ? 'AGENCY' : 'SUBACCOUNT',
    agencyId: compact.a,
    subAccountId: compact.sa,
    roleId: compact.r,
    isOwner: compact.o,
    isAdmin: compact.ad,
    permissionHash: compact.ph,
    entitlementHash: compact.eh,
    planId: compact.p,
    expiresAt: compact.exp,
  }
}

/**
 * Encode compact context to URL-safe string
 */
export function encodeCompact(compact: CompactScopeContext): string {
  const json = JSON.stringify(compact)
  // Use base64url encoding (URL-safe, no padding)
  return Buffer.from(json, 'utf-8').toString('base64url')
}

/**
 * Decode URL-safe string back to compact context
 */
export function decodeCompact(encoded: string): CompactScopeContext | null {
  try {
    const json = Buffer.from(encoded, 'base64url').toString('utf-8')
    const parsed = JSON.parse(json)
    
    // Basic validation
    if (typeof parsed.v !== 'number' || typeof parsed.u !== 'string') {
      return null
    }
    
    return parsed as CompactScopeContext
  } catch {
    return null
  }
}
