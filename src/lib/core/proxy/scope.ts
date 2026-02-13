import 'server-only'

import {
  agencyScopeKey,
  subAccountScopeKey,
  parseScopeKey,
  type ScopeKey,
} from '@/lib/core/scope-key'
import {
  AUTLIFY_HEADER_AGENCY_ID,
  AUTLIFY_HEADER_SUBACCOUNT_ID,
  AUTLIFY_HEADER_SCOPE_KEY,
  getAutlifyAgencyHeader,
  getAutlifySubAccountHeader,
} from '@/lib/features/iam/authn/headers'

export const AUTLIFY_CONTEXT_COOKIE = 'autlify.context'
export const AUTLIFY_CONTEXT_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 60 // 60 days

const NON_CONTEXT_AGENCY_SLUGS = new Set(['sign-in', 'sign-up', 'verify', 'api', 'password'])

type ScopeParts =
  | { kind: 'agency'; agencyId: string }
  | { kind: 'subaccount'; subAccountId: string }

export type DerivedAutlifyScopeSource =
  | 'pathname'
  | 'headers'
  | 'query'
  | 'referer'
  | 'cookie'

export type DerivedAutlifyScope = ScopeParts & {
  source: DerivedAutlifyScopeSource
  scopeKey: ScopeKey
}

function scopePartsFromPathname(pathname: string): ScopeParts | null {
  // Agency scope: /agency/:agencyId/...
  const agencyMatch = pathname.match(/^\/agency\/([^/]+)(?:\/|$)/)
  if (agencyMatch?.[1] && !NON_CONTEXT_AGENCY_SLUGS.has(agencyMatch[1])) {
    return { kind: 'agency', agencyId: agencyMatch[1] }
  }

  // Subaccount scope: /subaccount/:subAccountId/...
  const subMatch = pathname.match(/^\/subaccount\/([^/]+)(?:\/|$)/)
  if (subMatch?.[1]) {
    return { kind: 'subaccount', subAccountId: subMatch[1] }
  }

  return null
}

function scopePartsFromSearchParams(searchParams: URLSearchParams): ScopeParts | null {
  const subAccountId =
    searchParams.get('subAccountId') ||
    searchParams.get('subaccountId') ||
    searchParams.get('sub_account_id')

  if (subAccountId) return { kind: 'subaccount', subAccountId }

  const agencyId =
    searchParams.get('agencyId') ||
    searchParams.get('agencyid') ||
    searchParams.get('agency_id')

  if (agencyId) return { kind: 'agency', agencyId }

  return null
}

function scopePartsFromHeaders(headers: Headers): ScopeParts | null {
  const requestedSubAccountId = getAutlifySubAccountHeader(headers)
  if (requestedSubAccountId) return { kind: 'subaccount', subAccountId: requestedSubAccountId }

  const requestedAgencyId = getAutlifyAgencyHeader(headers)
  if (requestedAgencyId) return { kind: 'agency', agencyId: requestedAgencyId }

  return null
}

function scopePartsFromCookieValue(value: string | null | undefined): ScopeParts | null {
  if (!value) return null
  const parsed = parseScopeKey(value.trim())
  if (!parsed) return null
  return parsed.scope === 'AGENCY'
    ? { kind: 'agency', agencyId: parsed.agencyId }
    : { kind: 'subaccount', subAccountId: parsed.subAccountId }
}

// Legacy cookie migration helper (transitional)
const LEGACY_COOKIE_NAMES = ['autlify_scopeKey', 'autlify.context-token'] as const

function scopePartsFromReferer(headers: Headers): ScopeParts | null {
  const raw = headers.get('referer')
  if (!raw) return null

  try {
    const u = new URL(raw)
    return scopePartsFromPathname(u.pathname) || scopePartsFromSearchParams(u.searchParams)
  } catch {
    return null
  }
}

function toScopeKey(parts: ScopeParts): ScopeKey {
  return parts.kind === 'agency'
    ? agencyScopeKey(parts.agencyId)
    : subAccountScopeKey(parts.subAccountId)
}

export function deriveAutlifyScope(args: {
  pathname: string
  searchParams: URLSearchParams
  headers: Headers
  cookieValue: string | null
  /** @deprecated Legacy cookies for migration only */
  legacyCookieValues?: (string | null)[]
}): DerivedAutlifyScope | null {
  const fromPath = scopePartsFromPathname(args.pathname)
  if (fromPath) return { ...fromPath, scopeKey: toScopeKey(fromPath), source: 'pathname' }

  const fromHeaders = scopePartsFromHeaders(args.headers)
  if (fromHeaders) return { ...fromHeaders, scopeKey: toScopeKey(fromHeaders), source: 'headers' }

  const fromQuery = scopePartsFromSearchParams(args.searchParams)
  if (fromQuery) return { ...fromQuery, scopeKey: toScopeKey(fromQuery), source: 'query' }

  const fromReferer = scopePartsFromReferer(args.headers)
  if (fromReferer) return { ...fromReferer, scopeKey: toScopeKey(fromReferer), source: 'referer' }

  const fromCookie = scopePartsFromCookieValue(args.cookieValue)
  if (fromCookie) return { ...fromCookie, scopeKey: toScopeKey(fromCookie), source: 'cookie' }

  return null
}

/**
 * Get legacy cookie names for migration cleanup
 */
export function getLegacyCookieNames(): readonly string[] {
  return LEGACY_COOKIE_NAMES
}

export function injectAutlifyScopeHeaders(headers: Headers, scope: DerivedAutlifyScope | null): void {
  if (!scope) return

  if (!headers.get(AUTLIFY_HEADER_SCOPE_KEY)) {
    headers.set(AUTLIFY_HEADER_SCOPE_KEY, scope.scopeKey)
  }

  if (scope.kind === 'agency') {
    if (!headers.get(AUTLIFY_HEADER_AGENCY_ID)) {
      headers.set(AUTLIFY_HEADER_AGENCY_ID, scope.agencyId)
    }
    return
  }

  if (!headers.get(AUTLIFY_HEADER_SUBACCOUNT_ID)) {
    headers.set(AUTLIFY_HEADER_SUBACCOUNT_ID, scope.subAccountId)
  }
}

