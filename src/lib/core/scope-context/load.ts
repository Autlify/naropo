/**
 * Scope Context Loader
 * 
 * Loads and combines permission + entitlement data into a single ScopeContext.
 * Uses existing cached snapshot functions to minimize DB queries.
 */

import 'server-only'

import crypto from 'crypto'
import { cache } from 'react'
import { auth } from '@/auth'
import { getAgencyAccessSnapshot, getSubAccountAccessSnapshot } from '@/lib/features/iam/authz/access-snapshot'
import { readEntitlementSnapshot } from '@/lib/features/org/billing/entitlements/snapshot'
import { db } from '@/lib/db'
import type { ScopeContext, ExtractedScope } from './types'

const CONTEXT_TTL_MS = 5 * 60 * 1000 // 5 minutes

// Permission keys that indicate admin privileges
const ADMIN_PERMISSION_KEYS = ['*', 'iam.authZ.roles.manage', 'org.organization.settings.manage']

/**
 * Hash an array of strings for staleness detection
 */
function hashStrings(strs: string[]): string {
  const normalized = Array.from(new Set(strs.map((s) => s.trim()))).sort()
  return crypto.createHash('sha256').update(JSON.stringify(normalized)).digest('hex').slice(0, 16)
}

/**
 * Load full scope context for a user in a given scope
 * Cached per-request via React cache()
 */
export const loadScopeContext = cache(async (params: ExtractedScope): Promise<ScopeContext | null> => {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return null

  // Load access snapshot (permissions)
  const accessSnapshot = params.scope === 'AGENCY'
    ? await getAgencyAccessSnapshot(params.agencyId)
    : params.subAccountId
      ? await getSubAccountAccessSnapshot(params.subAccountId)
      : null

  if (!accessSnapshot) return null

  // Load entitlement snapshot
  const entitlements = await readEntitlementSnapshot({
    scope: params.scope,
    agencyId: params.agencyId,
    subAccountId: params.subAccountId,
  })

  // Extract enabled features from entitlements
  const enabledFeatures: string[] = []
  const unlimitedFeatures: string[] = []
  
  if (entitlements) {
    for (const [featureKey, ent] of Object.entries(entitlements)) {
      if (ent.isEnabled) {
        enabledFeatures.push(featureKey)
        if (ent.isUnlimited) {
          unlimitedFeatures.push(featureKey)
        }
      }
    }
  }

  // Get subscription/plan info (from agency subscription)
  const subscription = await db.subscription.findUnique({
    where: { agencyId: params.agencyId },
    select: { plan: true, priceId: true },
  })

  // Get membership info for role name
  let roleName: string | null = null
  let isPrimary = false

  if (params.scope === 'AGENCY') {
    const membership = await db.agencyMembership.findFirst({
      where: { userId, agencyId: params.agencyId, isActive: true },
      select: { 
        isPrimary: true,
        Role: { select: { name: true } },
      },
    })
    if (membership) {
      roleName = membership.Role?.name ?? null
      isPrimary = membership.isPrimary
    }
  } else if (params.subAccountId) {
    const membership = await db.subAccountMembership.findFirst({
      where: { userId, subAccountId: params.subAccountId, isActive: true },
      select: {
        Role: { select: { name: true } },
      },
    })
    if (membership) {
      roleName = membership.Role?.name ?? null
    }
  }

  // Determine admin status from permissions
  const isAdmin = accessSnapshot.permissionKeys.some(
    (key) => ADMIN_PERMISSION_KEYS.includes(key) || key.endsWith('.manage')
  )

  const now = Date.now()

  return {
    version: 1,
    userId,
    scope: params.scope,
    agencyId: params.agencyId,
    subAccountId: params.subAccountId,
    roleId: accessSnapshot.roleId,
    roleName,
    isOwner: isPrimary, // isPrimary indicates the primary owner
    isAdmin,
    permissionKeys: accessSnapshot.permissionKeys,
    permissionHash: accessSnapshot.permissionHash.slice(0, 16),
    enabledFeatures,
    unlimitedFeatures,
    entitlementHash: hashStrings(enabledFeatures),
    planId: subscription?.priceId ?? null,
    planName: subscription?.plan ?? null,
    loadedAt: now,
    expiresAt: now + CONTEXT_TTL_MS,
  }
})

/**
 * Extract scope from a URL path
 * Patterns:
 *   /agency/{agencyId}/...           -> AGENCY scope
 *   /subaccount/{subAccountId}/...   -> SUBACCOUNT scope (needs agencyId lookup)
 */
export function extractScopeFromPath(path: string): ExtractedScope | null {
  // Agency scope: /agency/{id}
  const agencyMatch = path.match(/^\/agency\/([a-zA-Z0-9_-]+)/)
  if (agencyMatch) {
    return {
      scope: 'AGENCY',
      agencyId: agencyMatch[1],
      subAccountId: null,
    }
  }

  // Subaccount scope: /subaccount/{id}
  // Note: For subaccount, we need the agencyId from DB
  // This is handled by the caller
  const subMatch = path.match(/^\/subaccount\/([a-zA-Z0-9_-]+)/)
  if (subMatch) {
    // Return partial - caller must look up agencyId
    return {
      scope: 'SUBACCOUNT',
      agencyId: '', // Must be filled by caller
      subAccountId: subMatch[1],
    }
  }

  return null
}

/**
 * Lookup agencyId for a subaccount
 */
export async function getAgencyIdForSubAccount(subAccountId: string): Promise<string | null> {
  const sub = await db.subAccount.findUnique({
    where: { id: subAccountId },
    select: { agencyId: true },
  })
  return sub?.agencyId ?? null
}
