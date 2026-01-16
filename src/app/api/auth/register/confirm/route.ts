import { NextResponse } from 'next/server'
import { validateVerificationToken } from '@/lib/queries'

/**
 * GET /api/auth/register/confirm?token=xxx
 * Verify email using token from email link
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.redirect(
        new URL('/agency/verify?error=missing-token', req.url)
      )
    }

    // Validate the verification token
    const result = await validateVerificationToken(token)

    if (!result.success) {
      // Handle different error types
      const errorParam = result.error || 'server-error'
      const emailParam = result.email ? `&email=${encodeURIComponent(result.email)}` : ''
      return NextResponse.redirect(
        new URL(`/agency/verify?error=${errorParam}${emailParam}`, req.url)
      )
    }

    // Successful verification - redirect to URL from result
    if (result.url) {
      return NextResponse.redirect(
        new URL(result.url, req.url)
      )
    }

    // Fallback redirect
    return NextResponse.redirect(
      new URL('/agency/verify?error=server-error', req.url)
    )
  } catch (error) {
    console.error('Email verification error:', error)
    return NextResponse.redirect(
      new URL('/agency/verify?error=server-error', req.url)
    )
  }
}
