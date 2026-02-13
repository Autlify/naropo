'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, CheckCircle2, XCircle, Mail } from 'lucide-react'
import Image from 'next/image'
import { useSession, signIn } from 'next-auth/react'
import { cn } from '@/lib/utils'
import { getVerificationToken } from '../../../../../lib/queries'

// Password reset scopes should not trigger redirect when authenticated
const RESET_SCOPES = ['reset-request', 'reset-password']

// Error messages for URL error params
const ERROR_MESSAGES: Record<string, string> = {
  'expired-token': 'Your verification link has expired. Please request a new one.',
  'invalid-token': 'Invalid verification link. Please request a new one.',
  'missing-token': 'Verification link is incomplete. Please request a new one.',
  'server-error': 'An error occurred. Please try again.',
}

const Page = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session, status } = useSession()
  
  // URL params
  const email = searchParams.get('email')
  const error = searchParams.get('error')
  const verified = searchParams.get('verified')
  const autoLoginToken = searchParams.get('token')
  const urlScope = searchParams.get('scope')

  // State
  const [isResending, setIsResending] = useState(false)
  const [isAutoLoggingIn, setIsAutoLoggingIn] = useState(false)
  const [resendMessage, setResendMessage] = useState('')
  const [resendError, setResendError] = useState('')
  const [cooldownSeconds, setCooldownSeconds] = useState(0)
  const autoLoginAttempted = useRef(false)

  // Derive if this is a password reset flow from URL scope
  const isResetFlow = urlScope ? RESET_SCOPES.includes(urlScope) : false

  // Set initial error from URL params
  useEffect(() => {
    if (error && ERROR_MESSAGES[error]) {
      setResendError(ERROR_MESSAGES[error])
    }
  }, [error])

  // Redirect if already verified and logged in (skip for password reset flows)
  useEffect(() => {
    if (!isResetFlow && status === 'authenticated' && session?.user?.emailVerified) {
      router.push('/agency')
    }
  }, [status, session?.user?.emailVerified, router, isResetFlow])

  // Auto-login after email verification
  useEffect(() => {
    if (verified !== 'true' || !autoLoginToken || !email || autoLoginAttempted.current) return
    
    const performAutoLogin = async () => {
      // First check if token is authN type
      const tokenData = await getVerificationToken(autoLoginToken)
      if (tokenData?.scope !== 'authN') return

      autoLoginAttempted.current = true
      setIsAutoLoggingIn(true)
      
      try {
        // Sign out first if there's an existing session to force fresh JWT
        if (session) {
          await fetch('/api/auth/signout', { method: 'POST' })
          await new Promise(resolve => setTimeout(resolve, 500))
        }

        const result = await signIn('credentials', {
          email,
          password: autoLoginToken,
          redirect: false,
        })

        if (result?.ok) {
          window.location.href = '/agency'
          return
        }
        setResendError('Verification successful! Please sign in to continue.')
      } catch {
        setResendError('Verification successful! Please sign in to continue.')
      } finally {
        setIsAutoLoggingIn(false)
      }
    }

    performAutoLogin()
  }, [verified, autoLoginToken, email, session])

  // Check cooldown on mount (only for email verification, not password reset)
  useEffect(() => {
    if (isResetFlow) return

    const emailToCheck = email || session?.user?.email
    if (!emailToCheck) return

    const checkCooldown = async () => {
      try {
        const response = await fetch(
          `/api/auth/token/verify?email=${encodeURIComponent(emailToCheck)}`
        )
        const data = await response.json()

        if (data.cooldownActive && data.remainingSeconds > 0) {
          setCooldownSeconds(data.remainingSeconds)
        }
      } catch (err) {
        console.error('Failed to check cooldown:', err)
      }
    }

    checkCooldown()
  }, [email, session?.user?.email, isResetFlow])

  // Cooldown timer
  useEffect(() => {
    if (cooldownSeconds <= 0) return

    const timer = setInterval(() => {
      setCooldownSeconds((prev) => Math.max(0, prev - 1))
    }, 1000)

    return () => clearInterval(timer)
  }, [cooldownSeconds])

  const handleResendEmail = useCallback(async () => {
    const emailToUse = email || session?.user?.email

    if (!emailToUse) {
      setResendError('Email address not found. Please sign up again.')
      return
    }

    setIsResending(true)
    setResendMessage('')
    setResendError('')

    try {
      const response = await fetch('/api/auth/token/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailToUse }),
      })

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 429) {
          setCooldownSeconds(data.remainingSeconds || 300)
          throw new Error(data.error || 'Please wait before requesting again.')
        }
        throw new Error(data.error || 'Failed to resend verification email')
      }

      setResendMessage(data.message || 'Verification email sent! Please check your inbox.')
      if (data.cooldownSeconds) {
        setCooldownSeconds(data.cooldownSeconds)
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to resend email. Please try again.'
      setResendError(message)
    } finally {
      setIsResending(false)
    }
  }, [email, session?.user?.email])

  // Derived state
  const isButtonDisabled = isResending || cooldownSeconds > 0

  // Auto-login loading state
  if (isAutoLoggingIn) {
    return (
      <div className="w-full flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="text-lg font-medium">Email verified! Signing you in...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="w-full flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <Image
              src="/assets/autlify-logo.svg"
              alt="Autlify Logo"
              width={40}
              height={40}
              style={{ height: 'auto' }}
            />
            <span className="ml-2 text-2xl font-bold">Autlify</span>
          </div>
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-primary/10 p-3">
              <Mail className="h-10 w-10 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl text-center">Verify Your Email</CardTitle>
          <CardDescription className="text-center">
            We've sent a verification link to your email address
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {email && (
            <div className="p-3 bg-muted rounded-lg text-center">
              <p className="text-sm font-medium">{email}</p>
            </div>
          )}

          {resendMessage && (
            <Alert className="border-success/30 bg-success/10">
              <CheckCircle2 className="h-4 w-4 text-success" />
              <AlertDescription className="text-success-foreground">
                {resendMessage}
              </AlertDescription>
            </Alert>
          )}

          {resendError && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>{resendError}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2 text-sm text-muted-foreground">
            <p>📧 Check your email inbox (and spam folder)</p>
            <p>🔗 Click the verification link in the email</p>
            <p>✅ You'll be automatically redirected once verified</p>
          </div>

          <Button
            onClick={handleResendEmail}
            variant="outline"
            className={cn(
              'w-full',
              !cooldownSeconds && 'cursor-pointer hover:bg-primary/10',
              cooldownSeconds > 0 && 'disabled:!pointer-events-auto disabled:!cursor-not-allowed'
            )}
            disabled={isButtonDisabled}
          >
            {isResending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {!isResending && cooldownSeconds > 0 && (
              <>
                Resend in {Math.floor(cooldownSeconds / 60)}m {cooldownSeconds % 60}s
              </>
            )}
            {!isResending && cooldownSeconds === 0 && 'Resend Verification Email'}
          </Button>
        </CardContent>

        <CardFooter className="flex flex-col space-y-4">
          <div className="text-sm text-center text-muted-foreground">
            Already verified?{' '}
            <Link href="/agency/sign-in" className="text-primary hover:underline">
              Sign in
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}

export default Page