import Stripe from 'stripe'
import { stripe } from '@/lib/stripe'
import { db } from '@/lib/db'
import { makeStripeIdempotencyKey } from '@/lib/stripe/idempotency'
import { PRICING_CONFIG } from '@/lib/registry/plans/pricing-config'
import { syncStripeSubscriptionToDb } from '@/lib/stripe/billing/subscription-sync'

export type SubscriptionPurchaseAction = 'create' | 'update' | 'cancel'
export type AddonPurchaseAction = 'add' | 'remove' | 'list'
export type CreditsPurchaseAction = 'checkout'

export type SubscriptionPurchaseResult = {
  subscriptionId: string
  status: string
  clientSecret?: string
  requiresSetup?: boolean
  trialEnd?: number | null
  message?: string
}

export type AddonPurchaseResult = {
  success: boolean
  message: string
  requiresSubscription?: boolean
  subscriptionItemId?: string
  addons?: any[]
}

export type CreditsPurchaseResult = {
  ok: boolean
  url: string | null
  sessionId: string
}

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

export async function ensureCustomerForAgency(params: {
  agencyId: string
  email?: string | null
  name?: string | null
}): Promise<{ agency: { id: string; customerId: string | null; name: string; companyEmail: string | null }; customerId: string }> {
  const agency = await db.agency.findUnique({
    where: { id: params.agencyId },
    select: { id: true, customerId: true, name: true, companyEmail: true },
  })

  if (!agency) throw new Error('Agency not found')

  let customerId = agency.customerId
  if (!customerId) {
    const idem = makeStripeIdempotencyKey('customer_create', ['agency', agency.id])
    const customer = await stripe.customers.create(
      {
        email: (params.email || agency.companyEmail) || undefined,
        name: params.name || agency.name,
        metadata: { agencyId: agency.id },
      },
      { idempotencyKey: idem }
    )

    customerId = customer.id
    await db.agency.update({ where: { id: agency.id }, data: { customerId } })
  }

  return { agency, customerId }
}

function resolveAddonConfig(addonKey: string) {
  const addonConfig = (PRICING_CONFIG as Record<string, any>)[addonKey]
  if (!addonConfig || addonConfig.type !== 'addon') throw new Error(`Invalid addon key: ${addonKey}`)
  return addonConfig
}

// ---------------------------------------------------------------------------
// Subscription
// ---------------------------------------------------------------------------

export async function purchaseSubscription(params: {
  action: SubscriptionPurchaseAction
  customerId: string
  agencyId: string
  priceId?: string
  coupon?: string
  paymentMethodId?: string
  trialEnabled?: boolean
  trialPeriodDays?: number
  prorationBehavior?: 'create_prorations' | 'none' | 'always_invoice'
}): Promise<SubscriptionPurchaseResult> {
  const {
    action,
    customerId,
    agencyId,
    priceId,
    coupon,
    paymentMethodId,
    trialEnabled,
    trialPeriodDays,
    prorationBehavior,
  } = params

  const agency = await db.agency.findUnique({
    where: { id: agencyId },
    include: { Subscription: true },
  })
  if (!agency) throw new Error('Agency not found')
  if (agency.customerId !== customerId) throw new Error('Agency does not belong to this customer')

  if (action === 'create') {
    if (!priceId) throw new Error('priceId is required')
    if (agency.Subscription) throw new Error('Agency already has a subscription')

    // Attach payment method if provided
    if (paymentMethodId) {
      try {
        await stripe.paymentMethods.attach(paymentMethodId, { customer: customerId })
        await stripe.customers.update(customerId, {
          invoice_settings: { default_payment_method: paymentMethodId },
        })
      } catch {
        // Best-effort; payment method might already be attached.
      }
    }

    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      payment_behavior: trialEnabled ? 'default_incomplete' : 'error_if_incomplete',
      payment_settings: {
        save_default_payment_method: 'on_subscription',
        payment_method_types: ['card'],
      },
      metadata: { agencyId },
      expand: ['latest_invoice.payment_intent', 'pending_setup_intent'],
      ...(coupon && { coupon }),
      ...(trialEnabled && trialPeriodDays && { trial_period_days: trialPeriodDays }),
    })

    await syncStripeSubscriptionToDb({ subscription, customerId })


    const hasTrial =
      Boolean(subscription.trial_end) &&
      (subscription.trial_end as number) > Math.floor(Date.now() / 1000)

    if (hasTrial) {
      const setupIntent = subscription.pending_setup_intent as Stripe.SetupIntent | null
      if (setupIntent?.client_secret) {
        return {
          subscriptionId: subscription.id,
          clientSecret: setupIntent.client_secret,
          status: subscription.status,
          requiresSetup: true,
          trialEnd: subscription.trial_end,
        }
      }

      return {
        subscriptionId: subscription.id,
        status: subscription.status,
        requiresSetup: false,
        trialEnd: subscription.trial_end,
        message: `Trial started`,
      }
    }

    const latestInvoice = subscription.latest_invoice as Stripe.Invoice
    const paymentIntent = (latestInvoice as any)?.payment_intent as Stripe.PaymentIntent | null
    if (paymentIntent?.client_secret) {
      return {
        subscriptionId: subscription.id,
        clientSecret: paymentIntent.client_secret,
        status: subscription.status,
        requiresSetup: false,
      }
    }

    if (latestInvoice?.status === 'paid' || (latestInvoice as any)?.amount_due === 0) {
      return {
        subscriptionId: subscription.id,
        status: subscription.status,
        requiresSetup: false,
        message: 'Subscription activated without payment',
      }
    }

    // Fallback SetupIntent
    const fallbackSetupIntent = await stripe.setupIntents.create({
      customer: customerId,
      payment_method_types: ['card'],
      usage: 'off_session',
    })

    return {
      subscriptionId: subscription.id,
      status: subscription.status,
      clientSecret: fallbackSetupIntent.client_secret || undefined,
      requiresSetup: true,
    }
  }

  if (action === 'update') {
    if (!priceId) throw new Error('priceId is required')
    if (!agency.Subscription?.subscritiptionId) throw new Error('No subscription found')

    const stripeSub = await stripe.subscriptions.retrieve(agency.Subscription.subscritiptionId)
    const currentItem = stripeSub.items.data[0]

    const updated = await stripe.subscriptions.update(agency.Subscription.subscritiptionId, {
      items: [{ id: currentItem.id, price: priceId }],
      proration_behavior: prorationBehavior || 'create_prorations',
      ...(coupon && { coupon }),
      expand: ['latest_invoice.payment_intent'],
    })

    await syncStripeSubscriptionToDb({ subscription: updated, customerId })


    const latestInvoice = updated.latest_invoice as Stripe.Invoice
    const paymentIntent = (latestInvoice as any)?.payment_intent as Stripe.PaymentIntent | null

    return {
      subscriptionId: updated.id,
      status: updated.status,
      clientSecret: paymentIntent?.client_secret || undefined,
      requiresSetup: Boolean(paymentIntent?.client_secret),
    }
  }

  // cancel
  if (!agency.Subscription?.subscritiptionId) throw new Error('No subscription found')
  const canceled = await stripe.subscriptions.cancel(agency.Subscription.subscritiptionId)
  await syncStripeSubscriptionToDb({ subscription: canceled, customerId })
  return {
    subscriptionId: canceled.id,
    status: canceled.status,
    requiresSetup: false,
    message: 'Subscription canceled',
  }
}

// ---------------------------------------------------------------------------
// Add-ons
// ---------------------------------------------------------------------------

export async function purchaseAddon(params: {
  action: AddonPurchaseAction
  agencyId: string
  addonKey?: string
  priceId?: string
}): Promise<AddonPurchaseResult> {
  const { action, agencyId, addonKey, priceId } = params

  const agency = await db.agency.findUnique({
    where: { id: agencyId },
    include: { Subscription: true, AddOns: true },
  })
  if (!agency) throw new Error('Agency not found')

  if (action === 'list') {
    return { success: true, message: 'ok', addons: agency.AddOns || [] }
  }

  if (!addonKey) throw new Error('addonKey is required')
  const addonConfig = resolveAddonConfig(addonKey)

  if (action === 'add') {
    if (!priceId) throw new Error('priceId is required')

    // If no subscription yet, persist desired addon for later.
    if (!agency.Subscription?.subscritiptionId) {
      await db.addOns.upsert({
        where: { agencyId_priceId: { agencyId, priceId } },
        create: { name: addonConfig.name, addonKey, priceId, agencyId, active: true },
        update: { active: true, agencyId, name: addonConfig.name, addonKey },
      })

      return {
        success: true,
        message: 'Addon added. It will be included when you subscribe to a plan.',
        requiresSubscription: true,
      }
    }

    const stripeSub = await stripe.subscriptions.retrieve(agency.Subscription.subscritiptionId)
    const isTrialing = stripeSub.status === 'trialing'

    const subscriptionItem = await stripe.subscriptionItems.create({
      subscription: agency.Subscription.subscritiptionId,
      price: priceId,
      proration_behavior: isTrialing ? 'none' : 'create_prorations',
    })

    const refreshed = await stripe.subscriptions.retrieve(agency.Subscription.subscritiptionId)
    await syncStripeSubscriptionToDb({ subscription: refreshed, customerId: agency.customerId! })


    await db.addOns.upsert({
      where: { agencyId_priceId: { agencyId, priceId } },
      create: { name: addonConfig.name, addonKey, priceId, agencyId, active: true },
      update: { active: true, agencyId, name: addonConfig.name, addonKey },
    })

    return {
      success: true,
      subscriptionItemId: subscriptionItem.id,
      message: `${addonConfig.name} addon added successfully`,
    }
  }

  // remove
  const subId = agency.Subscription?.subscritiptionId
  if (subId) {
    // Try to find matching subscription item and delete it.
    const sub = await stripe.subscriptions.retrieve(subId)
    const item = sub.items.data.find((it) => it.price?.id === priceId)
    if (item) {
      await stripe.subscriptionItems.del(item.id)
    }

    const refreshed = await stripe.subscriptions.retrieve(subId)
    await syncStripeSubscriptionToDb({ subscription: refreshed, customerId: agency.customerId! })
  }

  // mark inactive in DB
  if (priceId) {
    await db.addOns.updateMany({
      where: { agencyId, priceId },
      data: { active: false },
    })
  }

  return { success: true, message: `${addonConfig.name} addon removed` }
}

// ---------------------------------------------------------------------------
// Credits checkout (Stripe Checkout Session)
// ---------------------------------------------------------------------------

export async function purchaseCreditsCheckout(params: {
  baseUrl: string
  agencyId: string
  subAccountId?: string | null
  featureKey: string
  credits: number
  priceId?: string
}): Promise<CreditsPurchaseResult> {
  const { baseUrl, agencyId, subAccountId, featureKey, credits, priceId } = params
  const scope = subAccountId ? 'SUBACCOUNT' : 'AGENCY'

  const creditAmount = Math.max(1, Math.floor(Number(credits) || 0))
  if (creditAmount <= 0) throw new Error('Invalid credit amount')

  const { customerId } = await ensureCustomerForAgency({ agencyId })

  const successUrl = `${baseUrl}/agency/${agencyId}/billing/credits?session_id={CHECKOUT_SESSION_ID}`
  const cancelUrl = `${baseUrl}/agency/${agencyId}/billing/credits`

  // NOTE: This mirrors existing /api/stripe/credits/checkout behavior.
  const pricePerCredit = 1 // cents
  const checkoutSession = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'payment',
    payment_method_types: ['card'],
    ...(priceId
      ? { line_items: [{ price: priceId, quantity: creditAmount }] }
      : {
          line_items: [
            {
              price_data: {
                currency: 'myr',
                unit_amount: pricePerCredit,
                product_data: {
                  name: `${featureKey} Credits`,
                  description: `${creditAmount} credits for ${featureKey}`,
                },
              },
              quantity: creditAmount,
            },
          ],
        }),
    metadata: {
      checkoutType: 'credits',
      type: 'credit_purchase',
      agencyId,
      subAccountId: subAccountId || '',
      scope,
      scopeLevel: subAccountId ? 'subAccount' : 'agency',
      featureKey,
      credits: String(creditAmount),
    },
    success_url: successUrl,
    cancel_url: cancelUrl,
  })

  return { ok: true, url: checkoutSession.url, sessionId: checkoutSession.id }
}
