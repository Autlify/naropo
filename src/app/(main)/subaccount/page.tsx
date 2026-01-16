import Unauthorized from '@/components/unauthorized'
import { getAuthUserDetails, verifyAndAcceptInvitation } from '@/lib/queries'
import { redirect } from 'next/navigation'
import React from 'react'

type Props = {
  searchParams: Promise<{ state: string; code: string }>
}

const SubAccountMainPage = async ({ searchParams }: Props) => {
  const searchParamsData = await searchParams
  const agencyId = await verifyAndAcceptInvitation()

  if (!agencyId) {
    return <Unauthorized />
  }

  const user = await getAuthUserDetails()
  if (!user) return

  const firstSubaccountWithAccess = user.SubAccountMemberships?.find(
    (membership) => membership.isActive === true
  )

  if (searchParamsData.state) {
    const statePath = searchParamsData.state.split('___')[0]
    const stateSubaccountId = searchParamsData.state.split('___')[1]
    if (!stateSubaccountId) return <Unauthorized />
    return redirect(
      `/subaccount/${stateSubaccountId}/${statePath}?code=${searchParamsData.code}`
    )
  }

  if (firstSubaccountWithAccess) {
    return redirect(`/subaccount/${firstSubaccountWithAccess.subAccountId}`)
  }

  return <Unauthorized />
}

export default SubAccountMainPage
