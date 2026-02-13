import React from 'react'
import { notFound } from 'next/navigation'

import BillingClient from '@/components/features/core/billing/client'
import { isBillingSection } from '@/lib/features/org/billing/sections'

type Props = {
  params: Promise<{ agencyId: string; section: string }>
}

export default async function BillingSectionPage({ params }: Props) {
  const { agencyId, section } = await params

  // Fail-closed: invalid section should not render fallback UI.
  if (!isBillingSection(section)) return notFound()

  return <BillingClient scope="agency" scopeId={agencyId} section={section} />
}
