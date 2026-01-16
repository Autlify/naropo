'use server'
import Stripe from 'stripe'
import { db } from '../db'
import { stripe } from '.'
import { Plan, SubscriptionStatus } from '@/generated/prisma/enums'
import { pricingCards } from '@/lib/constants'

export const subscriptionCreated = async (
  subscription: Stripe.Subscription,
  customerId: string
) => {
  try {
    // Get agencyId from subscription metadata (agency created before subscription)
    const agencyId = subscription.metadata?.agencyId
    
    if (!agencyId) {
      console.error('🔴 No agencyId in subscription metadata:', subscription.id)
      throw new Error('Subscription metadata missing agencyId')
    }

    const agency = await db.agency.findUnique({
      where: {
        id: agencyId,
      },
      include: {
        SubAccount: true,
        Subscription: true,
      },
    })
    
    if (!agency) {
      throw new Error(`Could not find agency with id: ${agencyId}`)
    }
    
    // Verify the agency belongs to the customer
    if (agency.customerId !== customerId) {
      throw new Error(`Agency ${agencyId} does not belong to customer ${customerId}`)
    }

    const isTrialing = subscription.status === 'trialing'
    const isActive = subscription.status === 'active' || isTrialing

    const trialEndedAt = isTrialing && subscription.trial_end ? new Date(subscription.trial_end * 1000) : agency.Subscription?.trialEndedAt

    // Get subscription item - Stripe webhook includes items.data
    const subscriptionItem = subscription.items?.data?.[0]
    if (!subscriptionItem) {
      throw new Error(`Subscription ${subscription.id} has no items`)
    }

    // Get price info - use price object if available, fallback to plan
    const priceId = subscriptionItem.price?.id || subscriptionItem.plan?.id
    const currentPeriodEnd = subscriptionItem.current_period_end
    
    if (!priceId || !currentPeriodEnd) {
      throw new Error(`Missing price or period info in subscription ${subscription.id}`)
    }

    const data = {
      active: isActive,
      agencyId: agency.id,
      customerId,
      status: subscription.status.toUpperCase() as SubscriptionStatus,
      trialEndedAt,
      currentPeriodEndDate: new Date(currentPeriodEnd * 1000),
      priceId: priceId,
      subscritiptionId: subscription.id,
      //@ts-ignore
      plan: priceId as Plan,
    }

    const res = await db.subscription.upsert({
      where: {
        agencyId: agency.id,
      },
      create: data,
      update: data,
    })

    console.log(`🟢 Created/Updated Subscription`, {
      subscriptionId: subscription.id,
      status: subscription.status,
      active: isActive,
      trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
    })
  } catch (error) {
    console.log('🔴 Error from subscriptionCreated action', error)
  }
}

export const getConnectAccountProducts = async (stripeAccount: string) => {
  const products = await stripe.products.list(
    {
      limit: 50,
      expand: ['data.default_price'],
    },
    {
      stripeAccount,
    }
  )
  return products.data
}