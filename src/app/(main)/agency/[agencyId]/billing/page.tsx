import React from 'react'
import { stripe } from '@/lib/stripe'
import { addOnProducts, pricingCards } from '@/lib/constants'
import { db } from '@/lib/db'
import { Separator } from '@/components/ui/separator'
import PricingCard from './_components/pricing-card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import clsx from 'clsx'
import SubscriptionHelper from './_components/subscription-helper'

type Props = {
  params: Promise<{ agencyId: string }>
}

const page = async ({ params }: Props) => {
  const { agencyId } = await params
  
  //CHALLENGE : Create the add on  products
  const addOns = await stripe.products.list({
    ids: addOnProducts.map((product) => product.id),
    expand: ['data.default_price'],
  })

  const agencySubscription = await db.agency.findUnique({
    where: {
      id: agencyId,
    },
    select: {
      customerId: true,
      Subscription: true,
    },
  })

  const prices = await stripe.prices.list({
    product: process.env.NEXT_AUTLIFY_PRODUCT_ID,
    active: true,
  })

  const currentPlanDetails = pricingCards.find(
    (c) => c.priceId === agencySubscription?.Subscription?.priceId
  )

  // Check if subscription is truly active (both ACTIVE and TRIALING are considered active)
  const isSubscriptionActive = 
    agencySubscription?.Subscription?.active === true &&
    (agencySubscription?.Subscription?.status === 'ACTIVE' || 
     agencySubscription?.Subscription?.status === 'TRIALING')

  const charges = await stripe.charges.list({
    limit: 50,
    customer: agencySubscription?.customerId,
  })

  const invoices = await stripe.invoices.list({
    limit: 50,
    customer: agencySubscription?.customerId,
  })

  const allCharges = [
    ...charges.data.map((charge) => ({
      description: charge.description,
      id: charge.id,
      date: `${new Date(charge.created * 1000).toLocaleTimeString()} ${new Date(
        charge.created * 1000
      ).toLocaleDateString()}`,
      status: 'Paid',
      amount: `RM ${charge.amount / 100}`,
    })),
    ...invoices.data.map((invoice) => ({
      description: invoice.lines.data[0]?.description || 'Subscription Invoice',
      id: invoice.id,
      date: `${new Date(invoice.created * 1000).toLocaleTimeString()} ${new Date(
        invoice.created * 1000
      ).toLocaleDateString()}`,
      status: invoice.status === 'paid' ? 'Paid' : invoice.status === 'open' ? 'Pending' : 'Failed',
      amount: `RM ${(invoice.amount_paid / 100).toFixed(2)}`,
    })),
  ].sort((a, b) => {
    const dateA = new Date(a.date.split(' ').slice(1).join(' '))
    const dateB = new Date(b.date.split(' ').slice(1).join(' '))
    return dateB.getTime() - dateA.getTime()
  })

  return (
    <>
      <SubscriptionHelper
        prices={prices.data}
        customerId={agencySubscription?.customerId || ''}
        planExists={isSubscriptionActive}
        subscriptionStatus={agencySubscription?.Subscription?.status || null}
        trialEndDate={agencySubscription?.Subscription?.trialEndedAt || null}
        currentPeriodEndDate={agencySubscription?.Subscription?.currentPeriodEndDate || null}
        planTitle={currentPlanDetails?.title}
        currentPriceId={agencySubscription?.Subscription?.priceId}
      />
      <h1 className="text-4xl mb-2">Billing</h1>
      <Separator className="mb-8" />
      <h2 className="text-2xl mb-6">Current Plan</h2>
      <div className="flex flex-col lg:!flex-row justify-between gap-8 mb-12">
        <PricingCard
          planExists={isSubscriptionActive}
          prices={prices.data}
          customerId={agencySubscription?.customerId || ''}
          amt={
            isSubscriptionActive
              ? currentPlanDetails?.price || 'Free'
              : 'Free'
          }
          buttonCta={
            isSubscriptionActive
              ? 'Change Plan'
              : 'Get Started'
          }
          highlightDescription="Want to modify your plan? You can do this here. If you have
          further question contact support@autlify.com"
          highlightTitle="Plan Options"
          description={
            isSubscriptionActive
              ? currentPlanDetails?.description || 'Lets get started'
              : 'Lets get started! Pick a plan that works best for you.'
          }
          duration="/ month"
          features={
            isSubscriptionActive
              ? currentPlanDetails?.features || []
              : currentPlanDetails?.features ||
                pricingCards.find((pricing) => pricing.title === 'Starter')
                  ?.features ||
                []
          }
          title={
            isSubscriptionActive
              ? currentPlanDetails?.title || 'Starter'
              : 'Starter'
          }
        />
        {addOns.data.map((addOn) => (
          <PricingCard
            planExists={isSubscriptionActive}
            prices={prices.data}
            customerId={agencySubscription?.customerId || ''}
            key={addOn.id}
            amt={
              //@ts-ignore
              addOn.default_price?.unit_amount
                ? //@ts-ignore
                  `RM ${addOn.default_price.unit_amount / 100}`
                : 'RM 0'
            }
            buttonCta="Subscribe"
            description="Dedicated support line & teams channel for support"
            duration="/ month"
            features={[]}
            title={'24/7 priority support'}
            highlightTitle="Get support now!"
            highlightDescription="Get priority support and skip the long long with the click of a button."
          />
        ))}
      </div>
      <h2 className="text-2xl mb-6 mt-8">Payment History</h2>
      <Table className="bg-card border-[1px] border rounded-md">
        <TableHeader className="rounded-md">
          <TableRow>
            <TableHead className="w-[200px]">Description</TableHead>
            <TableHead className="w-[200px]">Invoice Id</TableHead>
            <TableHead className="w-[300px]">Date</TableHead>
            <TableHead className="w-[200px]">Paid</TableHead>
            <TableHead className="text-right">Amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="font-medium truncate">
          {allCharges.map((charge) => (
            <TableRow key={charge.id}>
              <TableCell>{charge.description}</TableCell>
              <TableCell className="text-muted-foreground">
                {charge.id}
              </TableCell>
              <TableCell>{charge.date}</TableCell>
              <TableCell>
                <p
                  className={clsx('', {
                    'text-emerald-500': charge.status.toLowerCase() === 'paid',
                    'text-orange-600':
                      charge.status.toLowerCase() === 'pending',
                    'text-red-600': charge.status.toLowerCase() === 'failed',
                  })}
                >
                  {charge.status.toUpperCase()}
                </p>
              </TableCell>
              <TableCell className="text-right">{charge.amount}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </>
  )
}

export default page
