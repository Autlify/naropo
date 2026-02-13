import { db } from '@/lib/db'
import { getDomainContent } from '@/lib/queries'
import EditorProvider from '@/providers/editor/editor-provider'
import { notFound } from 'next/navigation'
import React from 'react'
import FunnelEditor from '../(main)/subaccount/[subaccountId]/funnels/[funnelId]/editor/[funnelPageId]/_components/funnel-editor'
import { FunnelPage } from '@/generated/prisma/client'

const Page = async ({ params }: { params: Promise<{ domain: string }> }) => {
  const { domain } = await params
  const domainData = await getDomainContent(domain.slice(0, -1))
  if (!domainData) return notFound()
  if (!domainData.published) return notFound()

  const pageData = domainData.FunnelPages.find((page: FunnelPage) => !page.pathName)

  if (!pageData) return notFound()

  await db.funnelPage.update({
    where: {
      id: pageData.id,
    },
    data: {
      visits: {
        increment: 1,
      },
    },
  })

  return (
    <EditorProvider
      subaccountId={domainData.subAccountId}
      pageDetails={pageData}
      funnelId={domainData.id}
    >
      <FunnelEditor
        funnelPageId={pageData.id}
        liveMode={true}
      />
    </EditorProvider>
  )
}

export default Page
