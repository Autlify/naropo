import BlurPage from '@/components/global/blur-page'
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
  searchParams: Promise<{
    code?: string
  }>
  params: Promise<{ subaccountId: string }>
}

const LaunchPad = async ({ params, searchParams }: Props) => {
  const { subaccountId } = await params
  const { code } = await searchParams
  
  const subaccountDetails = await db.subAccount.findUnique({
    where: {
      id: subaccountId,
    },
  })

  if (!subaccountDetails) {
    return
  }

  const allDetailsExist =
    subaccountDetails.line1 &&
    subaccountDetails.subAccountLogo &&
    subaccountDetails.city &&
    subaccountDetails.companyEmail &&
    subaccountDetails.companyPhone &&
    subaccountDetails.country &&
    subaccountDetails.name &&
    subaccountDetails.state

  const stripeOAuthLink = getStripeOAuthLink(
    'subaccount',
    `launchpad___${subaccountDetails.id}`
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
      
      await db.subAccount.update({
        where: { id: subaccountId },
        data: { connectAccountId: response.stripe_user_id },
      })
    } catch (error: any) {
      // Log but don't crash - code might already be used (double render) or expired
      console.log('🔴 Could not connect stripe account:', error?.message || error)
    }
    // Always redirect to remove code from URL
    return redirect(`/subaccount/${subaccountId}/launchpad`)
  }

  // Re-fetch to get updated connectAccountId after OAuth
  const updatedSubaccount = await db.subAccount.findUnique({
    where: { id: subaccountId },
    select: { connectAccountId: true },
  })
  
  const connectedStripeAccount = !!updatedSubaccount?.connectAccountId

  return (
    <BlurPage>
      <div className="flex flex-col justify-center items-center">
        <div className="w-full h-full max-w-[800px]">
          <Card className="border-border/50 bg-gradient-to-br from-muted/20 to-transparent">
            <CardHeader>
              <CardTitle>Lets get started!</CardTitle>
              <CardDescription>
                Follow the steps below to get your account setup correctly.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex justify-between items-center w-full h-20 border border-border/50 p-4 rounded-lg bg-gradient-to-br from-muted/30 to-transparent hover:border-foreground/20 transition-all">
                <div className="flex items-center gap-4">
                  <Image
                    src="/appstore.png"
                    alt="App logo"
                    height={80}
                    width={80}
                    className="rounded-md object-contain"
                  />
                  <p>Save the website as a shortcut on your mobile devide</p>
                </div>
                <Button>Start</Button>
              </div>
              <div className="flex justify-between items-center w-full h-20 border border-border/50 p-4 rounded-lg bg-gradient-to-br from-muted/30 to-transparent hover:border-foreground/20 transition-all">
                <div className="flex items-center gap-4">
                  <Image
                    src="/stripelogo.png"
                    alt="App logo"
                    height={80}
                    width={80}
                    className="rounded-md object-contain "
                  />
                  <p>
                    Connect your stripe account to accept payments. Stripe is
                    used to run payouts.
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
              <div className="flex justify-between items-center w-full h-20 border border-border/50 p-4 rounded-lg bg-gradient-to-br from-muted/30 to-transparent hover:border-foreground/20 transition-all">
                <div className="flex items-center gap-4">
                  <Image
                    src={subaccountDetails.subAccountLogo}
                    alt="App logo"
                    height={80}
                    width={80}
                    className="rounded-md object-contain p-4"
                  />
                  <p>Fill in all your business details.</p>
                </div>
                {allDetailsExist ? (
                  <CheckCircleIcon
                    size={50}
                    className=" text-primary p-2 flex-shrink-0"
                  />
                ) : (
                  <Link
                    className="bg-primary py-2 px-4 rounded-md text-white"
                    href={`/subaccount/${subaccountDetails.id}/settings`}
                  >
                    Start
                  </Link>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </BlurPage>
  )
}

export default LaunchPad