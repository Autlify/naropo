import Unauthorized from '@/components/unauthorized'
import { verifyAndAcceptInvitation } from '@/lib/queries' 
import { redirect } from 'next/navigation'
import React from 'react'
import { auth } from '@/auth'
import { db } from '@/lib/db'

type Props = {
  searchParams: Promise<{ state: string; code: string }>
}

const SubAccountMainPage = async ({ searchParams }: Props) => {
  const searchParamsData = await searchParams
  const agencyId = await verifyAndAcceptInvitation()

  if (!agencyId) {
    return <Unauthorized />
  }

  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return <Unauthorized />

  const firstSubaccountWithAccess = await db.subAccountMembership.findFirst({
    where: { userId, isActive: true },
    select: { subAccountId: true },
  })

  if (searchParamsData.state) {
    const statePath = searchParamsData.state.split('___')[0]
    const stateSubaccountId = searchParamsData.state.split('___')[1]
    if (!stateSubaccountId) return <Unauthorized />
    return redirect(
      `/subaccount/${stateSubaccountId}/${statePath}?code=${searchParamsData.code}`
    )
  }

  if (firstSubaccountWithAccess?.subAccountId) {
    return redirect(`/subaccount/${firstSubaccountWithAccess.subAccountId}`)
  }

  return <Unauthorized />
}

export default SubAccountMainPage
