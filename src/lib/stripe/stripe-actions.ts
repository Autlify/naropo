'use server'
import Stripe from 'stripe'
import { db } from '../db'
import { stripe } from '.'
import { Plan, SubscriptionStatus } from '@/generated/prisma/enums'
import { applyTopUpCreditsFromCheckout } from '@/lib/features/org/billing/credits/grant'
import { PRICING_CONFIG } from '@/lib/registry/plans/pricing-config'
import { syncStripeSubscriptionToDb } from '@/lib/stripe/billing/subscription-sync'

/**
 * Map a Stripe recurring plan priceId -> Prisma Plan enum (STARTER/BASIC/ADVANCED/ENTERPRISE)
 * NOTE: add-ons & credits are NOT plans.
 */
function resolvePlanFromStripePriceId(priceId: string): Plan {
  const hit = Object.entries(PRICING_CONFIG).find(
    ([, cfg]) => (cfg as any)?.type === 'plan' && (cfg as any)?.stripePriceId === priceId
  )

  const key = hit?.[0]
  if (!key) {
    // Fallback: do not hard-crash webhook, but keep DB consistent.
    console.warn('⚠️ Unknown plan priceId; defaulting Plan.STARTER', { priceId })
    return Plan.price_1SzWP7EDFXmtidMA6eacKYD6
  }

  // Prisma Plan enum is expected to have the same keys as PRICING_CONFIG plan keys.
  return (Plan as any)[key] ?? (Plan.price_1SzWP7EDFXmtidMA6eacKYD6 as Plan)
}

export const subscriptionCreated = async (
  subscription: Stripe.Subscription,
  customerId: string
) => {
  try {
    await syncStripeSubscriptionToDb({ subscription, customerId })

    // Update user's trialEligible to false after first subscription/trial
    const agencyId = subscription.metadata?.agencyId
    if (!agencyId) return
    const isTrialing = subscription.status === 'trialing'
    const isActive = subscription.status === 'active' || isTrialing
    if (isTrialing || isActive) {
      const agencyOwner = await db.user.findFirst({
        where: {
          AgencyMemberships: { some: { agencyId, Role: { name: 'AGENCY_OWNER' } } },
        },
        select: { id: true, trialEligible: true },
      })
      if (agencyOwner?.trialEligible) {
        await db.user.update({ where: { id: agencyOwner.id }, data: { trialEligible: false } })
        console.log('🔄 Updated user trialEligible to false:', agencyOwner.id)
      }
    }
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
    // Prefer new unified checkout metadata keys (scopeLevel), but keep legacy support.
    // - Unified checkout uses: scopeLevel = 'agency' | 'subAccount' | 'user'
    // - Legacy credits checkout used: scope = 'AGENCY' | 'SUBACCOUNT'
    const scopeLevel = checkoutSession.metadata?.scopeLevel
    const legacyScope = checkoutSession.metadata?.scope
    const scope = (
      legacyScope ||
      (scopeLevel === 'subAccount' ? 'SUBACCOUNT' : 'AGENCY')
    ) as any
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

    await applyTopUpCreditsFromCheckout({
      scope,
      agencyId,
      subAccountId,
      featureKey,
      credits,
      // IMPORTANT: grant.applyTopUpCreditsFromCheckout prefixes idempotencyKey with "topup:".
      // Pass the raw Stripe session id to avoid creating "topup:topup:<id>".
      stripeCheckoutSessionId: checkoutSession.id,
    })

    console.log(`🟢 Processed Credit Top-Up`, {
      agencyId,
      featureKey,
      credits,
      scope,
      subAccountId,
      stripeCheckoutSessionId: checkoutSession.id,
    })
  } catch (error) {
    console.log('🔴 Error from creditTopUpCreated action', error)
  }
}


export const getConnectAccountProducts = async (stripeAccount: string) => {
  try {
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
  } catch (error: any) {
    // Handle invalid/inaccessible connected accounts gracefully
    if (error?.code === 'account_invalid' || error?.message?.includes('does not have access')) {
      console.warn(`⚠️ Cannot access Stripe Connect account ${stripeAccount}: ${error.message}`)
      return []
    }
    throw error
  }
}