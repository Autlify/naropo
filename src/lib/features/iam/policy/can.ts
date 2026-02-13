import 'server-only'

import type { MeteringScope } from '@/generated/prisma/client'
import { db } from '@/lib/db'
import { hasAgencyPermission, hasSubAccountPermission } from '@/lib/features/iam/authz/permissions'
import { getAgencySubscriptionState, type SubscriptionState } from '@/lib/features/iam/authz/resolver'
import { checkUsage } from '@/lib/features/org/billing/usage/consume'
import type { UsageDecision } from '@/lib/features/org/billing/usage/consume'

import { POLICY_MESSAGES, type PolicyReason, type PolicySuggestion } from './messages'
import type { ActionKey, FeatureKey } from '@/lib/registry/keys'

export type CanPerformArgs = {
  userId: string
  agencyId: string
  subAccountId?: string | null

  // RBAC
  requiredPermissionKey?: ActionKey
  requiredPermissionKeys?: ActionKey[]

  // Subscription
  requireActiveSubscription?: boolean

  // Feature/usage gating
  featureKey?: FeatureKey
  quantity?: number
  actionKey?: ActionKey

  // Determines whether to show topup/upgrade or contact-admin
  billingPermissionKeys?: ActionKey[]
}

export type CanPerformResult = {
  allowed: boolean
  reason?: PolicyReason
  message?: string
  suggestion?: PolicySuggestion

  // Useful for UI
  subscription?: Awaited<ReturnType<typeof getAgencySubscriptionState>>
  usage?: UsageDecision
  hasBillingAccess?: boolean
}

const DEFAULT_BILLING_PERMISSION_KEYS: Partial<ActionKey>[] = [
  'org.billing.account.view',
  'org.billing.account.manage',
]

const isSubscriptionAllowed = (state: SubscriptionState) =>
  state === 'ACTIVE' || state === 'TRIAL'

async function hasMembership(userId: string, agencyId: string, subAccountId: string | null) {
  if (subAccountId) {
    const m = await db.subAccountMembership.findFirst({
      where: { userId, subAccountId, isActive: true },
      select: { id: true },
    })
    return Boolean(m)
  }

  const m = await db.agencyMembership.findFirst({
    where: { userId, agencyId, isActive: true },
    select: { id: true },
  })
  return Boolean(m)
}

async function hasAllPermissions(
  userId: string,
  agencyId: string,
  subAccountId: string | null,
  keys: ActionKey[]
): Promise<boolean> {
  if (keys.length === 0) return true
  if (subAccountId) {
    for (const k of keys) {
      const ok = await hasSubAccountPermission(subAccountId, k)
      if (!ok) return false
    }
    return true
  }

  for (const k of keys) {
    const ok = await hasAgencyPermission(agencyId, k)
    if (!ok) return false
  }
  return true
}

async function computeHasBillingAccess(
  userId: string,
  agencyId: string,
  subAccountId: string | null,
  billingKeys?: ActionKey[]
): Promise<boolean> {
  const keys = billingKeys?.length ? billingKeys : DEFAULT_BILLING_PERMISSION_KEYS
  // Billing is typically agency-scoped even when operating in subaccount context.
  for (const k of keys) {
    const ok = await hasAgencyPermission(agencyId, k)
    if (ok) return true
  }
  return false
}

export const canPerform = async (args: CanPerformArgs): Promise<CanPerformResult> => {
  const {
    userId,
    agencyId,
    subAccountId = null,
    requiredPermissionKey,
    requiredPermissionKeys,
    requireActiveSubscription = true,
    featureKey,
    quantity = 1,
    actionKey,
    billingPermissionKeys,
  } = args

  const membershipOk = await hasMembership(userId, agencyId, subAccountId)
  if (!membershipOk) {
    return {
      allowed: false,
      reason: 'NO_MEMBERSHIP',
      message: POLICY_MESSAGES.NO_MEMBERSHIP,
      suggestion: 'NONE',
    }
  }

  const permKeys = [
    ...(requiredPermissionKey ? [requiredPermissionKey] : []),
    ...(requiredPermissionKeys ?? []),
  ].map((s) => s.trim()).filter(Boolean) as ActionKey[]

  const permOk = await hasAllPermissions(userId, agencyId, subAccountId, permKeys)
  if (!permOk) {
    return {
      allowed: false,
      reason: 'NO_PERMISSION',
      message: POLICY_MESSAGES.NO_PERMISSION,
      suggestion: 'NONE',
    }
  }

  const subscription = await getAgencySubscriptionState(agencyId)
  if (requireActiveSubscription && !isSubscriptionAllowed(subscription)) {
    const hasBillingAccess = await computeHasBillingAccess(userId, agencyId, subAccountId, billingPermissionKeys)
    return {
      allowed: false,
      reason: 'NO_SUBSCRIPTION',
      message: POLICY_MESSAGES.NO_SUBSCRIPTION,
      suggestion: hasBillingAccess ? 'UPGRADE' : 'CONTACT_ADMIN',
      subscription,
      hasBillingAccess,
    }
  }

  // If no feature usage gating requested, we’re done.
  if (!featureKey) {
    return {
      allowed: true,
      subscription,
      hasBillingAccess: await computeHasBillingAccess(userId, agencyId, subAccountId, billingPermissionKeys),
    }
  }

  const scope: MeteringScope = subAccountId ? 'SUBACCOUNT' : 'AGENCY'
  const usage = await checkUsage({
    scope,
    agencyId,
    subAccountId,
    featureKey,
    quantity,
    actionKey,
    // REMOVED actionKey as it is not yet supported in usage checks
  })

  if (usage.allowed) {
    return {
      allowed: true,
      subscription,
      usage,
      hasBillingAccess: await computeHasBillingAccess(userId, agencyId, subAccountId, billingPermissionKeys),
    }
  }

  const hasBillingAccess = await computeHasBillingAccess(userId, agencyId, subAccountId, billingPermissionKeys)

  // Map usage failure to policy reason + suggestion.
  if (usage.reason === 'FEATURE_DISABLED') {
    return {
      allowed: false,
      reason: 'FEATURE_DISABLED',
      message: POLICY_MESSAGES.FEATURE_DISABLED,
      suggestion: hasBillingAccess ? 'UPGRADE' : 'CONTACT_ADMIN',
      subscription,
      usage,
      hasBillingAccess,
    }
  }

  if (usage.reason === 'INSUFFICIENT_CREDITS') {
    return {
      allowed: false,
      reason: 'INSUFFICIENT_CREDITS',
      message: POLICY_MESSAGES.INSUFFICIENT_CREDITS,
      suggestion: hasBillingAccess ? 'TOPUP' : 'CONTACT_ADMIN',
      subscription,
      usage,
      hasBillingAccess,
    }
  }

  return {
    allowed: false,
    reason: 'LIMIT_EXCEEDED',
    message: POLICY_MESSAGES.LIMIT_EXCEEDED,
    suggestion: hasBillingAccess ? 'UPGRADE' : 'CONTACT_ADMIN',
    subscription,
    usage,
    hasBillingAccess,
  }
}
