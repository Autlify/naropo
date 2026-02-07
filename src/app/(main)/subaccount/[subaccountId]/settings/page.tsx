import SubAccountDetails from '@/components/forms/subaccount-details'
import UserDetails from '@/components/forms/user-details'
import BlurPage from '@/components/global/blur-page'
import { db } from '@/lib/db'
import { auth } from '@/auth'
import React from 'react'

type Props = {
  params: Promise<{ subaccountId: string }>
}

const SubaccountSettingPage = async ({ params }: Props) => {
  const { subaccountId } = await params
  const session = await auth()
  if (!session?.user?.email) return
  const userDetails = await db.user.findUnique({
    where: {
      email: session.user.email,
    },
  })
  if (!userDetails) return

  const subAccount = await db.subAccount.findUnique({
    where: { id: subaccountId },
  })
  if (!subAccount) return

  const agencyDetails = await db.agency.findUnique({
    where: { id: subAccount.agencyId },
    include: { SubAccount: true },
  })

  if (!agencyDetails) return
  const subAccounts = agencyDetails.SubAccount

  return (
    <BlurPage>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Manage your subaccount configuration and user preferences</p>
        </div>
        
        <div className="flex lg:!flex-row flex-col gap-6">
          <SubAccountDetails
            agencyDetails={agencyDetails}
            details={subAccount}
            userId={userDetails.id}
            userName={userDetails.name}
          />
          <UserDetails
            type="subaccount"
            id={subaccountId}
            subAccounts={subAccounts}
            userData={userDetails}
          />
        </div>
      </div>
    </BlurPage>
  )
}

export default SubaccountSettingPage
