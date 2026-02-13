'use client'

import { usePermissionVersionSync } from '@/lib/client'

type PermissionVersionSyncProps = {
  agencyId: string
  subAccountId?: string | null
  enabled?: boolean
  intervalMs?: number
  autoRefresh?: boolean
}

export default function PermissionVersionSync(props: PermissionVersionSyncProps) {
  usePermissionVersionSync({
    enabled: props.enabled ?? true,
    intervalMs: props.intervalMs,
    autoRefresh: props.autoRefresh,
    scope: props.subAccountId
      ? {
        scope: 'SUBACCOUNT',
        agencyId: props.agencyId,
        subAccountId: props.subAccountId,
      }
      : {
        scope: 'AGENCY',
        agencyId: props.agencyId,
      },
  })

  return null
}
