/**
 * Autlify Middleware Proxy
 *
 * Request flow (in order):
 * 1. Static assets & API routes → pass through
 * 2. Subdomain routing → rewrite to funnel pages (public)
 * 3. Legacy redirects → redirect old auth routes
 * 4. Site/home routing → rewrite root to /site
 * 5. Protected routes → require authentication
 * 6. Context tracking → set last-visited context cookie
 */

import { getToken } from 'next-auth/jwt'
import { NextRequest, NextResponse } from 'next/server'
import {
  AUTLIFY_CONTEXT_COOKIE,
  AUTLIFY_CONTEXT_COOKIE_MAX_AGE_SECONDS,
  getLegacyCookieNames,
  deriveAutlifyScope,
  injectAutlifyScopeHeaders,
} from '@/lib/core/proxy/scope'

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const AUTH_PAGES = ['/agency/sign-in', '/agency/sign-up', '/agency/verify', '/agency/password']

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Check if path is a static asset or Next.js internal */
const isStaticAsset = (pathname: string) =>
  pathname.startsWith('/_next') ||
  pathname.startsWith('/static/') ||
  pathname.startsWith('/public/') ||
  pathname === '/favicon.ico' ||
  pathname.includes('.')

/** Extract hostname without port */
const getHostWithoutPort = (host: string | null) =>
  host ? host.split(':')[0] : ''

/** Build path with query string */
const buildPathWithSearch = (pathname: string, searchParams: URLSearchParams) => {
  const search = searchParams.toString()
  return `${pathname}${search ? `?${search}` : ''}`
}

/** Add x-pathname header to response */
const withPathname = (res: NextResponse, pathname: string) => {
  res.headers.set('x-pathname', pathname)
  return res
}

/** Persist last-active tenant scopeKey cookie. */
const setContextCookie = (res: NextResponse, scopeKey: string) => {
  res.cookies.set(AUTLIFY_CONTEXT_COOKIE, scopeKey, {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: AUTLIFY_CONTEXT_COOKIE_MAX_AGE_SECONDS,
  })
}

/** Clear legacy cookies during migration */
const clearLegacyCookies = (res: NextResponse) => {
  for (const name of getLegacyCookieNames()) {
    res.cookies.delete(name)
  }
}

/** Check if route requires authentication */
const isProtectedRoute = (pathname: string) =>
  (pathname.startsWith('/agency/') && pathname !== '/agency') ||
  pathname.startsWith('/subaccount')

/** Check if route is an auth page (sign-in, sign-up, verify) */
const isAuthPage = (pathname: string) =>
  AUTH_PAGES.some((page) => pathname.startsWith(page))

// ─────────────────────────────────────────────────────────────────────────────
// Main Middleware
// ─────────────────────────────────────────────────────────────────────────────

export default async function proxy(req: NextRequest) {
  const url = req.nextUrl
  const pathname = url.pathname
  const host = getHostWithoutPort(req.headers.get('host'))
  const rootDomain = getHostWithoutPort(process.env.NEXT_PUBLIC_DOMAIN ?? '')

  // ─────────────────────────────────────────────────────────────────────────
  // 1. Static Assets & API Routes → Pass through immediately
  // ─────────────────────────────────────────────────────────────────────────
  if (isStaticAsset(pathname)) {
    return withPathname(NextResponse.next(), pathname)
  }

  // Build request headers for downstream Server Components/Route Handlers.
  // NOTE: Must not perform DB queries in proxy.
  const requestHeaders = new Headers(req.headers)
  requestHeaders.set('x-pathname', pathname)

  const scope = deriveAutlifyScope({
    pathname,
    searchParams: url.searchParams,
    headers: req.headers,
    cookieValue: req.cookies.get(AUTLIFY_CONTEXT_COOKIE)?.value ?? null,
  })

  // Always inject scope headers when derivable; do not override existing ones.
  injectAutlifyScopeHeaders(requestHeaders, scope)

  // Prepare a default "next" response with request header overrides.
  const nextRes = () => NextResponse.next({ request: { headers: requestHeaders } })

  // API/TRPC routes should never be rewritten via subdomain routing.
  // Still inject scope headers so route handlers can resolve context without extra work.
  if (pathname.startsWith('/api') || pathname.startsWith('/trpc')) {
    return withPathname(nextRes(), pathname)
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 2. Subdomain Routing → Rewrite to funnel pages (public, no auth needed)
  //    Example: test.localhost:3000/checkout → /test./checkout
  //    The trailing dot is preserved for [domain]/page.tsx to slice off
  // ─────────────────────────────────────────────────────────────────────────
  if (rootDomain && host.endsWith(rootDomain) && host !== rootDomain) {
    const subdomain = host.replace(rootDomain, '') // "test." (keeps trailing dot)
    if (subdomain && subdomain !== 'www.' && subdomain !== 'www') {
      const targetPath = `/${subdomain}${buildPathWithSearch(pathname, url.searchParams)}`
      return withPathname(
        NextResponse.rewrite(new URL(targetPath, req.url), {
          request: { headers: requestHeaders },
        }),
        pathname
      )
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 3. Legacy Redirects → Redirect old auth routes to new ones
  // ─────────────────────────────────────────────────────────────────────────
  if (pathname === '/sign-in' || pathname === '/sign-up') {
    return withPathname(NextResponse.redirect(new URL('/agency/sign-in', req.url)), pathname)
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 4. Site/Home Routing → Rewrite root to /site
  // ─────────────────────────────────────────────────────────────────────────
  if (pathname === '/' || (pathname === '/site' && host === rootDomain)) {
    return withPathname(
      NextResponse.rewrite(new URL('/site', req.url), {
        request: { headers: requestHeaders },
      }),
      pathname
    )
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 5. Protected Routes → Require authentication
  // ─────────────────────────────────────────────────────────────────────────
  if (isProtectedRoute(pathname) && !isAuthPage(pathname)) {
    let token: any = null
    try {
      token = await getToken({ req, secret: process.env.AUTH_SECRET })
    } catch {
      token = null
    }
    const isLoggedIn = !!token

    if (!isLoggedIn) {
      return withPathname(NextResponse.redirect(new URL('/agency/sign-in', req.url)), pathname)
    }

    // Redirect unverified users to verification page (best-effort, based on JWT claims).
    const alreadyVerified = url.searchParams.get('verified') === 'true'
    const email = typeof token?.email === 'string' ? token.email : undefined
    const emailVerified = (token as any)?.emailVerified
    const isVerified = !!emailVerified

    if (email && !isVerified && !alreadyVerified) {
      const verifyUrl = `/agency/verify?email=${encodeURIComponent(email)}`
      return withPathname(NextResponse.redirect(new URL(verifyUrl, req.url)), pathname)
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 6. Context Tracking → Persist "last active scope" cookie
  // ─────────────────────────────────────────────────────────────────────────
  // Only persist when scope is derived from the URL path (navigation-safe).
  if (scope?.source === 'pathname') {
    const res = nextRes()
    setContextCookie(res, scope.scopeKey)
    clearLegacyCookies(res)
    return withPathname(res, pathname)
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 7. Default → Pass through
  // ─────────────────────────────────────────────────────────────────────────
  return withPathname(nextRes(), pathname)
}

// ─────────────────────────────────────────────────────────────────────────────
// Middleware Config
// ─────────────────────────────────────────────────────────────────────────────

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
}
