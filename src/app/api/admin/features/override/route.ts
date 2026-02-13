import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRequestAccess, ApiAuthzError } from '@/lib/features/iam/authz/require'
import { inferScopeFromIds } from '@/lib/features/org/billing/entitlements/resolve'
import type { MeteringScope } from '@/generated/prisma/client'

/**
 * POST /api/admin/features/override
 * Create/update admin override for a feature
 * 
 * Requires: x-autlify-agency or x-autlify-subaccount header
 * Supports: User sessions and API keys
 */
export async function POST(request: Request) {
  try {
    // Secure authorization with header-based context resolution
    const { scope } = await requireRequestAccess({
      req: request,
      requiredKeys: ['org.billing.features.manage'],
      requireActiveSubscription: true,
    })

    const agencyId = scope.kind === 'agency' ? scope.agencyId : scope.agencyId
    const subAccountId = scope.kind === 'subaccount' ? scope.subAccountId : null

    const { featureKey, isEnabled, reason, endsAt } = await request.json()

    if (!featureKey || typeof isEnabled !== 'boolean') {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      )
    }

    const meteringScope = inferScopeFromIds(subAccountId)

    // Verify feature exists
    const feature = await db.entitlementFeature.findUnique({
      where: { key: featureKey },
    })

    if (!feature) {
      return NextResponse.json({ error: 'Feature not found' }, { status: 404 })
    }

    // Normalize subAccountId (empty string instead of null for composite keys)
    const normalizedSubAccountId = subAccountId ?? ''

    // Create or update override
    const override = await db.entitlementOverride.upsert({
      where: {
        scope_agencyId_subAccountId_featureKey: {
          scope: meteringScope,
          agencyId,
          subAccountId: normalizedSubAccountId,
          featureKey,
        },
      },
      update: {
        isEnabled,
        reason,
        endsAt: endsAt ? new Date(endsAt) : null,
      },
      create: {
        scope: meteringScope,
        agencyId,
        subAccountId: normalizedSubAccountId,
        featureKey,
        isEnabled,
        reason,
        endsAt: endsAt ? new Date(endsAt) : null,
      },
    })

    return NextResponse.json({ success: true, override })
  } catch (error) {
    if (error instanceof ApiAuthzError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('Error creating override:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/admin/features/override
 * Remove an admin override
 * 
 * Requires: x-autlify-agency or x-autlify-subaccount header
 * Supports: User sessions and API keys
 */
export async function DELETE(request: Request) {
  try {
    // Secure authorization with header-based context resolution
    const { scope } = await requireRequestAccess({
      req: request,
      requiredKeys: ['org.billing.features.manage'],
      requireActiveSubscription: true,
    })

    const agencyId = scope.kind === 'agency' ? scope.agencyId : scope.agencyId
    const subAccountId = scope.kind === 'subaccount' ? scope.subAccountId : null

    const { searchParams } = new URL(request.url)
    const featureKey = searchParams.get('featureKey')

    if (!featureKey) {
      return NextResponse.json(
        { error: 'featureKey is required' },
        { status: 400 }
      )
    }

    const meteringScope = inferScopeFromIds(subAccountId)

    await db.entitlementOverride.deleteMany({
      where: {
        scope: meteringScope,
        agencyId,
        subAccountId: subAccountId ?? '',
        featureKey,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof ApiAuthzError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('Error deleting override:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
