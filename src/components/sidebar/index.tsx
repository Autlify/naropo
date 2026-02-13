/**
 * @component Sidebar
 * @description Server component sidebar that fetches user data and renders navigation.
 * Groups by module field, grays out premium features with upsell prompt.
 * 
 * OPTIMIZATIONS:
 * - Sidebar structure from SIDEBAR_REGISTRY (0 DB queries)
 * - Entitlements from snapshot cache (60s TTL)
 * - Minimal context loading (2-3 queries vs 6+ before)
 * - No syncSubscriptionStatus call (webhooks handle this)
 */

import { loadSidebarContext } from './loader'
import { getSidebarOptionsFromRegistry } from './directory'
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
    org: 'Organization',
    core: 'Platform',
    crm: 'CRM',
    iam: 'Identity & Access',
    finance: 'Finance',
    fi: 'Finance',
    apps: 'Apps',
    settings: 'Settings',
}

/** Module order for sorting */
const MODULE_ORDER: Record<string, number> = {
    org: 0,
    crm: 10,
    iam: 15,
    finance: 20,
    fi: 20,
    apps: 30,
    settings: 100,
}

function groupByModule(options: SidebarOptionWithLinks[]): GroupedSidebarOptions[] {
    const groups = new Map<string, SidebarOptionWithLinks[]>()

    for (const option of options) {
        const module = option.module || 'org'
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
    // Load optimized sidebar context (2-3 queries instead of 6+)
    const ctx = await loadSidebarContext({ type, id })
    if (!ctx || !ctx.agency) return null

    const { agency, subAccount, accessibleSubAccounts, entitledFeatures, user } = ctx

    // Determine details based on scope
    const details = type === 'agency'
        ? { id: agency.id, name: agency.name }
        : subAccount
            ? { id: subAccount.id, name: subAccount.name }
            : null

    if (!details) return null

    // Determine sidebar logo
    let sideBarLogo = agency.agencyLogo || '/assets/autlify-logo.svg'

    if (!agency.whiteLabel) {
        if (type === 'subaccount' && subAccount) {
            sideBarLogo = subAccount.subAccountLogo || agency.agencyLogo || '/assets/autlify-logo.svg'
        } else if (type === 'agency') {
            sideBarLogo = '/assets/autlify-logo.svg'
        }
    }

    // Get sidebar structure from registry (0 DB queries)
    const sidebarOptions = getSidebarOptionsFromRegistry(type) as SidebarOptionWithLinks[]

    // Group by module
    const groupedOptions = groupByModule(sidebarOptions)

    // Map subaccounts to expected shape
    const subaccounts = accessibleSubAccounts.map((sub) => ({
        id: sub.id,
        name: sub.name,
        subAccountLogo: sub.subAccountLogo,
        agencyId: sub.agencyId,
    }))

    // Map agency to expected shape for MenuOptions
    const agencyForMenu = {
        id: agency.id,
        name: agency.name,
        agencyLogo: agency.agencyLogo,
        whiteLabel: agency.whiteLabel,
    }

    // Map user to expected shape
    const userForMenu = {
        id: user.id,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl,
    }

    const currentPlan = agency.subscriptionPriceId

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
                subAccounts={subaccounts as any}
                user={userForMenu}
                agency={agencyForMenu as any}
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
                subAccounts={subaccounts as any}
                user={userForMenu}
                agency={agencyForMenu as any}
                currentPlan={currentPlan}
                entitledFeatures={entitledFeatures}
            />
        </>
    )
}

export default Sidebar

// Re-export types and utilities 

