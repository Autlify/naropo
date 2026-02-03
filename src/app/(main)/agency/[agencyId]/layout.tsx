import BlurPage from '@/components/global/blur-page'
import InfoBar from '@/components/global/infobar'
import Sidebar from '@/components/sidebar-01'
import { LayoutWrapper } from '@/components/sidebar-01/layout-wrapper'
import Unauthorized from '@/components/unauthorized'
import {
  getNotificationAndUser,
  verifyAndAcceptInvitation,
} from '@/lib/queries'
import { hasAgencyPermission } from '@/lib/features/iam/authz/permissions'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import React from 'react' 

type Props = {
  children: React.ReactNode
  params: Promise<{ agencyId: string }>
}

const Layout = async ({ children, params }: Props) => {
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
  const hasAgencyAccess = await hasAgencyPermission(paramsAgencyId, 'core.agency.account.read')

  if (!hasAgencyAccess) {
    return <Unauthorized />
  }

  let allNoti: any = []
  const notifications = await getNotificationAndUser(agencyId)
  if (notifications) allNoti = notifications

  // Check permission for filtering notifications
  const canFilterBySubAccount = await hasAgencyPermission(paramsAgencyId,'core.subaccount.account.read')

  return (
    <LayoutWrapper
      sidebar={<Sidebar id={paramsAgencyId} type="agency" />}
      infobar={
        <InfoBar
          notifications={allNoti}
          canFilterBySubAccount={canFilterBySubAccount}
        />
      }
    >
      <BlurPage>{children}</BlurPage>
    </LayoutWrapper>
  )
}

export default Layout