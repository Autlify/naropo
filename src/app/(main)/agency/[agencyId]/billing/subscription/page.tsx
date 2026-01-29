import React from 'react'
import Link from 'next/link'

import { db } from '@/lib/db'
import { getAgencySubscriptionState } from '@/lib/features/iam/authz/resolver'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { pricingCards } from '@/lib/constants'
import { TrialBanner } from '@/components/billing-sdk/trial-banner'
import { SubscriptionClient } from './_components/subscription-client'



type Props = { params: Promise<{ agencyId: string }> }

export default async function SubscriptionPage({ params }: Props) {
  const { agencyId } = await params

  const agencySubscription = await db.agency.findUnique({
    where: {
      id: agencyId,
    },
    select: {
      customerId: true,
      Subscription: true,
    },
  })

  const sub = pricingCards.find(
    (c) => c.priceId === agencySubscription?.Subscription?.priceId
  )

  const state = await getAgencySubscriptionState(agencyId)

  // Check if in trial
  const subscription = agencySubscription?.Subscription
  const isTrialing = subscription?.status === 'TRIALING'
  const trialEndDate = subscription?.trialEndedAt


  return (
    <div className="space-y-6">
      <Card className="p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold">Subscription</h2>
              <Badge variant={state === 'ACTIVE' ? 'default' : 'secondary'} className="font-mono text-xs">
                {state}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Manage your plan, billing cycle, and cancellation settings.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button asChild variant="outline">
              <Link href="/site/pricing">View plans</Link>
            </Button>
            <SubscriptionClient
              agencyId={agencyId}
              currentPriceId={subscription?.priceId}
              subscriptionId={subscription?.subscritiptionId}
              status={subscription?.status}
            />
          </div>
        </div>

        <Separator className="my-4" />

        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="rounded-lg border bg-card/50 p-3">
            <div className="text-xs text-muted-foreground">Plan</div>
            <div className="mt-1 font-medium">{sub?.title ?? '—'}</div>
          </div>
          <div className="rounded-lg border bg-card/50 p-3">
            <div className="text-xs text-muted-foreground">Renews / Ends</div>
            <div className="mt-1 font-medium">
              {agencySubscription?.Subscription?.currentPeriodEndDate ? new Date(agencySubscription.Subscription.currentPeriodEndDate).toLocaleDateString() : '—'}
            </div>
            {agencySubscription?.Subscription?.cancelAtPeriodEnd ? (
              <div className="mt-1 text-xs text-muted-foreground">Cancels at period end</div>
            ) : null}
          </div>
          <div className="rounded-lg border bg-card/50 p-3">
            <div className="text-xs text-muted-foreground">Status</div>
            <div className="mt-1 font-medium">{agencySubscription?.Subscription?.status ?? '—'}</div>
            {agencySubscription?.Subscription?.trialEndedAt ? (
              <div className="mt-1 text-xs text-muted-foreground">
                Trial ends: {new Date(agencySubscription.Subscription.trialEndedAt).toLocaleDateString()}
              </div>
            ) : null}
          </div>
        </div>

        {!agencySubscription?.Subscription ? (
          <div className="mt-4 rounded-lg border bg-muted/40 p-3 text-sm">
            No subscription is currently associated with this agency. Choose a plan to activate billing.
          </div>
        ) : null}
      </Card>

      <Card className="p-5">
        <h3 className="font-semibold">Details</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          These fields are stored in your database for policy enforcement and internal billing logic.
        </p>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <tbody className="divide-y">
              <tr>
                <td className="py-2 pr-4 text-muted-foreground">Customer ID</td>
                <td className="py-2 font-mono text-xs">{agencySubscription?.Subscription?.customerId ?? '—'}</td>
              </tr>
              <tr>
                <td className="py-2 pr-4 text-muted-foreground">Stripe subscription ID</td>
                <td className="py-2 font-mono text-xs">{agencySubscription?.Subscription?.subscritiptionId ?? '—'}</td>
              </tr>
              <tr>
                <td className="py-2 pr-4 text-muted-foreground">Price ID</td>
                <td className="py-2 font-mono text-xs">{agencySubscription?.Subscription?.priceId ?? '—'}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>

      {/* Trial Banner - shown when in trial period */}
      {isTrialing && trialEndDate && (
        <TrialBanner
          trialEndDate={new Date(trialEndDate)}
          title="Trial Period"
          description="Your trial will end soon. Upgrade to keep your access."
          features={[
            "Unlimited API requests",
            "Advanced analytics dashboard",
            "Priority email support",
            "Custom domain integration",
          ]}
          className="w-full"
        />
      )}
    </div>
  )
}
