import { NextResponse } from 'next/server'

import { auth } from '@/auth'
import { db } from '@/lib/db'
import { stripe } from '@/lib/stripe'

/**
 * GET /api/stripe/connect/health?agencyId=... | ?subAccountId=...
 *
 * Purpose
 * - Centralized Stripe Connect health check (connected account access).
 * - Handles common failure modes:
 *   - wrong platform key / access revoked (StripePermissionError account_invalid)
 *   - deauthorized / deleted connected account
 *
 * Behavior
 * - Returns a compact status payload suitable for client-side polling.
 * - If the stored connected account is no longer accessible, it clears the saved connectAccountId
 *   (best-effort) so the UI can immediately prompt the user to reconnect.
 */

type HealthStatus =
  | 'ok'
  | 'missing'
  | 'invalid'
  | 'deauthorized'
  | 'unauthorized'
  | 'forbidden'
  | 'error'

function pickErrorCode(err: unknown): { code?: string; statusCode?: number; message?: string } {
  const anyErr = err as any
  return {
    code: anyErr?.code,
    statusCode: anyErr?.statusCode,
    message: anyErr?.message,
  }
}

async function userCanAccessAgency(userId: string, agencyId: string) {
  const membership = await db.agencyMembership.findFirst({
    where: { userId, agencyId },
    select: { id: true },
  })
  return !!membership
}

async function userCanAccessSubAccount(userId: string, subAccountId: string) {
  const membership = await db.subAccountMembership.findFirst({
    where: { userId, subAccountId },
    select: { id: true },
  })
  return !!membership
}

export async function GET(req: Request) {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) {
    return NextResponse.json({ status: 'unauthorized' satisfies HealthStatus }, { status: 401 })
  }

  const url = new URL(req.url)
  const agencyId = url.searchParams.get('agencyId')?.trim() || '' // e.g, URL ?agencyId=...
  const subAccountId = url.searchParams.get('subAccountId')?.trim() || '' // e.g, URL ?subAccountId=...

  if (!agencyId && !subAccountId) {
    return NextResponse.json(
      { status: 'error' satisfies HealthStatus, message: 'Missing agencyId or subAccountId' },
      { status: 400 }
    )
  }

  // Authorization: user must be a member of the target tenant.
  if (agencyId) {
    const ok = await userCanAccessAgency(userId, agencyId)
    if (!ok) {
      return NextResponse.json({ status: 'forbidden' satisfies HealthStatus }, { status: 403 })
    }
  }
  if (subAccountId) {
    const ok = await userCanAccessSubAccount(userId, subAccountId)
    if (!ok) {
      return NextResponse.json({ status: 'forbidden' satisfies HealthStatus }, { status: 403 })
    }
  }

  // Resolve connectAccountId from the tenant.
  let connectAccountId: string | null = null
  if (agencyId) {
    const agency = await db.agency.findUnique({
      where: { id: agencyId },
      select: { connectAccountId: true },
    })
    connectAccountId = agency?.connectAccountId || null
  } else if (subAccountId) {
    const sa = await db.subAccount.findUnique({
      where: { id: subAccountId },
      select: { connectAccountId: true },
    })
    connectAccountId = sa?.connectAccountId || null
  }

  if (!connectAccountId) {
    return NextResponse.json({ status: 'missing' satisfies HealthStatus })
  }

  try {
    // This call will fail with account_invalid when the platform key cannot access the account.
    const acct = await stripe.accounts.retrieve(connectAccountId)

    return NextResponse.json({
      status: 'ok' satisfies HealthStatus,
      connectAccountId,
      chargesEnabled: (acct as any)?.charges_enabled ?? null,
      payoutsEnabled: (acct as any)?.payouts_enabled ?? null,
      detailsSubmitted: (acct as any)?.details_submitted ?? null,
    })
  } catch (err) {
    const { code, statusCode, message } = pickErrorCode(err)

    const shouldClear = code === 'account_invalid' || statusCode === 403
    const isDeauth = code === 'account_invalid' || code === 'invalid_grant'

    if (shouldClear) {
      try {
        if (agencyId) {
          await db.agency.update({ where: { id: agencyId }, data: { connectAccountId: '' } })
        } else if (subAccountId) {
          await db.subAccount.update({ where: { id: subAccountId }, data: { connectAccountId: '' } })
        }
      } catch {
        // best-effort only
      }
    }

    return NextResponse.json({
      status: (isDeauth ? 'deauthorized' : 'invalid') satisfies HealthStatus,
      connectAccountId,
      code,
      statusCode,
      message,
      cleared: shouldClear,
    })
  }
}
