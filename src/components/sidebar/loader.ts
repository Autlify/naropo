/**
 * Sidebar Context Loader
 * 
 * Optimized context loading for sidebar component.
 * Uses caching to minimize DB queries.
 */

import 'server-only'

import { cache } from 'react'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { readEntitlementSnapshot } from '@/lib/features/org/billing/entitlements/snapshot'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface SidebarContextAgency {
  id: string
  name: string
  agencyLogo: string
  whiteLabel: boolean
  subscriptionPriceId: string | null
}

export interface SidebarContextSubAccount {
  id: string
  name: string
  subAccountLogo: string
  agencyId: string
}

export interface SidebarContext {
  user: {
    id: string
    name: string | null
    email: string
    avatarUrl: string | null
  }
  agency: SidebarContextAgency | null
  subAccount: SidebarContextSubAccount | null
  accessibleSubAccounts: SidebarContextSubAccount[]
  entitledFeatures: Record<string, boolean>
}

// ─────────────────────────────────────────────────────────────────────────────
// Cached Loaders
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get minimal agency info for sidebar (cached per-request)
 */
const getAgencyBasics = cache(async (agencyId: string): Promise<SidebarContextAgency | null> => {
  const agency = await db.agency.findUnique({
    where: { id: agencyId },
    select: {
      id: true,
      name: true,
      agencyLogo: true,
      whiteLabel: true,
      Subscription: {
        select: { priceId: true },
      },
    },
  })
  
  if (!agency) return null
  
  return {
    id: agency.id,
    name: agency.name,
    agencyLogo: agency.agencyLogo,
    whiteLabel: agency.whiteLabel,
    subscriptionPriceId: agency.Subscription?.priceId ?? null,
  }
})

/**
 * Get subaccount basics (cached per-request)
 */
const getSubAccountBasics = cache(async (subAccountId: string): Promise<SidebarContextSubAccount | null> => {
  const sub = await db.subAccount.findUnique({
    where: { id: subAccountId },
    select: {
      id: true,
      name: true,
      subAccountLogo: true,
      agencyId: true,
    },
  })
  
  if (!sub) return null
  
  return {
    id: sub.id,
    name: sub.name,
    subAccountLogo: sub.subAccountLogo,
    agencyId: sub.agencyId,
  }
})

/**
 * Get user's accessible subaccounts for an agency (cached per-request)
 */
const getAccessibleSubAccounts = cache(async (
  userId: string,
  agencyId: string
): Promise<SidebarContextSubAccount[]> => {
  // Get subaccounts where user has membership
  const memberships = await db.subAccountMembership.findMany({
    where: {
      userId,
      isActive: true,
      SubAccount: { agencyId },
    },
    select: {
      SubAccount: {
        select: {
          id: true,
          name: true,
          subAccountLogo: true,
          agencyId: true,
        },
      },
    },
  })
  
  return memberships.map((m) => ({
    id: m.SubAccount.id,
    name: m.SubAccount.name,
    subAccountLogo: m.SubAccount.subAccountLogo,
    agencyId: m.SubAccount.agencyId,
  }))
})

/**
 * Convert entitlement snapshot to simple boolean map
 */
function entitlementsToFeatureMap(
  entitlements: Record<string, any> | null
): Record<string, boolean> {
  if (!entitlements) return {}
  
  const features: Record<string, boolean> = {}
  
  for (const [key, ent] of Object.entries(entitlements)) {
    if (ent.valueType === 'BOOLEAN') {
      features[key] = !!ent.isEnabled
      continue
    }
    
    if (!ent.isEnabled) {
      features[key] = false
      continue
    }
    
    if (ent.isUnlimited) {
      features[key] = true
      continue
    }
    
    const intLimit = ent.maxInt ?? ent.includedInt ?? 0
    const decLimit = Number.parseFloat((ent.maxDec ?? ent.includedDec ?? '0') as string)
    features[key] = intLimit > 0 || (Number.isFinite(decLimit) && decLimit > 0)
  }
  
  return features
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Loader
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Load sidebar context for a given scope.
 * 
 * This replaces getCurrentUser({ withFullUser: true, redirectIfNotFound: false }); for sidebar use cases.
 * - Uses React cache() for request deduplication
 * - Uses entitlement snapshot cache (60s TTL)
 * - Minimal DB queries: 2-3 instead of 6+
 * 
 * @example
 * ```ts
 * const ctx = await loadSidebarContext({ type: 'agency', id: agencyId })
 * if (!ctx) return null
 * 
 * const logo = ctx.agency?.agencyLogo || '/default.svg'
 * const canAccessGL = ctx.entitledFeatures['fi.general_ledger.balances']
 * ```
 */
export const loadSidebarContext = cache(async (params: {
  type: 'agency' | 'subaccount'
  id: string
}): Promise<SidebarContext | null> => {
  const session = await auth()
  const userId = session?.user?.id
  const userEmail = session?.user?.email
  const userName = session?.user?.name
  
  if (!userId || !userEmail) return null
  
  let agency: SidebarContextAgency | null = null
  let subAccount: SidebarContextSubAccount | null = null
  let agencyId: string
  
  if (params.type === 'subaccount') {
    // Load subaccount first to get agencyId
    subAccount = await getSubAccountBasics(params.id)
    if (!subAccount) return null
    
    agencyId = subAccount.agencyId
    agency = await getAgencyBasics(agencyId)
  } else {
    agencyId = params.id
    agency = await getAgencyBasics(agencyId)
  }
  
  if (!agency) return null
  
  // Get accessible subaccounts
  const accessibleSubAccounts = await getAccessibleSubAccounts(userId, agencyId)
  
  // Get entitlements from snapshot cache
  const entitlementSnapshot = await readEntitlementSnapshot({
    scope: params.type === 'agency' ? 'AGENCY' : 'SUBACCOUNT',
    agencyId,
    subAccountId: params.type === 'subaccount' ? params.id : null,
  })
  
  const entitledFeatures = entitlementsToFeatureMap(entitlementSnapshot)
  
  return {
    user: {
      id: userId,
      name: userName ?? null,
      email: userEmail,
      avatarUrl: session?.user?.image ?? null,
    },
    agency,
    subAccount,
    accessibleSubAccounts,
    entitledFeatures,
  }
})
