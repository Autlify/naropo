import 'server-only'

import type { MeteringScope } from '@/generated/prisma/client'
import { listAppsWithState } from './service'

export type AppInstallState = 'INSTALLED' | 'AVAILABLE' | 'EXPIRED' | 'DISABLED'

export async function resolveAppInstallState(args: {
  appKey: string
  agencyId: string
  subAccountId?: string | null
  scope: MeteringScope
}): Promise<AppInstallState> {
  const apps = await listAppsWithState({
    agencyId: args.agencyId,
    subAccountId: args.subAccountId ?? null,
    meteringScope: args.scope,
  })
  const found = apps.find((a) => a.key === args.appKey)
  return (found?.state as AppInstallState) ?? 'AVAILABLE'
}

export function describeInstallState(state: AppInstallState): { label: string; tone: 'default' | 'secondary' | 'outline' | 'destructive' } {
  switch (state) {
    case 'INSTALLED':
      return { label: 'Installed', tone: 'default' }
    case 'EXPIRED':
      return { label: 'Expired', tone: 'destructive' }
    case 'DISABLED':
      return { label: 'Disabled', tone: 'secondary' }
    default:
      return { label: 'Available', tone: 'outline' }
  }
}
