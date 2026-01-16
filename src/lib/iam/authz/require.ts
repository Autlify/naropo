import 'server-only'

import { redirect, notFound } from 'next/navigation'
import {
  getAgencySubscriptionState,
  resolveCurrentAgencyContext,
  resolveCurrentSubAccountContext,
} from '@/lib/iam/authz/resolver'

type FailMode = 'redirect' | 'notFound' | 'throw'

class AuthzError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AuthzError'
  }
}

const normalize = (k: string) => k.trim()

const fail = (mode: FailMode, redirectTo: string, message: string): never => {
  if (mode === 'notFound') notFound()
  if (mode === 'throw') throw new AuthzError(message)
  redirect(redirectTo)
}

export const requirePermission = async (args: {
  permissionKeys: string[]
  requiredKeys: string[] // all required
  failMode?: FailMode
  redirectTo?: string
}) => {
  const failMode = args.failMode ?? 'redirect'
  const redirectTo = args.redirectTo ?? '/'

  const keys = args.permissionKeys.map(normalize)
  const required = args.requiredKeys.map(normalize).filter(Boolean)

  const ok = required.every((k) => keys.includes(k))
  if (!ok) fail(failMode, redirectTo, `Missing permissions: ${required.join(', ')}`)
}

export const requireAgencyAccess = async (args: {
  agencyId: string
  permissionKey?: string
  permissionKeys?: string[]
  requireActiveSubscription?: boolean
  billingPermissionKey?: string
  failMode?: FailMode
  redirectTo?: string
  subscriptionRedirectTo?: (p: { agencyId: string; canManageBilling: boolean }) => string
}) => {
  const failMode = args.failMode ?? 'redirect'
  const redirectTo = args.redirectTo ?? '/agency/sign-in'
  const billingPermissionKey = args.billingPermissionKey ?? 'agency.billing.update'

  const ctx = await resolveCurrentAgencyContext({ agencyId: args.agencyId })
  if (!ctx) return fail(failMode, redirectTo, 'No agency membership')

  const requiredKeys =
    args.permissionKeys?.length
      ? args.permissionKeys
      : args.permissionKey
        ? [args.permissionKey]
        : ['agency.account.read']

  await requirePermission({
    permissionKeys: ctx?.permissionKeys || [],
    requiredKeys,
    failMode,
    redirectTo,
  })

  const mustHaveActiveSub = args.requireActiveSubscription ?? true
  if (mustHaveActiveSub && ctx.subscriptionState !== 'ACTIVE') {
    const canManageBilling = ctx.permissionKeys.includes(billingPermissionKey)
    const target =
      args.subscriptionRedirectTo?.({ agencyId: ctx.agencyId, canManageBilling }) ??
      (canManageBilling
        ? `/agency/${ctx.agencyId}/billing?action=renew`
        : `/agency/${ctx.agencyId}/subscription`)

    fail('redirect', target, 'Inactive or missing subscription')
  }
  return ctx
}

export const requireSubAccountAccess = async (args: {
  subAccountId: string
  permissionKey?: string
  permissionKeys?: string[]
  requireActiveAgencySubscription?: boolean
  billingPermissionKey?: string
  failMode?: FailMode
  redirectTo?: string
  subscriptionRedirectTo?: (p: { agencyId: string; canManageBilling: boolean }) => string
}) => {
  const failMode = args.failMode ?? 'redirect'
  const redirectTo = args.redirectTo ?? '/agency/sign-in'
  const billingPermissionKey = args.billingPermissionKey ?? 'agency.billing.update'

  const ctx = await resolveCurrentSubAccountContext({ subAccountId: args.subAccountId })
  if (!ctx) return fail(failMode, redirectTo, 'No subaccount membership')

  const requiredKeys =
    args.permissionKeys?.length
      ? args.permissionKeys
      : args.permissionKey
        ? [args.permissionKey]
        : ['subaccount.account.read']

  await requirePermission({
    permissionKeys: ctx.permissionKeys,
    requiredKeys,
    failMode,
    redirectTo,
  })

  const mustHaveActiveAgencySub = args.requireActiveAgencySubscription ?? true
  if (mustHaveActiveAgencySub) {
    const state = await getAgencySubscriptionState(ctx.agencyId)
    if (state !== 'ACTIVE') {
      // Determine billing capability (from agency context, if any).
      const agencyCtx = await resolveCurrentAgencyContext({ agencyId: ctx.agencyId })
      const canManageBilling = !!agencyCtx?.permissionKeys.includes(billingPermissionKey)

      const target =
        args.subscriptionRedirectTo?.({ agencyId: ctx.agencyId, canManageBilling }) ??
        (canManageBilling
          ? `/agency/${ctx.agencyId}/billing?action=renew`
          : `/agency/${ctx.agencyId}/subscription`)

      fail('redirect', target, 'Inactive or missing agency subscription')
    }
  }

  return ctx
}
