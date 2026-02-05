'use server'
import Stripe from 'stripe'
import { db } from '../db'
import { stripe } from '.'
import { Plan, SubscriptionStatus } from '@/generated/prisma/enums'
import { applyTopUpCreditsFromCheckout } from '@/lib/features/core/billing/credits/grant'

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

    // Update user's trialEligible to false after first subscription
    // Find the user via the agency's membership
    if (isTrialing || isActive) {
      const agencyOwner = await db.user.findFirst({
        where: {
          AgencyMemberships: {
            some: {
              agencyId: agency.id,
              Role: { name: 'AGENCY_OWNER' }
            }
          }
        }
      })

      if (agencyOwner?.trialEligible) {
        await db.user.update({
          where: { id: agencyOwner.id },
          data: { trialEligible: false }
        })
        console.log('🔄 Updated user trialEligible to false:', agencyOwner.id)
      }
    }

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


export const creditTopUpCreated = async (
  checkoutSession: Stripe.Checkout.Session,
  customerId: string
) => {
  try {
    const agencyId = checkoutSession.metadata?.agencyId
    const featureKey = checkoutSession.metadata?.featureKey
    const scope = (checkoutSession.metadata?.scope as any) || 'AGENCY'
    const subAccountId = checkoutSession.metadata?.subAccountId || null
    const credits = Number(checkoutSession.metadata?.credits || checkoutSession.metadata?.quantity || 0)

    if (!agencyId || !featureKey || !scope || credits <= 0) {
      console.error('🔴 Missing agencyId or featureKey in checkout session metadata:', checkoutSession.id)
      throw new Error('Checkout session metadata missing agencyId or featureKey')
    }

    const agency = await db.agency.findUnique({
      where: {
        id: agencyId,
      },
      include: {
        SubAccount: true,
      },
    })

    const subaccount = agency?.SubAccount.find(sa => sa.id === subAccountId) || null

    // Verify the agency or subaccount belongs to the customer
    // Either agency or subaccount must match
    if (!agency && !subaccount) {
      throw new Error(`Could not find agency with id: ${agencyId}`)
    }

    if (agency?.customerId !== customerId && subaccount?.connectAccountId !== customerId) {
      throw new Error(`Could not find agency with id: ${customerId}`)
    }

    const res = await applyTopUpCreditsFromCheckout({
      scope,
      agencyId,
      subAccountId,
      featureKey,
      credits,
      stripeCheckoutSessionId: `topup:${checkoutSession.id}`,
    })

    console.log(`🟢 Processed Credit Top-Up`, {
      agencyId,
      featureKey,
      credits,
      scope,
      subAccountId,
      stripeCheckoutSessionId: `topup:${checkoutSession.id}`,
    })
  } catch (error) {
    console.log('🔴 Error from creditTopUpCreated action', error)
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