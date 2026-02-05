'use client'

import { useState, useEffect } from 'react'
import { signIn, useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, CheckCircle2 } from 'lucide-react'
import Image from 'next/image'
import { Tooltip } from '@/components/ui/tooltip'
import { PasskeyButton } from '@/components/auth/passkey-button'
import { TermsAgreement } from '@/components/auth/terms-agreement'
export default function SignInPage() {
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

  useEffect(() => {
    if (session?.user?.id) {
      router.push(redirectPath)
      router.refresh()
    }
  }, [session, redirectPath, router])


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
            router.push(`/agency/verify?email`)
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

  const handleOAuthSignIn = async (provider: 'github' | 'azure-ad') => {
    setIsLoading(true)
    setError('')

    try {
      await signIn(provider, { callbackUrl })
    } catch (error) {
      setError(`Failed to sign in with ${provider}`)
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
                required
                disabled={isLoading}
              />

            </div>
            <div className="flex justify-end -mt-4">
              <Button variant="link" size="sm" className="text-sm" asChild>
                <Link href="/agency/password?scope=reset-request">Forgot password?</Link>
              </Button>
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
          <div className="mx-auto grid w-full grid-cols-4 gap-4 items-center justify-center">
            <Button
              variant="outline"
              onClick={() => handleOAuthSignIn('github')}
              disabled={isLoading}
              aria-label="Sign up with GitHub"
              className="h-12 p-2"
              tooltip="Sign in with GitHub"
            >
              <span className="relative h-8 w-8">
                <Image
                  src="/logos/github.svg"
                  alt="GitHub"
                  fill
                  sizes="24px"
                  className="object-contain brightness-0 invert"
                />
              </span>
            </Button>
            <Button
              variant="outline"
              onClick={() => handleOAuthSignIn('azure-ad')}
              disabled={isLoading}
              aria-label="Sign up with Microsoft"
              className="h-12 p-2"
              tooltip="Sign in with Microsoft"
            >
              <span className="relative h-8 w-8 ">
                <Image
                  src="/logos/microsoft.svg"
                  alt="Microsoft"
                  fill
                  sizes="24px"
                  className="object-contain"
                />
              </span>
            </Button>
            <Button
              variant="outline"
              disabled={isLoading}
              aria-label="Sign up with Google"
              className="h-12 p-2"
              tooltip="Sign in with Google"
            >
              <span className="relative h-8 w-8">
                <svg className="absolute inset-0 h-8 w-8" viewBox="0 0 533.5 544.3" xmlns="http://www.w3.org/2000/svg">
                  <path fill="#4285f4" d="M533.5 278.4c0-17.4-1.4-34.1-4.2-50.4H272v95.5h147.1c-6.4 34.7-25.4 64.1-54.3 83.8v69.7h87.7c51.3-47.2 81-116.7 81-198.6z" />
                  <path fill="#34a853" d="M272 544.3c73.4 0 135-24.3 180-66l-87.7-69.7c-24.3 16.3-55.5 26-92.3 26-70.9 0-131-47.9-152.4-112.2H29.6v70.6c46.2 91.7 141.1 151.3 242.4 151.3z" />
                  <path fill="#fbbc04" d="M119.6 324.4c-11.4-34.7-11.4-72.4 0-107.1V146.7H29.6c-39.2 77.9-39.2 169.1 0 247l90-69.3z" />
                  <path fill="#ea4335" d="M272 107.7c39.9-.6 78.3 14.5 107.4 41.7l80.5-80.5C407 24.6 344.4-.4 272 0 170.7 0 75.8 59.6 29.6 151.3l90 70.6C141 155.6 201.1 107.7 272 107.7z" />
                </svg>
              </span>
            </Button>

            <PasskeyButton
              email={email}
              variant="icon-signin"
              onSuccess={(result) => {
                // NextAuth's Passkey provider handles session creation automatically
                router.push(callbackUrl)
                router.refresh()
              }}
              onError={(err) => setError(err)}
              disabled={isLoading}
              className="h-12 p-2 p-0"
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
