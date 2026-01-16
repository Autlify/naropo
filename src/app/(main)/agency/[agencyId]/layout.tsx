import BlurPage from '@/components/global/blur-page'
import InfoBar from '@/components/global/infobar'
import Sidebar from '@/components/sidebar'
import Unauthorized from '@/components/unauthorized'
import {
  getNotificationAndUser,
  verifyAndAcceptInvitation
} from '@/lib/queries'
import { hasPermission } from '@/lib/iam/authz/permissions'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import React from 'react'

type Props = {
  children: React.ReactNode
  params: Promise<{ agencyId: string }>
}

const layout = async ({ children, params }: Props) => {
  const { agencyId: paramsAgencyId } = await params
  const agencyId = await verifyAndAcceptInvitation()
  const session = await auth()
  
  if (!session?.user) {
    return redirect('/')
  }

  if (!session.user.email) {
    return redirect('/')
  }

  if (!agencyId) {
    return redirect('/agency')
  }

  // Check if user has agency access permission
  const hasAgencyAccess = await hasPermission('agency.account.read')

  if (!hasAgencyAccess) {
    return <Unauthorized />
  }

  let allNoti: any = []
  const notifications = await getNotificationAndUser(agencyId)
  if (notifications) allNoti = notifications

  // Check permission for filtering notifications
  const canFilterBySubAccount = await hasPermission('subaccount.account.read')

  return (
    <div className="h-screen overflow-hidden">
      <Sidebar
        id={paramsAgencyId}
        type="agency"
      />
      <div className="md:pl-[300px]">
        <InfoBar
          notifications={allNoti}
          canFilterBySubAccount={canFilterBySubAccount}
        />
        <div className="relative">
          <BlurPage>{children}</BlurPage>
        </div>
      </div>
    </div>
  )
}

export default layout
