'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2 } from 'lucide-react'
import Image from 'next/image'
import { signIn, getProviders } from 'next-auth/react'
import { PasskeyButton } from '@/components/auth/passkey-button'
import { TermsAgreement } from '@/components/auth/terms-agreement'
import { OAuthProviderButtons } from '@/components/auth/oauth-provider-buttons'

export default function SignUpPage() {
  const router = useRouter()

  const [name, setName] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [termsAgreed, setTermsAgreed] = useState(false)
  const [usePasskeyOnly, setUsePasskeyOnly] = useState(false)
  const [disabled, setDisabled] = useState(false)
  const [availableProviders, setAvailableProviders] = useState<Record<string, any> | null>(null)

  useEffect(() => {
    setName(`${firstName} ${lastName}`)
  }, [firstName, lastName])

  useEffect(() => {
    // Load configured OAuth providers so we don't show buttons that will fail in production.
    getProviders()
      .then((p) => setAvailableProviders(p ?? null))
      .catch(() => setAvailableProviders(null))
  }, [])
 
  useEffect(() => {
    if (!email || !firstName || !lastName || !password || !confirmPassword || !termsAgreed) {
      setDisabled(true)
    } else {
      setDisabled(false)
    }
  }, [email, firstName, lastName, password, confirmPassword, termsAgreed])

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    if (!termsAgreed) {
      setError('You must agree to the terms of service')
      setIsLoading(false)
      return
    }

    if (!usePasskeyOnly) {
      if (password !== confirmPassword) {
        setError('Passwords do not match')
        setIsLoading(false)
        return
      }

      if (password.length < 6) {
        setError('Password must be at least 6 characters')
        setIsLoading(false)
        return
      }
    }

    try {
      // Create account (works for both passkey and password auth)
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName,
          lastName,
          name,
          email,
          password: usePasskeyOnly ? null : password,
          termsAgreed
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create account')
      }

      if (usePasskeyOnly) {
        // Skip email verification for passkey-only accounts
        router.push(`/agency/sign-in?email=${encodeURIComponent(email)}`)
      } else {
        // Redirect to verify page for password accounts
        router.push(`/agency/verify?email=${encodeURIComponent(email)}`)
      }
      router.refresh()
    } catch (error: any) {
      setError(error.message || 'An error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleOAuthSignIn = async (providerId: string) => {
    setIsLoading(true)
    setError('')

    try {
      await signIn(providerId, { callbackUrl: '/agency' })
    } catch (error) {
      setError(`Failed to sign in with ${providerId}`)
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full flex min-h-screen items-center justify-center p-4">
         <Card className="max-w-[380px]">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <Image src="/assets/autlify-logo.svg" alt="Autlify Logo" width={48} height={48} />
            <CardTitle className="text-center ml-2 text-2xl font-bold">Create an account</CardTitle>
      
          </div>

          <CardDescription className="text-center">
            Enter your information to get started
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSignUp} className="space-y-4" autoComplete="on">
            <div className="grid md:grid-cols-2 space-y-2 md:space-y-0 md:gap-4">
              <div>
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  type="text"
                  name="firstName"
                  autoComplete="given-name"
                  placeholder="John"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
              <div>
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  type="text"
                  name="lastName"
                  autoComplete="family-name"
                  placeholder="Doe"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                name="email"
                autoComplete="email"
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
                autoComplete="new-password"
                placeholder="Create a password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required={!usePasskeyOnly}
                disabled={isLoading || usePasskeyOnly}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                name="confirmPassword"
                autoComplete="new-password"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required={!usePasskeyOnly}
                disabled={isLoading || usePasskeyOnly}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading || !termsAgreed || disabled}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create account
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or sign up with
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <OAuthProviderButtons
              providers={availableProviders as any}
              disabled={isLoading || !termsAgreed}
              onSignIn={handleOAuthSignIn}
            />

            <PasskeyButton
              email={email}
              variant="signup"
              buttonText="Continue with Passkey"
              onSuccess={() => {
                router.push('/agency')
                router.refresh()
              }}
              onError={(err) => setError(err)}
              disabled={isLoading || !termsAgreed}
              className="h-11 rounded-xl justify-start px-3"
            />
          </div>

        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <TermsAgreement
            agreed={termsAgreed}
            onChange={setTermsAgreed}
            variant="signup"
          />
          <div className="text-sm text-center text-muted-foreground">
            Already have an account?{' '}
            <Link href="/agency/sign-in" className="text-primary hover:underline">
              Sign in
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
