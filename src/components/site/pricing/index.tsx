'use client'
import { PlanSelectorDialog, type PlanSelectorDialogProps } from '@autlify/billing-sdk'
import React from 'react'
import { getPricingCards } from '@/lib/registry/plans/pricing-config'
import { getAuthUserDetails } from '@/lib/queries'
import { redirect } from 'next/navigation'

const Pricing: React.FC = async () => {
    const [selectedInterval, setSelectedInterval] = React.useState<'monthly' | 'yearly'>('monthly')

    const monthlyCards = getPricingCards('month')
    const yearlyCards = getPricingCards('year')
    const open = true
    const cards = selectedInterval === 'monthly' ? monthlyCards : yearlyCards

    const user = await getAuthUserDetails();

    return (
        <div>
            <PlanSelectorDialog
                currentPlanId={''}
                plans={cards.map(card => ({
                    id: card.priceId,
                    name: card.title,
                    description: card.description,
                    monthlyPrice: card.interval === 'month' ? String(card.priceAmount / 100) : '0',
                    yearlyPrice: card.interval === 'year' ? String(card.priceAmount / 100) : '0',
                    currency: 'MYR',
                    features: card.features,
                }))}
                open
                onSelectPlan={() => redirect('/site/pricing/checkout/' + cards[0]?.priceId)}
            />
        </div>
    )
}

Pricing.displayName = 'Pricing'

export { Pricing }