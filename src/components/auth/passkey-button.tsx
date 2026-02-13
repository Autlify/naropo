'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Fingerprint } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useRouter } from 'next/navigation'
import { startRegistration, startAuthentication } from '@simplewebauthn/browser'
import type {
    PublicKeyCredentialCreationOptionsJSON,
    PublicKeyCredentialRequestOptionsJSON
} from '@simplewebauthn/types'
import { cn } from '@/lib/utils'

interface PasskeyButtonProps {
    email: string
    variant?: 'signin' | 'signup' | 'icon-signup' | 'icon-signin'
    buttonText?: string
    tooltip?: string
    onSuccess?: (result: any) => void
    onError?: (error: string) => void
    disabled?: boolean
    className?: string
}

export function PasskeyButton({
    email,
    variant = 'signup',
    onSuccess,
    onError,
    disabled = false,
    className,
    tooltip,
    buttonText
}: PasskeyButtonProps) {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState('')
    const [buttonTextState, setButtonTextState] = useState('')

    useEffect(() => {
        if (buttonText) {
            setButtonTextState(buttonText)
        } else if (variant === 'icon-signup' || variant === 'icon-signin') {
            setButtonTextState('')
        } else if (variant === 'signup') {
            setButtonTextState('Sign up with Passkey')
        } else {
            setButtonTextState('Sign in with Passkey')
        }
    }, [variant, buttonText])

    const handlePasskeySignup = async () => {
        try {
            // 1. Initiate passkey registration
            const optionsRes = await fetch('/api/auth/passkey', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    mode: 'register',
                    email,
                    userName: email.split('@')[0]
                }),
            })

            if (!optionsRes.ok) {
                const error = await optionsRes.json()
                console.log('Error response from passkey endpoint:', error)
                throw new Error(error.error || 'Failed to get registration options')
            }

            const { options, token } = await optionsRes.json()

            // 2. Start WebAuthn registration
            const credential = await startRegistration(options)

            // 3. Confirm registration with server
            const confirmRes = await fetch('/api/auth/passkey/confirm', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    mode: 'register',
                    email,
                    token,
                    credential,
                    deviceName: 'Browser Passkey'
                }),
            })

            if (!confirmRes.ok) {
                const error = await confirmRes.json()
                throw new Error(error.error || 'Failed to verify registration')
            }

            const { success } = await confirmRes.json()

            if (success) {
                onSuccess?.({ ok: true })
            }
        } catch (err: any) {
            let errorMsg = err.message || 'Passkey registration failed'
            if (err.name === 'NotAllowedError') {
                errorMsg = 'Passkey registration was cancelled or not allowed'
            }
            throw new Error(errorMsg)
        }
    }

    const handlePasskeySignin = async () => {
        try {
            // 1. Initiate passkey authentication (usernameless if no email)
            const optionsRes = await fetch('/api/auth/passkey', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    mode: 'signin',
                    email: email || undefined, // Optional for discoverable credentials
                    usernameless: !email // Flag for usernameless authentication
                })
            })

            if (!optionsRes.ok) {
                const error = await optionsRes.json()
                throw new Error(error.error || 'Failed to get authentication options')
            }

            const { options } = await optionsRes.json()

            // 2. Start WebAuthn authentication
            const credential = await startAuthentication(options)

            // 3. Confirm authentication with server
            const confirmRes = await fetch('/api/auth/passkey/confirm', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    mode: 'signin',
                    email,
                    credential
                }),
            })

            if (!confirmRes.ok) {
                const error = await confirmRes.json()
                throw new Error(error.error || 'Failed to verify authentication')
            }

            const { success } = await confirmRes.json()

            if (success) {
                onSuccess?.({ ok: true })
            }
        } catch (err: any) {
            let errorMsg = err.message || 'Passkey signin failed'
            if (err.name === 'NotAllowedError') {
                errorMsg = 'Passkey signin was cancelled or not allowed'
            }
            throw new Error(errorMsg)
        }
    }

    const handlePasskey = async () => {
        // For signup, email is still required to create account
        if (variant === 'signup' && !email) {
            setError('Please enter your email first')
            return
        }

        // For signin with discoverable credentials, email is optional
        // The passkey itself contains the user identifier

        setIsLoading(true)
        setError('')

        try {
            if (variant === 'signup') {
                await handlePasskeySignup()
            } else {
                await handlePasskeySignin()
            }
        } catch (err: any) {
            const errorMsg = err.message || `An error occurred with ${variant === 'signup' ? 'passkey registration' : 'passkey signin'}`
            // If parent manages error state (common on auth pages), don't double-render alerts.
            if (onError) onError(errorMsg)
            else setError(errorMsg)
        } finally {
            setIsLoading(false)
        }
    }

    const isIconOnly = variant === 'icon-signup' || variant === 'icon-signin'

    return (
        <div className="space-y-2">
            <Button
                type="button"
                variant="outline"
                className={cn(
                    'w-full justify-start gap-2',
                    isIconOnly && 'justify-center',
                    isLoading && 'opacity-70',
                    className
                )}
                onClick={handlePasskey}
                disabled={isLoading || disabled || (variant === 'signup' && !email)}
                tooltip={tooltip || (buttonTextState || 'Continue with Passkey')}
                aria-label={buttonTextState || 'Continue with Passkey'}
            >
                <Fingerprint className="h-4 w-4" />
                {!isIconOnly && <span className="truncate">{buttonTextState}</span>}
            </Button>

            {error && !onError && (
                <Alert className="border-destructive/30 bg-destructive/10">
                    <AlertDescription className="text-destructive-foreground">{error}</AlertDescription>
                </Alert>
            )}
        </div>
    )
}