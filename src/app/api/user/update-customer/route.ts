import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'

/**
 * POST /api/user/update-customer
 * 
 * Updates the user's Stripe customerId in the database.
 * Enforces the business rule: 1 User = 1 Customer Account
 * 
 * Request body:
 * - userId: string - The user's ID
 * - customerId: string - The Stripe customer ID to associate with the user
 * 
 * Returns:
 * - success: boolean
 * - userId: string
 * - customerId: string
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await req.json()
    const { userId, customerId } = body

    if (!userId || !customerId) {
      return NextResponse.json(
        { error: 'userId and customerId are required' },
        { status: 400 }
      )
    }

    // Verify the user is updating their own record
    if (session.user.id !== userId) {
      return NextResponse.json(
        { error: 'Forbidden: Can only update own customer ID' },
        { status: 403 }
      )
    }

    console.log('🔄 Updating user customerId:', { userId, customerId })

    // Update user with customerId
    const updatedUser = await db.user.update({
      where: { id: userId },
      data: { customerId },
    })

    console.log('✅ User customerId updated successfully')

    return NextResponse.json({
      success: true,
      userId: updatedUser.id,
      customerId: updatedUser.customerId,
    })
  } catch (error) {
    console.error('❌ Error updating user customerId:', error)
    
    return NextResponse.json(
      { error: 'Failed to update customer ID' },
      { status: 500 }
    )
  }
}
