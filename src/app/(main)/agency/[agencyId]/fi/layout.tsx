import { ReactNode } from 'react'
import { redirect } from 'next/navigation'

import Unauthorized from '@/components/unauthorized'

import { auth } from '@/auth'
import { hasAgencyPermission } from '@/lib/features/iam/authz/permissions'
import { ActionKey, FeatureKey } from '@/lib/registry'
import { ModularNav } from '@/components/global/modular-nav-new'

export default async function FiLayout({
  children,
  params,
}: {
  children: ReactNode
  params: Promise<{ agencyId: string }>
}) {
  const { agencyId } = await params

  const session = await auth()
  if (!session?.user?.id) {
    redirect('/sign-in')
  }

  // Top-level guard to prevent URL-jailbreak into FI routes.
  // (entitlement-aware via hasAgencyPermission for FI/CO namespaces)
  const keys: Partial<ActionKey>[] = [
    'fi.general_ledger.settings.view',
    'fi.master_data.accounts.view',
    'fi.bank_ledger.bank_accounts.view',
    'fi.accounts_receivable.subledgers.view',
    'fi.accounts_payable.subledgers.view',
    'fi.controlling.cost_centers.view',
    'fi.advanced_reporting.financial_statements.view',
  ]

  const ok = (await Promise.all(keys.map((k) => hasAgencyPermission(agencyId, k)))).some(Boolean)

  if (!ok) {
    return (
      <div className="h-full flex items-center justify-center">
        <Unauthorized />
      </div>
    )
  }

    <div className="space-y-4">
      <div className="flex  sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* <PageTitle title="Billing" description="Subscription, payment methods, usage, credits, and add-ons." /> */}
 
        <ModularNav
          variant='dropdown'
          from="submodule"
          levels={2}
          scope="agency"
          scopeId={agencyId}
        />
        {/* <span className="text-xs font-light flex-1" ></span>  */}
      </div>
      {children}
    </div>
}
