import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { createVerificationToken, validateVerificationToken } from '@/lib/queries'
import { sendPasswordResetEmail } from '@/lib/email'
import bcrypt from 'bcryptjs'

/**
 * Consolidated Password Reset API
 * 
 * POST /api/auth/password - Request password reset (sends email)
 * PUT  /api/auth/password - Execute password reset (with token)
 */

// =============================================================================
// POST - Request password reset
// =============================================================================
export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const normalizedEmail = email.toLowerCase().trim()

    // Step 1: Check if user exists
    const user = await db.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true, name: true, password: true },
    })

    // Always return success to prevent email enumeration attacks
    if (!user || !user.password) {
      // User doesn't exist or doesn't have password (OAuth only)
      return NextResponse.json({
        success: true,
        message: 'If an account exists, a reset link has been sent.',
      })
    }

    // Step 2: Create verification token (24 hours)
    const verificationToken = await createVerificationToken(
      normalizedEmail,
      'pwd-reset',
      24 * 60 * 60 * 1000
    )

    // Step 3: Send password reset email
    await sendPasswordResetEmail({
      email: normalizedEmail,
      token: verificationToken.token,
      name: user.name || 'User',
    })

    return NextResponse.json({
      success: true,
      message: 'If an account exists, a reset link has been sent.',
    })
  } catch (error) {
    console.error('Error requesting password reset:', error)
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    )
  }
}

// =============================================================================
// PUT - Execute password reset
// =============================================================================
export async function PUT(req: NextRequest) {
  try {
    const { token, password } = await req.json()

    if (!token || !password) {
      return NextResponse.json(
        { error: 'Token and password are required' },
        { status: 400 }
      )
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      )
    }

    // Step 1: Validate token (auto-deletes on success)
    const result = await validateVerificationToken(token)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Invalid or expired token' },
        { status: 400 }
      )
    }

    // Step 2: Get user by email from token
    const user = await db.user.findUnique({
      where: { email: result.email },
      select: { id: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Step 3: Hash new password and update user
    const hashedPassword = await bcrypt.hash(password, 10)
    
    await db.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    })

    return NextResponse.json({
      success: true,
      message: 'Password reset successfully',
    })
  } catch (error) {
    console.error('Error resetting password:', error)
    return NextResponse.json(
      { error: 'Failed to reset password' },
      { status: 500 }
    )
  }
}
