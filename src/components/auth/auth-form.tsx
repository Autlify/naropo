'use client'

import { useState, useCallback, useTransition, use, useEffect } from 'react'
import { signIn, useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import {
  Loader2,
  Mail,
  Lock,
  User,
  ArrowLeft,
  ArrowRight,
  Fingerprint,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from 'lucide-react'
import { PasskeyButton } from '@/components/auth/passkey-button'
import { TermsAgreement } from '@/components/auth/terms-agreement'
import { checkUserAuthState, registerUser, requestPasswordReset, type AuthState } from './auth-form.actions'
import { Adapter, AdapterUser } from 'next-auth/adapters'
import { FieldValues, useForm } from 'react-hook-form'

// ============================================================================
// TYPES
// ============================================================================

type AuthMode = 'initial' | 'signIn' | 'signUp' | 'forgot' | 'reset' | 'verify'
type User = AdapterUser extends { id: infer U, password: infer P } ? U : never

interface AuthFormProps {
  /** Display mode: modal (compact) or page (full screen) */
  variant?: 'modal' | 'page'
  /** Callback URL after successful auth */
  callbackUrl?: string
  /** Pre-filled email (from verification link, etc.) */
  defaultEmail?: string
  /** Show success message */
  successMessage?: string
  /** Show error message */
  errorMessage?: string
  /** Custom class for container */
  className?: string
  /** Called when auth is successful */
  onSuccess?: () => void
  /** Called when modal should close */
  onClose?: () => void
  /** Token for password reset */
  resetToken?: string
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const AuthForm = ({
  variant = 'page',
  callbackUrl = '/agency',
  defaultEmail = '',
  successMessage,
  errorMessage,
  className,
  onSuccess,
  onClose,
  resetToken,
}: AuthFormProps) => {
  const router = useRouter()
  const adapter = {} as Adapter
  const [isPending, startTransition] = useTransition()

  // Form state
  const [mode, setMode] = useState<AuthMode>(resetToken ? 'reset' : 'initial')
  const [user, setUser] = useState<any | null>(null)
  const [email, setEmail] = useState(defaultEmail)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [termsAgreed, setTermsAgreed] = useState(false)
  const { data: session } = useSession()
  












  // Auth state from server
  const [authState, setAuthState] = useState<AuthState | null>(null)

  // UI state
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(errorMessage || '')
  const [success, setSuccess] = useState(successMessage || '')

  // ============================================================================
  // HANDLERS
  // ============================================================================




  // const handleSignIn = useCallback(async () => {
  //   if (!email || !password) {
  //     setError('Please enter your password')
  //     return
  //   }

  //   setIsLoading(true)
  //   setError('')

  //   try {
  //     const result = await signIn('credentials', {
  //       email,
  //       password,
  //       redirect: false,
  //     })

  //     if (result?.error) {
  //       if (result.error.includes('verify')) {
  //         setError('Please verify your email first')
  //         setMode('verify')
  //       } else {
  //         setError('Invalid email or password')
  //       }
  //     } else {
  //       setSuccess('Signed in successfully!')
  //       onSuccess?.()
  //       router.push(callbackUrl)
  //       router.refresh()
  //     }
  //   } catch (err) {
  //     setError('Sign in failed. Please try again.')
  //   } finally {
  //     setIsLoading(false)
  //   }
  // }, [email, password, callbackUrl, router, onSuccess])

  const handleCredentialsSignIn = async (e: React.FormEvent) => {

    e.preventDefault()
    setIsLoading(true)
    setError('')
    setSuccess('')

    switch (mode) {
      case 'initial':
        try {
          const result = await adapter.getUserByEmail?.(email) 

          if (!result) {
            setMode('signUp')
            setIsLoading(false)
          } else if (result && !result.emailVerified) {
            setMode('verify')
            setIsLoading(false)
          } else if (result) {
            setMode('signIn')
            setIsLoading(false)
          }
        } catch (error) {
          setError('An error occurred. Please try again.')
          setIsLoading(false)
        }

        break

      case 'signIn':
        try {
          const result = await signIn('credentials', {
            email: email,
            password: password,
            redirect: false,
          })
          if (result?.error) {
            // Check if it's an email verification error
            if (result.error.includes('verify')) {
              setError('Your email is not verified. Redirecting to verification page...')
              setTimeout(() => {
                setMode('verify')
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

        break

      case 'signUp':
        handleSignUp()
        break
      case 'forgot':
        handleForgotPassword()
        break
      case 'reset':
        handleResetPassword()
        break
      default:
        setIsLoading(false)
        break

    }
  }

  const handleSignUp = useCallback(async () => {

    if (!firstName || !lastName) {
      setError('Please enter your name')
      return
    }

    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (!termsAgreed) {
      setError('Please agree to the terms of service')
      return
    }

    setIsLoading(true)
    setError('')


    startTransition(async () => {
      try {

        const user = {
          email: email,
          firstName: firstName,
          lastName: lastName, 
        } as AdapterUser
        const newUser = await adapter.createUser?.(user)

        if (!newUser) {
          setError('Failed to create account')
        } else if (newUser) {
          setSuccess('Account created! Please check your email to verify.')
          setMode('verify')
        } else {
          onSuccess?.()
          router.push(callbackUrl)
          router.refresh()
        }
      } catch (err) {
        setError('Failed to create account. Please try again.')
      } finally {
        setIsLoading(false)
      }
    })
  }, [handleCredentialsSignIn, mode])

  const handleForgotPassword = useCallback(async () => {
    if (!email) {
      setError('Please enter your email')
      return
    }

    setIsLoading(true)
    setError('')

    startTransition(async () => {
      try {
        const result = await requestPasswordReset(email)
        if (result.success) {
          setSuccess('If an account exists, you will receive a reset email.')
        } else {
          setError(result.error || 'Failed to send reset email')
        }
      } catch (err) {
        setError('Failed to send reset email')
      } finally {
        setIsLoading(false)
      }
    })
  }, [email])

  const handleResetPassword = useCallback(async () => {
    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: resetToken, password: password }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to reset password')
      } else {
        setSuccess('Password reset successfully! You can now sign in.')
        setMode('initial')
        setPassword('')
        setConfirmPassword('')
      }
    } catch (err) {
      setError('Failed to reset password')
    } finally {
      setIsLoading(false)
    }
  }, [password, confirmPassword, resetToken])

  const handleOAuthSignIn = useCallback(async (provider: 'github' | 'azure-ad') => {
    setIsLoading(true)
    setError('')
    try {
      await signIn(provider, { callbackUrl })
    } catch (err) {
      setError(`Failed to sign in with ${provider}`)
      setIsLoading(false)
    }
  }, [callbackUrl])

  const handlePasskeySuccess = useCallback(() => {
    onSuccess?.()
    router.push(callbackUrl)
    router.refresh()
  }, [callbackUrl, router, onSuccess])

  // const goBack = useCallback(() => {
  //   setError('')
  //   setSuccess('')
  //   setPassword('')
  //   setConfirmPassword('')
  //   if (mode === 'forgot') {
  //     setMode('initial')
  //   } else {
  //     setMode('initial')
  //     setAuthState(null)
  //   }
  // }, [mode, authState, session])

  // ============================================================================
  // RENDER HELPERS
  // ============================================================================

  const isModal = variant === 'modal'

  const containerClasses = cn(
    'w-full',
    isModal
      ? 'max-w-md p-6'
      : 'min-h-screen flex items-center justify-center p-4',
    className
  )

  const cardClasses = cn(
    'relative overflow-hidden',
    'bg-gradient-to-br from-background via-background to-muted/30',
    'border border-border/50',
    'shadow-2xl shadow-primary/5',
    'rounded-2xl',
    isModal ? 'w-full' : 'w-full max-w-md'
  )

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className={containerClasses}>
      <div className={cardClasses}>
        {/* Decorative gradient orbs */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-secondary/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full" />
                <Image
                  src="/assets/autlify-logo.svg"
                  alt="Autlify"
                  width={48}
                  height={48}
                  className="relative"
                />
              </div>
              <span className="ml-3 text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                Autlify
              </span>
            </div>

            <h1 className="text-2xl font-semibold tracking-tight">
              {mode === 'initial' && 'Welcome'}
              {mode === 'signIn' && 'Welcome back'}
              {mode === 'signUp' && 'Create account'}
              {mode === 'forgot' && 'Reset password'}
              {mode === 'reset' && 'Set new password'}
              {mode === 'verify' && 'Check your email'}
            </h1>

            <p className="text-muted-foreground mt-2 text-sm">
              {mode === 'initial' && 'Sign in to your account or create a new one'}
              {mode === 'signIn' && `Signing in as ${email}`}
              {mode === 'signUp' && `Creating account for ${email}`}
              {mode === 'forgot' && 'We\'ll send you a reset link'}
              {mode === 'reset' && 'Enter your new password'}
              {mode === 'verify' && `Verification email sent to ${email}`}
            </p>
          </div>

          {/* Alerts */}
          {error && (
            <Alert variant="destructive" className="mb-6 animate-in fade-in slide-in-from-top-2">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="mb-6 border-success/30 bg-success/10 animate-in fade-in slide-in-from-top-2">
              <CheckCircle2 className="h-4 w-4 text-success" />
              <AlertDescription className="text-success-foreground">{success}</AlertDescription>
            </Alert>
          )}

          {/* Back button for sub-modes */}
          {mode !== 'initial' && mode !== 'reset' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="mb-4 -ml-2 text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
          )}

          {/* ================================================================ */}
          {/* INITIAL: Email input + OAuth/Passkey buttons */}
          {/* ================================================================ */}
      
          <form onSubmit={handleCredentialsSignIn} className="space-y-4">
            <div className="grid md:grid-cols-2 space-y-2 md:space-y-0 md:gap-4" hidden={firstName === undefined && lastName === undefined}>
              <div>
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  type="text"
                  name="firstName"
                  autoComplete="given-name"
                  placeholder="John"
                  value={firstName || ''}
                  onChange={(e) => setFirstName(e.target.value)}
                  required={mode === 'signUp'}
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
                  value={lastName || ''}
                  onChange={(e) => setLastName(e.target.value)}
                  required={mode === 'signUp'}
                  disabled={isLoading}
                />
              </div>
            </div>
            <div className="space-y-2" hidden={email === undefined}>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email username"
                placeholder="name@example.com"
                defaultValue={email}
                value={email || ''}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2" hidden={password === undefined}>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                name="password"
                autoComplete="current-password"
                placeholder="Your password"
                defaultValue={password}
                value={password || ''}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            <Button onClick={handleCredentialsSignIn} className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sign in {mode}
            </Button>

                 <div className="space-y-6">
              {/* OAuth Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  onClick={() => handleOAuthSignIn('github')}
                  disabled={isLoading}
                  className="h-12 bg-background/50 hover:bg-muted/50 border-border/50"
                >
                  <Image
                    src="/logos/github.svg"
                    alt="GitHub"
                    width={20}
                    height={20}
                    className="mr-2 dark:invert"
                  />
                  GitHub
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleOAuthSignIn('azure-ad')}
                  disabled={isLoading}
                  className="h-12 bg-background/50 hover:bg-muted/50 border-border/50"
                >
                  <Image
                    src="/logos/microsoft.svg"
                    alt="Microsoft"
                    width={20}
                    height={20}
                    className="mr-2"
                  />
                  Microsoft
                </Button>
              </div>

              {/* Passkey */}
              <PasskeyButton
                email={email}
                variant="signin"
                onSuccess={handlePasskeySuccess}
                onError={(err) => setError(err)}
                disabled={isLoading}
                className="w-full h-12 bg-background/50 hover:bg-muted/50 border-border/50"
              />
            </div>
          </form>


        </div>
      </div>
    </div >
  )
}

AuthForm.displayName = 'AuthForm'

export { AuthForm }