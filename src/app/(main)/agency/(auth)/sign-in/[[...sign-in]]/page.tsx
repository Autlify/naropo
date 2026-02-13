'use client'

import { useState, useEffect } from 'react'
import { signIn, useSession, getProviders } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, CheckCircle2 } from 'lucide-react'
import Image from 'next/image'
import { PasskeyButton } from '@/components/auth/passkey-button'
import { TermsAgreement } from '@/components/auth/terms-agreement'
import { OAuthProviderButtons } from '@/components/auth/oauth-provider-buttons'
export default function SignInPage() {
  // NOTE: provider buttons are dynamically derived from getProviders()
  const router = useRouter()
  const { data: session } = useSession()
  const searchParams = useSearchParams()
  const redirectPath = searchParams?.get('redirect') || '/agency'
  const callbackUrl = searchParams?.get('callbackUrl') || redirectPath
  const verified = searchParams?.get('verified')
  const verifiedEmail = searchParams?.get('email')
  const urlError = searchParams?.get('error')
  const [email, setEmail] = useState(verifiedEmail || '')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [termsAgreed, setTermsAgreed] = useState(false)
  const [availableProviders, setAvailableProviders] = useState<Record<string, any> | null>(null)

  useEffect(() => {
    if (session?.user?.id) {
      router.push(redirectPath)
      router.refresh()
    }
  }, [session, redirectPath, router])

  useEffect(() => {
    // Dynamically load configured providers. This prevents showing OAuth buttons
    // for providers that are not configured in the deployment environment.
    getProviders()
      .then((p) => setAvailableProviders(p ?? null))
      .catch(() => setAvailableProviders(null))
  }, [])


  useEffect(() => {
    if (verified === 'true') {
      setSuccess('Email verified successfully! Please sign in to continue.')
    }
    if (urlError === 'invalid-token') {
      setError('Invalid or expired verification token. Please sign up again.')
    } else if (urlError === 'verification-failed') {
      setError('Email verification failed. Please try again.')
    }
  }, [verified, urlError])


  const handleCredentialsSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setSuccess('')

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        // Check if it's an email verification error
        if (result.error.includes('verify')) {
          setError('Your email is not verified. Redirecting to verification page...')
          setTimeout(() => {
            router.push(`/agency/verify?email=${encodeURIComponent(email)}`)
          }, 2000)
        } else {
          setError('Invalid email or password')
        }
      } else {
        router.push(callbackUrl)
        router.refresh()
      }
    } catch (error) {
      setError('An error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleOAuthSignIn = async (providerId: string) => {
    setIsLoading(true)
    setError('')

    try {
      await signIn(providerId, { callbackUrl })
    } catch (error) {
      setError(`Failed to sign in with ${providerId}`)
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full min-h-screen flex items-center justify-center">
      <Card className="max-w-[380px]">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <Image src="/assets/autlify-logo.svg" alt="Autlify Logo" width={40} height={40} />
            <span className="ml-2 text-2xl font-bold">Autlify</span>
          </div>
          <CardTitle className="text-2xl text-center">Welcome back</CardTitle>
          <CardDescription className="text-center">
            Sign in to your account to continue
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {success && (
            <Alert className="border-success/30 bg-success/10">
              <CheckCircle2 className="h-4 w-4 text-success" />
              <AlertDescription className="text-success-foreground">
                {success}
              </AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleCredentialsSignIn} className="space-y-4" autoComplete="on">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email username"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                name="password"
                autoComplete="current-password"
                placeholder="Your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
                    e.preventDefault()
                    e.currentTarget.form?.requestSubmit()
                  }
                }}
                required
                disabled={isLoading}
              />

            </div>
            <div className="flex justify-end -mt-4">
              <Link
                className="text-primary hover:underline text-xs font-normal pt-2 mr-1"
                href="/agency/password?scope=reset-request">
                Forgot password?
              </Link>

            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sign in
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>
          <div className="space-y-3">
            <OAuthProviderButtons
              providers={availableProviders as any}
              disabled={isLoading}
              onSignIn={handleOAuthSignIn}
            />

            <PasskeyButton
              email={email}
              variant="signin"
              buttonText="Continue with Passkey"
              onSuccess={() => {
                router.push(callbackUrl)
                router.refresh()
              }}
              onError={(err) => setError(err)}
              disabled={isLoading}
              className="h-11 rounded-xl justify-start px-3"
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <TermsAgreement
            agreed={termsAgreed}
            onChange={setTermsAgreed}
            variant="signin"
          />
          <div className="text-sm text-center text-muted-foreground">
            Don&apos;t have an account?{' '}
            <Link href="/agency/sign-up" className="text-primary hover:underline">
              Sign up
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
