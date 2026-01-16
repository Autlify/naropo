'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, CheckCircle2, XCircle, Mail } from 'lucide-react'
import Image from 'next/image'
import { useSession, signIn } from 'next-auth/react'
import { cn } from '@/lib/utils'

export default function VerifyEmailPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session, status } = useSession()
  const email = searchParams.get('email')
  const error = searchParams.get('error')
  const verified = searchParams.get('verified')
  const autoLoginToken = searchParams.get('token')
  
  const [isResending, setIsResending] = useState(false)
  const [isAutoLoggingIn, setIsAutoLoggingIn] = useState(false)
  const [resendMessage, setResendMessage] = useState('')
  const [resendError, setResendError] = useState('')
  const [cooldownSeconds, setCooldownSeconds] = useState(0)
  const [isButtonDisabled, setIsButtonDisabled] = useState(false)
  const autoLoginAttempted = useRef(false)

  // Handle auto-login after verification
  useEffect(() => {
    if (verified === 'true' && autoLoginToken && email && !autoLoginAttempted.current) {
      autoLoginAttempted.current = true
      const performAutoLogin = async () => {
        setIsAutoLoggingIn(true)
        try {
          // Sign out first if there's an existing session to force fresh JWT
          if (session) {
            await fetch('/api/auth/signout', { method: 'POST' })
            await new Promise(resolve => setTimeout(resolve, 500))
          }
          
          // Use authN token directly as password
          const result = await signIn('credentials', {
            email,
            password: autoLoginToken, // authN token (hex format)
            redirect: false,
          })

          if (result?.ok) {
            // Force full page reload to get fresh session
            window.location.href = '/agency'
            return
          } else {
            setResendError('Verification successful! Please sign in to continue.')
          }
        } catch (error) {
          setResendError('Verification successful! Please sign in to continue.')
        } finally {
          setIsAutoLoggingIn(false)
        }
      }

      performAutoLogin()
    }
  }, [verified, autoLoginToken, email, session])

  // Redirect if already verified and logged in
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.emailVerified) {
      router.push('/agency')
    }
  }, [status, session, router])

  // Check cooldown status on mount
  useEffect(() => {
    const checkCooldown = async () => {
      const emailToCheck = email || session?.user?.email
      if (!emailToCheck) return

      try {
        const response = await fetch(
          `/api/auth/register/verify?email=${encodeURIComponent(emailToCheck)}`
        )
        const data = await response.json()
        
        if (data.cooldownActive && data.remainingSeconds > 0) {
          setCooldownSeconds(data.remainingSeconds)
          setIsButtonDisabled(true)
        }
      } catch (error) {
        console.error('Failed to check cooldown:', error)
      }
    }

    checkCooldown()
  }, [email, session?.user?.email])

  // Show error from URL params
  useEffect(() => {
    const errorMessages: Record<string, string> = {
      'expired-token': 'Your verification link has expired. Please request a new one.',
      'invalid-token': 'Invalid verification link. Please request a new one.',
      'missing-token': 'Verification link is incomplete. Please request a new one.',
      'server-error': 'An error occurred. Please try again.',
    }

    if (error && errorMessages[error]) {
      setResendError(errorMessages[error])
    }
  }, [error])

  // Cooldown timer
  useEffect(() => {
    if (cooldownSeconds > 0) {
      const timer = setInterval(() => {
        setCooldownSeconds((prev) => {
          if (prev <= 1) {
            setIsButtonDisabled(false)
            return 0
          }
          return prev - 1
        })
      }, 1000)

      return () => clearInterval(timer)
    }
  }, [cooldownSeconds])

  const handleResendEmail = async () => {
    setIsResending(true)
    setResendMessage('')
    setResendError('')

    const emailToUse = email || session?.user?.email

    if (!emailToUse) {
      setResendError('Email address not found. Please sign up again.')
      setIsResending(false)
      return
    }

    try {
      const response = await fetch('/api/auth/register/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailToUse }),
      })

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 429) {
          setCooldownSeconds(data.remainingSeconds || 300)
          setIsButtonDisabled(true)
          throw new Error(data.error || 'Please wait before requesting again.')
        }
        throw new Error(data.error || 'Failed to resend verification email')
      }

      setResendMessage(data.message || 'Verification email sent! Please check your inbox.')
      if (data.cooldownSeconds) {
        setCooldownSeconds(data.cooldownSeconds)
        setIsButtonDisabled(true)
      }
    } catch (error: any) {
      setResendError(error.message || 'Failed to resend email. Please try again.')
    } finally {
      setIsResending(false)
    }
  }

  // Show auto-login loading state
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
            <Alert className="border-emerald-500 bg-emerald-50 dark:bg-emerald-950">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <AlertDescription className="text-emerald-600 dark:text-emerald-400">
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
            className={cn(`w-full`,
              !cooldownSeconds && 'cursor-pointer hover:bg-primary/10',
              cooldownSeconds && 'disabled:!pointer-events-auto disabled:!cursor-not-allowed',
            )}

            disabled={isResending || isButtonDisabled}
          >
            {isResending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {!isResending && isButtonDisabled && cooldownSeconds > 0 && (
              <>Resend in {Math.floor(cooldownSeconds / 60)} minute{Math.floor(cooldownSeconds / 60) !== 1 ? 's' : ''} {cooldownSeconds % 60} second{cooldownSeconds % 60 !== 1 ? 's' : ''}</>
            )}
            {!isResending && !isButtonDisabled && 'Resend Verification Email'}
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
