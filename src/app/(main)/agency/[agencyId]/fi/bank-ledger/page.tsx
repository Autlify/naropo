import { redirect } from 'next/navigation'

import Unauthorized from '@/components/unauthorized'
import PageTitle from '@/components/global/page-title'

import { auth } from '@/auth'
import { hasAgencyPermission } from '@/lib/features/iam/authz/permissions'
import { BankReconciliation } from '@/components/features/fi/bank-ledger/bank-reconciliation'

export default async function BankLedgerPage({
  params,
}: {
  params: Promise<{ agencyId: string }>
}) {
  const { agencyId } = await params

  const session = await auth()
  if (!session?.user?.id) {
    redirect('/sign-in')
  }

  const canView = await hasAgencyPermission(agencyId, 'fi.bank_ledger.bank_accounts.view')
  if (!canView) {
    return (
      <div className="h-full flex items-center justify-center">
        <Unauthorized />
      </div>
    )
  }

  return (
    <div className="flex flex-col">
      <PageTitle title="Bank Ledger" description="" />
      <BankReconciliation />
    </div>
  )
}
