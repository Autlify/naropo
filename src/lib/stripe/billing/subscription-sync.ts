import 'server-only'

import Stripe from 'stripe'
import { db } from '@/lib/db'
import { PRICING_CONFIG } from '@/lib/registry/plans/pricing-config'
import { agencyScopeKey } from '@/lib/core/scope-key'
import { resolveEffectiveEntitlementsFromPlanIds } from '@/lib/features/org/billing/entitlements/resolve'
import { writeEntitlementSnapshot, invalidateEntitlementSnapshotsForAgency } from '@/lib/features/org/billing/entitlements/snapshot'
import { ScopeType } from '@/types/sidebar'

type PricingHit = { key: string; type: 'plan' | 'addon' | string }

function classifyPriceId(priceId: string): PricingHit | null {
  for (const [key, cfg] of Object.entries(PRICING_CONFIG as any)) {
    if ((cfg as any)?.stripePriceId === priceId) {
      return { key, type: (cfg as any).type }
    }
  }
  return null
}

export async function syncStripeSubscriptionToDb(params: {
  subscription: Stripe.Subscription
  customerId: string
}) {
  const { subscription, customerId } = params

  const agencyId = subscription.metadata?.agencyId
  if (!agencyId) throw new Error('Subscription metadata missing agencyId')

  const isTrialing = subscription.status === 'trialing'
  const isActive = subscription.status === 'active' || isTrialing

  // Persist the canonical Subscription row (legacy table)
  const items = subscription.items?.data || []
  const planItem = items.find((it) => {
    const pid = it.price?.id
    if (!pid) return false
    const hit = classifyPriceId(pid)
    return hit?.type === 'plan'
  })
  const first = planItem || items[0]
  const planPriceId = first?.price?.id || null

  const currentPeriodEndSec = (subscription as unknown as Stripe.SubscriptionItem).current_period_end as number | undefined
  await db.subscription.upsert({
    where: { agencyId },
    create: {
      agencyId,
      customerId,
      active: isActive,
      status: subscription.status.toUpperCase() as any,
      trialEndedAt: isTrialing && subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
      currentPeriodEndDate: currentPeriodEndSec ? new Date(currentPeriodEndSec * 1000) : new Date(),
      priceId: planPriceId || 'unknown',
      subscritiptionId: subscription.id,
      plan: (planPriceId as any) ?? null,
    } as any,
    update: {
      customerId,
      active: isActive,
      status: subscription.status.toUpperCase() as any,
      trialEndedAt: isTrialing && subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
      currentPeriodEndDate: currentPeriodEndSec ? new Date(currentPeriodEndSec * 1000) : new Date(),
      priceId: planPriceId || 'unknown',
      subscritiptionId: subscription.id,
    },
  })

  const scopeKey = agencyScopeKey(agencyId)

  // SubscriptionItem (low-query read model)
  const currentStripeItemIds = new Set<string>()
  for (const it of items) {
    const stripeItemId = it.id
    currentStripeItemIds.add(stripeItemId)
    const priceId = it.price?.id
    if (!priceId) continue

    const hit = classifyPriceId(priceId)
    const kind = hit?.type === 'addon' ? 'ADDON' : 'PLAN'

    await db.subscriptionItem.upsert({
      where: { stripeSubscriptionItemId: stripeItemId },
      create: {
        scopeKey,
        stripeSubscriptionId: subscription.id,
        stripeSubscriptionItemId: stripeItemId,
        kind: kind as any,
        priceId,
        quantity: it.quantity ?? null,
        status: subscription.status,
      },
      update: {
        scopeKey,
        stripeSubscriptionId: subscription.id,
        kind: kind as any,
        priceId,
        quantity: it.quantity ?? null,
        status: subscription.status,
      },
    })
  }

  // Remove SubscriptionItem rows that no longer exist on the subscription
  await db.subscriptionItem.deleteMany({
    where: {
      scopeKey,
      stripeSubscriptionId: subscription.id,
      stripeSubscriptionItemId: { notIn: Array.from(currentStripeItemIds) },
    },
  })

  // BillingState (low-query read model)
  const addonPriceIds: string[] = []
  const addonKeys: string[] = []
  let planKey: string | null = null

  for (const it of items) {
    const pid = it.price?.id
    if (!pid) continue
    const hit = classifyPriceId(pid)
    if (!hit) continue
    if (hit.type === 'plan') {
      planKey = hit.key
    } else if (hit.type === 'addon') {
      addonPriceIds.push(pid)
      addonKeys.push(hit.key)
    }
  }

  await db.billingState.upsert({
    where: { scopeKey },
    create: {
      scopeKey,
      agencyId,
      customerId,
      subscriptionId: subscription.id,
      planPriceId,
      planKey,
      addonPriceIds: addonPriceIds as any,
      addonKeys: addonKeys as any,
      isTrialing,
      trialEndsAt: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
      currentPeriodEnd: currentPeriodEndSec ? new Date(currentPeriodEndSec * 1000) : null,
    },
    update: {
      agencyId,
      customerId,
      subscriptionId: subscription.id,
      planPriceId,
      planKey,
      addonPriceIds: addonPriceIds as any,
      addonKeys: addonKeys as any,
      isTrialing,
      trialEndsAt: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
      currentPeriodEnd: currentPeriodEndSec ? new Date(currentPeriodEndSec * 1000) : null,
    },
  })

  // AddOns compat table
  for (const addonPid of addonPriceIds) {
    await db.addOns.upsert({
      where: { agencyId_priceId: { agencyId, priceId: addonPid } },
      create: { agencyId, priceId: addonPid, active: isActive , name: addonPid },
      update: { active: isActive },
    })
  }

  // Deactivate any previously-known addons that are no longer present
  await db.addOns.updateMany({
    where: addonPriceIds.length
      ? { agencyId, priceId: { notIn: addonPriceIds } }
      : { agencyId },
    data: { active: false },
  })

  // If subscription is not active/trialing, remove all addon actives
  if (!isActive) {
    await db.addOns.updateMany({ where: { agencyId }, data: { active: false } })
  }

  // EntitlementSnapshot write-through
  await invalidateEntitlementSnapshotsForAgency(agencyId)
  if (isActive && planPriceId) {
    const planIds = [planPriceId, ...addonPriceIds]
    const entitlements = await resolveEffectiveEntitlementsFromPlanIds({
      scope: 'AGENCY',
      agencyId,
      subAccountId: null,
      planIds,
    })
    await writeEntitlementSnapshot({
      scope: 'AGENCY',
      agencyId,
      subAccountId: null,
      entitlements,
      source: 'stripe_sync',
    })
  } else {
    await writeEntitlementSnapshot({
      scope: 'AGENCY',
      agencyId,
      subAccountId: null,
      entitlements: {},
      source: 'stripe_sync',
    })
  }
}
