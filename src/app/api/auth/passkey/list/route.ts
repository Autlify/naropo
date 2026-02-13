import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'

/**
 * GET /api/auth/passkey/list
 * List all passkeys for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const passkeys = await db.passkey.findMany({
      where: { userId: session.user.id },
      select: {
        id: true,
        name: true,
        deviceName: true,
        authenticatorType: true,
        createdAt: true,
        lastUsedAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 100, // Limit to 100 passkeys per user
    })

    return NextResponse.json({ passkeys })
  } catch (error) {
    console.error('Error fetching passkeys:', error)
    return NextResponse.json(
      { error: 'Failed to fetch passkeys' },
      { status: 500 }
    )
  }
}
