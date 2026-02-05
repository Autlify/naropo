/**
 * @component Sidebar
 * @description Server component sidebar that fetches user data and renders navigation.
 * Groups by module field, grays out premium features with upsell prompt.
 */

import { getAuthUserDetails, getSidebarOptions } from '@/lib/queries'
import { resolveEffectiveEntitlements } from '@/lib/features/core/billing/entitlements/resolve'
import { syncSubscriptionStatus } from '@/lib/stripe/actions/subscription'
import React from 'react'
import MenuOptions from './menu-options'
import type { SidebarOption, SidebarOptionLink } from '@/generated/prisma/client'

type Props = {
    id: string
    type: 'agency' | 'subaccount'
}

export type SidebarOptionWithLinks = SidebarOption & {
    OptionLinks: SidebarOptionLink[]
}

export type GroupedSidebarOptions = {
    module: string
    label: string
    items: SidebarOptionWithLinks[]
}

/** Module display labels */
const MODULE_LABELS: Record<string, string> = {
    core: 'Platform',
    crm: 'CRM',
    finance: 'Finance',
    fi: 'Finance',
    apps: 'Apps',
    settings: 'Settings',
}

/** Module order for sorting */
const MODULE_ORDER: Record<string, number> = {
    core: 0,
    crm: 10,
    finance: 20,
    fi: 20,
    apps: 30,
    settings: 100,
}

function groupByModule(options: SidebarOptionWithLinks[]): GroupedSidebarOptions[] {
    const groups = new Map<string, SidebarOptionWithLinks[]>()

    for (const option of options) {
        const module = option.module || 'core'
        if (!groups.has(module)) {
            groups.set(module, [])
        }
        groups.get(module)!.push(option)
    }

    return Array.from(groups.entries())
        .map(([module, items]) => ({
            module,
            label: MODULE_LABELS[module] || module.charAt(0).toUpperCase() + module.slice(1),
            items,
        }))
        .sort((a, b) => (MODULE_ORDER[a.module] ?? 50) - (MODULE_ORDER[b.module] ?? 50))
}

const Sidebar = async ({ id, type }: Props) => {
    const user = await getAuthUserDetails()
    if (!user) return null

    // Get the agency from memberships
    const agencyMembership = user.AgencyMemberships?.find(
        (membership) =>
            type === 'agency'
                ? membership.agencyId === id
                : membership.Agency.SubAccount.some((sub) => sub.id === id)
    )

    if (!agencyMembership) return null

    const agency = agencyMembership.Agency

    const details =
        type === 'agency'
            ? agency
            : agency.SubAccount.find((subaccount) => subaccount.id === id)

    const isWhiteLabeledAgency = agency.whiteLabel
    if (!details) return null

    let sideBarLogo = agency.agencyLogo || '/assets/autlify-logo.svg'

    if (!isWhiteLabeledAgency) {
        if (type === 'subaccount') {
            sideBarLogo =
                agency.SubAccount.find((subaccount) => subaccount.id === id)
                    ?.subAccountLogo || agency.agencyLogo
        } else if (type === 'agency') {
            sideBarLogo = '/assets/autlify-logo.svg'
        }
    }

    // Get subaccounts user has access to via SubAccountMemberships
    const subaccounts = agency.SubAccount.filter((subaccount) =>
        user.SubAccountMemberships?.some(
            (membership) =>
                membership.subAccountId === subaccount.id && membership.isActive
        )
    )


    // Fetch sidebar options from the unified table
    const sidebarOptions = await getSidebarOptions(type) as SidebarOptionWithLinks[]

    // Group by module
    const groupedOptions = groupByModule(sidebarOptions)

    // Ensure subscription is synced from Stripe (handles webhook latency)
    await syncSubscriptionStatus(agency.id, agency.Subscription?.subscritiptionId || '')

    // Get subscription info for entitlement checking (refetch after sync)
    const subscription = agency.Subscription
    const currentPlan = subscription?.priceId || null

    // Fetch effective entitlements for proper feature gating
    const scope = type === 'agency' ? 'AGENCY' : 'SUBACCOUNT'
    const entitlementsMap = await resolveEffectiveEntitlements({
        agencyId: agency.id,
        subAccountId: type === 'subaccount' ? id : null,
        scope: scope as 'AGENCY' | 'SUBACCOUNT',
    })
    
    // Serialize entitlements for client component (only pass what's needed)
    const entitledFeatures: Record<string, boolean> = {}
    for (const [key, ent] of Object.entries(entitlementsMap)) {
        entitledFeatures[key] = ent.isEnabled
    }

    return (
        <>
            {/* Desktop sidebar - always visible */}
            <MenuOptions
                defaultOpen={true}
                details={details}
                id={id}
                type={type}
                sidebarLogo={sideBarLogo}
                groupedOptions={groupedOptions}
                subAccounts={subaccounts}
                user={user}
                agency={agency}
                currentPlan={currentPlan}
                entitledFeatures={entitledFeatures}
            />
            {/* Mobile sidebar - sheet trigger */}
            <MenuOptions
                details={details}
                id={id}
                type={type}
                sidebarLogo={sideBarLogo}
                groupedOptions={groupedOptions}
                subAccounts={subaccounts}
                user={user}
                agency={agency}
                currentPlan={currentPlan}
                entitledFeatures={entitledFeatures}
            />
        </>
    )
}

export default Sidebar

// Re-export types and utilities 

