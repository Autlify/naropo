import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { sendVerificationEmail } from '@/lib/email'
import { createVerificationToken } from '@/lib/queries'
import { upsertBaselineTermsAcceptance, recordLegalAcceptance } from '@/lib/core/legal/acceptance'

type RegisterBody = {
  firstName?: string
  lastName?: string
  name?: string
  email?: string
  password?: string | null
  termsAgreed?: boolean
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as RegisterBody
    const firstName = body.firstName?.trim()
    const lastName = body.lastName?.trim()
    const name = (body.name?.trim() || `${firstName ?? ''} ${lastName ?? ''}`.trim())
    const email = body.email?.trim()?.toLowerCase()
    const password = body.password
    const termsAgreed = body.termsAgreed === true

    if (!firstName || !lastName || !name || !email) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (!termsAgreed) {
      return NextResponse.json({ error: 'You must agree to the terms' }, { status: 400 })
    }

    const isPasskeyOnly = password == null || password === ''

    if (!isPasskeyOnly && typeof password === 'string' && password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
    }

    // Check if user already exists
    const existingUser = await db.user.findUnique({ where: { email } })
    if (existingUser) {
      return NextResponse.json({ error: 'User already exists' }, { status: 400 })
    }

    const hashedPassword = !isPasskeyOnly && typeof password === 'string'
      ? await bcrypt.hash(password, 10)
      : null

    // Create user
    const user = await db.user.create({
      data: {
        firstName,
        lastName,
        name,
        email,
        password: hashedPassword,
        // Passkey-only users can be verified immediately (credential possession is the proof)
        ...(isPasskeyOnly ? { emailVerified: new Date() } : {}),
      },
    })

    // Always record baseline legal acceptance from signup.
    await upsertBaselineTermsAcceptance(user.id)
    await recordLegalAcceptance(user.id, 'baseline')

    // Password users still require email verification
    if (!isPasskeyOnly) {
      const verificationToken = await createVerificationToken(email, 'verify', 24 * 60 * 60 * 1000)

      const cooldownMinutes = Number.parseInt(process.env.AUTH_COOLDOWN_MINUTES || '15', 10)
      const cooldown = (Number.isFinite(cooldownMinutes) ? cooldownMinutes : 15) * 60 * 1000

      await sendVerificationEmail({ email, token: verificationToken.token, name })

      return NextResponse.json(
        {
          message:
            'User created successfully. Please check your email to verify your account.',
          userId: user.id,
          cooldownSeconds: Math.ceil(cooldown / 1000),
        },
        { status: 201 }
      )
    }

    // Passkey-only accounts
    return NextResponse.json(
      {
        message: 'User created successfully.',
        userId: user.id,
        passkeyOnly: true,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
