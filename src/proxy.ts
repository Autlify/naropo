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

import { auth } from '@/auth'
import { NextResponse } from 'next/server'
import { NextRequest } from 'next/server'
import { logger } from '@/lib/logger'

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const CONTEXT_COOKIE = 'autlify.context-token'
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 60 // 60 days

const AUTH_PAGES = ['/agency/sign-in', '/agency/sign-up', '/agency/verify']
const NON_CONTEXT_SLUGS = ['sign-in', 'sign-up', 'verify', 'api']

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

/** Set context tracking cookie */
const setContextCookie = (res: NextResponse, ctx: string) => {
  res.cookies.set(CONTEXT_COOKIE, ctx, {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: COOKIE_MAX_AGE_SECONDS,
  })
}

/** Extract and set context cookie based on pathname */
const setContextFromPath = (req: NextRequest, res: NextResponse) => {
  const pathname = req.nextUrl.pathname

  // Agency context: /agency/[agencyId]/...
  const agencyMatch = pathname.match(/^\/agency\/([^/]+)(?:\/|$)/)
  if (agencyMatch?.[1] && !NON_CONTEXT_SLUGS.includes(agencyMatch[1])) {
    setContextCookie(res, `agency:${agencyMatch[1]}`)
    return
  }

  // Subaccount context: /subaccount/[subAccountId]/...
  const subMatch = pathname.match(/^\/subaccount\/([^/]+)(?:\/|$)/)
  if (subMatch?.[1]) {
    setContextCookie(res, `subaccount:${subMatch[1]}`)
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

  if (pathname.startsWith('/api')) {
    return withPathname(NextResponse.next(), pathname)
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
      return withPathname(NextResponse.rewrite(new URL(targetPath, req.url)), pathname)
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
    return withPathname(NextResponse.rewrite(new URL('/site', req.url)), pathname)
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 5. Protected Routes → Require authentication
  // ─────────────────────────────────────────────────────────────────────────
  const session = await auth()
  const isLoggedIn = !!session

  if (isProtectedRoute(pathname) && !isLoggedIn && !isAuthPage(pathname)) {
    return withPathname(NextResponse.redirect(new URL('/agency/sign-in', req.url)), pathname)
  }

  // Redirect unverified users to verification page
  if (isLoggedIn && isProtectedRoute(pathname) && !isAuthPage(pathname)) {
    const user = session?.user as { email?: string; emailVerified?: Date | null }
    const alreadyVerified = url.searchParams.get('verified') === 'true'

    if (user?.email && !user.emailVerified && !alreadyVerified) {
      const verifyUrl = `/agency/verify?email=${encodeURIComponent(user.email)}`
      return withPathname(NextResponse.redirect(new URL(verifyUrl, req.url)), pathname)
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 6. Context Tracking → Set last-visited context cookie
  // ─────────────────────────────────────────────────────────────────────────
  if (pathname.startsWith('/agency') || pathname.startsWith('/subaccount')) {
    const targetPath = buildPathWithSearch(pathname, url.searchParams)
    const res = NextResponse.rewrite(new URL(targetPath, req.url))
    setContextFromPath(req, res)
    return withPathname(res, pathname)
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 7. Default → Pass through
  // ─────────────────────────────────────────────────────────────────────────
  return withPathname(NextResponse.next(), pathname)
}

// ─────────────────────────────────────────────────────────────────────────────
// Middleware Config
// ─────────────────────────────────────────────────────────────────────────────

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
}
