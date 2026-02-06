'use client'

import React, { useState, useEffect, useCallback, useMemo } from "react"
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
import type { AddonCardData, BillingScope, CheckoutItem, User, CheckoutContext, CustomerData, PaymentMethod, CheckoutResult } from '@/types/billing'
import { getAddonCards } from '@/lib/registry/plans/pricing-config'
import { formatCurrency } from '@/lib/utils'
import { useCheckout } from '@/components/features/core/billing/checkout/use-checkout' 

/** Get icon for addon category */
function getCategoryIcon(category: AddonCardData['category']) {
    switch (category) {
        case 'fi':
            return <PiggyBank className="h-4 w-4" />
        case 'core':
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
 * Convert AddonCardData to CheckoutItem for unified checkout
 */
function addonToCheckoutItem(addon: AddonCardData): CheckoutItem {
    return {
        key: addon.key,
        type: 'addon',
        title: addon.title,
        description: addon.description,
        price: addon.price,
        priceAmount: addon.priceAmount,
        priceId: addon.priceId,
        interval: addon.interval,
        features: addon.features,
    }
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

    // Checkout context for the hook
    const checkoutContext: CheckoutContext = useMemo(() => ({
        agencyId: scopeId,
        customerId: billingData.customerId || undefined,
        isNewSubscription: false,
    }), [scopeId, billingData.customerId])

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

    // Handle checkout completion
    const handleCheckoutComplete = useCallback((result: CheckoutResult) => {
        if (result.success) {
            toast({
                title: 'Success',
                description: 'Add-on added successfully',
            })
            fetchActiveAddons()
        } else {
            toast({
                title: 'Error',
                description: result.error || 'Failed to add addon',
                variant: 'destructive',
            })
        }
    }, [toast, fetchActiveAddons])

    // Default user for checkout (will be fetched from session if not provided)
    const checkoutUser: User = useMemo(() => {
        if (billingData.user) return billingData.user
        return {
            id: '',
            email: '',
            name: '',
            firstName: '',
            lastName: '',
            trialEligible: false,
        }
    }, [billingData.user])

    // Setup unified checkout hook
    const { openCheckout, CheckoutModal } = useCheckout({
        user: checkoutUser,
        context: checkoutContext,
        existingCustomer: billingData.customer,
        existingPaymentMethods: billingData.paymentMethods,
        onComplete: handleCheckoutComplete,
        successUrl: `/${scope}/${scopeId}/billing/addons`,
        cancelUrl: `/${scope}/${scopeId}/billing/addons`,
    })

    useEffect(() => {
        fetchActiveAddons()
        fetchBillingData()
    }, [fetchActiveAddons, fetchBillingData])

    const isAddonActive = (key: string) => {
        return activeAddons.some(a => a.key === key && a.active)
    }

    /**
     * Handle adding addon via unified checkout
     * Opens checkout modal for a complete billing experience
     */
    const handleAddAddon = (addon: AddonCardData) => {
        const checkoutItem = addonToCheckoutItem(addon)
        openCheckout(checkoutItem)
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
        <>
        {/* Unified Checkout Modal */}
        {CheckoutModal}

        <div className="space-y-8">
            {/* Header */}
            <div>
                <h2 className="text-xl font-semibold text-content-primary">Add-ons</h2>
                <p className="text-sm text-content-secondary mt-1">
                    Extend your subscription with powerful add-on modules
                </p>
            </div>

            {/* Active Addons Summary */}
            {activeAddons.length > 0 && (
                <div className="bg-muted/50 rounded-lg p-4">
                    <h3 className="text-sm font-medium text-content-primary mb-2">Active Add-ons</h3>
                    <div className="flex flex-wrap gap-2">
                        {activeAddons.filter(a => a.active).map(addon => (
                            <Badge key={addon.id} variant="secondary" className="bg-brand-bg/10 text-brand-bg">
                                {addon.name}
                            </Badge>
                        ))}
                    </div>
                </div>
            )}

            {/* Addon Categories */}
            {Object.entries(groupedAddons).map(([category, categoryAddons]) => (
                <div key={category} className="space-y-4">
                    {/* Category Header */}
                    <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-brand-bg/10 border border-brand-bg/30">
                            {getCategoryIcon(category as AddonCardData['category'])}
                        </div>
                        <div>
                            <h3 className="text-base font-semibold text-content-primary">
                                {categoryLabels[category] || 'Add-ons'}
                            </h3>
                        </div>
                    </div>

                    {/* Addon Cards Grid */}
                    <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-4">
                        {categoryAddons.map((addon) => {
                            const amount = Math.round(addon.priceAmount / 100)
                            const isActive = isAddonActive(addon.key)
                            const hasRequirement = !!(addon.requires && !isAddonActive(addon.requires))
                            const isLoading = actionLoading === addon.key

                            return (
                                <Card
                                    key={addon.key}
                                    className={clsx(
                                        "group relative overflow-hidden rounded-xl flex flex-col transition-all duration-300",
                                        isActive
                                            ? "border-2 border-brand-bg bg-brand-bg/5"
                                            : "border border-line-primary bg-surface-secondary/95",
                                        hasRequirement && "opacity-50"
                                    )}
                                >
                                    {/* Active/Recommended badge */}
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
                                    </div>

                                    <CardHeader className="pb-3">
                                        <div className="flex items-start gap-3">
                                            <div className={clsx(
                                                "flex items-center justify-center h-10 w-10 rounded-lg transition-colors",
                                                isActive
                                                    ? "bg-brand-bg text-white"
                                                    : "bg-surface-tertiary border border-line-secondary"
                                            )}>
                                                {getAddonTypeIcon(addon.addonType)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <CardTitle className="text-base font-semibold text-content-primary truncate">
                                                    {addon.title}
                                                </CardTitle>
                                                <CardDescription className="text-xs text-content-secondary line-clamp-2 mt-1">
                                                    {addon.description}
                                                </CardDescription>
                                            </div>
                                        </div>
                                    </CardHeader>

                                    <CardContent className="flex-1 space-y-4 pb-3">
                                        {/* Price */}
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-2xl font-bold bg-gradient-to-b from-neutral-header to-neutral-fg-tertiary bg-clip-text text-transparent">
                                                {formatCurrency(amount, addon.currency)}
                                            </span>
                                            <span className="text-sm text-content-tertiary">
                                                /{addon.interval === 'one_time' ? 'one-time' : 'month'}
                                            </span>
                                        </div>

                                        {/* Requirement Notice */}
                                        {hasRequirement && (
                                            <div className="text-xs text-warning-fg bg-warning-bg/10 border border-warning-border/30 rounded-md px-2 py-1.5">
                                                Requires {addon.requires} addon
                                            </div>
                                        )}

                                        {/* Features */}
                                        <ul className="space-y-1.5">
                                            {addon.features.slice(0, 3).map((feature) => (
                                                <li key={feature} className="flex items-start gap-2">
                                                    <div className="flex-shrink-0 inline-flex h-4 w-4 items-center justify-center rounded-full bg-brand-bg/10 border border-brand-bg/30 mt-0.5">
                                                        <Check className="h-2.5 w-2.5 text-brand-bg" strokeWidth={2.5} />
                                                    </div>
                                                    <span className="text-xs text-content-primary leading-relaxed">
                                                        {feature}
                                                    </span>
                                                </li>
                                            ))}
                                            {addon.features.length > 3 && (
                                                <li className="text-xs text-content-tertiary pl-6">
                                                    +{addon.features.length - 3} more features
                                                </li>
                                            )}
                                        </ul>
                                    </CardContent>

                                    <CardFooter className="pt-0 pb-4">
                                        <Button
                                            variant={isActive ? "outline" : "default"}
                                            size="sm"
                                            className={clsx(
                                                "w-full transition-all",
                                                !isActive && "bg-brand-gradient hover:bg-brand-gradient-hover"
                                            )}
                                            onClick={() => handleToggleAddon(addon)}
                                            disabled={hasRequirement || isLoading}
                                        >
                                            {isLoading ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : isActive ? (
                                                'Remove Add-on'
                                            ) : (
                                                <>
                                                    <Plus className="h-4 w-4 mr-1.5" />
                                                    Add to Subscription
                                                </>
                                            )}
                                        </Button>
                                    </CardFooter>
                                </Card>
                            )
                        })}
                    </div>
                </div>
            ))}
        </div>
        </>
    )
}

export default AddonManagement
