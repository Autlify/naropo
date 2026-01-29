'use server'

import { db } from '@/lib/db'
import { sendVerificationEmail, sendPasswordResetEmail } from '@/lib/email'
import { createVerificationToken } from '@/lib/queries'

export type AuthState = {
  exists: boolean
  hasPassword: boolean
  hasPasskey: boolean
  providers: string[]
}

/**
 * Check if a user exists by email and what auth methods they have
 * Uses direct DB query for minimal overhead
 */
export async function checkUserAuthState(email: string): Promise<AuthState> {
  if (!email) {
    return { exists: false, hasPassword: false, hasPasskey: false, providers: [] }
  }

  const normalizedEmail = email.toLowerCase().trim()

  const user = await db.user.findUnique({
    where: { email: normalizedEmail },
    select: {
      id: true,
      password: true,
      Authenticators: { select: { credentialID: true }, take: 1 },
      accounts: { select: { provider: true } },
    },
  })

  if (!user) {
    return { exists: false, hasPassword: false, hasPasskey: false, providers: [] }
  }

  const oauthProviders = user.accounts
    .map((a: { provider: string }) => a.provider)
    .filter((p: string) => p !== 'credentials')

  return {
    exists: true,
    hasPassword: !!user.password,
    hasPasskey: user.Authenticators.length > 0,
    providers: oauthProviders,
  }
}

/**
 * Register a new user (for signup flow)
 */
export async function registerUser(data: {
  email: string
  firstName: string
  lastName: string
  password?: string | null
}): Promise<{ success: boolean; error?: string; requiresVerification?: boolean }> {
  try {
    const normalizedEmail = data.email.toLowerCase().trim()

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email: normalizedEmail },
    })

    if (existingUser) {
      return { success: false, error: 'An account with this email already exists' }
    }

    // Hash password if provided
    let hashedPassword = null
    if (data.password) {
      const bcrypt = await import('bcryptjs')
      hashedPassword = await bcrypt.hash(data.password, 10)
    }

    const fullName = `${data.firstName} ${data.lastName}`.trim()

    // Create user
    await db.user.create({
      data: {
        email: normalizedEmail,
        name: fullName,
        firstName: data.firstName,
        lastName: data.lastName,
        password: hashedPassword,
        emailVerified: data.password ? null : new Date(), // Auto-verify passkey-only users
      },
    })

    // Create verification token if password auth
    if (data.password) {
      const verificationToken = await createVerificationToken(normalizedEmail, 'verify', 24 * 60 * 60 * 1000) // 24 hours
      await sendVerificationEmail({ email: normalizedEmail, token: verificationToken.token, name: fullName })
      return { success: true, requiresVerification: true }
    }

    return { success: true, requiresVerification: false }
  } catch (error) {
    console.error('Registration error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to create account' 
    }
  }
}

/**
 * Request password reset email
 */
export async function requestPasswordReset(email: string): Promise<{ success: boolean; error?: string }> {
  try {
    const normalizedEmail = email.toLowerCase().trim()

    const user = await db.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true, email: true, name: true, password: true },
    })

    // Always return success to prevent email enumeration
    if (!user || !user.password) {
      return { success: true }
    }

    const resetToken = await createVerificationToken(normalizedEmail, 'pwd-reset', 60 * 60 * 1000) // 1 hour
    await sendPasswordResetEmail({ email: normalizedEmail, token: resetToken.token, name: user.name || undefined })

    return { success: true }
  } catch (error) {
    console.error('Password reset request error:', error)
    return { success: false, error: 'Failed to send reset email' }
  }
}
