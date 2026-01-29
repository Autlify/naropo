import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'

/**
 * DELETE /api/auth/passkey/[id]
 * Delete a passkey by ID (user must own the passkey)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params

    // Verify passkey belongs to user
    const passkey = await db.passkey.findUnique({
      where: { id },
      select: { userId: true },
    })

    if (!passkey) {
      return NextResponse.json(
        { error: 'Passkey not found' },
        { status: 404 }
      )
    }

    if (passkey.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    // Delete the passkey
    await db.passkey.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting passkey:', error)
    return NextResponse.json(
      { error: 'Failed to delete passkey' },
      { status: 500 }
    )
  }
}
