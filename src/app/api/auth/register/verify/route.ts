import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { sendVerificationEmail } from '@/lib/email'
import { createVerificationToken } from '@/lib/queries'

/**
 * POST /api/auth/register/verify
 * Send or resend email verification link
 */
export async function POST(req: Request) {
    try {
        const { email } = await req.json()

        if (!email) {
            return NextResponse.json(
                { error: 'Email is required' },
                { status: 400 }
            )
        }

        const user = await db.user.findUnique({
            where: { email },
        })

        if (!user) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            )
        }

        if (user.emailVerified) {
            return NextResponse.json(
                { message: 'Email already verified' },
                { status: 200 }
            )
        }

        // Check for existing verification token and cooldown
        const existingToken = await db.verificationToken.findFirst({
            where: {
                identifier: `verify:${email}`,
            },
            orderBy: {
                expires: 'desc',
            },
        })

        // Check cooldown (5 minutes between sends)
        if (existingToken) {
            const now = new Date()
            const cooldownDuration = parseInt(process.env.AUTH_COOLDOWN_MINUTES!) * 60 * 1000
            const tokenCreatedAt = new Date(existingToken.expires.getTime() - 24 * 60 * 60 * 1000) // Token expires in 24h, so subtract to get created time
            const timeSinceCreation = now.getTime() - tokenCreatedAt.getTime()

            if (timeSinceCreation < cooldownDuration) {
                const remainingSeconds = Math.ceil((cooldownDuration - timeSinceCreation) / 1000)
                return NextResponse.json(
                    {
                        error: 'Please wait before requesting another verification email',
                        cooldownActive: true,
                        remainingSeconds,
                    },
                    { status: 429 }
                )
            }
        }

        // Create new verification token (24 hours expiry)
        const verificationToken = await createVerificationToken(
            email,
            'verify',
            24 * 60 * 60 * 1000
        )

        const cooldownDuration = parseInt(process.env.AUTH_COOLDOWN_MINUTES!) * 60 * 1000

        // Send verification email
        await sendVerificationEmail({ email, token: verificationToken.token, name: user.name })

        return NextResponse.json({
            message: 'Verification email sent successfully',
            cooldownSeconds: cooldownDuration / 1000,
        })
    } catch (error) {
        console.error('Error sending verification email:', error)
        return NextResponse.json(
            { error: 'Failed to send verification email' },
            { status: 500 }
        )
    }
}

/**
 * GET /api/auth/register/verify?email=xxx
 * Check cooldown status for resending verification email
 */
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url)
        const email = searchParams.get('email')

        if (!email) {
            return NextResponse.json(
                { error: 'Email parameter is required' },
                { status: 400 }
            )
        }

        const existingToken = await db.verificationToken.findFirst({
            where: {
                identifier: `verify:${email}`,
            },
            orderBy: {
                expires: 'desc',
            },
        })

        if (!existingToken) {
            return NextResponse.json({
                cooldownActive: false,
                remainingSeconds: 0,
            })
        }

        const now = new Date()
        const cooldownDuration = parseInt(process.env.AUTH_COOLDOWN_MINUTES!) * 60 * 1000
        const tokenCreatedAt = new Date(existingToken.expires.getTime() - 24 * 60 * 60 * 1000)
        const timeSinceCreation = now.getTime() - tokenCreatedAt.getTime()

        if (timeSinceCreation < cooldownDuration) {
            const remainingSeconds = Math.ceil((cooldownDuration - timeSinceCreation) / 1000)
            return NextResponse.json({
                cooldownActive: true,
                remainingSeconds,
            })
        }

        return NextResponse.json({
            cooldownActive: false,
            remainingSeconds: 0,
        })
    } catch (error) {
        console.error('Error checking cooldown:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
