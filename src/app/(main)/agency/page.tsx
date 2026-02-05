import { resolveLandingTarget, CONTEXT_COOKIE } from '@/lib/features/iam/authz/resolver'
import { verifyAndAcceptInvitation } from '@/lib/queries'
import { Plan } from '@/generated/prisma/client'
import { redirect } from 'next/navigation' 
import { cookies } from 'next/headers'  
import { auth } from '@/auth'


const Page = async ({
  searchParams,
}: {
  searchParams: Promise<{ plan?: Plan; state?: string; code?: string }>
}) => {
  const session = await auth()
  const cookieStore = await cookies() 
  if (!session?.user?.id) return redirect('/agency/sign-in')

  const { plan, state, code } = await searchParams

  // Create memberships from pending invites (if any)
  await verifyAndAcceptInvitation()

  const cookieValue = cookieStore.get(CONTEXT_COOKIE)?.value ?? null

  const landingTarget = await resolveLandingTarget({
    cookieValue,
    agencyPermissionKey: 'core.agency.account.read',
    subAccountPermissionKey: 'core.subaccount.account.read',
    billingPermissionKey: 'core.billing.account.view',
  })

  if (!landingTarget) {
    if (plan) return redirect(`/site/pricing/checkout/${plan}`)
    return redirect('/site/pricing')
  }

  if (landingTarget.kind === 'agency') {
    const { agencyId, hasInactiveSubscription, permissionKeys } = landingTarget
    const canManageBilling = permissionKeys.includes('core.billing.account.manage')

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

    // Handle OAuth callback - use stateAgencyId from state, not landingTarget
    if (state && code) {
      const [statePath, stateAgencyId] = state.split('___')
      if (stateAgencyId) {
        return redirect(`/agency/${stateAgencyId}/${statePath}?code=${code}`)
      }
    }

    return redirect(landingTarget.href)
  }

  return redirect(landingTarget.href)
}

export default Page
