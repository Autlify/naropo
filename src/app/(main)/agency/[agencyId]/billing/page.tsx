import React from 'react'
import BillingClient from '@/components/features/core/billing/client'

type Props = {
  params: Promise<{ agencyId: string }>
}

const Page = async ({ params }: Props) => {
  const { agencyId } = await params

  return <BillingClient scope="agency" scopeId={agencyId} />
}

export default Page
