import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { sendVerificationEmail } from '@/lib/email'
import { createVerificationToken } from '@/lib/queries'

export async function POST(req: Request) {
  try {
    const { firstName, lastName, name, email, password } = await req.json()

    if (!firstName || !lastName || !name || !email || !password) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10) 

    // Create user
    const user = await db.user.create({
      data: {
        firstName,
        lastName,
        name,
        email,
        password: hashedPassword,
      },
    })

    // Create verification token (24 hours expiry)
    const verificationToken = await createVerificationToken(
      email,
      'verify',
      24 * 60 * 60 * 1000
    )

    const cooldown = (parseInt(process.env.AUTH_COOLDOWN_MINUTES!)) * 60 * 1000

    // Send verification email
    await sendVerificationEmail({ email, token: verificationToken.token, name })

    return NextResponse.json(
      { 
        message: 'User created successfully. Please check your email to verify your account.', 
        userId: user.id,
        cooldownSeconds: Math.ceil(cooldown / 1000),
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
