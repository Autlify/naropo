import React from 'react'
import { CreditCard, BarChart3, Gift, PackagePlus, ReceiptText } from 'lucide-react'

import Unauthorized from '@/components/unauthorized'
import PageTitle from '@/components/global/page-title'
import { ModularNav, type NavItem } from '@/components/global/modular-nav-new'
import { hasAgencyPermission } from '@/lib/features/iam/authz/permissions'

type Props = {
  children: React.ReactNode
  params: Promise<{ agencyId: string }>
}

export default async function BillingLayout({ children, params }: Props) {
  const { agencyId } = await params

  // Guard: billing management access
  const canBilling =
    (await hasAgencyPermission(agencyId, 'org.billing.account.view')) ||
    (await hasAgencyPermission(agencyId, 'org.billing.account.manage'))

  if (!canBilling) return <Unauthorized />

  const baseHref = `/agency/${agencyId}/billing`

  // Custom billing nav items (curated from registry features)
  const billingNavItems: NavItem[] = [
    { key: 'org.billing.subscription', label: 'Subscription', href: `${baseHref}/subscription`, icon: <ReceiptText className="h-4 w-4" />, permissionKey: 'org.billing.subscription.view' },
    { key: 'org.billing.payment_methods', label: 'Payment Methods', href: `${baseHref}/payment-methods`, icon: <CreditCard className="h-4 w-4" />, permissionKey: 'org.billing.payment_methods.read' },
    { key: 'org.billing.usage', label: 'Usage', href: `${baseHref}/usage`, icon: <BarChart3 className="h-4 w-4" />, permissionKey: 'org.billing.usage.view' },
    { key: 'org.billing.credits', label: 'Credits', href: `${baseHref}/credits`, icon: <Gift className="h-4 w-4" />, permissionKey: 'org.billing.credits.view' },
    { key: 'org.billing.addons', label: 'Add-ons', href: `${baseHref}/addons`, icon: <PackagePlus className="h-4 w-4" />, permissionKey: 'org.billing.features.manage' },
  ]

  return (
    <div className="space-y-4">
      <div className="flex  sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* <PageTitle title="Billing" description="Subscription, payment methods, usage, credits, and add-ons." /> */}
 
        <ModularNav
          variant='dropdown'
          from="submodule"
          levels={2}
          scope="agency"
          scopeId={agencyId}
          items={billingNavItems}
        />
        {/* <span className="text-xs font-light flex-1" ></span>  */}
      </div>
      {children}
    </div>
  )
}
