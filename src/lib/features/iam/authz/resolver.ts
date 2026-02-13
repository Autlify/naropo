import 'server-only'

import { cache } from 'react'
import { db } from '@/lib/db'
import type { ActionKey } from '@/lib/registry'
import { AUTLIFY_CONTEXT_COOKIE } from '@/lib/core/proxy/scope'
import { agencyScopeKey, subAccountScopeKey } from '@/lib/core/scope-key'
import { getAuthedUserIdCached } from '@/lib/features/iam/authz/session'
import { getGrantedPermissionKeysForRole } from '@/lib/features/iam/authz/role-permissions'

// Re-export for backwards compatibility
export { AUTLIFY_CONTEXT_COOKIE as CONTEXT_COOKIE }

export type SubscriptionState = 'ACTIVE' | 'INACTIVE' | 'MISSING' | 'TRIAL'

export type SavedContext =
  | { kind: 'agency'; agencyId: string }
  | { kind: 'subaccount'; subAccountId: string }

export type LandingTarget =
  | {
    kind: 'agency'
    agencyId: string
    href: string
    permissionKeys: ActionKey[]
    subscriptionState: SubscriptionState
    hasInactiveSubscription: boolean
   }
  | {
    kind: 'subaccount'
    subAccountId: string
    agencyId: string
    href: string
    permissionKeys: ActionKey[]
  }

const computeSubscriptionState = (
  sub:
    | {
      status: string
      currentPeriodEndDate: Date
      trialEndedAt: Date | null
      active: boolean
      cancelAtPeriodEnd: boolean
    }
    | null
    | undefined
): SubscriptionState => {
  if (!sub) return 'MISSING'

  const now = new Date()
  const status = (sub.status || '').toUpperCase()

  const inPeriod =
    sub.currentPeriodEndDate instanceof Date &&
    sub.currentPeriodEndDate.getTime() > now.getTime()

  // Consider ACTIVE/TRIALING within currentPeriodEndDate as active.
  if ((status === 'ACTIVE' || status === 'TRIALING') && inPeriod) return 'ACTIVE'

  // Fallback: if TRIALING and trialEndedAt is in the future, treat as active.
  if (
    status === 'TRIALING' &&
    sub.trialEndedAt instanceof Date &&
    sub.trialEndedAt.getTime() > now.getTime()
  ) {
    return 'ACTIVE'
  }

  return 'INACTIVE'
}

export const parseSavedContext = (value: string | null): SavedContext | null => {
  if (!value) return null
  const [kind, id] = value.split(':')
  if (!id) return null
  if (kind === 'agency') return { kind: 'agency', agencyId: id }
  if (kind === 'subaccount') return { kind: 'subaccount', subAccountId: id }
  return null
}

export const formatSavedContext = (ctx: SavedContext): string => {
  return ctx.kind === 'agency'
    ? `agency:${ctx.agencyId}`
    : `subaccount:${ctx.subAccountId}`
}

const getPermissionKeysFromSnapshotCached = cache(async (
  userId: string,
  scopeKey: string
): Promise<ActionKey[] | null> => {
  const snapshot = await db.accessContextSnapshot.findUnique({
    where: { userId_scopeKey: { userId, scopeKey } },
    select: { permissionKeys: true, active: true },
  })

  if (!snapshot?.active) return null
  return (snapshot.permissionKeys as any) as ActionKey[]
})

const getAgencySubscriptionRecordCached = cache(async (agencyId: string) => {
  return db.subscription.findUnique({
    where: { agencyId },
    select: {
      status: true,
      currentPeriodEndDate: true,
      trialEndedAt: true,
      active: true,
      cancelAtPeriodEnd: true,
    },
  })
})

const getAgencyMembershipForUserCached = cache(async (userId: string, agencyId: string) => {
  return db.agencyMembership.findFirst({
    where: { userId, agencyId, isActive: true },
    select: {
      userId: true,
      agencyId: true,
      roleId: true,
    },
  })
})

const getSubAccountMembershipForUserCached = cache(async (userId: string, subAccountId: string) => {
  return db.subAccountMembership.findFirst({
    where: { userId, subAccountId, isActive: true },
    select: {
      userId: true,
      subAccountId: true,
      SubAccount: { select: { agencyId: true } },
      roleId: true,
    },
  })
})

const resolvePermissionKeysForScope = async (params: {
  userId: string
  scopeKey: string
  roleId: string | null
  cache?: Map<string, ActionKey[]>
}): Promise<ActionKey[]> => {
  if (!params.roleId) return []

  if (params.cache) {
    const cached = params.cache.get(params.scopeKey)
    if (cached) return cached
  }

  const fromSnapshot = await getPermissionKeysFromSnapshotCached(params.userId, params.scopeKey)

  const keys = fromSnapshot ?? (await getGrantedPermissionKeysForRole(params.roleId))
  if (params.cache) params.cache.set(params.scopeKey, keys)
  return keys
}

export const resolveLandingTarget = async (args?: {
  cookieValue?: string | null
  agencyPermissionKey?: ActionKey
  subAccountPermissionKey?: ActionKey
  billingPermissionKey?: ActionKey
}): Promise<LandingTarget | null> => {
  const userId = await getAuthedUserIdCached()
  if (!userId) return null

  const agencyPermissionKey = args?.agencyPermissionKey ?? 'org.agency.account.read'
  const subAccountPermissionKey =
    args?.subAccountPermissionKey ?? 'org.subaccount.account.read'
  const billingPermissionKey = args?.billingPermissionKey ?? 'org.billing.account.view'

  const saved = parseSavedContext(args?.cookieValue ?? null)

  const agencyMemberships = await db.agencyMembership.findMany({
    where: {
      userId,
      isActive: true,
      Role: {
        Permissions: {
          some: {
            granted: true,
            Permission: { key: agencyPermissionKey },
          },
        },
      },
    },
    select: {
      agencyId: true,
      isPrimary: true,
      joinedAt: true,
      roleId: true,
    },
    orderBy: { joinedAt: 'asc' },
  })

  const subAccountMemberships = await db.subAccountMembership.findMany({
    where: {
      userId,
      isActive: true,
      Role: {
        Permissions: {
          some: {
            granted: true,
            Permission: { key: subAccountPermissionKey },
          },
        },
      },
    },
    select: {
      subAccountId: true,
      joinedAt: true,
      roleId: true,
      SubAccount: { select: { agencyId: true } },
    },
    orderBy: { joinedAt: 'asc' },
  })

  const permissionKeysByScope = new Map<string, ActionKey[]>()

  const toAgencyTarget = async (agencyId: string): Promise<LandingTarget | null> => {
    const m = agencyMemberships.find((x) => x.agencyId === agencyId)
    if (!m) return null

    const permissionKeys = await resolvePermissionKeysForScope({
      scopeKey: agencyScopeKey(agencyId),
      roleId: m.roleId ?? null,
      userId,
      cache: permissionKeysByScope,
    })

    const sub = await getAgencySubscriptionRecordCached(agencyId)
    const subscriptionState = computeSubscriptionState(sub)
    return {
      kind: 'agency',
      agencyId,
      href: `/agency/${agencyId}`,
      permissionKeys,
      subscriptionState,
      hasInactiveSubscription: subscriptionState !== 'ACTIVE',
    }
  }

  const toSubTarget = async (subAccountId: string): Promise<LandingTarget | null> => {
    const m = subAccountMemberships.find((x) => x.subAccountId === subAccountId)
    if (!m) return null

    const permissionKeys = await resolvePermissionKeysForScope({
      scopeKey: subAccountScopeKey(subAccountId),
      roleId: m.roleId ?? null,
      userId,
      cache: permissionKeysByScope,
    })
    return {
      kind: 'subaccount',
      subAccountId,
      agencyId: m.SubAccount.agencyId,
      href: `/subaccount/${subAccountId}`,
      permissionKeys,
    }
  }

  // 1) Saved cookie (if still allowed)
  if (saved?.kind === 'agency') {
    const t = await toAgencyTarget(saved.agencyId)
    if (t) return t
  }
  if (saved?.kind === 'subaccount') {
    const t = await toSubTarget(saved.subAccountId)
    if (t) return t
  }

  // 2) Exactly 1 agency
  if (agencyMemberships.length === 1) {
    return await toAgencyTarget(agencyMemberships[0].agencyId)
  }

  // 3) Exactly 1 subaccount (and no agency)
  if (agencyMemberships.length === 0 && subAccountMemberships.length === 1) {
    return await toSubTarget(subAccountMemberships[0].subAccountId)
  }

  // 4) Primary agency
  const primaryAgency = agencyMemberships.find((m) => m.isPrimary)
  if (primaryAgency) return await toAgencyTarget(primaryAgency.agencyId)

  // Fallback: first agency, else first subaccount
  if (agencyMemberships.length > 0) return await toAgencyTarget(agencyMemberships[0].agencyId)
  if (subAccountMemberships.length > 0) {
    return await toSubTarget(subAccountMemberships[0].subAccountId)
  }

  return null
}

/**
 * User-id based resolver (does not call `auth()`).
 *
 * This is the canonical resolver to reuse for API-key / SDK contexts.
 */
export const resolveAgencyContextForUser = async (args: {
  userId: string
  agencyId: string
}): Promise<{
  userId: string
  agencyId: string
  permissionKeys: ActionKey[]
  subscriptionState: SubscriptionState
} | null> => {
  const membership = await getAgencyMembershipForUserCached(args.userId, args.agencyId)

  if (!membership) return null

  const permissionKeys = await resolvePermissionKeysForScope({
    userId: membership.userId,
    scopeKey: agencyScopeKey(membership.agencyId),
    roleId: membership.roleId ?? null,
  })
  const subscriptionState = await getAgencySubscriptionState(membership.agencyId)

  return {
    userId: membership.userId,
    agencyId: membership.agencyId,
    permissionKeys,
    subscriptionState,
  }
}

export const resolveCurrentAgencyContext = async (args: {
  agencyId: string
}): Promise<{
  userId: string
  agencyId: string
  permissionKeys: ActionKey[]
  subscriptionState: SubscriptionState
} | null> => {
  const userId = await getAuthedUserIdCached()
  if (!userId) return null

  const membership = await getAgencyMembershipForUserCached(userId, args.agencyId)

  if (!membership) return null

  const permissionKeys = await resolvePermissionKeysForScope({
    userId: membership.userId,
    scopeKey: agencyScopeKey(membership.agencyId),
    roleId: membership.roleId ?? null,
  })
  const subscriptionState = await getAgencySubscriptionState(membership.agencyId)

  return {
    userId: membership.userId,
    agencyId: membership.agencyId,
    permissionKeys,
    subscriptionState,
  }
}

export const getAgencySubscriptionState = async (
  agencyId: string
): Promise<SubscriptionState> => {
  const sub = await getAgencySubscriptionRecordCached(agencyId)
  return computeSubscriptionState(sub)
}


/**
 * Resolve SubAccount context for an explicit userId (used by request guards / API key flows).
 */
export const resolveSubAccountContextForUser = async (args: {
  userId: string
  subAccountId: string

}): Promise<{
  userId: string
  agencyId: string
  subAccountId: string
  permissionKeys: ActionKey[]
} | null> => {
  const membership = await getSubAccountMembershipForUserCached(args.userId, args.subAccountId)

  if (!membership) return null

  const permissionKeys = await resolvePermissionKeysForScope({
    userId: membership.userId,
    scopeKey: subAccountScopeKey(membership.subAccountId),
    roleId: membership.roleId ?? null,
  })

  return {
    userId: membership.userId,
    agencyId: membership.SubAccount.agencyId,
    subAccountId: membership.subAccountId,
    permissionKeys,
  }
}

export const resolveCurrentSubAccountContext = async (args: {
  subAccountId: string
}): Promise<{
  userId: string
  agencyId: string
  subAccountId: string
  permissionKeys: ActionKey[]
} | null> => {
  const userId = await getAuthedUserIdCached()
  if (!userId) return null

  return resolveSubAccountContextForUser({ userId, subAccountId: args.subAccountId })
} 
