'use client'

import React from 'react'
import Link from 'next/link'
import { useModal } from '@/providers/modal-provider'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
} from '@/components/ui/dialog'
import { DialogTitle } from '@radix-ui/react-dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    Crown,
    Sparkles,
    ArrowRight,
    Check,
    Star,
} from 'lucide-react'
import {
    PremiumAnalytics,
    PremiumTeam,
    PremiumShield,
    PremiumZap,
} from '@/components/icons/premium'
import { cn } from '@/lib/utils'

interface PremiumFeature {
    icon: React.ElementType
    title: string
    description: string
}

interface PremiumUpsellModalProps {
    featureName: string
    billingPath: string
    requiredPlan?: 'Professional' | 'Enterprise' | 'Add-on'
}

const PREMIUM_FEATURES: PremiumFeature[] = [
    {
        icon: PremiumAnalytics,
        title: 'Advanced Analytics',
        description: 'Deep insights and custom reports',
    },
    {
        icon: PremiumTeam,
        title: 'Unlimited Team Members',
        description: 'Collaborate without restrictions',
    },
    {
        icon: PremiumShield,
        title: 'Enterprise Security',
        description: 'SOC 2 compliance and SSO',
    },
    {
        icon: PremiumZap,
        title: 'Priority Support',
        description: '24/7 dedicated assistance',
    },
]

export const PremiumUpsellModal = ({
    featureName,
    billingPath,
    requiredPlan = 'Professional',
}: PremiumUpsellModalProps) => {
    const { isOpen, setClose } = useModal()

    return (
        <Dialog open={isOpen} onOpenChange={setClose}>
            <DialogContent
                className={cn(
                    'overflow-hidden border-0 p-0 sm:max-w-[480px]',
                    'bg-gradient-to-b from-background via-background to-muted/20',
                    'shadow-2xl'
                )}
            >
                {/* Premium Header with Gradient */}
                <div className="relative overflow-hidden">
                    {/* Decorative gradient background */}
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/10 to-transparent" />
                    <div className="absolute -top-24 -right-24 h-48 w-48 rounded-full bg-primary/10 blur-3xl" />
                    <div className="absolute -bottom-12 -left-12 h-32 w-32 rounded-full bg-primary/5 blur-2xl" />

                    {/* Animated sparkles decoration */}
                    <div className="absolute top-4 right-16 opacity-60">
                        <Star className="h-3 w-3 animate-pulse text-primary/60" style={{ animationDelay: '0s' }} />
                    </div>
                    <div className="absolute top-8 right-8 opacity-40">
                        <Star className="h-2 w-2 animate-pulse text-primary/40" style={{ animationDelay: '0.5s' }} />
                    </div>
                    <div className="absolute top-12 right-24 opacity-50">
                        <Star className="h-2.5 w-2.5 animate-pulse text-primary/50" style={{ animationDelay: '1s' }} />
                    </div>

                    <DialogHeader className="relative px-6 pt-8 pb-6">
                        {/* Crown Icon with Glow */}
                        <div className="mb-4 flex justify-center">
                            <div className="relative">
                                <div className="absolute inset-0 animate-pulse rounded-full bg-primary/20 blur-xl" />
                                <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/5 ring-1 ring-primary/20">
                                    <Crown className="h-8 w-8 text-primary" strokeWidth={1.5} />
                                </div>
                            </div>
                        </div>

                        <div className="text-center">
                            <Badge
                                variant="secondary"
                                className="mb-3 border-primary/20 bg-primary/10 text-primary"
                            >
                                <Sparkles className="mr-1 h-3 w-3" />
                                Premium Feature
                            </Badge>
                            <DialogTitle className="text-2xl font-bold tracking-tight">
                                Unlock {featureName}
                            </DialogTitle>
                            <DialogDescription className="mt-2 text-base text-muted-foreground">
                                This feature is available on{' '}
                                <span className="font-medium text-foreground">
                                    {requiredPlan}
                                </span>{' '}
                                and higher plans.
                            </DialogDescription>
                        </div>
                    </DialogHeader>
                </div>

                {/* Features Grid */}
                <div className="px-6 pb-2">
                    <div className="grid grid-cols-2 gap-3">
                        {PREMIUM_FEATURES.map((feature, index) => (
                            <div
                                key={index}
                                className={cn(
                                    'group rounded-xl border border-border/50 p-3',
                                    'bg-gradient-to-b from-muted/30 to-transparent',
                                    'transition-all duration-200',
                                    'hover:border-primary/30 hover:bg-muted/50'
                                )}
                            >
                                <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 transition-colors group-hover:bg-primary/20">
                                    <feature.icon size={18} />
                                </div>
                                <h4 className="text-sm font-medium leading-tight">
                                    {feature.title}
                                </h4>
                                <p className="mt-0.5 text-xs text-muted-foreground leading-snug">
                                    {feature.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Benefits List */}
                <div className="mx-6 mt-4 rounded-xl border border-border/50 bg-muted/20 p-4">
                    <h4 className="mb-3 text-sm font-semibold text-foreground">
                        What you&apos;ll get:
                    </h4>
                    <ul className="space-y-2">
                        {[
                            'Full access to all premium features',
                            'Priority customer support',
                            'Advanced customization options',
                            'No usage limits',
                        ].map((benefit, index) => (
                            <li
                                key={index}
                                className="flex items-center gap-2 text-sm text-muted-foreground"
                            >
                                <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/10">
                                    <Check className="h-2.5 w-2.5 text-primary" />
                                </div>
                                {benefit}
                            </li>
                        ))}
                    </ul>
                </div>

                {/* CTA Section */}
                <div className="mt-6 border-t border-border/50 bg-muted/10 p-6">
                    <Button
                        asChild
                        size="lg"
                        className={cn(
                            'w-full gap-2 text-base font-semibold',
                            'bg-gradient-to-r from-primary to-primary/90',
                            'shadow-lg shadow-primary/20',
                            'transition-all duration-300',
                            'hover:shadow-xl hover:shadow-primary/30',
                            'hover:from-primary/90 hover:to-primary'
                        )}
                    >
                        <Link href={billingPath}>
                            View Plans & Upgrade
                            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                        </Link>
                    </Button>
                    <p className="mt-3 text-center text-xs text-muted-foreground">
                        Cancel anytime • 14-day money-back guarantee
                    </p>
                </div>
            </DialogContent>
        </Dialog>
    )
}

export default PremiumUpsellModal
