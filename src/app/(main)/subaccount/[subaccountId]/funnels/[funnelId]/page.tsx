import BlurPage from '@/components/global/blur-page'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { getFunnel } from '@/lib/queries'
import { redirect } from 'next/navigation'
import React from 'react'
import FunnelSettings from './_components/funnel-settings'
import FunnelSteps from './_components/funnel-steps'
import { FunnelHeaderActions } from './_components/funnel-header-actions'
import { hasSubAccountPermission } from '@/lib/features/iam/authz/permissions'

type Props = {
  params: Promise<{ funnelId: string; subaccountId: string }>
}

const FunnelPage = async ({ params }: Props) => {
  const { funnelId, subaccountId } = await params

  const canRead = await hasSubAccountPermission(subaccountId, 'crm.funnels.content.read')
  if (!canRead) return redirect(`/subaccount/${subaccountId}`)
  
  const funnelPages = await getFunnel(funnelId)
  if (!funnelPages)
    return redirect(`/subaccount/${subaccountId}/funnels`)

  return (
    <BlurPage>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between mb-6">
        <div className="min-w-0">
          <h1 className="text-3xl font-semibold tracking-tight truncate">{funnelPages.name}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage pages, publish state, and live checkout.
          </p>
        </div>
        <FunnelHeaderActions
          subAccountId={subaccountId}
          funnelId={funnelId}
          published={!!funnelPages.published}
          subDomainName={funnelPages.subDomainName}
        />
      </div>
      <Tabs
        defaultValue="steps"
        className="w-full"
      >
        <TabsList className="grid  grid-cols-2 w-[50%] bg-transparent ">
          <TabsTrigger value="steps">Steps</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
        <TabsContent value="steps">
          <FunnelSteps
            funnel={funnelPages}
            subaccountId={subaccountId}
            pages={funnelPages.FunnelPages}
            funnelId={funnelId}
          />
        </TabsContent>
        <TabsContent value="settings">
          <FunnelSettings
            subaccountId={subaccountId}
            defaultData={funnelPages}
          />
        </TabsContent>
      </Tabs>
    </BlurPage>
  )
}

export default FunnelPage
