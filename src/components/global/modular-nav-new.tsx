'use client'

import React, { useMemo, useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronDown } from 'lucide-react'
import { Button } from "@/components/ui-2/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuPortal,
    DropdownMenuSeparator,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuTrigger,
} from "@/components/ui-2/dropdown-menu"
import { Tabs, TabsList, TabsTrigger } from '@/components/ui-2/tabs'
import { cn } from '@/lib/utils'
import { KEYS, type ModuleCode } from '@/lib/registry/keys/permissions'

// ============================================================================
// TYPES
// ============================================================================

type ScopeType = 'agency' | 'subaccount'

/** 
 * Hierarchy levels define the depth of navigation:
 * - 1: Show only current tier items
 * - 2: Show current tier + one level deeper
 * - 3: Show current tier + two levels deeper (max depth)
 */
export type HierarchyLevel = 1 | 2 | 3

/**
 * Starting point for navigation hierarchy:
 * - 'module': Start from module level, can have levels 1|2|3
 * - 'submodule': Start from submodule level, can have levels 2|3 only
 * - 'feature': Start from feature level, can only have level 1 (last tier)
 */
export type HierarchyKind = 'module' | 'submodule' | 'feature'

/**
 * Display variant for the navigation:
 * - 'navbar': Horizontal tabs with overflow dropdown (default)
 * - 'dropdown': Single button that opens a dropdown menu with all items
 */
export type NavVariant = 'navbar' | 'dropdown'

/** Navigation item structure */
export interface NavItem {
    key: string
    label: string
    href: string
    icon?: React.ReactNode
    children?: NavItem[]
    /** Permission key to check (optional) */
    permissionKey?: string
}

/** 
 * Level validation rules:
 * - module: can have 1 (module→module), 2 (module→submodule), 3 (module→feature)
 * - submodule: can have 2 (submodule→submodule) or 3 (submodule→feature) only
 * - feature: can only have 1 (it's the last tier, cannot go deeper to higher)
 */
const ALLOWED_LEVELS: Record<HierarchyKind, readonly HierarchyLevel[]> = {
    module: [1, 2, 3],     // module can show 1, 2, or 3 levels
    submodule: [2, 3],     // submodule can show 2 or 3 levels only
    feature: [1],          // feature can only show 1 level (it's the last tier)
} as const

/** Validate level config - must be in allowed levels for starting kind */
function validateLevelConfig(from: HierarchyKind, level: HierarchyLevel): boolean {
    return ALLOWED_LEVELS[from].includes(level)
}

/** Get the minimum allowed level for a starting kind */
function getMinLevel(from: HierarchyKind): HierarchyLevel {
    return ALLOWED_LEVELS[from][0]
}

/** Get the maximum allowed level for a starting kind */
function getMaxLevel(from: HierarchyKind): HierarchyLevel {
    const levels = ALLOWED_LEVELS[from]
    return levels[levels.length - 1]
}

// ============================================================================
// PROPS
// ============================================================================

interface ModularNavProps {
    /** Display variant: 'navbar' (tabs) or 'dropdown' (menu) - default: 'navbar' */
    variant?: NavVariant
    /** Label for the dropdown trigger button (only used when variant='dropdown') */
    triggerLabel?: string
    /** Starting hierarchy level - determines where navigation starts (optional when items provided) */
    from?: HierarchyKind
    /** 
     * How many levels deep to show (optional when items provided)
     * - module: 1|2|3
     * - submodule: 2|3 
     * - feature: 1 only
     */
    levels?: HierarchyLevel
    /** Scope type for URL building */
    scope: ScopeType
    /** Scope ID (agencyId or subaccountId) */
    scopeId: string
    /** 
     * Override: Module key to start from (e.g., 'org', 'fi', 'crm')
     * If not provided, auto-parses from current path
     */
    moduleKey?: ModuleCode
    /** 
     * Override: Submodule key (e.g., 'fi.general_ledger')
     * Required when from='submodule' or 'feature' if not using path parsing
     */
    submoduleKey?: string
    /** 
     * Override: Feature key (e.g., 'fi.general_ledger.accounts')
     * Required when from='feature' if not using path parsing
     */
    featureKey?: string
    /** 
     * Custom items (makes from/levels optional)
     * If item has no href, auto-generates from key: core.billing.sub → /scope/id/billing/sub
     */
    items?: NavItem[]
    /** Max visible tabs before overflow (default: 6) */
    maxVisibleTabs?: number
    /** Additional class name */
    className?: string
    /** Callback to filter items by permission */
    filterByPermission?: (permissionKey: string) => boolean | Promise<boolean>
}

// ============================================================================
// UTILITIES
// ============================================================================

/** Convert registry key to display label */
function keyToLabel(key: string): string {
    // Handle common abbreviations
    const abbrevMap: Record<string, string> = {
        'coa': 'Chart of Accounts',
        'api': 'API',
        'iam': 'Identity & Access',
        'fi': 'Finance',
        'crm': 'Customer',
        'co': 'Controlling',
        'mm': 'Materials',
    }

    if (abbrevMap[key.toLowerCase()]) {
        return abbrevMap[key.toLowerCase()]
    }

    return key
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
}

/** Convert key to URL segment */
function keyToUrlSegment(key: string): string {
    return key.replace(/_/g, '-')
}

/** Convert URL segment back to key */
function urlSegmentToKey(segment: string): string {
    return segment.replace(/-/g, '_')
}

/**
 * Convert registry key to href path
 * Example: core.billing.subscription → /agency/123/billing/subscription
 * Note: 'org' module is skipped in path as it's platform core, not a route
 */
function keyToHref(key: string, scope: ScopeType, scopeId: string): string {
    const parts = key.split('.')
    // Skip 'org' module in path - it's platform, not a route segment
    const pathParts = parts[0] === 'org' ? parts.slice(1) : parts
    const pathSegments = pathParts.map(p => p.replace(/_/g, '-'))
    return `/${scope}/${scopeId}/${pathSegments.join('/')}`
}

/** 
 * Parse current path to extract hierarchy info
 * Pattern: /{scope}/{scopeId}/{module}/{submodule?}/{feature?}
 */
function parsePathHierarchy(pathname: string, scope: ScopeType): {
    module?: string
    submodule?: string
    feature?: string
} {
    const scopePattern = new RegExp(`/${scope}/[^/]+/(.*)`)
    const match = pathname.match(scopePattern)

    if (!match) return {}

    const segments = match[1].split('/').filter(Boolean)

    return {
        module: segments[0] ? urlSegmentToKey(segments[0]) : undefined,
        submodule: segments[1] ? urlSegmentToKey(segments[1]) : undefined,
        feature: segments[2] ? urlSegmentToKey(segments[2]) : undefined,
    }
}

/** 
 * Parse module key from KEYS registry that starts with given prefix 
 * Used when manual input of module is provided
 */
function getModuleFromRegistry(moduleKey: string): ModuleCode | undefined {
    const modules = Object.keys(KEYS) as ModuleCode[]
    return modules.find(m => m.toLowerCase() === moduleKey.toLowerCase())
}

/** Build nav items from KEYS registry */
function buildNavItemsFromRegistry(
    from: HierarchyKind,
    levels: HierarchyLevel,
    moduleKey?: ModuleCode,
    submoduleKey?: string,
    featureKey?: string,
    baseHref: string = ''
): NavItem[] {
    const items: NavItem[] = []

    if (from === 'module' && moduleKey) {
        const moduleData = KEYS[moduleKey]
        if (!moduleData) return items

        if (levels === 1) {
            // Level 1: Show modules only (list all modules)
            const modules = Object.keys(KEYS) as ModuleCode[]
            for (const mod of modules) {
                items.push({
                    key: mod,
                    label: keyToLabel(mod),
                    href: `/${baseHref.split('/')[1]}/${baseHref.split('/')[2]}/${keyToUrlSegment(mod)}`,
                    permissionKey: mod,
                })
            }
        } else {
            // Level 2+: Submodules of the specified module
            const submodules = Object.keys(moduleData) as string[]

            for (const submod of submodules) {
                const submodHref = `${baseHref}/${keyToUrlSegment(submod)}`
                const submodData = (moduleData as Record<string, unknown>)[submod]

                const item: NavItem = {
                    key: `${moduleKey}.${submod}`,
                    label: keyToLabel(submod),
                    href: submodHref,
                    permissionKey: `${moduleKey}.${submod}`,
                }

                // Level 3: Features (resources) under submodule
                if (levels >= 3 && typeof submodData === 'object' && submodData !== null) {
                    const features = Object.keys(submodData) as string[]
                    item.children = features.map(feat => ({
                        key: `${moduleKey}.${submod}.${feat}`,
                        label: keyToLabel(feat),
                        href: `${submodHref}/${keyToUrlSegment(feat)}`,
                        permissionKey: `${moduleKey}.${submod}.${feat}`,
                    }))
                }

                items.push(item)
            }
        }
    } else if (from === 'submodule' && submoduleKey) {
        // Parse submoduleKey like "fi.general_ledger"
        const [mod, submod] = submoduleKey.split('.') as [ModuleCode, string]
        const moduleData = KEYS[mod]
        if (!moduleData) return items

        const submodData = (moduleData as Record<string, unknown>)[submod]
        if (!submodData || typeof submodData !== 'object') return items

        if (levels === 2) {
            // Level 2: Features (resources) under submodule - flat list
            const features = Object.keys(submodData) as string[]

            for (const feat of features) {
                items.push({
                    key: `${mod}.${submod}.${feat}`,
                    label: keyToLabel(feat),
                    href: `${baseHref}/${keyToUrlSegment(feat)}`,
                    permissionKey: `${mod}.${submod}.${feat}`,
                })
            }
        } else if (levels === 3) {
            // Level 3: Features with their actions as children
            const features = Object.keys(submodData) as string[]

            for (const feat of features) {
                const featData = (submodData as Record<string, unknown>)[feat]
                const featHref = `${baseHref}/${keyToUrlSegment(feat)}`

                const item: NavItem = {
                    key: `${mod}.${submod}.${feat}`,
                    label: keyToLabel(feat),
                    href: featHref,
                    permissionKey: `${mod}.${submod}.${feat}`,
                }

                // Add actions as children if they exist
                if (typeof featData === 'object' && featData !== null) {
                    const actions = Object.keys(featData) as string[]
                    item.children = actions.map(action => ({
                        key: `${mod}.${submod}.${feat}.${action}`,
                        label: keyToLabel(action),
                        href: `${featHref}/${keyToUrlSegment(action)}`,
                        permissionKey: `${mod}.${submod}.${feat}.${action}`,
                    }))
                }

                items.push(item)
            }
        }
    } else if (from === 'feature' && featureKey) {
        // Feature is the last tier - show the single item (level 1 only)
        const parts = featureKey.split('.')
        const feat = parts[parts.length - 1]

        items.push({
            key: featureKey,
            label: keyToLabel(feat),
            href: baseHref,
            permissionKey: featureKey,
        })
    }

    return items
}

// ============================================================================
// COMPONENT
// ============================================================================

export const ModularNav = ({
    variant = 'navbar',
    triggerLabel = 'Open',
    from,
    levels,
    scope,
    scopeId,
    moduleKey: inputModuleKey,
    submoduleKey: inputSubmoduleKey,
    featureKey: inputFeatureKey,
    items: customItems,
    maxVisibleTabs = 6,
    className,
    filterByPermission,
}: ModularNavProps) => {
    const pathname = usePathname()

    // Parse path to auto-detect hierarchy when no manual input
    const pathInfo = useMemo(() => parsePathHierarchy(pathname, scope), [pathname, scope])

    // Resolve keys: use input overrides or fall back to path parsing
    const resolvedKeys = useMemo(() => {
        let moduleKey = inputModuleKey
        let submoduleKey = inputSubmoduleKey
        let featureKey = inputFeatureKey

        // If no manual module input, try to get from path
        if (!moduleKey && pathInfo.module) {
            const foundModule = getModuleFromRegistry(pathInfo.module)
            if (foundModule) {
                moduleKey = foundModule
            }
        }

        // Build submoduleKey from path if not provided
        if (!submoduleKey && moduleKey && pathInfo.submodule) {
            submoduleKey = `${moduleKey}.${pathInfo.submodule}`
        }

        // Build featureKey from path if not provided
        if (!featureKey && submoduleKey && pathInfo.feature) {
            featureKey = `${submoduleKey}.${pathInfo.feature}`
        }

        return { moduleKey, submoduleKey, featureKey }
    }, [inputModuleKey, inputSubmoduleKey, inputFeatureKey, pathInfo])

    // Validate and clamp levels config (skip if in manual mode with custom items)
    const validatedLevels = useMemo(() => {
        // Skip validation if from/levels not provided (manual mode with items)
        if (!from || !levels) return undefined
        
        if (!validateLevelConfig(from, levels)) {
            const allowedStr = ALLOWED_LEVELS[from].join(', ')
            console.warn(
                `[ModuleNavbar] Invalid config: from="${from}" with levels=${levels}. ` +
                `Allowed levels for "${from}" are: ${allowedStr}. Clamping to valid range.`
            )
            // Clamp to nearest valid level
            if (levels < getMinLevel(from)) return getMinLevel(from)
            if (levels > getMaxLevel(from)) return getMaxLevel(from)
            return getMinLevel(from)
        }
        return levels
    }, [from, levels])

    // Build base href
    const baseHref = useMemo(() => {
        let href = `/${scope}/${scopeId}`

        const { moduleKey, submoduleKey } = resolvedKeys

        if (moduleKey) {
            href += `/${keyToUrlSegment(moduleKey)}`
        }
        if (submoduleKey && from && from !== 'module') {
            const submod = submoduleKey.split('.')[1]
            if (submod) {
                href += `/${keyToUrlSegment(submod)}`
            }
        }

        return href
    }, [scope, scopeId, resolvedKeys, from])

    // Build or use custom items (with auto-href generation)
    const navItems = useMemo(() => {
        if (customItems) {
            // Auto-generate href from key if not provided
            return customItems.map(item => ({
                ...item,
                href: item.href || keyToHref(item.key, scope, scopeId),
                children: item.children?.map(c => ({
                    ...c,
                    href: c.href || keyToHref(c.key, scope, scopeId),
                }))
            }))
        }

        // Require from/levels for auto mode
        if (!from || !validatedLevels) {
            console.warn('[ModularNav] from/levels required when items not provided')
            return []
        }

        const { moduleKey, submoduleKey, featureKey } = resolvedKeys

        return buildNavItemsFromRegistry(
            from,
            validatedLevels,
            moduleKey,
            submoduleKey,
            featureKey,
            baseHref
        )
    }, [customItems, from, validatedLevels, resolvedKeys, baseHref, scope, scopeId])

    // =========================================================================
    // PERMISSION FILTERING (Runtime)
    // =========================================================================
    const [filteredNavItems, setFilteredNavItems] = useState<NavItem[]>(navItems)
    const [permissionsLoaded, setPermissionsLoaded] = useState(!filterByPermission)

    useEffect(() => {
        // If no filter callback provided, use all items
        if (!filterByPermission) {
            setFilteredNavItems(navItems)
            setPermissionsLoaded(true)
            return
        }

        // Capture the filter function to avoid closure issues
        const checkPermission = filterByPermission

        // Filter items by permission asynchronously
        async function filterItems() {
            const filteredItems: NavItem[] = []

            for (const item of navItems) {
                // Check parent permission
                const hasParentPermission = item.permissionKey
                    ? await Promise.resolve(checkPermission(item.permissionKey))
                    : true

                if (!hasParentPermission) continue

                // Filter children if they exist
                let filteredChildren: NavItem[] | undefined
                if (item.children && item.children.length > 0) {
                    filteredChildren = []
                    for (const child of item.children) {
                        const hasChildPermission = child.permissionKey
                            ? await Promise.resolve(checkPermission(child.permissionKey))
                            : true
                        if (hasChildPermission) {
                            filteredChildren.push(child)
                        }
                    }
                    // If all children filtered out, skip this parent too
                    if (filteredChildren.length === 0) continue
                }

                filteredItems.push({
                    ...item,
                    children: filteredChildren,
                })
            }

            setFilteredNavItems(filteredItems)
            setPermissionsLoaded(true)
        }

        filterItems()
    }, [navItems, filterByPermission])

    // Determine active item key
    const activeKey = useMemo(() => {
        for (const item of navItems) {
            if (pathname === item.href || pathname.startsWith(item.href + '/')) {
                return item.key
            }
            if (item.children) {
                for (const child of item.children) {
                    if (pathname === child.href || pathname.startsWith(child.href + '/')) {
                        return child.key
                    }
                }
            }
        }
        return navItems[0]?.key
    }, [pathname, navItems])

    // Split items into visible and overflow
    const visibleItems = navItems.slice(0, maxVisibleTabs)
    const overflowItems = navItems.slice(maxVisibleTabs)
    const hasOverflow = overflowItems.length > 0

    // Check if overflow contains active item
    const overflowHasActive = overflowItems.some(
        item => item.key === activeKey || item.children?.some(c => c.key === activeKey)
    )

    // Check if items have children (multi-level) or flat list (1 level)
    const isFlat = !filteredNavItems.some(item => item.children && item.children.length > 0)

    // Get the active item's label for dropdown trigger (default to first item)
    const activeLabel = useMemo(() => {
        // Find active item
        for (const item of filteredNavItems) {
            if (item.key === activeKey) return item.label
            if (item.children) {
                for (const child of item.children) {
                    if (child.key === activeKey) return child.label
                }
            }
        }
        // Default to first item's label or triggerLabel
        return filteredNavItems[0]?.label || triggerLabel
    }, [filteredNavItems, activeKey, triggerLabel])

    // Don't render if no items
    if (navItems.length === 0) {
        return null
    }

    // =========================================================================
    // DROPDOWN VARIANT
    // =========================================================================
    if (variant === 'dropdown') {
        return (
            <div className={cn("flex items-center", className)}>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline">{activeLabel}</Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56" align="start">
                        {isFlat ? (
                            // Flat list - no group labels, simple items
                            filteredNavItems.map(item => (
                                <DropdownMenuItem
                                    key={item.key}
                                    asChild
                                >
                                    <Link
                                        href={item.href}
                                        className={cn(
                                            "w-full cursor-pointer gap-2",
                                            item.key === activeKey && "bg-accent"
                                        )}
                                    >
                                        {item.icon}
                                        {item.label}
                                    </Link>
                                </DropdownMenuItem>
                            ))
                        ) : (
                            // Multi-level - with group labels
                            filteredNavItems.map((item, idx) => (
                                <React.Fragment key={item.key}>
                                    <DropdownMenuGroup>
                                        <DropdownMenuLabel className="text-xs text-muted-foreground">
                                            {item.label}
                                        </DropdownMenuLabel>
                                        {item.children && item.children.length > 0 ? (
                                            // Item with children -> show children directly + sub-menu
                                            <>
                                                {item.children.slice(0, 3).map(child => (
                                                    <DropdownMenuItem
                                                        key={child.key}
                                                        asChild
                                                    >
                                                        <Link
                                                            href={child.href}
                                                            className={cn(
                                                                "w-full cursor-pointer gap-2",
                                                                child.key === activeKey && "bg-accent"
                                                            )}
                                                        >
                                                            {child.icon}
                                                            {child.label}
                                                        </Link>
                                                    </DropdownMenuItem>
                                                ))}
                                                {item.children.length > 3 && (
                                                    <DropdownMenuSub>
                                                        <DropdownMenuSubTrigger>More...</DropdownMenuSubTrigger>
                                                        <DropdownMenuPortal>
                                                            <DropdownMenuSubContent>
                                                                {item.children.slice(3).map(child => (
                                                                    <DropdownMenuItem
                                                                        key={child.key}
                                                                        asChild
                                                                    >
                                                                        <Link
                                                                            href={child.href}
                                                                            className={cn(
                                                                                "w-full cursor-pointer gap-2",
                                                                                child.key === activeKey && "bg-accent"
                                                                            )}
                                                                        >
                                                                            {child.icon}
                                                                            {child.label}
                                                                        </Link>
                                                                    </DropdownMenuItem>
                                                                ))}
                                                            </DropdownMenuSubContent>
                                                        </DropdownMenuPortal>
                                                    </DropdownMenuSub>
                                                )}
                                            </>
                                        ) : (
                                            // Simple item without children
                                            <DropdownMenuItem
                                                asChild
                                            >
                                                <Link
                                                    href={item.href}
                                                    className={cn(
                                                        "w-full cursor-pointer gap-2",
                                                        item.key === activeKey && "bg-accent"
                                                    )}
                                                >
                                                    {item.icon}
                                                    {item.label}
                                                </Link>
                                            </DropdownMenuItem>
                                        )}
                                    </DropdownMenuGroup>
                                    {idx < filteredNavItems.length - 1 && (
                                        <DropdownMenuSeparator />
                                    )}
                                </React.Fragment>
                            ))
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        )
    }

    // =========================================================================
    // NAVBAR VARIANT (default)
    // =========================================================================
    return (
        <div className={cn("flex items-center gap-2", className)}>
            <Tabs value={activeKey} className="w-full">
                <TabsList className="h-10 bg-transparent p-0 gap-1">
                    {visibleItems.map((item) => (
                        <TabsTrigger
                            key={item.key}
                            value={item.key}
                            asChild
                            className={cn(
                                "data-[state=active]:bg-muted data-[state=active]:shadow-none",
                                "px-3 py-2 h-9 rounded-md text-sm font-medium",
                                "hover:bg-muted/50 transition-colors"
                            )}
                        >
                            <Link href={item.href}>
                                {item.icon}
                                {item.label}
                            </Link>
                        </TabsTrigger>
                    ))}

                    {/* Overflow dropdown */}
                    {hasOverflow && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant={overflowHasActive ? "secondary" : "ghost"}
                                    size="sm"
                                    className={cn(
                                        "h-9 px-3 gap-1",
                                        overflowHasActive && "bg-muted"
                                    )}
                                >
                                    More
                                    <ChevronDown className="h-3.5 w-3.5" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                                {overflowItems.map((item, idx) => (
                                    <React.Fragment key={item.key}>
                                        {item.children && item.children.length > 0 ? (
                                            <DropdownMenuGroup>
                                                <DropdownMenuLabel className="text-xs">
                                                    {item.label}
                                                </DropdownMenuLabel>
                                                {item.children.map(child => (
                                                    <DropdownMenuItem key={child.key} asChild>
                                                        <Link
                                                            href={child.href}
                                                            className={cn(
                                                                "w-full cursor-pointer",
                                                                child.key === activeKey && "bg-muted"
                                                            )}
                                                        >
                                                            {child.icon}
                                                            {child.label}
                                                        </Link>
                                                    </DropdownMenuItem>
                                                ))}
                                            </DropdownMenuGroup>
                                        ) : (
                                            <DropdownMenuItem asChild>
                                                <Link
                                                    href={item.href}
                                                    className={cn(
                                                        "w-full cursor-pointer",
                                                        item.key === activeKey && "bg-muted"
                                                    )}
                                                >
                                                    {item.icon}
                                                    {item.label}
                                                </Link>
                                            </DropdownMenuItem>
                                        )}
                                        {idx < overflowItems.length - 1 && item.children && (
                                            <DropdownMenuSeparator />
                                        )}
                                    </React.Fragment>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </TabsList>
            </Tabs>
        </div>
    )
}
