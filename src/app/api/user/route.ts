import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { stripe } from '@/lib/stripe'

/**
 * Consolidated User API
 * 
 * GET  /api/user - Get current user info + deletion eligibility
 * DELETE /api/user - Delete user account
 */

// =============================================================================
// GET - User info + deletion eligibility check
// =============================================================================
export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id

    // Get user with memberships
    const memberships = await db.agencyMembership.findMany({
      where: { userId, isActive: true },
      include: {
        Agency: {
          select: {
            id: true,
            name: true,
            Subscription: {
              select: { id: true, active: true },
            },
          },
        },
      },
    })

    // Check for primary admin status
    const primaryMemberships = memberships.filter((m) => m.isPrimary)
    const ownedAgencies = primaryMemberships.map((m) => ({
      id: m.Agency.id,
      name: m.Agency.name,
    }))

    const hasActiveSubscription = memberships.some(
      (m) => m.Agency.Subscription?.active
    )

    return NextResponse.json({
      user: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
      },
      deletion: {
        canDelete: primaryMemberships.length === 0,
        isPrimaryAdmin: primaryMemberships.length > 0,
        ownedAgencies,
        memberships: memberships.length,
        hasActiveSubscription,
      },
    })
  } catch (error) {
    console.error('Error fetching user:', error)
    return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 })
  }
}

// =============================================================================
// DELETE - Delete user account
// =============================================================================
export async function DELETE(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { confirmText } = body
    const userId = session.user.id

    // Require confirmation
    if (confirmText !== 'DELETE') {
      return NextResponse.json(
        { error: 'Confirmation text does not match' },
        { status: 400 }
      )
    }

    // Step 1: Verify user is not primary admin of any agency
    const primaryMembership = await db.agencyMembership.findFirst({
      where: { userId, isPrimary: true, isActive: true },
    })

    if (primaryMembership) {
      return NextResponse.json(
        { error: 'Cannot delete account while you are primary admin of an agency. Transfer ownership first.' },
        { status: 400 }
      )
    }

    // Step 2: Get memberships to check for subscription cancellation
    const memberships = await db.agencyMembership.findMany({
      where: { userId, isActive: true },
      include: {
        Agency: {
          select: {
            id: true,
            customerId: true,
            Subscription: {
              select: { id: true, subscritiptionId: true },
            },
          },
        },
      },
    })

    // Step 3: Cancel Stripe subscriptions where user is last member
    // Batch query all member counts to avoid N+1
    const agencyIds = memberships.map((m) => m.Agency.id)
    const memberCounts = await db.agencyMembership.groupBy({
      by: ['agencyId'],
      where: { agencyId: { in: agencyIds }, isActive: true },
      _count: { id: true },
    })
    const memberCountMap = new Map(memberCounts.map((mc) => [mc.agencyId, mc._count.id]))

    for (const membership of memberships) {
      const agency = membership.Agency
      if (agency.Subscription?.subscritiptionId && agency.customerId) {
        try {
          const memberCount = memberCountMap.get(agency.id) ?? 0

          // Only cancel if user is the last member
          if (memberCount === 1) {
            await stripe.subscriptions.update(agency.Subscription.subscritiptionId, {
              cancel_at_period_end: true,
              metadata: {
                cancellation_reason: 'user_account_deleted',
                cancelled_by: userId,
              },
            })
          }
        } catch (stripeError) {
          console.error('Error cancelling Stripe subscription:', stripeError)
          // Continue with deletion even if Stripe call fails
        }
      }
    }

    // Step 4: Delete user (cascades handle memberships, passkeys, sessions, accounts)
    await db.user.delete({ where: { id: userId } })

    return NextResponse.json({
      success: true,
      message: 'Account deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting account:', error)
    return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 })
  }
}
