import { getFunnels } from '@/lib/queries'
import React from 'react'
import FunnelsDataTable from './data-table'
import { Plus } from 'lucide-react'
import { columns } from './columns'
import FunnelForm from '@/components/forms/funnel-form'
import BlurPage from '@/components/global/blur-page'

const Funnels = async ({ params }: { params: Promise<{ subaccountId: string }> }) => {
  const { subaccountId } = await params
  const funnels = await getFunnels(subaccountId)
  if (!funnels) return null

  return (
    <BlurPage>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl font-bold">Funnels</h1>
          <p className="text-muted-foreground">Create and manage your marketing funnels and conversion paths</p>
        </div>
        
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
      </div>
    </BlurPage>
  )
}

export default Funnels
