import 'server-only'

/**
 * Canonical context headers for SDK / integrations.
 *
 * Rationale: header-based "act on behalf of" (Stripe Connect style) keeps the API surface stable,
 * while allowing callers to target a BizUnit (SubAccount) under an OrgUnit (Agency) safely.
 */

// Lower-case constants (Request/Headers are case-insensitive, but we normalize to lower-case).
// Preferred (as per Autlify docs)
export const AUTLIFY_HEADER_AGENCY_ID = 'x-autlify-agency-id'
export const AUTLIFY_HEADER_SUBACCOUNT_ID = 'x-autlify-subaccount-id'
export const AUTLIFY_HEADER_API_KEY = 'x-autlify-api-key'
export const AUTLIFY_HEADER_SCOPE_KEY = 'x-autlify-scope-key'

// Backwards-compatible legacy aliases (older patches)
export const AUTLIFY_HEADER_AGENCY_ID_LEGACY = 'x-autlify-agency'
export const AUTLIFY_HEADER_SUBACCOUNT_ID_LEGACY = 'x-autlify-subaccount'

// Human-readable equivalents (useful for docs / examples).
export const AUTLIFY_HEADER_AGENCY_ID_CANONICAL = 'Autlify-Agency-Id'
export const AUTLIFY_HEADER_SUBACCOUNT_ID_CANONICAL = 'Autlify-SubAccount-Id'
export const AUTLIFY_HEADER_API_KEY_CANONICAL = 'Autlify-Api-Key'
export const AUTLIFY_HEADER_SCOPE_KEY_CANONICAL = 'Autlify-Scope-Key'

export const getHeaderValue = (headers: Headers, name: string): string | null => {
  // Headers.get is case-insensitive, but some runtimes normalize differently.
  // We keep a tiny fallback list for robustness.
  const direct = headers.get(name)
  if (direct) return direct
  const lower = name.toLowerCase()
  if (lower !== name) {
    const v = headers.get(lower)
    if (v) return v
  }
  return null
}

export const getAutlifyAgencyHeader = (headers: Headers): string | null =>
  getHeaderValue(headers, AUTLIFY_HEADER_AGENCY_ID) ||
  getHeaderValue(headers, AUTLIFY_HEADER_AGENCY_ID_LEGACY)

export const getAutlifySubAccountHeader = (headers: Headers): string | null =>
  getHeaderValue(headers, AUTLIFY_HEADER_SUBACCOUNT_ID) ||
  getHeaderValue(headers, AUTLIFY_HEADER_SUBACCOUNT_ID_LEGACY)

export const getAutlifyApiKeyHeader = (headers: Headers): string | null =>
  getHeaderValue(headers, AUTLIFY_HEADER_API_KEY)

export const getAutlifyScopeKeyHeader = (headers: Headers): string | null =>
  getHeaderValue(headers, AUTLIFY_HEADER_SCOPE_KEY)
