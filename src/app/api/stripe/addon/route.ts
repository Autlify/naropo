import { db } from '@/lib/db'
import { stripe } from '@/lib/stripe'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { PRICING_CONFIG } from '@/lib/registry/plans/pricing-config'

/**
 * POST /api/stripe/addon
 * 
 * Manages add-ons for a subscription.
 * Handles add, remove, and list actions.
 * 
 * Request body:
 * - action: 'add' | 'remove' | 'list' - The action to perform
 * - agencyId: string - Agency ID to associate the addon with
 * - addonKey: string (for add/remove) - The addon key (e.g., 'FI_GL', 'PRIORITY_SUPPORT')
 * - priceId: string (for add) - Stripe price ID for the addon
 * 
 * Note: customerId is derived from the agency record, not required in request.
 * 
 * Returns:
 * - success: boolean
 * - addons: array (for list action) - List of active addons
 * - subscriptionItemId: string (for add action) - ID of the new subscription item
 * - message: string - Human-readable message
 */
export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { action, agencyId, addonKey, priceId } = body

        if (!action || !agencyId) {
            return NextResponse.json(
                { error: 'action and agencyId are required' },
                { status: 400 }
            )
        }

        // Fetch agency with subscription and addons - customerId is derived from agency
        const agency = await db.agency.findUnique({
            where: { id: agencyId },
            include: { Subscription: true, AddOns: true },
        })

        if (!agency) {
            return NextResponse.json({ error: 'Agency not found' }, { status: 404 })
        }

        // Derive customerId from agency
        const customerId = agency.customerId
        if (!customerId) {
            return NextResponse.json(
                { error: 'Agency does not have a Stripe customer ID' },
                { status: 400 }
            )
        }

        switch (action) {
            case 'add':
                return await handleAddAddon({
                    customerId,
                    agencyId,
                    addonKey,
                    priceId,
                    subscription: agency.Subscription,
                    existingAddons: agency.AddOns,
                })

            case 'remove':
                return await handleRemoveAddon({
                    agencyId,
                    addonKey,
                    subscription: agency.Subscription,
                    existingAddons: agency.AddOns,
                })

            case 'list':
                return await handleListAddons({
                    agencyId,
                    existingAddons: agency.AddOns,
                })

            default:
                return NextResponse.json(
                    { error: `Invalid action: ${action}. Must be 'add', 'remove', or 'list'` },
                    { status: 400 }
                )
        }
    } catch (error) {
        console.error('🔴 Addon action error:', error)
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        return NextResponse.json(
            { error: 'Failed to process addon action', details: errorMessage },
            { status: 500 }
        )
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// ADD - Add an addon to subscription
// ─────────────────────────────────────────────────────────────────────────────
async function handleAddAddon(params: {
    customerId: string
    agencyId: string
    addonKey?: string
    priceId?: string
    subscription: any
    existingAddons: any[]
}) {
    const { customerId, agencyId, addonKey, priceId, subscription, existingAddons } = params

    if (!addonKey || !priceId) {
        return NextResponse.json(
            { error: 'addonKey and priceId are required for add action' },
            { status: 400 }
        )
    }

    // Check if addon already exists
    const existingAddon = existingAddons.find(a => a.priceId === priceId)
    if (existingAddon && existingAddon.active) {
        return NextResponse.json(
            { error: 'Addon is already active for this agency' },
            { status: 400 }
        )
    }

    // Validate addon key exists in config
    const addonConfig = (PRICING_CONFIG as Record<string, any>)[addonKey]
    if (!addonConfig || addonConfig.type !== 'addon') {
        return NextResponse.json(
            { error: `Invalid addon key: ${addonKey}` },
            { status: 400 }
        )
    }

    // Check if agency has an active subscription
    if (!subscription?.subscritiptionId) {
        // No subscription - addon will be stored in DB for future subscription
        // Create or update addon record
        await db.addOns.upsert({
            where: { priceId },
            create: {
                name: addonConfig.name,
                priceId,
                agencyId,
                active: true,
            },
            update: {
                active: true,
            },
        })

        return NextResponse.json({
            success: true,
            message: 'Addon added. It will be included when you subscribe to a plan.',
            requiresSubscription: true,
        })
    }

    // Agency has a subscription - add addon as subscription item
    console.log('➕ Adding addon to subscription:', subscription.subscritiptionId)

    try {
        // Add new item to existing subscription
        const subscriptionItem = await stripe.subscriptionItems.create({
            subscription: subscription.subscritiptionId,
            price: priceId,
            proration_behavior: 'create_prorations',
        })

        console.log('✅ Addon added to subscription:', subscriptionItem.id)

        // Store addon in database
        await db.addOns.upsert({
            where: { priceId },
            create: {
                name: addonConfig.name,
                priceId,
                agencyId,
                active: true,
            },
            update: {
                active: true,
            },
        })

        return NextResponse.json({
            success: true,
            subscriptionItemId: subscriptionItem.id,
            message: `${addonConfig.name} addon added successfully`,
        })
    } catch (error) {
        console.error('Failed to add addon to subscription:', error)
        throw error
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// REMOVE - Remove an addon from subscription
// ─────────────────────────────────────────────────────────────────────────────
async function handleRemoveAddon(params: {
    agencyId: string
    addonKey?: string
    subscription: any
    existingAddons: any[]
}) {
    const { agencyId, addonKey, subscription, existingAddons } = params

    if (!addonKey) {
        return NextResponse.json(
            { error: 'addonKey is required for remove action' },
            { status: 400 }
        )
    }

    // Find addon config
    const addonConfig = (PRICING_CONFIG as Record<string, any>)[addonKey]
    if (!addonConfig || addonConfig.type !== 'addon') {
        return NextResponse.json(
            { error: `Invalid addon key: ${addonKey}` },
            { status: 400 }
        )
    }

    // Find existing addon
    const existingAddon = existingAddons.find(a => a.priceId === addonConfig.stripePriceId)
    if (!existingAddon) {
        return NextResponse.json(
            { error: 'Addon not found for this agency' },
            { status: 404 }
        )
    }

    // If subscription exists, remove from Stripe
    if (subscription?.subscritiptionId) {
        try {
            // Get subscription to find the item ID
            const stripeSubscription = await stripe.subscriptions.retrieve(subscription.subscritiptionId)
            const subscriptionItem = stripeSubscription.items.data.find(
                item => item.price.id === addonConfig.stripePriceId
            )

            if (subscriptionItem) {
                // Remove item from subscription (prorate by default)
                await stripe.subscriptionItems.del(subscriptionItem.id, {
                    proration_behavior: 'create_prorations',
                })
                console.log('✅ Addon removed from Stripe subscription')
            }
        } catch (error) {
            console.error('Failed to remove addon from Stripe:', error)
            // Continue to mark as inactive in DB
        }
    }

    // Mark addon as inactive in database
    await db.addOns.update({
        where: { id: existingAddon.id },
        data: { active: false },
    })

    return NextResponse.json({
        success: true,
        message: `${addonConfig.name} addon removed`,
    })
}

// ─────────────────────────────────────────────────────────────────────────────
// LIST - List all addons for an agency
// ─────────────────────────────────────────────────────────────────────────────
async function handleListAddons(params: {
    agencyId: string
    existingAddons: any[]
}) {
    const { existingAddons } = params

    // Enrich addons with config data
    const enrichedAddons = existingAddons.map(addon => {
        // Find matching config
        const configEntry = Object.entries(PRICING_CONFIG as Record<string, any>).find(
            ([, config]) => config.stripePriceId === addon.priceId
        )

        return {
            id: addon.id,
            name: addon.name,
            priceId: addon.priceId,
            active: addon.active,
            key: configEntry?.[0] || null,
            description: configEntry?.[1]?.description || null,
            price: configEntry?.[1]?.baseAmount || null,
            createdAt: addon.createdAt,
        }
    })

    return NextResponse.json({
        success: true,
        addons: enrichedAddons,
        activeCount: enrichedAddons.filter(a => a.active).length,
    })
}

// ─────────────────────────────────────────────────────────────────────────────
// GET - Get active addons for an agency
// ─────────────────────────────────────────────────────────────────────────────
export async function GET(req: Request) {
    const url = new URL(req.url)
    const agencyId = url.searchParams.get('agencyId')

    if (!agencyId) {
        return NextResponse.json({ error: 'agencyId is required' }, { status: 400 })
    }

    const addons = await db.addOns.findMany({
        where: { agencyId, active: true },
        select: {
            id: true,
            name: true,
            priceId: true,
            active: true,
            createdAt: true,
        },
    })

    // Enrich with config data
    const enrichedAddons = addons.map(addon => {
        const configEntry = Object.entries(PRICING_CONFIG as Record<string, any>).find(
            ([, config]) => config.stripePriceId === addon.priceId
        )

        return {
            ...addon,
            key: configEntry?.[0] || null,
            description: configEntry?.[1]?.description || null,
            price: configEntry?.[1]?.baseAmount || null,
        }
    })

    return NextResponse.json({
        success: true,
        addons: enrichedAddons,
    })
}
