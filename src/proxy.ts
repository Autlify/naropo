// src/proxy.ts (or wherever you keep it)
import { auth } from './auth'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const CONTEXT_COOKIE = 'app.last_context.v1'
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 60 // 60 days

const isAssetOrNext = (pathname: string) =>
  pathname.startsWith('/_next') || pathname.includes('.')

const getHostWithoutPort = (host: string | null) => (host ? host.split(':')[0] : '')

const setLastContextCookie = (res: NextResponse, ctx: string) => {
  res.cookies.set(CONTEXT_COOKIE, ctx, {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: COOKIE_MAX_AGE_SECONDS,
  })
}

const maybeSetContextCookie = (req: NextRequest, res: NextResponse) => {
  const pathname = req.nextUrl.pathname

  // /agency/[agencyId]/...
  const agencyMatch = pathname.match(/^\/agency\/([^/]+)(?:\/|$)/)
  if (agencyMatch?.[1]) {
    const agencyId = agencyMatch[1]
    // ignore non-context slugs under /agency
    if (!['sign-in', 'sign-up', 'verify', 'api'].includes(agencyId)) {
      setLastContextCookie(res, `agency:${agencyId}`)
      return
    }
  }

  // /subaccount/[subAccountId]/...
  const subMatch = pathname.match(/^\/subaccount\/([^/]+)(?:\/|$)/)
  if (subMatch?.[1]) {
    const subAccountId = subMatch[1]
    // ignore root /subaccount page if you have it
    if (subAccountId !== '') {
      setLastContextCookie(res, `subaccount:${subAccountId}`)
    }
  }
}

export default auth((req) => {
  const url = req.nextUrl
  const pathname = url.pathname
  const isLoggedIn = !!req.auth

  // Let static assets through
  if (isAssetOrNext(pathname)) return NextResponse.next()

  // Allow auth + uploadthing (and generally API) routes through
  if (pathname.startsWith('/api')) return NextResponse.next()

  // Redirect legacy auth routes
  if (pathname === '/sign-in' || pathname === '/sign-up') {
    return NextResponse.redirect(new URL('/agency/sign-in', req.url))
  }

  // Root/site rewrite
  const host = getHostWithoutPort(req.headers.get('host'))
  const rootDomain = process.env.NEXT_PUBLIC_DOMAIN ?? ''

  if (pathname === '/' || (pathname === '/site' && rootDomain && host === rootDomain)) {
    return NextResponse.rewrite(new URL('/site', req.url))
  }

  // Subdomain rewrite: <tenant>.<domain> -> /<tenant>/...
  if (rootDomain && host.endsWith(rootDomain) && host !== rootDomain) {
    const sub = host.replace(`.${rootDomain}`, '')
    if (sub && sub !== 'www') {
      const search = url.searchParams.toString()
      const withSearch = `${pathname}${search ? `?${search}` : ''}`
      return NextResponse.rewrite(new URL(`/${sub}${withSearch}`, req.url))
    }
  }

  // Protected routes require authentication
  const isProtected =
    pathname.startsWith('/agency') || pathname.startsWith('/subaccount')

  const isAuthPage =
    pathname.startsWith('/agency/sign-in') ||
    pathname.startsWith('/agency/sign-up') ||
    pathname.startsWith('/agency/verify')

  if (isProtected && !isLoggedIn && !isAuthPage) {
    return NextResponse.redirect(new URL('/agency/sign-in', req.url))
  }

  // Redirect unverified (credential) users to verify page
  if (isLoggedIn && isProtected && !isAuthPage) {
    const user = req.auth?.user as any
    const verified = url.searchParams.get('verified')

    if (user && verified !== 'true' && !user.emailVerified) {
      return NextResponse.redirect(
        new URL(`/agency/verify?email=${encodeURIComponent(user.email)}`, req.url)
      )
    }
  }

  // IMPORTANT: set last-context cookie when entering an agency/subaccount context
  if (pathname.startsWith('/agency') || pathname.startsWith('/subaccount')) {
    const search = url.searchParams.toString()
    const withSearch = `${pathname}${search ? `?${search}` : ''}`
    const res = NextResponse.rewrite(new URL(withSearch, req.url))
    maybeSetContextCookie(req as unknown as NextRequest, res)
    return res
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
}
