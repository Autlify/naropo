import { resolveLandingTarget, CONTEXT_COOKIE } from '@/lib/iam/authz/resolver'
import { verifyAndAcceptInvitation } from '@/lib/queries'
import { Plan } from '@/generated/prisma/client'
import { redirect } from 'next/navigation'
import React from 'react'
import { auth } from '@/auth'
import { cookies } from 'next/headers'

const Page = async ({
  searchParams,
}: {
  searchParams: Promise<{ plan?: Plan; state?: string; code?: string }>
}) => {
  const session = await auth()
  if (!session?.user?.id) return redirect('/agency/sign-in')

  const { plan, state, code } = await searchParams

  // Create memberships from pending invites (if any)
  await verifyAndAcceptInvitation()
  const cookieValue = (await cookies()).get(CONTEXT_COOKIE)?.value ?? null

  const landingTarget = await resolveLandingTarget({
    cookieValue,
    agencyPermissionKey: 'agency.account.read',
    subAccountPermissionKey: 'subaccount.account.read',
    billingPermissionKey: 'agency.billing.update',
  })

  if (!landingTarget) {
    if (plan) return redirect(`/site/pricing/checkout/${plan}`)
    return redirect('/site/pricing')
  }

  if (landingTarget.kind === 'agency') {
    const { agencyId, hasInactiveSubscription, permissionKeys } = landingTarget
    const canManageBilling = permissionKeys.includes('agency.billing.update')

    // IMPORTANT: missing subscription is treated as inactive too.
    if (hasInactiveSubscription) {
      return redirect(
        canManageBilling
          ? `/agency/${agencyId}/billing?action=renew`
          : `/agency/${agencyId}/subscription`
      )
    }

    if (plan && canManageBilling) return redirect(`/agency/${agencyId}/billing?plan=${plan}`)
    if (plan && !canManageBilling) return redirect(`/site/pricing/checkout/${plan}`)

    if (state) {
      const [statePath, stateAgencyId] = state.split('___')
      if (stateAgencyId && stateAgencyId === agencyId) {
        return redirect(`/agency/${stateAgencyId}/${statePath}?code=${code ?? ''}`)
      }
    }

    return redirect(landingTarget.href)
  }

  return redirect(landingTarget.href)
}

export default Page
