'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React from 'react'
import { CreditCard, Receipt, BarChart3, Gift, type LucideIcon } from 'lucide-react'

import { cn } from '@/lib/utils'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'

type Item = { href: string; label: string; icon: LucideIcon }

export function BillingNav(props: { baseHref: string; className?: string }) {
  const pathname = usePathname()
  const base = props.baseHref

  const items: Item[] = [
    { href: `${base}/subscription`, label: 'Subscription', icon: Receipt },
    { href: `${base}/payment-methods`, label: 'Payment Methods', icon: CreditCard },
    { href: `${base}/usage`, label: 'Usage', icon: BarChart3 },
    { href: `${base}/credits`, label: 'Credits & Coupons', icon: Gift },
    { href: `${base}/invoices`, label: 'Invoices', icon: Receipt },
    { href: `${base}/addons`, label: 'Add-ons', icon: Gift },
  ]

  return (
    <div className={cn('w-full', props.className)}>
      <ScrollArea className="w-full">
        <div className="inline-flex h-10 items-center justify-start gap-1 rounded-lg bg-muted p-1">
          {items.map((item) => {
            const active = pathname === item.href || pathname?.startsWith(item.href)
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-all',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                  active
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="hidden sm:inline">{item.label}</span>
              </Link>
            )
          })}
        </div>
        <ScrollBar orientation="horizontal" className="invisible" />
      </ScrollArea>
    </div>
  )
}