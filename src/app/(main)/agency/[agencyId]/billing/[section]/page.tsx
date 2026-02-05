import React from 'react'

import BillingClient from '@/components/features/core/billing/client'

type Props = {
  params: Promise<{ agencyId: string; section: string }>
}

export default async function BillingSectionPage({ params }: Props) {
  const { agencyId, section } = await params
  return <BillingClient scope="agency" scopeId={agencyId} section={section} />
}
