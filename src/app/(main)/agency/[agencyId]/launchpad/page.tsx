import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { db } from '@/lib/db'
import { stripe } from '@/lib/stripe'
import { getStripeOAuthLink } from '@/lib/utils'
import { CheckCircleIcon } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import React from 'react'
import { redirect } from 'next/navigation'

type Props = {
  params: Promise<{
    agencyId: string
  }>
  searchParams: Promise<{ code?: string }>
}

const LaunchPadPage = async ({ params, searchParams }: Props) => {
  const { agencyId } = await params
  const { code } = await searchParams
  
  const agencyDetails = await db.agency.findUnique({
    where: { id: agencyId },
  })

  if (!agencyDetails) return

  const allDetailsExist =
    agencyDetails.agencyLogo &&
    agencyDetails.city &&
    agencyDetails.companyEmail &&
    agencyDetails.companyPhone &&
    agencyDetails.country &&
    agencyDetails.name &&
    agencyDetails.state &&
    agencyDetails.postalCode

  const stripeOAuthLink = getStripeOAuthLink(
    'agency',
    `launchpad___${agencyDetails.id}`
  )

  // Handle OAuth callback
  if (code) {
    try {
      const response = await stripe.oauth.token({
        grant_type: 'authorization_code',
        code,
      })
      
      // Verify connection works before saving
      await stripe.accounts.retrieve({
        stripeAccount: response.stripe_user_id,
      })
      
      await db.agency.update({
        where: { id: agencyId },
        data: { connectAccountId: response.stripe_user_id },
      })
    } catch (error: any) {
      // Log but don't crash - code might already be used (double render) or expired
      console.log('🔴 Could not connect stripe account:', error?.message || error)
    }
    // Always redirect to remove code from URL
    return redirect(`/agency/${agencyId}/launchpad`)
  }

  // Re-fetch to get updated connectAccountId after OAuth
  const updatedAgency = await db.agency.findUnique({
    where: { id: agencyId },
    select: { connectAccountId: true },
  })
  
  const connectedStripeAccount = !!updatedAgency?.connectAccountId

  return (
    <div className="flex flex-col justify-center items-center">
      <div className="w-full h-full max-w-[800px]">
        <Card className="border-border/50 bg-gradient-to-br from-muted/20 to-transparent">
          <CardHeader>
            <CardTitle>Lets get started!</CardTitle>
            <CardDescription>
              Follow the steps below to get your account setup.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex justify-between items-center w-full border border-border/50 p-4 rounded-lg gap-2 bg-gradient-to-br from-muted/30 to-transparent hover:border-foreground/20 transition-all">
              <div className="flex md:items-center gap-4 flex-col md:!flex-row">
                <Image
                  src="/appstore.png"
                  alt="app logo"
                  height={80}
                  width={80}
                  className="rounded-md object-contain"
                />
                <p> Save the website as a shortcut on your mobile device</p>
              </div>
              <Button>Start</Button>
            </div>
            <div className="flex justify-between items-center w-full border border-border/50 p-4 rounded-lg gap-2 bg-gradient-to-br from-muted/30 to-transparent hover:border-foreground/20 transition-all">
              <div className="flex md:items-center gap-4 flex-col md:!flex-row">
                <Image
                  src={'/logos/stripe.svg'}
                  alt="app logo"
                  height={80}
                  width={80}
                  className="rounded-md object-contain"
                />
                <p>
                  Connect your stripe account to accept payments and see your
                  dashboard.
                </p>
              </div>
              {connectedStripeAccount ? (
                <CheckCircleIcon
                  size={50}
                  className=" text-primary p-2 flex-shrink-0"
                />
              ) : (
                <Link
                  className="bg-primary py-2 px-4 rounded-md text-white"
                  href={stripeOAuthLink}
                >
                  Start
                </Link>
              )}
            </div>
            <div className="flex justify-between items-center w-full border border-border/50 p-4 rounded-lg gap-2 bg-gradient-to-br from-muted/30 to-transparent hover:border-foreground/20 transition-all">
              <div className="flex md:items-center gap-4 flex-col md:!flex-row">
                <Image
                  src={agencyDetails.agencyLogo || "/assets/glassmorphism/organization.svg"}
                  alt="app logo"
                  height={80}
                  width={80}
                  className="rounded-md object-contain"
                />
                <p> Fill in all your bussiness details</p>
              </div>
              {allDetailsExist ? (
                <CheckCircleIcon
                  size={50}
                  className="text-primary p-2 flex-shrink-0"
                />
              ) : (
                <Link
                  className="bg-primary py-2 px-4 rounded-md text-white"
                  href={`/agency/${agencyId}/settings`}
                >
                  Start
                </Link>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default LaunchPadPage