import 'server-only'

import { Prisma } from '@/generated/prisma/client'
import type {
  MeteringScope,
  OverageMode,
  UsagePeriod,
} from '@/generated/prisma/client'

import { db } from '@/lib/db'
import { resolveEffectiveEntitlements } from '@/lib/features/org/billing/entitlements/resolve'
import { getUsageWindow } from './period'
import { getOrCreateUsageTracking, UsageTrackingKey } from '@/lib/features/org/billing/usage/track'
import { getUsageEventByIdempotency, createUsageEvent } from '@/lib/features/org/billing/usage/events'
import { consumeCredits } from '@/lib/features/org/billing/credits/consume'
import { getCreditBalance } from '@/lib/features/org/billing/credits/balance' 

export type UsageDecision = {
  allowed: boolean
  reason?:
    | 'NO_SUBSCRIPTION'
    | 'FEATURE_DISABLED'
    | 'LIMIT_EXCEEDED'
    | 'INSUFFICIENT_CREDITS'
    | 'INVALID_SCOPE'

  overageMode?: OverageMode
  currentUsage: number
  quantity: number
  nextUsage: number

  maxAllowed?: number | null
  creditsAvailable?: number
  creditsRequired?: number
}

function n(v: any): number {
  if (v == null) return 0
  const num = Number(v.toString?.() ?? v)
  return Number.isFinite(num) ? num : 0
}

export async function checkUsage(args: {
  scope: MeteringScope
  agencyId: string
  subAccountId?: string | null
  featureKey: string
  quantity: number
  now?: Date
  actionKey?: string | null
}): Promise<UsageDecision> {
  const now = args.now ?? new Date()
  const entitlements = await resolveEffectiveEntitlements({
    scope: args.scope,
    agencyId: args.agencyId,
    subAccountId: args.subAccountId || null,
  }) 

  if (!entitlements.planId) {
    return {
      allowed: false,
      reason: 'NO_SUBSCRIPTION',
      currentUsage: 0,
      quantity: args.quantity,
      nextUsage: args.quantity,
    }
  }

  const ent = entitlements[args.featureKey]
  if (!ent || !ent.isEnabled) {
    return {
      allowed: false,
      reason: 'FEATURE_DISABLED',
      currentUsage: 0,
      quantity: args.quantity,
      nextUsage: args.quantity,
    }
  }

  const period = (ent.period as UsagePeriod | null) ?? 'MONTHLY'
  const { periodStart } = getUsageWindow(period, now)

  const tracking = await db.usageTracking.findUnique({
    where: {
      scope_agencyId_subAccountId_featureKey_periodStart: {
        scope: args.scope,
        agencyId: args.agencyId,
        subAccountId: args.subAccountId || '',
        featureKey: args.featureKey,
        periodStart,
      },
    },
  })

  const currentUsage = n(tracking?.currentUsage)
  const quantity = Math.max(0, Number(args.quantity) || 0)
  const nextUsage = currentUsage + quantity

  const maxAllowed = ent.isUnlimited
    ? null
    : ent.maxInt != null
      ? Number(ent.maxInt)
      : ent.maxDec != null
        ? Number(ent.maxDec)
        : null

  if (maxAllowed == null || nextUsage <= maxAllowed) {
    return {
      allowed: true,
      overageMode: ent.overageMode,
      currentUsage,
      quantity,
      nextUsage,
      maxAllowed,
    }
  }

  // Exceeded.
  const exceedBy = nextUsage - maxAllowed
  if (ent.overageMode !== 'INTERNAL_CREDITS') {
    return {
      allowed: false,
      reason: 'LIMIT_EXCEEDED',
      overageMode: ent.overageMode,
      currentUsage,
      quantity,
      nextUsage,
      maxAllowed,
    }
  }

  const bal = await db.featureCreditBalance.findUnique({
    where: {
      scope_agencyId_subAccountId_featureKey: {
        scope: args.scope,
        agencyId: args.agencyId,
        subAccountId: args.subAccountId || '',
        featureKey: args.featureKey,
      },
    },
  })

  const creditsAvailable = n(bal?.balance)
  if (creditsAvailable < exceedBy) {
    return {
      allowed: false,
      reason: 'INSUFFICIENT_CREDITS',
      overageMode: ent.overageMode,
      currentUsage,
      quantity,
      nextUsage,
      maxAllowed,
      creditsAvailable,
      creditsRequired: exceedBy,
    }
  }

  return {
    allowed: true,
    overageMode: ent.overageMode,
    currentUsage,
    quantity,
    nextUsage,
    maxAllowed,
    creditsAvailable,
    creditsRequired: exceedBy,
  }
}

export async function consumeUsage(args: {
  scope: MeteringScope
  agencyId: string
  subAccountId?: string | null
  featureKey: string
  quantity: number
  actionKey?: string | null
  idempotencyKey: string
  now?: Date
}): Promise<UsageDecision & { creditsConsumed?: number }>
{
  const now = args.now ?? new Date()

  return db.$transaction(async (tx) => {
    const existing = await getUsageEventByIdempotency(tx, args.idempotencyKey)
    if (existing) {
      const quantity = n(existing.quantity)
      return {
        allowed: true,
        currentUsage: 0,
        quantity,
        nextUsage: quantity,
        creditsConsumed: 0,
      }
    }

    const entitlements = await resolveEffectiveEntitlements({
      scope: args.scope,
      agencyId: args.agencyId,
      subAccountId: args.subAccountId ?? null,
    })

    if (!entitlements.planId) {
      return {
        allowed: false,
        reason: 'NO_SUBSCRIPTION',
        currentUsage: 0,
        quantity: args.quantity,
        nextUsage: args.quantity,
      }
    }

    const ent = entitlements[args.featureKey]
    if (!ent || !ent.isEnabled) {
      return {
        allowed: false,
        reason: 'FEATURE_DISABLED',
        currentUsage: 0,
        quantity: args.quantity,
        nextUsage: args.quantity,
      }
    }

    const period = (ent.period as UsagePeriod | null) ?? 'MONTHLY'
    const { periodStart, periodEnd } = getUsageWindow(period, now)

    const tracking = await getOrCreateUsageTracking(tx, {
      scope: args.scope,
      agencyId: args.agencyId,
      subAccountId: args.subAccountId || '',
      featureKey: args.featureKey,
      periodStart,
    } as UsageTrackingKey, {periodStart, periodEnd}, period as UsagePeriod)

    const currentUsage = n(tracking.currentUsage)
    const quantity = Math.max(0, Number(args.quantity) || 0)
    const nextUsage = currentUsage + quantity

    const maxAllowed = ent.isUnlimited
      ? null
      : ent.maxInt != null
        ? Number(ent.maxInt)
        : ent.maxDec != null
          ? Number(ent.maxDec)
          : null

    let creditsConsumed = 0

    if (maxAllowed != null && nextUsage > maxAllowed) {
      const exceedBy = nextUsage - maxAllowed
      if (ent.overageMode !== 'INTERNAL_CREDITS') {
        return {
          allowed: false,
          reason: 'LIMIT_EXCEEDED',
          overageMode: ent.overageMode,
          currentUsage,
          quantity,
          nextUsage,
          maxAllowed,
        }
      }

      // Consume internal credits for the exceeded portion.
      const bal = await getCreditBalance(tx, {
        scope: args.scope,
        agencyId: args.agencyId,
        subAccountId: args.subAccountId ?? null,
        featureKey: args.featureKey,
      })

      const available = n(bal?.balance)
      if (available < exceedBy) {
        return {
          allowed: false,
          reason: 'INSUFFICIENT_CREDITS',
          overageMode: ent.overageMode,
          currentUsage,
          quantity,
          nextUsage,
          maxAllowed,
          creditsAvailable: available,
          creditsRequired: exceedBy,
        }
      }

      creditsConsumed = exceedBy
      await consumeCredits(tx, {
        scope: args.scope,
        agencyId: args.agencyId,
        subAccountId: args.subAccountId ?? null,
        featureKey: args.featureKey,
        amount: exceedBy,
        idempotencyKey: `consume:${args.idempotencyKey}`,
        reason: `Usage overage for ${args.featureKey}`,
        // REMOVED: periodStart AND periodEnd are not part of ConsumeCreditsArgs
      })
    }

    await createUsageEvent(tx, {
      scope: args.scope,
      agencyId: args.agencyId,
      subAccountId: args.subAccountId ?? null,
      featureKey: args.featureKey,
      quantity: new Prisma.Decimal(quantity),
      actionKey: args.actionKey ?? null,
      idempotencyKey: args.idempotencyKey,
    })

    await tx.usageTracking.update({
      where: { id: tracking.id },
      data: {
        currentUsage: new Prisma.Decimal(nextUsage),
        lastEventAt: now,
      },
    })

    return {
      allowed: true,
      overageMode: ent.overageMode,
      currentUsage,
      quantity,
      nextUsage,
      maxAllowed,
      creditsConsumed,
    }
  })
}
