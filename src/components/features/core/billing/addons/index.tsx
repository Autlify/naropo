'use client'

import React, { useState, useEffect, useCallback } from "react"
import clsx from "clsx"
import { Check, Plus, Zap, PiggyBank, Headphones, Palette, Loader2, ShoppingCart } from "lucide-react"
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import type { AddonCardData, BillingScope, User, CustomerData, PaymentMethod } from '@/types/billing'
import { getAddonCards } from '@/lib/registry/plans/pricing-config'
import { cn, formatCurrency } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import { BentoGrid } from '@/components/ui/bento-grid'
import CustomModal from '@/components/global/custom-modal'
import { useModal } from '@/providers/modal-provider'
import { CustomModifiers } from 'react-day-picker'


/** Get icon for addon category */
function getCategoryIcon(category: AddonCardData['category']) {
    switch (category) {
        case 'fi':
            return <PiggyBank className="h-4 w-4" />
        case 'org':
            return <Zap className="h-4 w-4" />
        default:
            return <Plus className="h-4 w-4" />
    }
}

/** Get icon for addon type */
function getAddonTypeIcon(addonType: AddonCardData['addonType']) {
    switch (addonType) {
        case 'support':
            return <Headphones className="h-3 w-3" />
        case 'branding':
            return <Palette className="h-3 w-3" />
        case 'finance':
            return <PiggyBank className="h-3 w-3" />
        default:
            return <Zap className="h-3 w-3" />
    }
}

interface AddonManagementProps {
    scope: BillingScope
    scopeId: string
    /** Optional user info for checkout (fetched if not provided) */
    user?: User
    /** Optional customer data for checkout */
    existingCustomer?: CustomerData | null
    /** Optional payment methods for checkout */
    existingPaymentMethods?: PaymentMethod[]
}

interface ActiveAddon {
    id: string
    name: string
    priceId: string
    active: boolean
    key: string | null
}

interface AgencyBillingData {
    user: User | null
    customerId: string | null
    customer: CustomerData | null
    paymentMethods: PaymentMethod[]
}

/**
 * Addon Management Component
 * 
 * Displays available addons for agencies with active subscriptions.
 * Allows adding/removing addons from subscription via unified checkout.
 * 
 * Note: customerId is derived from agency on the server side.
 */
export function AddonManagement({
    scope,
    scopeId,
    user: propUser,
    existingCustomer: propCustomer,
    existingPaymentMethods: propPaymentMethods,
}: AddonManagementProps) {
    const { toast } = useToast()
    const router = useRouter()
    const [viewDetailsAddon, setViewDetailsAddon] = useState<React.ReactNode | null>(null)
    const [loading, setLoading] = useState(true)
    const [actionLoading, setActionLoading] = useState<string | null>(null)
    const [activeAddons, setActiveAddons] = useState<ActiveAddon[]>([])
    const [availableAddons] = useState<AddonCardData[]>(() => getAddonCards())
    const [billingData, setBillingData] = useState<AgencyBillingData>({
        user: propUser || null,
        customerId: null,
        customer: propCustomer || null,
        paymentMethods: propPaymentMethods || [],
    })


    const categoryLabels: Record<string, string> = {
        fi: 'Finance Modules',
        core: 'Core Add-ons',
        co: 'Commerce',
        crm: 'CRM',
        apps: 'Apps',
        iam: 'Identity & Access',
    }

    // Add-ons are NOT plans.
    // They should be added as subscription items to an existing plan subscription.
    const handleCheckout = async (addon: AddonCardData) => {
        try {
            const res = await fetch('/api/stripe/addon', {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({
                    action: 'add',
                    agencyId: scopeId,
                    addonKey: addon.key,
                    priceId: addon.priceId,
                }),
            })

            const data = await res.json().catch(() => ({}))

            if (!res.ok || data?.error) {
                toast({
                    title: 'Error',
                    description: data?.error || data?.details || 'Failed to add add-on',
                    variant: 'destructive',
                })
                return
            }

            if (data?.requiresSubscription) {
                toast({
                    title: 'Plan required',
                    description: 'Please subscribe to a plan first before purchasing add-ons.',
                })
                router.push('/site/pricing')
                return
            }

            toast({
                title: 'Success',
                description: data?.message || 'Add-on added successfully',
            })
            fetchActiveAddons()
        } catch (e) {
            toast({
                title: 'Error',
                description: e instanceof Error ? e.message : 'Failed to add add-on',
                variant: 'destructive',
            })
        }
    }


    // Fetch active addons and billing data for agency
    const fetchActiveAddons = useCallback(async () => {
        try {
            const res = await fetch(`/api/stripe/addon?agencyId=${scopeId}`)
            if (res.ok) {
                const data = await res.json()
                setActiveAddons(data.addons || [])
            }
        } catch (error) {
            console.error('Failed to fetch addons:', error)
        } finally {
            setLoading(false)
        }
    }, [scopeId])

    // Fetch billing data (user, customer, payment methods) if not provided via props
    const fetchBillingData = useCallback(async () => {
        if (propUser && propCustomer && propPaymentMethods) {
            return // Already have all data from props
        }

        try {
            // Fetch session user if needed
            if (!propUser) {
                const sessionRes = await fetch('/api/auth/session')
                if (sessionRes.ok) {
                    const session = await sessionRes.json()
                    if (session?.user) {
                        const nameParts = (session.user.name || '').split(' ')
                        setBillingData(prev => ({
                            ...prev,
                            user: {
                                id: session.user.id || '',
                                email: session.user.email || '',
                                name: session.user.name || '',
                                firstName: nameParts[0] || '',
                                lastName: nameParts.slice(1).join(' ') || '',
                                trialEligible: false,
                            },
                        }))
                    }
                }
            }

            // Fetch customer data and payment methods
            const customerRes = await fetch(`/api/stripe/customer?agencyId=${scopeId}`)
            if (customerRes.ok) {
                const data = await customerRes.json()
                setBillingData(prev => ({
                    ...prev,
                    customerId: data.customerId || null,
                    customer: data.customer || null,
                    paymentMethods: data.paymentMethods || [],
                }))
            }
        } catch (error) {
            console.error('Failed to fetch billing data:', error)
        }
    }, [scopeId, propUser, propCustomer, propPaymentMethods])


    useEffect(() => {
        fetchActiveAddons()
        fetchBillingData()
    }, [fetchActiveAddons, fetchBillingData])

    const isAddonActive = (key: string) => {
        return activeAddons.some(a => a.key === key && a.active)
    }

    /**
     * Add add-on as a Stripe subscription item.
     * (Add-ons are recurring line items, not a plan checkout.)
     */
    const handleAddAddon = (addon: AddonCardData) => {
        setActionLoading(addon.key)
        Promise.resolve(handleCheckout(addon)).finally(() => setActionLoading(null))
    }

    /**
     * Handle removing addon directly via API
     * No checkout needed for removal
     */
    const handleRemoveAddon = async (addon: AddonCardData) => {
        setActionLoading(addon.key)

        try {
            const res = await fetch('/api/stripe/addon', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'remove',
                    agencyId: scopeId,
                    addonKey: addon.key,
                    priceId: addon.priceId,
                }),
            })

            const data = await res.json()

            if (res.ok) {
                toast({
                    title: 'Success',
                    description: data.message || `${addon.title} removed successfully`,
                })
                await fetchActiveAddons()
            } else {
                toast({
                    title: 'Error',
                    description: data.error || 'Failed to remove addon',
                    variant: 'destructive',
                })
            }
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to remove addon. Please try again.',
                variant: 'destructive',
            })
        } finally {
            setActionLoading(null)
        }
    }

    /**
     * Toggle addon - adds via checkout, removes via direct API
     */
    const handleToggleAddon = (addon: AddonCardData) => {
        const isActive = isAddonActive(addon.key)
        if (isActive) {
            handleRemoveAddon(addon)
        } else {
            handleAddAddon(addon)
        }
    }

    const handleViewDetails = (addon: AddonCardData) => {
        setViewDetailsAddon(
            <CustomModal
                title={addon.title}
                subheading={addon.description}
                defaultOpen={addon !== null}
                className="max-w-lg"
                onOpenChange={(open) => {
                    if (!open) setViewDetailsAddon(null)
                }}

            >
                <div className="space-y-4">
                    <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold bg-gradient-to-b from-neutral-header to-neutral-fg-tertiary bg-clip-text text-transparent">
                            {formatCurrency(Math.round(addon.priceAmount / 100), addon.currency)}
                        </span>
                        <span className="text-sm text-content-tertiary">
                            /{addon.interval === 'one_time' ? 'one-time' : 'month'}
                        </span>
                    </div>
                    {addon.requires && (
                        <div className="text-xs font-bold text-warning-fg bg-warning-bg/10 border border-warning-border/30 rounded-md px-2 py-1.5">
                            Requires {addon.requires} addon
                        </div>
                    )}
                    <div className="space-y-2">
                        <p className="text-sm font-medium text-content-primary">What you get</p>
                        <ul className="space-y-2">
                            {addon.features.map((feature) => (
                                <li key={feature} className="flex items-start gap-2 text-sm text-content-primary">
                                    <Check className="h-4 w-4 text-brand-bg mt-0.5" />
                                    <span>{feature}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div className="pt-2 flex flex-wrap gap-2">
                        <Button
                            variant={isAddonActive(addon.key) ? "outline" : "default"}
                            size="sm"
                            className={clsx(!isAddonActive(addon.key) && "bg-brand-gradient hover:bg-brand-gradient-hover")}
                            onClick={() => {
                                handleToggleAddon(addon)
                                setViewDetailsAddon(null)
                            }}
                        >
                            {isAddonActive(addon.key) ? 'Remove Add-on' : 'Subscribe'}
                        </Button>
                    </div>
                </div>
            </CustomModal>
        )
    }

    // Group addons by category
    const groupedAddons = availableAddons.reduce((acc, addon) => {
        const category = addon.category
        if (!acc[category]) acc[category] = []
        acc[category].push(addon)
        return acc
    }, {} as Record<string, AddonCardData[]>)

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    return (
        <div className="h-full top-0">
            {/* Catalog - Addon Category */}
            {Object.entries(groupedAddons).map(([category, categoryAddons]) => (
                <div key={category} className="space-y-4">
                    {/* Category Header */}
                    <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center h-5 w-5 rounded-lg bg-brand-bg/10 border border-brand-bg/30">
                            {getCategoryIcon(category as AddonCardData['category'])}
                        </div>
                        <div>
                            <h3 className="text-md font-semibold text-content-primary">
                                {categoryLabels[category] || 'Add-ons'}
                            </h3>
                        </div>
                    </div>

                    {/* Addon Cards Bento Grid */}
                    {/*
                          Layout tuning (Microsoft-like density):
                          - reduce row height to avoid excessive whitespace
                          - increase grid gap for cleaner rhythm
                          - keep our premium styling and bento emphasis
                        */}
                    <BentoGrid className="mx-0 max-w-none h-full gap-x-4 gap-y-2 sm:gap-x-5 lg:gap-x-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 auto-rows-[1fr]">
                        {categoryAddons.map((addon, index) => {
                            const amount = Math.round(addon.priceAmount / 100)
                            const isActive = isAddonActive(addon.key)
                            const hasRequirement = !!(addon.requires && !isAddonActive(addon.requires))
                            const isLoading = actionLoading === addon.key

                            const featuredKey = categoryAddons.find((a) => a.recommended)?.key ?? categoryAddons[0]?.key
                            const isFeatured = addon.key === featuredKey

                            return (
                                <Card
                                    key={addon.key}
                                    className={clsx(
                                        "h-[260px] py-2",
                                        "group relative overflow-hidden rounded-xl flex flex-col transition-all duration-300",
                                        // Bento sizing: feature one item per category
                                        isFeatured && "md:col-span-2",
                                        isActive
                                            ? "border-2 border-brand-bg bg-brand-bg/5"
                                            : "border border-line-primary bg-surface-secondary/95",
                                        hasRequirement && "opacity-60",
                                    )}
                                >
                                    {/* Subtle bento glow */}
                                    <div
                                        aria-hidden
                                        className={clsx(
                                            "pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300",
                                            "bg-[radial-gradient(ellipse_at_top,rgba(99,102,241,0.10),transparent_55%)]",
                                            "group-hover:opacity-100"
                                        )}
                                    />
                                    {/* Active/Recommended badge */}
                                    <div className="flex flex-1">
                                        <div className="absolute top-3 right-3 flex gap-1">
                                            {isActive && (
                                                <Badge variant="default" className="bg-brand-bg text-white text-[10px]">
                                                    Active
                                                </Badge>
                                            )}
                                            {addon.recommended && !isActive && (
                                                <Badge variant="secondary" className="bg-brand-bg/10 text-brand-bg border-brand-bg/30 text-[10px]">
                                                    Recommended
                                                </Badge>
                                            )}
                                            {hasRequirement && (
                                                <Badge variant="secondary" className="bg-warning-bg/10 text-warning-fg border-warning-border/30 text-[10px]">
                                                    Pre-requisite
                                                </Badge>
                                            )}
                                        </div>

                                        <CardHeader className={clsx(
                                            "pt-4 pb-2 px-4",
                                            isFeatured ? "flex items-start gap-3" : "pb-2"
                                        )}>
                                            <div className="absolute top-3 left-5 flex items-start">

                                                {/* <div className={cn(
                                                "flex items-center justify-center h-8 w-8 rounded-lg transition-colors",
                                                isActive
                                                    ? "bg-brand-bg text-white"
                                                    : "bg-surface-tertiary border border-line-secondary"
                                            )}>
                                                {getAddonTypeIcon(addon.addonType)}
                                            </div> */}
                                                <div className="flex-1 min-w-0">
                                                    <CardTitle className="lg:!text-lg leading-snug text-content-primary line-clamp-2">
                                                        {addon.title}
                                                    </CardTitle>
                                                    <CardDescription className="text-xs text-content-secondary line-clamp-2 mt-0.5">
                                                        {addon.description}
                                                    </CardDescription>
                                                </div>
                                            </div>
                                        </CardHeader>
                                    </div>
                                    <CardContent className="relative flex-1 space-y-3">
                                        {/* Price */}
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-xl font-bold bg-gradient-to-b from-neutral-header to-neutral-fg-tertiary bg-clip-text text-transparent">
                                                {formatCurrency(amount, addon.currency)}
                                            </span>
                                            <span className="text-sm text-content-tertiary">
                                                /{addon.interval === 'one_time' ? 'one-time' : 'month'}
                                            </span>
                                        </div>

                                        {/* Requirement Notice */}
                                        {/* {hasRequirement && (
                                            <div className="text-xs text-warning-fg bg-warning-bg/10 border border-warning-border/30 rounded-md px-2 py-1.5">
                                                Requires {addon.requires} addon
                                            </div>
                                        )} */}

                                        {/* Features */}
                                        {isFeatured ? (
                                            /* Two-column layout for featured cards */
                                            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                                                {addon.features.map((feature, idx) => (
                                                    <div key={feature} className="flex items-start gap-2">
                                                        <div className="flex-shrink-0 inline-flex h-4 w-4 items-center justify-center rounded-full bg-brand-bg/10 border border-brand-bg/30 mt-0.5">
                                                            <Check className="h-2.5 w-2.5 text-brand-bg" strokeWidth={2.5} />
                                                        </div>
                                                        <span className="text-xs text-content-primary leading-relaxed line-clamp-1">
                                                            {feature}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            /* Standard single-column for regular cards */
                                            <ul className={cn("space-y-1.5")}>
                                                {addon.features.slice(0, 2).map((feature) => (
                                                    <li key={feature} className={cn("flex items-start gap-2")}>
                                                        <div className="flex-shrink-0 inline-flex h-4 w-4 items-center justify-center rounded-full bg-brand-bg/10 border border-brand-bg/30 mt-0.5">
                                                            <Check className="h-2.5 w-2.5 text-brand-bg" strokeWidth={2.5} />
                                                        </div>
                                                        <span className="text-xs text-content-primary leading-relaxed">
                                                            {feature}
                                                        </span>
                                                    </li>
                                                ))}
                                                {addon.features.length > 2 && (
                                                    <li className="text-xs text-content-tertiary pl-6 text-primary font-semibold">
                                                        +{addon.features.length - 2} more features
                                                    </li>
                                                )}
                                            </ul>
                                        )}
                                    </CardContent>

                                    <CardFooter className="flex items-center justify-start gap-2">
                                        {/* Subscribe button - hidden for pre-requisite cards */}
                                        {!hasRequirement && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className={clsx(
                                                    "h-9 w-full sm:w-auto sm:min-w-[100px] px-4 transition-all",
                                                    !isActive && "border-brand-bg/50 text-brand-bg hover:bg-brand-bg/10 hover:border-brand-bg"
                                                )}
                                                onClick={() => handleToggleAddon(addon)}
                                                disabled={isLoading}
                                            >
                                                {isLoading ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : isActive ? (
                                                    'Remove Add-on'
                                                ) : (
                                                    <>
                                                        <Plus className="h-4 w-4 mr-0.5" />
                                                        Subscribe
                                                    </>
                                                )}
                                            </Button>
                                        )}
                                        <Button
                                            variant={'ghost'}
                                            size="sm"
                                            className="h-9 w-full sm:w-auto sm:min-w-[100px] px-4 transition-all border border-border/30 hover:border-border/50 bg-gradient-to-r from-muted/30 via-muted/20 to-muted/20 hover:from-muted/40 hover:via-muted/40 hover:to-muted/20"
                                            onClick={() => handleViewDetails(addon)}
                                        >
                                            View details
                                        </Button>
                                    </CardFooter>
                                </Card>
                            )
                        })}
                    </BentoGrid>
                </div>
            ))}

            {/** Custom Modal - Detailed View */}
            {viewDetailsAddon}
            {/* {selectedAddon && (
                <CustomModal
                    title={selectedAddon.title}
                    subheading={selectedAddon.description}
                    defaultOpen={selectedAddon !== null}
                    className="max-w-lg"
                    onClose={() => setSelectedAddon(null)}
                    
                >
                    <div className="space-y-4">
                        <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-bold bg-gradient-to-b from-neutral-header to-neutral-fg-tertiary bg-clip-text text-transparent">
                                {formatCurrency(Math.round(selectedAddon.priceAmount / 100), selectedAddon.currency)}
                            </span>
                            <span className="text-sm text-content-tertiary">
                                /{selectedAddon.interval === 'one_time' ? 'one-time' : 'month'}
                            </span>
                        </div>
                                  {selectedAddon.requires && (
                                            <div className="text-xs font-bold text-warning-fg bg-warning-bg/10 border border-warning-border/30 rounded-md px-2 py-1.5">
                                                Requires {selectedAddon.requires} addon
                                            </div>
                                        )}
                        <div className="space-y-2">
                            <p className="text-sm font-medium text-content-primary">What you get</p>
                            <ul className="space-y-2">
                                {selectedAddon.features.map((feature) => (
                                    <li key={feature} className="flex items-start gap-2 text-sm text-content-primary">
                                        <Check className="h-4 w-4 text-brand-bg mt-0.5" />
                                        <span>{feature}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="pt-2 flex flex-wrap gap-2">
                            <Button
                                variant={isAddonActive(selectedAddon.key) ? "outline" : "default"}
                                size="sm"
                                className={clsx(!isAddonActive(selectedAddon.key) && "bg-brand-gradient hover:bg-brand-gradient-hover")}
                                onClick={() => {
                                    handleToggleAddon(selectedAddon)
                                    setSelectedAddon(null)
                                }}
                            >
                                {isAddonActive(selectedAddon.key) ? 'Remove Add-on' : 'Subscribe'}
                            </Button>

                            <Button variant="ghost" size="sm" onClick={() => setSelectedAddon(null)}>
                                Cancel
                            </Button>
                        </div>
                    </div>
                </CustomModal>
            )} */}
        </div>
    )
}

export default AddonManagement