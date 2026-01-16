import AgencyDetails from '@/components/forms/agency-details'
import UserDetails from '@/components/forms/user-details'
import { db } from '@/lib/db'
import { auth } from '@/auth'
import React from 'react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Crown, CheckCircle, Lock, ArrowUpCircle } from 'lucide-react'
import Link from 'next/link'
import { pricingCards } from '@/lib/constants'

type Props = {
  params: Promise<{ agencyId: string }>
}

const SettingsPage = async ({ params }: Props) => {
  const { agencyId } = await params
  const session = await auth()
  if (!session?.user?.email) return null

  const userDetails = await db.user.findUnique({
    where: {
      email: session.user.email,
    },
  })

  if (!userDetails) return null
  
  const agencyDetails = await db.agency.findUnique({
    where: {
      id: agencyId,
    },
    include: {
      SubAccount: true,
      Subscription: true,
    },
  })

  if (!agencyDetails) return null

  const subAccounts = agencyDetails.SubAccount
  const subscription = agencyDetails.Subscription
  
  // Determine subscription status
  const isSubscriptionActive = 
    subscription?.active === true &&
    (subscription?.status === 'ACTIVE' || subscription?.status === 'TRIALING')
  
  const isTrialing = subscription?.status === 'TRIALING'
  
  // Get current plan details
  const currentPlan = pricingCards.find(
    (card) => card.priceId === subscription?.priceId
  )
  
  const planTitle = currentPlan?.title || 'Starter'
  const isStarterPlan = planTitle === 'Starter'
  const isUnlimitedPlan = planTitle === 'Unlimited'
  const isAgencyPlan = planTitle === 'Agency'

  return (
    <div className="flex flex-col gap-4">
      
      {/* Existing Settings Forms */}
      <div className="flex lg:!flex-row flex-col gap-8">
        <AgencyDetails data={agencyDetails} />
        <UserDetails
          type="agency"
          id={agencyId}
          subAccounts={subAccounts}
          userData={userDetails}
        />
      </div>
      
    </div>
  )
}

export default SettingsPage
