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

        <div className="space-y-10">
            {/* Header - Premium styling */}
            <div className="flex flex-col gap-3">
                <h1 className="text-4xl font-bold">Add-ons</h1>
                <p className="text-muted-foreground text-base">
Extension premium features to enhance your platform capabilities
                </p>
            </div>

            {/* Active Addons Summary - Elegant card */}
            {activeAddons.length > 0 && (
                <Card className="bg-gradient-to-br from-muted/30 to-transparent border-border/50 shadow-sm">
                    <CardHeader className="pb-4">
                        <CardTitle className="text-lg font-semibold flex items-center gap-2">
                            <ShoppingCart className="h-5 w-5 text-primary" />
                            Active Add-ons
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-2">
                            {activeAddons.filter(a => a.active).map(addon => (
                                <Badge key={addon.id} variant="secondary" className="bg-primary/10 text-primary border-primary/20 px-3 py-1">
                                    <Check className="h-3 w-3 mr-1" />
                                    {addon.name}
                                </Badge>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Addon Categories */}
            {Object.entries(groupedAddons).map(([category, categoryAddons]) => (
                <div key={category} className="space-y-6">
                    {/* Category Header - Premium styling */}
                    <div className="flex items-center gap-4 pb-2 border-b border-border/50">
                        <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20">
                            {getCategoryIcon(category as AddonCardData['category'])}
                        </div>
                        <div>
                            <h2 className="text-2xl font-semibold">
                                {categoryLabels[category] || 'Add-ons'}
                            </h2>
                        </div>
                    </div>

                    {/* Addon Cards Grid - More breathing room */}
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {categoryAddons.map((addon) => {
                            const amount = Math.round(addon.priceAmount / 100)
                            const isActive = isAddonActive(addon.key)
                            const hasRequirement = !!(addon.requires && !isAddonActive(addon.requires))
                            const isLoading = actionLoading === addon.key

                            return (
                                <Card
                                    key={addon.key}
                                    className={clsx(
                                        "group relative overflow-hidden rounded-xl flex flex-col transition-all duration-300 hover:shadow-lg",
                                        isActive
                                            ? "border-2 border-primary bg-gradient-to-br from-primary/5 to-transparent shadow-md"
                                            : "border border-border/50 bg-gradient-to-br from-muted/20 to-transparent hover:border-primary/30",
                                        hasRequirement && "opacity-60 cursor-not-allowed"
                                    )}
                                >
                                    {/* Active/Recommended badge - Refined */}
                                    <div className="absolute top-4 right-4 flex gap-2 z-10">
                                        {isActive && (
                                            <Badge variant="default" className="bg-primary text-primary-foreground text-xs font-medium px-2 py-0.5 shadow-sm">
                                                <Check className="h-3 w-3 mr-1" />
                                                Active
                                            </Badge>
                                        )}
                                        {addon.recommended && !isActive && (
                                            <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/30 text-xs font-medium px-2 py-0.5">
                                                Recommended
                                            </Badge>
                                        )}
                                    </div>

                                    <CardHeader className="pb-4 pt-6">
                                        <div className="flex items-start gap-4">
                                            <div className={clsx(
                                                "flex items-center justify-center h-12 w-12 rounded-xl transition-all duration-300",
                                                isActive
                                                    ? "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-md"
                                                    : "bg-gradient-to-br from-muted to-muted/50 border border-border/50 group-hover:border-primary/30"
                                            )}>
                                                {getAddonTypeIcon(addon.addonType)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <CardTitle className="text-lg font-semibold mb-2">
                                                    {addon.title}
                                                </CardTitle>
                                                <CardDescription className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                                                    {addon.description}
                                                </CardDescription>
                                            </div>
                                        </div>
                                    </CardHeader>

                                    <CardContent className="flex-1 space-y-5 pb-4">
                                        {/* Price - Premium typography */}
                                        <div className="flex items-baseline gap-1.5">
                                            <span className="text-3xl font-bold">
                                                {formatCurrency(amount, addon.currency)}
                                            </span>
                                            <span className="text-sm text-muted-foreground font-medium">
                                                /{addon.interval === 'one_time' ? 'one-time' : 'mo'}
                                            </span>
                                        </div>

                                        {/* Requirement Notice */}
                                        {hasRequirement && (
                                            <div className="text-xs text-yellow-700 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800/30 rounded-lg px-3 py-2">
                                                Requires {addon.requires} addon
                                            </div>
                                        )}

                                        {/* Features - Better spacing */}
                                        <ul className="space-y-2.5">
                                            {addon.features.slice(0, 3).map((feature) => (
                                                <li key={feature} className="flex items-start gap-2.5">
                                                    <div className="flex-shrink-0 inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 border border-primary/20 mt-0.5">
                                                        <Check className="h-3 w-3 text-primary" strokeWidth={2.5} />
                                                    </div>
                                                    <span className="text-sm text-foreground/90 leading-relaxed">
                                                        {feature}
                                                    </span>
                                                </li>
                                            ))}
                                            {addon.features.length > 3 && (
                                                <li className="text-sm text-muted-foreground pl-7 font-medium">
                                                    +{addon.features.length - 3} more features
                                                </li>
                                            )}
                                        </ul>
                                    </CardContent>

                                    <CardFooter className="pt-2 pb-6">
                                        <Button
                                            variant={isActive ? "outline" : "default"}
                                            size="default"
                                            className={clsx(
                                                "w-full transition-all font-medium",
                                                !isActive && "shadow-sm hover:shadow-md"
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
                                                    <Plus className="h-4 w-4 mr-2" />
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
