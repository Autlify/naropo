import InfoBar from '@/components/global/infobar'
import Sidebar from '@/components/sidebar'
import { LayoutWrapper } from '@/components/sidebar/sidebar-context'
import Unauthorized from '@/components/unauthorized'
import {
  getNotificationAndUser,
  verifyAndAcceptInvitation,
} from '@/lib/queries'
import { hasAgencyPermission, hasSubAccountPermission } from '@/lib/features/iam/authz/permissions'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import React from 'react'
import BlurPage from '@/components/global/blur-page'
import { headers } from 'next/headers';
import PermissionVersionSync from '@/components/features/iam/permission-version-sync'


type Props = {
  children: React.ReactNode
  params: Promise<{ subaccountId: string }>
}

const SubaccountLayout = async ({ children, params }: Props) => {
  const { subaccountId } = await params
  const agencyId = await verifyAndAcceptInvitation()
  const pathname = (await headers()).get('x-pathname') || '';
  const hideInfobar = pathname.includes('/funnels/') && pathname.includes('/editor')

  if (!agencyId) return <Unauthorized />
  const session = await auth()
  if (!session?.user) {
    return redirect('/')
  }

  let notifications: any = []

  // Check if user has subaccount access permission
  const hasSubaccountAccess = await hasSubAccountPermission(subaccountId, 'org.subaccount.account.read')

  if (!hasSubaccountAccess) {
    return <Unauthorized />
  }

  const allNotifications = await getNotificationAndUser(agencyId)

  // Filter notifications based on permissions
  const canViewAllNotifications = await hasAgencyPermission(agencyId, 'org.agency.account.read')

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
      <LayoutWrapper
        sidebar={<Sidebar id={subaccountId} type="subaccount" />}
        infobar={
          hideInfobar ? null :
          <InfoBar
            notifications={notifications}
            canFilterBySubAccount={canViewAllNotifications}
            subAccountId={subaccountId}
          />
        }
      >
        <PermissionVersionSync
          agencyId={agencyId}
          subAccountId={subaccountId}
        />
        <BlurPage>{children}</BlurPage>
      </LayoutWrapper>

    </div>
  )
}

export default SubaccountLayout
