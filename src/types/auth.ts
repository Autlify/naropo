/**
 * Centralized Authentication Types
 * 
 * Token scopes for verification tokens used across the auth system.
 * All API routes and functions should import from here for consistency.
 */

/**
 * Token scope types for verification tokens
 * 
 * @scope verify - Email verification after registration
 * @scope authN - One-time authentication token for auto-login after verification
 * @scope passkey - WebAuthn passkey registration/authentication
 * @scope reset-request - Password reset request (sent via email)
 * @scope reset-password - Password reset execution (after clicking email link)
 * 
 * @deprecated email - Use 'verify' instead (normalized internally)
 * @deprecated webauthN - Use 'passkey' instead (normalized internally)
 */
export type TokenScope = 
  | 'verify' 
  | 'authN' 
  | 'passkey' 
  | 'reset-request' 
  | 'reset-password'

/**
 * Alias scopes that get normalized to their canonical form
 * - 'email' → 'verify'
 * - 'webauthN' → 'passkey'
 */
export type TokenScopeAlias = 'email' | 'webauthN'

/**
 * All accepted token scopes including aliases
 */
export type TokenScopeInput = TokenScope | TokenScopeAlias

/**
 * Token scopes that trigger email sending
 */
export type EmailTokenScope = 'verify' | 'reset-request'

/**
 * Normalize alias scopes to their canonical form
 */
export function normalizeTokenScope(scope: TokenScopeInput): TokenScope {
  if (scope === 'email') return 'verify'
  if (scope === 'webauthN') return 'passkey'
  return scope
}

/**
 * Token request payload for POST /api/auth/token
 */
export interface TokenRequest {
  email: string
  scope: EmailTokenScope
}

/**
 * Token validation result from validateVerificationToken
 */
export interface TokenValidationResult {
  success: boolean
  error?: string
  message?: string
  email?: string
  scope?: TokenScope
  url?: string
  user?: {
    id: string
    email: string
    name?: string | null
  }
}

/**
 * Cooldown check response
 */
export interface CooldownStatus {
  cooldownActive: boolean
  remainingSeconds: number
}


export interface AuthConfig {
  requireEmailVerification: boolean
  enablePasskeys: boolean
  passwordPolicy: {
    minLength: number
    requireUppercase: boolean
    requireLowercase: boolean
    requireNumbers: boolean
    requireSpecialChars: boolean
  }
}

// ---------------------------------------------------------------------------
// User Types (for future use)
// ---------------------------------------------------------------------------
export interface BasicUser {
  id: string;
  email: string;
  name: string | null;
}

export interface AuthUser extends BasicUser {
  tenantId: string | null;
  businessId?: string | null;
  emailVerified?: boolean;
  authenticatorEnabled?: boolean;
}

export interface FullUser extends AuthUser {
  profile?: {
    firstName: string | null;
    lastName: string | null;
    fullName: string | null;
    avatar: string | null;
  } | null;
  tenant?: {
    id: string;
    name: string;
  } | null;
  businesses?: Array<{
    id: string;
    name: string;
  }>;
  permissions?: Array<{
    businessId: string;
    access: boolean;
  }>;
}

// ---------------------------------------------------------------------------
// Deprecated User Types
// ---------------------------------------------------------------------------



// export interface CurrentUser {
//   id: string;
//   email: string;
//   name: string | null;
//   tenantId: string | null;
//   businessId?: string | null;
//   avatar?: string | null;
//   emailVerified?: boolean;
//   authenticatorEnabled?: boolean;
//   role?: string; // User's primary role
//   // RBAC hints for client-side optimization
//   rbacHints?: {
//     roleKeys: string[];
//     isSuperuser: boolean;
//     tenantId?: string | null;
//     businessId?: string | null;
//   };
// }

// export interface FullUser extends CurrentUser {
//   Profile?: {
//     firstName: string | null;
//     lastName: string | null;
//     fullName: string | null;
//     avatar: string | null;
//   } | null;
//   Tenant?: {
//     id: string;
//     name: string;
//   } | null;
//   Businesses?: Array<{
//     id: string;
//     name: string;
//   }>;
//   Permissions?: Array<{
//     businessId: string;
//     access: boolean;
//   }>;
// }