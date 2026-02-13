import { getFunnels } from '@/lib/queries'
import { hasSubAccountPermission } from '@/lib/features/iam/authz/permissions'
import React from 'react'
import FunnelsDataTable from './data-table'
import { Plus } from 'lucide-react'
import { columns } from './columns'
import FunnelForm from '@/components/forms/funnel-form'
import BlurPage from '@/components/global/blur-page'

const Funnels = async ({ params }: { params: Promise<{ subaccountId: string }> }) => {
  const { subaccountId } = await params

  const canRead = await hasSubAccountPermission(subaccountId, 'crm.funnels.content.read')
  if (!canRead) return null

  const funnels = await getFunnels(subaccountId)
  if (!funnels) return null

  return (
    <BlurPage>
      <FunnelsDataTable
        actionButtonText={
          <>
            <Plus size={15} />
            Create Funnel
          </>
        }
        modalChildren={
          <FunnelForm subAccountId={subaccountId}></FunnelForm>
        }
        filterValue="name"
        columns={columns}
        data={funnels}
      />
    </BlurPage>
  )
}

export default Funnels
