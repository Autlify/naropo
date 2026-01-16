import 'server-only'

import { auth } from '@/auth'
import { db } from '@/lib/db'

export const CONTEXT_COOKIE = 'app.last_context.v1'

export type SubscriptionState = 'ACTIVE' | 'INACTIVE' | 'MISSING'

export type SavedContext =
  | { kind: 'agency'; agencyId: string }
  | { kind: 'subaccount'; subAccountId: string }

export type LandingTarget =
  | {
      kind: 'agency'
      agencyId: string
      href: string
      permissionKeys: string[]
      subscriptionState: SubscriptionState
      hasInactiveSubscription: boolean
    }
  | {
      kind: 'subaccount'
      subAccountId: string
      agencyId: string
      href: string
      permissionKeys: string[]
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

export const getAgencySubscriptionState = async (
  agencyId: string
): Promise<SubscriptionState> => {
  const sub = await db.subscription.findUnique({
    where: { agencyId },
    select: {
      status: true,
      currentPeriodEndDate: true,
      trialEndedAt: true,
      active: true,
      cancelAtPeriodEnd: true,
    },
  })
  return computeSubscriptionState(sub)
}

export const resolveLandingTarget = async (args?: {
  cookieValue?: string | null
  agencyPermissionKey?: string
  subAccountPermissionKey?: string
  billingPermissionKey?: string
}): Promise<LandingTarget | null> => {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return null

  const agencyPermissionKey = args?.agencyPermissionKey ?? 'agency.account.read'
  const subAccountPermissionKey =
    args?.subAccountPermissionKey ?? 'subaccount.account.read'
  const billingPermissionKey = args?.billingPermissionKey ?? 'agency.billing.update'

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
      Role: {
        select: {
          Permissions: {
            where: { granted: true },
            select: { Permission: { select: { key: true } } },
          },
        },
      },
      Agency: {
        select: {
          Subscription: {
            select: {
              status: true,
              currentPeriodEndDate: true,
              trialEndedAt: true,
              active: true,
              cancelAtPeriodEnd: true,
            },
          },
        },
      },
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
      Role: {
        select: {
          Permissions: {
            where: { granted: true },
            select: { Permission: { select: { key: true } } },
          },
        },
      },
      SubAccount: { select: { agencyId: true } },
    },
    orderBy: { joinedAt: 'asc' },
  })

  const toAgencyTarget = (agencyId: string): LandingTarget | null => {
    const m = agencyMemberships.find((x) => x.agencyId === agencyId)
    if (!m) return null

    const permissionKeys = m.Role.Permissions.map((rp) => rp.Permission.key)
    const subscriptionState = computeSubscriptionState(m.Agency.Subscription)
    return {
      kind: 'agency',
      agencyId,
      href: `/agency/${agencyId}`,
      permissionKeys,
      subscriptionState,
      hasInactiveSubscription: subscriptionState !== 'ACTIVE',
    }
  }

  const toSubTarget = (subAccountId: string): LandingTarget | null => {
    const m = subAccountMemberships.find((x) => x.subAccountId === subAccountId)
    if (!m) return null

    const permissionKeys = m.Role.Permissions.map((rp) => rp.Permission.key)
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
    const t = toAgencyTarget(saved.agencyId)
    if (t) return t
  }
  if (saved?.kind === 'subaccount') {
    const t = toSubTarget(saved.subAccountId)
    if (t) return t
  }

  // 2) Exactly 1 agency
  if (agencyMemberships.length === 1) return toAgencyTarget(agencyMemberships[0].agencyId)

  // 3) Exactly 1 subaccount (and no agency)
  if (agencyMemberships.length === 0 && subAccountMemberships.length === 1) {
    return toSubTarget(subAccountMemberships[0].subAccountId)
  }

  // 4) Primary agency
  const primaryAgency = agencyMemberships.find((m) => m.isPrimary)
  if (primaryAgency) return toAgencyTarget(primaryAgency.agencyId)

  // Fallback: first agency, else first subaccount
  if (agencyMemberships.length > 0) return toAgencyTarget(agencyMemberships[0].agencyId)
  if (subAccountMemberships.length > 0) return toSubTarget(subAccountMemberships[0].subAccountId)

  return null
}

export const resolveCurrentAgencyContext = async (args: {
  agencyId: string
}): Promise<{
  userId: string
  agencyId: string
  permissionKeys: string[]
  subscriptionState: SubscriptionState
} | null> => {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return null

  const membership = await db.agencyMembership.findFirst({
    where: { userId, agencyId: args.agencyId, isActive: true },
    select: {
      userId: true,
      agencyId: true,
      Role: {
        select: {
          Permissions: {
            where: { granted: true },
            select: { Permission: { select: { key: true } } },
          },
        },
      },
      Agency: {
        select: {
          Subscription: {
            select: {
              status: true,
              currentPeriodEndDate: true,
              trialEndedAt: true,
              active: true,
              cancelAtPeriodEnd: true,
            },
          },
        },
      },
    },
  })

  if (!membership) return null

  const permissionKeys = membership.Role.Permissions.map((rp) => rp.Permission.key)
  const subscriptionState = computeSubscriptionState(membership.Agency.Subscription)

  return {
    userId: membership.userId,
    agencyId: membership.agencyId,
    permissionKeys,
    subscriptionState,
  }
}

export const resolveCurrentSubAccountContext = async (args: {
  subAccountId: string
}): Promise<{
  userId: string
  agencyId: string
  subAccountId: string
  permissionKeys: string[]
} | null> => {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return null

  const membership = await db.subAccountMembership.findFirst({
    where: { userId, subAccountId: args.subAccountId, isActive: true },
    select: {
      userId: true,
      subAccountId: true,
      SubAccount: { select: { agencyId: true } },
      Role: {
        select: {
          Permissions: {
            where: { granted: true },
            select: { Permission: { select: { key: true } } },
          },
        },
      },
    },
  })

  if (!membership) return null

  const permissionKeys = membership.Role.Permissions.map((rp) => rp.Permission.key)

  return {
    userId: membership.userId,
    agencyId: membership.SubAccount.agencyId,
    subAccountId: membership.subAccountId,
    permissionKeys,
  }
}
