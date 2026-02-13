import 'server-only'

import { cache } from 'react'
import { db } from '@/lib/db'
import type { ActionKey } from '@/lib/registry'
import {
  hasAgencyPermissionForUser,
  hasSubAccountPermissionForUser,
} from '@/lib/features/iam/authz/permissions'
import { getAuthedUserIdCached } from '@/lib/features/iam/authz/session'

export type ActionContext = {
  agencyId?: string
  subAccountId?: string
  userId: string
}

export type ActionScopeHint = {
  agencyId?: string
  subAccountId?: string
}

const getActiveScopeFromSession = cache(async (userId: string) => {
  return db.session.findFirst({
    where: { userId },
    select: { activeAgencyId: true, activeSubAccountId: true },
  })
})

/**
 * Resolve request-scoped action context.
 *
 * Priority:
 * 1) explicit hint from caller (e.g. route params context id)
 * 2) active scope from persisted session
 */
export async function getActionContext(hint?: ActionScopeHint): Promise<ActionContext | null> {
  const userId = await getAuthedUserIdCached()
  if (!userId) return null

  if (hint?.agencyId || hint?.subAccountId) {
    return {
      userId,
      agencyId: hint.agencyId ?? undefined,
      subAccountId: hint.subAccountId ?? undefined,
    }
  }

  const dbSession = await getActiveScopeFromSession(userId)
  return {
    userId,
    agencyId: dbSession?.activeAgencyId ?? undefined,
    subAccountId: dbSession?.activeSubAccountId ?? undefined,
  }
}

export const hasContextPermission = async (
  context: ActionContext,
  permissionKey: ActionKey
): Promise<boolean> => {
  if (context.subAccountId) {
    return hasSubAccountPermissionForUser({
      userId: context.userId,
      agencyId: context.agencyId,
      subAccountId: context.subAccountId,
      permissionKey,
    })
  }
  if (context.agencyId) {
    return hasAgencyPermissionForUser({
      userId: context.userId,
      agencyId: context.agencyId,
      permissionKey,
    })
  }
  return false
}

export async function hasCurrentScopePermission(
  permissionKey: ActionKey,
  hint?: ActionScopeHint
): Promise<boolean> {
  const context = await getActionContext(hint)
  if (!context) return false
  return hasContextPermission(context, permissionKey)
}
