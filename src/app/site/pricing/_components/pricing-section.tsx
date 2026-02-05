'use client'

import React, { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import clsx from "clsx"
import { Check, ChevronRight, Sparkles, Building2, Minus, Plus } from "lucide-react"
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { PricingCardData } from '@/types/billing'
import { SegmentedControl } from '@/components/ui/segmented-control'
import { calculatePrice, formatAmount as formatCurrency } from '@/lib/registry/plans/pricing-config'

/** Format amount with comma separators (for display in RM without cents) */
function formatAmount(amount: number): string {
    return amount.toLocaleString('en-MY')
}

type Interval = 'monthly' | 'annually'

interface PricingSectionProps {
    monthlyCards: PricingCardData[]
    yearlyCards: PricingCardData[]
    user: {
        trialEligible?: boolean
    } | null
}

export function PricingSection({
    monthlyCards,
    yearlyCards,
    user
}: PricingSectionProps) {
    const router = useRouter()
    const [interval, setInterval] = useState<Interval>('monthly')
    const [enterpriseDialogOpen, setEnterpriseDialogOpen] = useState(false)
    const [subAccountCount, setSubAccountCount] = useState(20)
    const [selectedEnterpriseCard, setSelectedEnterpriseCard] = useState<PricingCardData | null>(null)

    const cards = interval === 'monthly' ? monthlyCards : yearlyCards
    const intervalLabel = interval === 'monthly' ? 'month' : 'year'

    const handleValueChange = (tabId: string) => {
        setInterval(tabId as Interval)
    }

    return (
        <>
            {/* Interval Toggle */}
            <div className="flex justify-center mb-12">

                <SegmentedControl
                    tabs={[
                        { id: 'monthly' as Interval, label: 'Monthly' },
                        { id: 'annually' as Interval, label: 'Annually' }
                    ]}
                    value={interval}
                    onValueChange={handleValueChange}
                />

                {/* 
                    <button
                        type="button"
                        onClick={() => setInterval("monthly")}
                        className={cn(
                            "px-8 py-2 rounded-md text-sm font-medium transition-all duration-200",
                            interval === "monthly"
                                ? "bg-primary text-primary-foreground shadow-sm"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        Monthly
                    </button>
                    <button
                        type="button"
                        onClick={() => setInterval("annually")}
                        className={cn(
                            "px-8 py-2 rounded-md text-sm font-medium transition-all duration-200",
                            interval === "annually"
                                ? "bg-primary text-primary-foreground shadow-sm"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        Yearly <span className="text-xs">(Save 20%)</span>
                    </button> */}


                {/* <button
                        onClick={() => setInterval('monthly')}
                        className={cn(
                            "px-6 py-2.5 rounded-md transition-all duration-200",
                            interval === 'monthly'
                                ? "bg-background text-foreground shadow-sm border border-border"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        Monthly
                    </button>
                    <button
                        onClick={() => setInterval('annually')}
                        className={cn(
                            "px-6 py-2.5 rounded-md transition-all duration-200 flex items-center gap-2",
                            interval === 'annually'
                                ? "bg-background text-foreground shadow-sm border border-border"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        Annually
                        <span className="text-xs bg-brand-bg text-white px-2 py-0.5 rounded-full">
                            Save 20%
                        </span>
                    </button> */}
            </div>


            {/* Pricing Cards */}
            <div className="grid gap-5 lg:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 max-w-7xl mx-auto">
                {cards.map((card) => {
                    const isPopular = card.highlight || card.key === "ADVANCED"
                    const amount = Math.round(card.priceAmount / 100)
                    const trialEnabled = card.trialEnabled && card.trialDays > 0

                    const wrapperClass = clsx(
                        "group relative rounded-xl transition-all duration-500",
                        "hover:-translate-y-1"
                    )

                    const surfaceClass = clsx(
                        "relative overflow-hidden rounded-xl flex flex-col h-full",
                        "shadow-sm",
                        "transition-all duration-500",
                        "backdrop-blur-xl backdrop-saturate-150",
                        "bg-surface-secondary/95 hover:bg-surface-tertiary/95",
                        "hover:shadow-md",
                        isPopular
                            ? "border-2 border-brand-bg"
                            : "border border-line-primary hover:border-line-primary/60"
                    )

                    return (
                        <div key={card.priceId} className={wrapperClass}>
                            <Card
                                className={surfaceClass}
                                role="article"
                                aria-label={`${card.title} pricing plan`}
                            >
                                {/* Hover gradient */}
                                <div
                                    aria-hidden
                                    className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100 bg-gradient-to-br from-accent-base/[0.03] via-transparent to-transparent"
                                />

                                {/* Popular badge glow */}
                                {isPopular && (
                                    <div
                                        aria-hidden
                                        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(46,140,255,0.15),transparent)] opacity-60"
                                    />
                                )}

                                <CardHeader className="relative px-5 pt-5 pb-4 min-h-[130px]">
                                    <div className="flex items-center justify-between mb-4 h-6">
                                        <div className="flex-shrink-0">
                                            {isPopular && (
                                                <div className="inline-flex items-center gap-1 rounded-md bg-brand-bg/10 px-2 py-1 text-[11px] font-medium text-brand-bg border border-brand-bg/30">
                                                    <Sparkles className="h-2.5 w-2.5" />
                                                    Popular
                                                </div>
                                            )}
                                        </div>
                                        <div className="rounded-md bg-surface-tertiary px-2 py-1 text-[11px] font-medium text-content-secondary border border-line-secondary">
                                            {card.title}
                                        </div>
                                    </div>
                                    <CardTitle className="text-lg font-semibold min-h-[24px] text-content-primary">
                                        {card.title}
                                    </CardTitle>
                                    <div className="h-1.5" aria-hidden="true" />
                                    <CardDescription className="text-xs text-content-secondary leading-[1.5]">
                                        {card.description}
                                    </CardDescription>
                                </CardHeader>

                                <CardContent className="relative px-5 py-4 flex-1">
                                    {/* Price */}
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-[2.5rem] font-bold tracking-tight bg-gradient-to-b from-neutral-header to-neutral-fg-tertiary bg-clip-text text-transparent text-transparent font-[system-ui] tabular-nums">
                                            {amount === 0 ? 'Custom' : `RM ${formatAmount(amount)}`}
                                        </span>
                                        <span className="text-sm font-medium text-content-tertiary">
                                            {intervalLabel && card.key !== 'ENTERPRISE' ? `/ ${intervalLabel}` : ''}
                                        </span>
                                    </div>

                                    <div className="h-3" aria-hidden="true" />

                                    {/* Savings indicator for yearly */}
                                    {interval === 'annually' && card.key !== 'ENTERPRISE' && (
                                        <p className="text-xs text-brand-bg font-medium min-h-[36px] leading-[1.5]">
                                            Save RM ${formatAmount(Math.round((amount * 12 - amount * 10) / 12))} per month with annual billing
                                        </p>
                                    )}
                                    {interval === 'annually' && card.key == 'ENTERPRISE' && (
                                        <p className="text-xs min-h-[36px] leading-[1.5]">
                                            {card?.highlight ? 'Most popular choice' : `The best option for ${card.title.toLowerCase()} users`}
                                        </p>
                                    )}




                                    {interval === 'monthly' && (
                                        <p className="text-xs text-content-tertiary min-h-[36px] leading-[1.5]">
                                            {card.highlight ? 'Most popular choice' : `The best option for ${card.title.toLowerCase()} users`}
                                        </p>
                                    )}

                                    {/* Divider */}
                                    <div className="mt-5 h-px w-full bg-gradient-to-r from-transparent via-line-secondary to-transparent" />

                                    {/* Features */}
                                    <ul className="space-y-2.5 pt-5" role="list" aria-label="Plan features">
                                        {card.features.map((feature) => (
                                            <li key={feature} className="flex items-start gap-2">
                                                <div className="flex-shrink-0 inline-flex h-4 w-4 items-center justify-center rounded-full bg-brand-bg/10 border border-brand-bg/30 transition-all duration-300 group-hover:bg-brand-bg/15 group-hover:border-brand-bg/50 mt-0.5" aria-hidden="true">
                                                    <Check className="h-2.5 w-2.5 text-brand-bg transition-all duration-300 group-hover:scale-110" strokeWidth={2.5} />
                                                </div>
                                                <span className="text-xs text-content-primary leading-[1.5] font-medium">
                                                    {feature}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                </CardContent>

                                <CardFooter className="relative px-5 pb-5 pt-4">
                                    {card.key === 'ENTERPRISE' ? (
                                        <button
                                            onClick={() => {
                                                setSelectedEnterpriseCard(card)
                                                setEnterpriseDialogOpen(true)
                                            }}
                                            className={clsx(
                                                "group/cta w-full text-center rounded-md font-medium text-sm transition-all duration-300",
                                                "h-9 inline-flex items-center justify-center gap-1",
                                                "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-surface-primary",
                                                "bg-surface-tertiary border border-line-primary text-content-primary shadow-sm hover:bg-surface-quaternary hover:border-brand-bg/50 active:scale-[0.98] focus:ring-brand-bg/30"
                                            )}
                                            aria-label="Configure Enterprise plan"
                                        >
                                            <span className="font-medium">Get Quote</span>
                                            <ChevronRight
                                                className="h-3.5 w-3.5 transition-transform duration-300 group-hover/cta:translate-x-0.5"
                                                aria-hidden="true"
                                            />
                                        </button>
                                    ) : (
                                        <Link
                                            href={`/site/pricing/checkout/${card.priceId}`}
                                            className={clsx(
                                                "group/cta w-full text-center rounded-md font-medium text-sm transition-all duration-300",
                                                "h-9 inline-flex items-center justify-center gap-1",
                                                "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-surface-primary",
                                                isPopular
                                                    ? "bg-brand-gradient hover:bg-brand-gradient-hover text-white border border-brand-border focus:ring-brand-bg shadow-md"
                                                    : "bg-surface-tertiary border border-line-primary text-content-primary shadow-sm hover:bg-surface-quaternary hover:border-brand-bg/50 active:scale-[0.98] focus:ring-brand-bg/30"
                                            )}
                                            aria-label={`Get started with ${card.title} plan`}
                                        >
                                            {user?.trialEligible && trialEnabled ? (
                                                <span className="font-medium">
                                                    Start <span className={isPopular ? "text-white/90" : "text-brand-bg"}>Trial</span>
                                                </span>
                                            ) : (
                                                <span className="font-medium">
                                                    Subscribe
                                                </span>
                                            )}
                                            <ChevronRight
                                                className="h-3.5 w-3.5 transition-transform duration-300 group-hover/cta:translate-x-0.5"
                                                aria-hidden="true"
                                            />
                                        </Link>
                                    )}
                                </CardFooter>
                            </Card>
                        </div>
                    )
                })}
            </div>

            {/* Enterprise Quantity Dialog */}
            <Dialog open={enterpriseDialogOpen} onOpenChange={setEnterpriseDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Building2 className="h-5 w-5 text-brand-bg" />
                            Configure Enterprise Plan
                        </DialogTitle>
                        <DialogDescription>
                            Enter the number of sub-accounts to calculate your custom pricing.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-6 space-y-6">
                        {/* Quantity Input */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-content-primary">
                                Number of Sub-Accounts
                            </label>
                            <div className="flex items-center gap-3">
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => setSubAccountCount(Math.max(1, subAccountCount - 10))}
                                    disabled={subAccountCount <= 1}
                                >
                                    <Minus className="h-4 w-4" />
                                </Button>
                                <Input
                                    type="number"
                                    min={1}
                                    value={subAccountCount}
                                    onChange={(e) => setSubAccountCount(Math.max(1, parseInt(e.target.value) || 1))}
                                    className="text-center text-lg font-semibold w-24"
                                />
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => setSubAccountCount(subAccountCount + 10)}
                                >
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>

                        {/* Pricing Breakdown */}
                        <div className="space-y-3 p-4 rounded-lg bg-surface-secondary border border-line-secondary">
                            <h4 className="text-sm font-medium text-content-secondary">Pricing Breakdown</h4>
                            <ul className="space-y-1.5 text-sm text-content-tertiary">
                                {calculatePrice({ configKey: 'ENTERPRISE', quantity: subAccountCount }).breakdown.map((item, i) => (
                                    <li key={i}>{item.description}: {formatCurrency(item.amount, 'MYR')}</li>
                                ))}
                            </ul>
                            <div className="pt-3 border-t border-line-secondary">
                                <div className="flex justify-between items-baseline">
                                    <span className="text-sm font-medium text-content-secondary">Total Monthly</span>
                                    <span className="text-2xl font-bold text-content-primary">
                                        {calculatePrice({ configKey: 'ENTERPRISE', quantity: subAccountCount }).displayPrice}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setEnterpriseDialogOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={() => {
                                if (selectedEnterpriseCard) {
                                    router.push(`/site/pricing/checkout/${selectedEnterpriseCard.priceId}?quantity=${subAccountCount}`)
                                }
                            }}
                            className="bg-brand-gradient hover:bg-brand-gradient-hover"
                        >
                            Continue to Checkout
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}
