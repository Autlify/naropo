'use client'

import { ModularNav, type NavItem } from '@/components/global/modular-nav-new'

type Props = {
  basePath: string
  agencyId?: string
  subaccountId?: string
}

const ITEMS: NavItem[] = [
  { key: 'providers', label: 'Providers', href: 'providers' },
  { key: 'connections', label: 'Connections', href: 'connections' },
  { key: 'api-keys', label: 'API Keys', href: 'api-keys' },
  { key: 'subscriptions', label: 'Subscriptions', href: 'subscriptions' },
  { key: 'deliveries', label: 'Deliveries', href: 'deliveries' },
]

export function WebhooksNav({ basePath, agencyId, subaccountId }: Props) {
  // Build full href for each item
  const items = ITEMS.map((it) => ({
    ...it,
    href: `${basePath}/${it.href}`,
  }))

  return (
    <ModularNav
      variant="navbar"
      scope={agencyId ? 'agency' : 'subaccount'}
      scopeId={agencyId || subaccountId || ''}
      items={items}
      maxVisibleTabs={6}
    />
  )
}
