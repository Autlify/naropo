import InfoBar from '@/components/global/infobar'
import Sidebar from '@/components/sidebar'
import Unauthorized from '@/components/unauthorized'
import {
  getAuthUserDetails,
  getNotificationAndUser,
  verifyAndAcceptInvitation,
  hasPermission,
} from '@/lib/queries'
import { auth } from '@/auth'
import { Role } from '@/generated/prisma/client'
import { redirect } from 'next/navigation'
import React from 'react'

type Props = {
  children: React.ReactNode
  params: Promise<{ subaccountId: string }>
}

const SubaccountLayout = async ({ children, params }: Props) => {
  const { subaccountId } = await params
  const agencyId = await verifyAndAcceptInvitation()
  if (!agencyId) return <Unauthorized />
  const session = await auth()
  if (!session?.user) {
    return redirect('/')
  }

  let notifications: any = []

  // Check if user has subaccount access permission
  const hasSubaccountAccess = await hasPermission('subaccount.account.read')
  
  if (!hasSubaccountAccess) {
    return <Unauthorized />
  }

  const allNotifications = await getNotificationAndUser(agencyId)

  // Filter notifications based on permissions
  const canViewAllNotifications = await hasPermission('agency.account.read')

  if (canViewAllNotifications) {
    notifications = allNotifications
  } else {
    const filteredNoti = allNotifications?.filter(
      (item) => item.subAccountId === subaccountId
    )
    if (filteredNoti) notifications = filteredNoti
  }

  return (
    <div className="h-screen overflow-hidden">
      <Sidebar
        id={subaccountId}
        type="subaccount"
      />

      <div className="md:pl-[300px]">
        <InfoBar
          notifications={notifications}
          canFilterBySubAccount={canViewAllNotifications}
          subAccountId={subaccountId}
        />
        <div className="relative">{children}</div>
      </div>
    </div>
  )
} 

export default SubaccountLayout
