'use client'

import { Agency, SubAccount } from '@/generated/prisma/client'
import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react'
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { ChevronRight, ChevronsUpDown, Compass, Lock, Menu, PlusCircleIcon, Sparkles } from 'lucide-react'
import clsx from 'clsx'
import { AspectRatio } from '@/components/ui/aspect-ratio'
import Image from 'next/image'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command'
import Link from 'next/link'
import { useModal } from '@/providers/modal-provider'
import CustomModal from '@/components/global/custom-modal'
import PremiumUpsellModal from '@/components/global/premium-upsell-modal'
import SubAccountDetails from '@/components/forms/subaccount-details'
import { Separator } from '@/components/ui/separator'
import { icons } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import type { GroupedSidebarOptions, SidebarOptionWithLinks } from './index'
import { usePathname } from 'next/navigation'
import { useSidebar } from './sidebar-context'

/** Premium modules that require add-on subscriptions */
const PREMIUM_MODULES = ['finance', 'fi']

type Props = {
    defaultOpen?: boolean
    subAccounts: SubAccount[]
    groupedOptions: GroupedSidebarOptions[]
    sidebarLogo: string
    details: any
    user: any
    id: string
    type: 'agency' | 'subaccount'
    agency: Agency
    currentPlan: string | null
    /** Map of feature keys to their enabled status from actual entitlements */
    entitledFeatures: Record<string, boolean>
}

const MenuOptions = ({
    details,
    id,
    type,
    sidebarLogo,
    groupedOptions,
    subAccounts,
    user,
    defaultOpen,
    agency,
    currentPlan,
    entitledFeatures,
}: Props) => {
    const { setOpen } = useModal()
    const { isCollapsed } = useSidebar()
    const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())
    const rememberedExpandedItems = useRef<Set<string>>(new Set())
    const pathname = usePathname()


    const basePath = type === 'agency' ? `/agency/${id}` : `/subaccount/${id}`

    const openState = useMemo(
        () => (defaultOpen ? { open: true } : {}),
        [defaultOpen]
    )

    // Check if pathname matches this link (exact or nested route)
    const matchesPath = useCallback((link: string): boolean => {
        if (link === '/' || link === '') return false
        const fullPath = `${basePath}${link}`
        return pathname === fullPath || pathname.startsWith(fullPath + '/')
    }, [basePath, pathname])

    // Check if this link is the BEST match among siblings (most specific)
    // This prevents /billing from matching when /billing/credits is the actual page
    const isBestMatchAmongSiblings = useCallback((link: string, siblings: { link: string }[]): boolean => {
        const fullPath = `${basePath}${link}`

        // First check if this link matches at all
        if (!matchesPath(link)) return false

        // Check if any sibling is a more specific match
        for (const sibling of siblings) {
            if (sibling.link === link) continue // Skip self
            const siblingFullPath = `${basePath}${sibling.link}`

            // If sibling's path is longer and also matches, it's more specific
            if (siblingFullPath.length > fullPath.length && matchesPath(sibling.link)) {
                return false // Another sibling is more specific
            }
        }

        return true // This is the best match
    }, [basePath, matchesPath])

    // Check if any child link of an option is active
    const hasActiveChild = useCallback((option: SidebarOptionWithLinks): boolean => {
        if (!option.OptionLinks || option.OptionLinks.length === 0) return false
        return option.OptionLinks.some((link) => matchesPath(link.link))
    }, [matchesPath])

    // Auto-expand items that have active children on mount and pathname change
    useEffect(() => {
        // Find all options with active children and expand them
        const itemsToExpand = new Set<string>()
        for (const group of groupedOptions) {
            for (const option of group.items) {
                // Only expand if a child is active, not the parent itself
                if (hasActiveChild(option)) {
                    itemsToExpand.add(option.id)
                }
            }
        }

        if (itemsToExpand.size > 0) {
            setExpandedItems((prev) => new Set([...prev, ...itemsToExpand]))
        }
    }, [pathname, groupedOptions, hasActiveChild])

    // Handle collapse/expand - save and restore expanded items
    useEffect(() => {
        if (isCollapsed) {
            // Save current expanded items before collapsing
            rememberedExpandedItems.current = new Set(expandedItems)
            setExpandedItems(new Set())
        } else {
            // Restore remembered expanded items when expanding
            if (rememberedExpandedItems.current.size > 0) {
                setExpandedItems(rememberedExpandedItems.current)
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isCollapsed])

    const isAgencyOwnerOrAdmin = user?.AgencyMemberships?.some(
        (m: any) => m.isActive && (m.Role?.name === 'AGENCY_OWNER' || m.Role?.name === 'AGENCY_ADMIN')
    )

    const toggleExpanded = (itemId: string) => {
        setExpandedItems((prev) => {
            const next = new Set(prev)
            if (next.has(itemId)) {
                next.delete(itemId)
            } else {
                next.add(itemId)
            }
            return next
        })
    }

    const isPremiumModule = (module: string): boolean => {
        return PREMIUM_MODULES.includes(module)
    }

    const isFeatureEntitled = (feature: string | null): boolean => {
        if (!feature) return true 

        // Check exact feature match in entitlements
        if (feature in entitledFeatures) {
            return entitledFeatures[feature]
        }

        // Check parent feature (e.g., fi.general_ledger.settings → fi.general_ledger)
        const parts = feature.split('.')
        while (parts.length > 1) {
            parts.pop()
            const parentFeature = parts.join('.')
            if (parentFeature in entitledFeatures) {
                return entitledFeatures[parentFeature]
            }
        }

        // For premium modules without matching entitlements, lock them
        const module = feature.split('.')[0]
        if (isPremiumModule(module)) {
            // Check if any entitlement from this module is enabled
            const hasModuleAccess = Object.entries(entitledFeatures).some(
                ([key, enabled]) => key.startsWith(`${module}.`) && enabled
            )
            return hasModuleAccess
        }

        // Non-premium feature not in entitlements - allow access (core feature)
        return true
    }

    const handleUpsellClick = (itemName: string) => {
        setOpen(
            <PremiumUpsellModal
                featureName={itemName}
                billingPath={`${basePath}/billing`}
                requiredPlan="Professional"
            />
        )
    }

    const renderNavItem = (
        option: SidebarOptionWithLinks,
        moduleIsPremium: boolean
    ) => {
        const hasSubLinks = option.OptionLinks && option.OptionLinks.length > 0
        const isExpanded = expandedItems.has(option.id)
        const isLocked = moduleIsPremium && !isFeatureEntitled(option.subModule || option.module)
        const hasActiveChildLink = hasActiveChild(option)

        // For items WITH children: parent is only "selected" if a child is active (not the parent link itself)
        // For items WITHOUT children: check if this exact link is active
        const isActive = hasSubLinks ? false : matchesPath(option.link)
        const isSelected = hasSubLinks ? hasActiveChildLink : isActive

        const iconDef = icons.find((icon) => icon.value === option.icon)
        const IconComponent = iconDef?.path

        if (hasSubLinks) {
            // When collapsed, show item with sub-links as a simple icon with tooltip/popover
            if (isCollapsed) {
                return (
                    <Popover key={option.id}>
                        <PopoverTrigger asChild>
                            <button
                                type="button"
                                className={cn(
                                    'flex w-full items-center justify-center rounded-md text-sm',
                                    isSelected ? 'bg-primary text-primary-foreground font-medium' : 'hover:bg-muted/50 transition-colors',
                                    isLocked && 'opacity-50 cursor-not-allowed'
                                )}
                                onClick={(e) => {
                                    if (isLocked) {
                                        e.preventDefault()
                                        e.stopPropagation()
                                        handleUpsellClick(option.name)
                                    }
                                }}
                            >
                                {IconComponent && (
                                    <span className={cn(
                                        'flex h-5 w-5 items-center justify-center [&_svg]:h-5 [&_svg]:w-5',
                                        isSelected ? 'text-white' : 'text-muted-foreground'
                                    )}>
                                        <IconComponent />
                                    </span>
                                )}
                            </button>
                        </PopoverTrigger>
                        {!isLocked && (
                            <PopoverContent side="right" className="w-48 p-2" align="start">
                                <div className="text-sm font-medium mb-2 px-2">{option.name}</div>
                                <div className="space-y-0.5">
                                    {option.OptionLinks.map((link) => {
                                        const linkIsLocked = !isFeatureEntitled(link.feature)
                                        const linkIsActive = isBestMatchAmongSiblings(link.link, option.OptionLinks)
                                        return linkIsLocked ? (
                                            <button
                                                key={link.id}
                                                type="button"
                                                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm opacity-50"
                                                onClick={() => handleUpsellClick(link.name)}
                                            >
                                                <span>{link.name}</span>
                                                <Lock className="h-3 w-3 ml-auto" />
                                            </button>
                                        ) : (
                                            <Link
                                                key={link.id}
                                                href={`${basePath}${link.link}`}
                                                className={cn(
                                                    'flex items-center rounded-md px-2 py-1.5 text-sm transition-colors',
                                                    linkIsActive 
                                                        ? 'bg-muted/50 text-foreground font-medium' 
                                                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
                                                )}
                                            >
                                                {link.name}
                                            </Link>
                                        )
                                    })}
                                </div>
                            </PopoverContent>
                        )}
                    </Popover>
                )
            }

            return (
                <Collapsible
                    key={option.id}
                    open={isExpanded}
                    onOpenChange={() => !isLocked && toggleExpanded(option.id)}
                >
                    <CollapsibleTrigger asChild>
                        <button
                            type="button"
                            className={cn(
                                'flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                                isSelected 
                                    ? 'bg-muted text-foreground'
                                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50',
                                isLocked && 'opacity-50 cursor-not-allowed'
                            )}
                            onClick={(e) => {
                                if (isLocked) {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    handleUpsellClick(option.name)
                                }
                            }}
                        >
                            <div className="flex items-center gap-3 flex-1">
                                {IconComponent && (
                                    <span className={cn(
                                        'flex h-4 w-4 items-center justify-center [&_svg]:h-4 [&_svg]:w-4'
                                    )}>
                                        <IconComponent />
                                    </span>
                                )}
                                <span className="flex-1 text-left">{option.name}</span>
                                {isLocked && <Lock className="h-3 w-3" />}
                            </div>
                            {!isLocked && (
                                <ChevronRight className={cn(
                                    'h-4 w-4 transition-transform duration-200',
                                    isExpanded && 'rotate-90'
                                )} />
                            )}
                        </button>
                    </CollapsibleTrigger>
                    {!isLocked && (
                        <CollapsibleContent className="pl-4 mt-1 ml-2 border-l border-border/50 space-y-0.5">
                            {option.OptionLinks.map((link) => {
                                const linkIsLocked = !isFeatureEntitled(link.feature)
                                // Child links: only highlight the most specific match among siblings
                                const linkIsActive = isBestMatchAmongSiblings(link.link, option.OptionLinks)
                                const linkIconDef = link.icon ? icons.find((i) => i.value === link.icon) : null
                                const LinkIconComponent = linkIconDef?.path

                                return (
                                    <div key={link.id}>
                                        {linkIsLocked ? (
                                            <button
                                                type="button"
                                                className={cn(
                                                    'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm',
                                                    'opacity-50 cursor-not-allowed text-muted-foreground'
                                                )}
                                                onClick={() => handleUpsellClick(link.name)}
                                            >
                                                {LinkIconComponent && (
                                                    <span className="flex h-4 w-4 items-center justify-center [&_svg]:h-4 [&_svg]:w-4">
                                                        <LinkIconComponent />
                                                    </span>
                                                )}
                                                <span>{link.name}</span>
                                                <Lock className="h-3 w-3 ml-auto" />
                                            </button>
                                        ) : defaultOpen ? (
                                            <Link
                                                href={`${basePath}${link.link}`}
                                                className={cn(
                                                    'flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors',
                                                    linkIsActive 
                                                        ? 'bg-muted text-foreground font-medium' 
                                                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                                                )}
                                            >
                                                {LinkIconComponent && (
                                                    <span className={cn(
                                                        'flex h-4 w-4 items-center justify-center [&_svg]:h-4 [&_svg]:w-4'
                                                    )}>
                                                        <LinkIconComponent />
                                                    </span>
                                                )}
                                                <span>{link.name}</span>
                                            </Link>
                                        ) : (
                                            <SheetClose asChild>
                                                <Link
                                                    href={`${basePath}${link.link}`}
                                                    className={cn(
                                                        'flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors',
                                                        linkIsActive 
                                                            ? 'bg-muted/50 text-foreground font-medium' 
                                                            : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
                                                    )}
                                                >
                                                    {LinkIconComponent && (
                                                        <span className={cn(
                                                            'flex h-4 w-4 items-center justify-center [&_svg]:h-4 [&_svg]:w-4'
                                                        )}>
                                                            <LinkIconComponent />
                                                        </span>
                                                    )}
                                                    <span>{link.name}</span>
                                                </Link>
                                            </SheetClose>
                                        )}
                                    </div>
                                )
                            })}
                        </CollapsibleContent>
                    )}
                </Collapsible>
            )
        }

        // Simple nav item without sublinks
        if (isLocked) {
            return (
                <button
                    type="button"
                    key={option.id}
                    className={cn(
                        'flex w-full items-center rounded-md text-sm',
                        'opacity-50 cursor-not-allowed text-muted-foreground',
                        isCollapsed ? 'justify-center p-2' : 'gap-2 px-2 py-1.5'
                    )}
                    onClick={() => handleUpsellClick(option.name)}
                    title={isCollapsed ? option.name : undefined}
                >
                    {IconComponent && (
                        <span className={cn(
                            'flex items-center justify-center [&_svg]:h-4 [&_svg]:w-4',
                            isCollapsed ? 'h-5 w-5 [&_svg]:h-5 [&_svg]:w-5' : 'h-4 w-4'
                        )}>
                            <IconComponent />
                        </span>
                    )}
                    {!isCollapsed && <span>{option.name}</span>}
                    {!isCollapsed && <Lock className="h-3 w-3 ml-auto" />}
                </button>
            )
        }

        return defaultOpen ? (
            <Link
                key={option.id}
                href={`${basePath}${option.link}`}
                className={cn(
                    'flex items-center rounded-lg text-sm font-medium transition-colors',
                    isActive 
                        ? 'bg-muted text-foreground' 
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50',
                    isCollapsed ? 'justify-center p-2' : 'gap-3 px-3 py-2'
                )}
                title={isCollapsed ? option.name : undefined}
            >
                {IconComponent && (
                    <span className={cn(
                        'flex items-center justify-center [&_svg]:h-4 [&_svg]:w-4',
                        isCollapsed ? 'h-5 w-5 [&_svg]:h-5 [&_svg]:w-5' : 'h-4 w-4'
                    )}>
                        <IconComponent />
                    </span>
                )}
                {!isCollapsed && <span className="flex-1 text-left">{option.name}</span>}
            </Link>
        ) : (
            <SheetClose asChild key={option.id}>
                <Link
                    href={`${basePath}${option.link}`}
                    className={cn(
                        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                        isActive 
                            ? 'bg-muted text-foreground' 
                            : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                    )}
                >
                    {IconComponent && (
                        <span className={cn(
                            'flex h-4 w-4 items-center justify-center [&_svg]:h-4 [&_svg]:w-4'
                        )}>
                            <IconComponent />
                        </span>
                    )}
                    <span className="flex-1 text-left">{option.name}</span>
                </Link>
            </SheetClose>
        )
    }

    return (
        <Sheet
            modal={false}
            {...openState}

        >
            <SheetTrigger
                asChild
                className="absolute left-4 top-4 z-[100] md:!hidden flex"
            >
                <Button
                    variant="outline"
                    size="icon"
                >
                    <Menu />
                </Button>
            </SheetTrigger>

            <SheetContent
                showX={!defaultOpen}
                side="left"
                className={clsx(
                    'bg-gradient-to-b from-muted/20 to-transparent backdrop-blur-xl fixed top-0 border-r border-border p-6 transition-all duration-300',
                    {
                        'hidden md:inline-block z-0': defaultOpen,
                        'inline-block md:hidden z-[100] w-full': !defaultOpen,
                    },
                    defaultOpen && (isCollapsed ? 'w-[80px]' : 'w-[280px]')
                )}
            >
                <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                <SheetDescription className="sr-only">
                    Navigate between agency and subaccounts
                </SheetDescription>
                <div className="flex flex-col h-full">
                    {/* Logo */}
                    <AspectRatio ratio={16 / 5}>
                        <Image
                            src={sidebarLogo}
                            alt="Sidebar Logo"
                            height={isCollapsed ? 76 : undefined}
                            width={isCollapsed ? 76 : undefined}
                            fill={isCollapsed ? false : true}
                            className={cn(isCollapsed ? 'absolute top-0 left-0 w-[40px] h-[40px]' : 'rounded-md object-contain', 'transition-all duration-300')}
                        />
                    </AspectRatio>

                    {/* Account Switcher */}
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                className={cn(
                                    'w-full my-4 flex items-center py-8 transition-all duration-300',
                                    isCollapsed ? 'justify-center p-2 relative top-6' : 'justify-between'
                                )}
                                variant="ghost"
                            >
                                <div className="flex items-center text-left gap-2">
                                    <Compass className="h-5 w-5 shrink-0" />
                                    {!isCollapsed && (
                                        <div className="flex flex-col">
                                            <span className="font-medium">{details.name}</span>
                                            <span className="text-muted-foreground text-xs">
                                                {details.address || details.line1}
                                            </span>
                                        </div>
                                    )}
                                </div>
                                {!isCollapsed && (
                                    <ChevronsUpDown
                                        size={16}
                                        className="text-muted-foreground"
                                    />
                                )}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80 h-80 mt-4 z-[200]">
                            <Command className="rounded-lg">
                                <CommandInput placeholder="Search Accounts..." />
                                <CommandList className="pb-16">
                                    <CommandEmpty>No results found</CommandEmpty>

                                    {/* Agency Section */}
                                    {isAgencyOwnerOrAdmin && agency && (
                                        <CommandGroup heading="Agency">
                                            <CommandItem className="!bg-transparent my-2 text-primary border-[1px] border p-2 rounded-md hover:!bg-muted cursor-pointer transition-all">
                                                {defaultOpen ? (
                                                    <Link
                                                        href={`/agency/${agency.id}`}
                                                        className="flex gap-4 w-full h-full"
                                                    >
                                                        <div className={cn(isCollapsed ? 'relative w-16 px-2' : 'relative w-16', 'transition-all duration-300')}>
                                                            <Image
                                                                src={agency.agencyLogo || '/assets/glassmorphism/organization.svg'}
                                                                alt="Agency Logo"
                                                                fill
                                                                className={cn(isCollapsed ? 'object-contain px-2' : 'rounded-md object-contain', 'transition-all duration-300')}
                                                            />
                                                        </div>
                                                        <div className="flex flex-col flex-1">
                                                            <span className="font-medium">{agency.name}</span>
                                                            <span className="text-muted-foreground text-xs">
                                                                {agency.city}, {agency.country}
                                                            </span>
                                                        </div>
                                                    </Link>
                                                ) : (
                                                    <SheetClose asChild>
                                                        <Link
                                                            href={`/agency/${agency.id}`}
                                                            className="flex gap-4 w-full h-full"
                                                        >
                                                            <div className="relative w-16">
                                                                <Image
                                                                    src={agency.agencyLogo || '/assets/glassmorphism/organization.svg'}
                                                                    alt="Agency Logo"
                                                                    fill
                                                                    className="rounded-md object-contain"
                                                                />
                                                            </div>
                                                            <div className="flex flex-col flex-1">
                                                                <span className="font-medium">{agency.name}</span>
                                                                <span className="text-muted-foreground text-xs">
                                                                    {agency.city}, {agency.country}
                                                                </span>
                                                            </div>
                                                        </Link>
                                                    </SheetClose>
                                                )}
                                            </CommandItem>
                                        </CommandGroup>
                                    )}

                                    {/* Subaccounts Section */}
                                    <CommandGroup heading="Accounts">
                                        {subAccounts && subAccounts.length > 0
                                            ? subAccounts.map((subaccount) => (
                                                <CommandItem key={subaccount.id}>
                                                    {defaultOpen ? (
                                                        <Link
                                                            href={`/subaccount/${subaccount.id}`}
                                                            className="flex gap-4 w-full h-full"
                                                        >
                                                            <div className="relative w-16">
                                                                <Image
                                                                    src={subaccount.subAccountLogo}
                                                                    alt="Subaccount Logo"
                                                                    fill
                                                                    className="rounded-md object-contain"
                                                                />
                                                            </div>
                                                            <div className="flex flex-col flex-1">
                                                                <span className="font-medium">{subaccount.name}</span>
                                                                <span className="text-muted-foreground text-xs">
                                                                    {subaccount.line1}
                                                                </span>
                                                            </div>
                                                        </Link>
                                                    ) : (
                                                        <SheetClose asChild>
                                                            <Link
                                                                href={`/subaccount/${subaccount.id}`}
                                                                className="flex gap-4 w-full h-full"
                                                            >
                                                                <div className="relative w-16">
                                                                    <Image
                                                                        src={subaccount.subAccountLogo}
                                                                        alt="Subaccount Logo"
                                                                        fill
                                                                        className="rounded-md object-contain"
                                                                    />
                                                                </div>
                                                                <div className="flex flex-col flex-1">
                                                                    <span className="font-medium">{subaccount.name}</span>
                                                                    <span className="text-muted-foreground text-xs">
                                                                        {subaccount.line1}
                                                                    </span>
                                                                </div>
                                                            </Link>
                                                        </SheetClose>
                                                    )}
                                                </CommandItem>
                                            ))
                                            : <CommandEmpty>No Accounts</CommandEmpty>
                                        }
                                    </CommandGroup>
                                </CommandList>

                                {/* Create Subaccount Button */}
                                {isAgencyOwnerOrAdmin && (
                                    <SheetClose asChild>
                                        <Button
                                            className="w-full flex gap-2"
                                            onClick={() => {
                                                setOpen(
                                                    <CustomModal
                                                        title="Create A Subaccount"
                                                        subheading="You can switch between your agency account and the subaccount from the sidebar"
                                                        className="max-w-3xl"
                                                    >
                                                        <SubAccountDetails
                                                            agencyDetails={agency}
                                                            userId={user?.id as string}
                                                            userName={user?.name}
                                                        />
                                                    </CustomModal>
                                                )
                                            }}
                                        >
                                            <PlusCircleIcon size={15} />
                                            Create Sub Account
                                        </Button>
                                    </SheetClose>
                                )}
                            </Command>
                        </PopoverContent>
                    </Popover>

                    {/* Navigation with Module Groups */}
                    <nav className={cn("relative flex-1 overflow-y-auto space-y-4",
                        isCollapsed ? "top-6" : ""


                    )}>
                        {groupedOptions.map((group) => {
                            const moduleIsPremium = isPremiumModule(group.module)

                            return (
                                <div key={group.module} className={clsx(isCollapsed ? "space-y-0" : "space-y-1")}>
                                    {/* Module Group Label */}
                                    <div className={clsx("flex items-center transition-all duration-300",
                                        isCollapsed ? "hidden" : "gap-2 px-2 py-1"
                                    )}>
                                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                            {group.label}
                                        </span>
                                        {moduleIsPremium && !isFeatureEntitled(group.module) && (
                                            <Sparkles className="h-3 w-3 text-primary" />
                                        )}
                                    </div>

                                    {/* Module Items */}
                                    <div className="space-y-0.5">
                                        {group.items.map((option) => renderNavItem(option, moduleIsPremium))}
                                    </div>
                                </div>
                            )
                        })}
                    </nav>

                    {/* User Section */}
                    <Separator className="my-4" />
                    <div className={cn(
                        'flex items-center transition-all duration-200',
                        isCollapsed ? 'justify-center' : 'gap-3 px-2'
                    )}>
                        <div className="relative h-8 w-8 rounded-full  overflow-hidden bg-muted shrink-0">
                            {user?.avatarUrl ? (
                                <Image
                                    src={user.avatarUrl}
                                    alt={user.name || 'User'}
                                    fill
                                    className="object-cover"
                                />
                            ) : (
                                <div className="flex h-full w-full items-center justify-center text-xs font-medium">
                                    {user?.name?.charAt(0) || 'U'}
                                </div>
                            )}
                        </div>
                        {!isCollapsed && (
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{user?.name}</p>
                                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                            </div>
                        )}
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    )
}

export default MenuOptions
