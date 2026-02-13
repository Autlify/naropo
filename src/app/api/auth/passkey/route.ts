/**
 * @file src/app/api/auth/passkey/route.ts
 * @description Initiate passkey flow (signin OR register)
 * @method POST
 * @body { mode: 'signin' | 'register', email: string, userName?: string }
 * @response { token?: string, options: PublicKeyCredentialCreationOptions | PublicKeyCredentialRequestOptions }
 */

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { generateRegistrationOptions, generateAuthenticationOptions } from '@simplewebauthn/server'
import { createVerificationToken } from '@/lib/queries'
import type { 
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON 
} from '@simplewebauthn/types'

import { getAppOrigin } from '@/lib/core/runtime/origins'

/**
 * WebAuthn RP ID must be a domain (no scheme, no port).
 * Many developers set NEXT_PUBLIC_DOMAIN to "localhost:3000" which breaks passkeys.
 */
function resolveRpId(req: Request): string {
  const raw = process.env.NEXT_PUBLIC_DOMAIN?.trim()

  if (raw) {
    try {
      // allow "example.com", "example.com:3000", or full URLs
      const url = raw.includes('://') ? new URL(raw) : new URL(`https://${raw}`)
      return url.hostname
    } catch {
      // last resort: strip port
      return raw.split(':')[0] || 'localhost'
    }
  }

  // fallback: infer from current request origin
  try {
    const origin = getAppOrigin({ headers: req.headers as any })
    return new URL(origin).hostname || 'localhost'
  } catch {
    return 'localhost'
  }
}

export async function POST(req: Request) {
  try {
    const rpID = resolveRpId(req)
    const { mode, email, userName, usernameless } = await req.json()

    if (!mode) {
      return NextResponse.json(
        { error: 'Mode is required' },
        { status: 400 }
      )
    }

    // For registration, email is always required
    if (mode === 'register' && !email) {
      return NextResponse.json(
        { error: 'Email is required for registration' },
        { status: 400 }
      )
    }

    // For signin, email is optional if using discoverable credentials
    let user = null
    if (email) {
      user = await db.user.findUnique({
        where: { email },
        include: { Passkeys: true },
      })

      if (!user && mode === 'register') {
        return NextResponse.json(
          { error: 'User not found. Please sign up first.' },
          { status: 404 }
        )
      }
    }

    // REGISTER MODE: Generate registration options
    if (mode === 'register') {
      if (!userName) {
        return NextResponse.json(
          { error: 'userName is required for registration' },
          { status: 400 }
        )
      }

      const options: PublicKeyCredentialCreationOptionsJSON = await generateRegistrationOptions({
        rpID,
        rpName: 'Autlify',
        userName: email,
        userID: user!.id,
        userDisplayName: userName,
        attestationType: 'direct',
        authenticatorSelection: {
          authenticatorAttachment: undefined,
          residentKey: 'preferred',
          userVerification: 'preferred',
        },
        supportedAlgorithmIDs: [-7, -257],
        excludeCredentials: user!.Passkeys.map((pk) => ({
          id: Buffer.from(pk.credentialId, 'base64'),
          type: 'public-key' as const,
        })),
      })

      // Store challenge for verification (15 minutes)
      await db.verificationToken.create({
        data: {
          identifier: email,
          token: options.challenge,
          expires: new Date(Date.now() + 15 * 60 * 1000),
        },
      })

      return NextResponse.json(
        {
          mode: 'register',
          token: options.challenge,
          options,
        },
        { status: 201 }
      )
    }

    // SIGNIN MODE: Generate authentication options
    if (mode === 'signin') {
      // Usernameless flow (discoverable credentials) - let browser show available passkeys
      // OR email-specific flow - only allow specific user's passkeys
      const options: PublicKeyCredentialRequestOptionsJSON = await generateAuthenticationOptions({
        rpID,
        // Empty array = discoverable credentials (any passkey for this RP)
        // Specific credentials = only allow specific user's passkeys
        allowCredentials: usernameless || !user 
          ? [] 
          : user!.Passkeys.map((pk) => ({
              id: Buffer.from(pk.credentialId, 'base64'),
              type: 'public-key' as const,
            })),
        userVerification: 'preferred',
      })

      // Store challenge for verification (5 minutes)
      // Use a generic identifier for usernameless flow
      await db.verificationToken.create({
        data: {
          identifier: email || `usernameless-${options.challenge}`,
          token: options.challenge,
          expires: new Date(Date.now() + 5 * 60 * 1000),
        },
      })

      return NextResponse.json(
        {
          mode: 'signin',
          options,
          usernameless: usernameless || !email,
        },
        { status: 200 }
      )
    }

    return NextResponse.json(
      { error: 'Invalid mode. Use "signin" or "register"' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Passkey flow initiation error:', error)
    return NextResponse.json(
      { error: 'Failed to initiate passkey flow' },
      { status: 500 }
    )
  }
}
