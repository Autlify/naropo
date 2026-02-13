/**
 * Scope Context Types
 * 
 * Defines the structure of the scope context that represents a user's
 * current permissions, entitlements, and membership within a scope.
 */

export type ScopeContextVersion = 1

/**
 * Full scope context - contains all permission and entitlement data
 * Used server-side in memory cache
 */
export interface ScopeContext {
  version: ScopeContextVersion
  
  // Identity
  userId: string
  scope: 'AGENCY' | 'SUBACCOUNT'
  agencyId: string
  subAccountId: string | null
  
  // Membership
  roleId: string | null
  roleName: string | null
  isOwner: boolean
  isAdmin: boolean
  
  // Permissions (action keys the user can perform)
  permissionKeys: string[]
  permissionHash: string
  
  // Entitlements (features enabled by plan/addons)
  enabledFeatures: string[]
  unlimitedFeatures: string[]
  entitlementHash: string
  
  // Plan info
  planId: string | null
  planName: string | null
  
  // Timestamps
  loadedAt: number  // Unix timestamp (ms)
  expiresAt: number // Unix timestamp (ms)
}

/**
 * Compact context for cookie storage
 * Minimized keys to reduce cookie size (~500-800 bytes)
 */
export interface CompactScopeContext {
  v: ScopeContextVersion
  
  // Identity (abbreviated)
  u: string       // userId
  s: 0 | 1        // scope: 0=AGENCY, 1=SUBACCOUNT
  a: string       // agencyId
  sa: string | null // subAccountId
  
  // Membership
  r: string | null  // roleId
  o: boolean        // isOwner
  ad: boolean       // isAdmin
  
  // Hashes for staleness detection (not full data)
  ph: string        // permissionHash
  eh: string        // entitlementHash
  
  // Plan
  p: string | null  // planId
  
  // Expiry
  exp: number       // expiresAt (Unix timestamp ms)
}

/**
 * Scope extraction result from URL path
 */
export interface ExtractedScope {
  scope: 'AGENCY' | 'SUBACCOUNT'
  agencyId: string
  subAccountId: string | null
}
