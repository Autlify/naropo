import 'server-only'

import { headers as nextHeaders } from 'next/headers'

type HeaderLike = Headers | Record<string, string | string[] | undefined>

function getHeader(h: HeaderLike, key: string): string | null {
  const k = key.toLowerCase()
  if (typeof Headers !== 'undefined' && h instanceof Headers) {
    return h.get(key)
  }
  for (const [hk, hv] of Object.entries(h)) {
    if (hk.toLowerCase() !== k) continue
    if (Array.isArray(hv)) return hv[0] ?? null
    return hv ?? null
  }
  return null
}

function inferOriginFromHeaders(h: HeaderLike): string | null {
  const proto = getHeader(h, 'x-forwarded-proto') || 'https'
  const host = getHeader(h, 'x-forwarded-host') || getHeader(h, 'host')
  if (!host) return null
  return `${proto}://${host}`
}

/**
 * Best-effort origin resolution for server-side contexts.
 *
 * Order:
 * 1) forwarded headers (Netlify/Vercel/Reverse proxies)
 * 2) deployment env vars
 * 3) NEXT_PUBLIC_APP_ORIGIN (optional override)
 */
export function getAppOrigin(opts?: { headers?: HeaderLike }): string {
  try {
    const h = opts?.headers ?? nextHeaders() 
    const inferred = inferOriginFromHeaders(h as HeaderLike)
    if (inferred) return inferred
  } catch {
    // ignore (called outside request scope)
  }

  // Platform envs
  if (process.env.URL) return process.env.URL
  if (process.env.DEPLOY_PRIME_URL) return process.env.DEPLOY_PRIME_URL
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`

  // Explicit override
  if (process.env.NEXT_PUBLIC_APP_ORIGIN) return process.env.NEXT_PUBLIC_APP_ORIGIN

  return 'http://localhost:3000'
}

const FIRST_PARTY_DOMAIN = process.env.FIRST_PARTY_DOMAIN || 'naropo.com'
const FIRST_PARTY_PUBLIC_API = process.env.PUBLIC_API_ORIGIN || 'https://api.naropo.com'

export function getPublicApiOrigin(opts?: { headers?: HeaderLike }): string {
  const appOrigin = getAppOrigin(opts)
  const host = new URL(appOrigin).hostname

  // If we're on the first-party domain, route to the public API subdomain.
  if (host === FIRST_PARTY_DOMAIN || host.endsWith(`.${FIRST_PARTY_DOMAIN}`)) {
    return FIRST_PARTY_PUBLIC_API
  }

  // For previews/local: keep same origin (or override via PUBLIC_API_ORIGIN).
  return FIRST_PARTY_PUBLIC_API || appOrigin
}

export function getAuthOrigin(opts?: { headers?: HeaderLike }): string {
  // Most deployments serve auth on the same app origin.
  return process.env.AUTH_ORIGIN || getAppOrigin(opts)
}
