import 'server-only'

import { db } from '@/lib/db'
import {
  getAutlifyAgencyHeader,
  getAutlifySubAccountHeader,
} from '@/lib/features/iam/authn/headers'
import type { Principal } from '@/lib/features/iam/authn/principal'
import {
  resolveAgencyContextForUser,
  resolveSubAccountContextForUser,
} from '@/lib/features/iam/authz/resolver'

export type ResolvedScope =
  | { kind: 'agency'; agencyId: string }
  | { kind: 'subaccount'; agencyId: string; subAccountId: string }

export class AutlifyContextError extends Error {
  status: number
  code: 'CONTEXT_INVALID' | 'CONTEXT_FORBIDDEN' | 'CONTEXT_MISSING'

  constructor(args: {
    message: string
    status: number
    code: AutlifyContextError['code']
  }) {
    super(args.message)
    this.name = 'AutlifyContextError'
    this.status = args.status
    this.code = args.code
  }
}

const assertSubAccountBelongsToAgency = async (args: {
  subAccountId: string
  agencyId: string
}): Promise<boolean> => {
  const sub = await db.subAccount.findUnique({
    where: { id: args.subAccountId },
    select: { agencyId: true },
  })
  return !!sub && sub.agencyId === args.agencyId
}

/**
 * Resolve the effective Agency/SubAccount scope for the current request.
 *
 * Header-based scoping:
 * - x-autlify-agency: target agency
 * - x-autlify-subaccount: act on behalf of a subaccount (must belong to the agency)
 *
 * Rules:
 * - AGENCY api key: agencyId fixed; optional subaccount header selects sub-scope.
 * - SUBACCOUNT api key: subAccountId fixed; header (if present) must match.
 * - USER api key or user session: header must provide at least agency or subaccount.
 */
export const resolveScopeFromHeaders = async (args: {
  principal: Principal
  headers: Headers
}): Promise<ResolvedScope> => {
  const requestedAgencyId = getAutlifyAgencyHeader(args.headers)
  const requestedSubAccountId = getAutlifySubAccountHeader(args.headers)

  // Helpers for user membership validation
  const requireAgencyMembership = async (p: { userId: string; agencyId: string }) => {
    const ctx = await resolveAgencyContextForUser(p)
    if (!ctx) {
      throw new AutlifyContextError({
        status: 403,
        code: 'CONTEXT_FORBIDDEN',
        message: 'No agency membership for requested context',
      })
    }
    return ctx
  }
  const requireSubAccountMembership = async (p: { userId: string; subAccountId: string }) => {
    const ctx = await resolveSubAccountContextForUser(p)
    if (!ctx) {
      throw new AutlifyContextError({
        status: 403,
        code: 'CONTEXT_FORBIDDEN',
        message: 'No subaccount membership for requested context',
      })
    }
    return ctx
  }

  // --- API Key principals ---
  if (args.principal.kind === 'apiKey') {
    const k = args.principal

    if (k.apiKeyKind === 'AGENCY') {
      if (!k.agencyId) {
        throw new AutlifyContextError({
          status: 500,
          code: 'CONTEXT_INVALID',
          message: 'Agency api key missing agencyId',
        })
      }

      if (requestedAgencyId && requestedAgencyId !== k.agencyId) {
        throw new AutlifyContextError({
          status: 403,
          code: 'CONTEXT_FORBIDDEN',
          message: 'Agency header does not match api key scope',
        })
      }

      if (requestedSubAccountId) {
        const belongs = await assertSubAccountBelongsToAgency({
          subAccountId: requestedSubAccountId,
          agencyId: k.agencyId,
        })
        if (!belongs) {
          throw new AutlifyContextError({
            status: 404,
            code: 'CONTEXT_INVALID',
            message: 'Subaccount does not belong to agency',
          })
        }

        if (k.allowedSubAccountIds?.length) {
          const ok = k.allowedSubAccountIds.includes(requestedSubAccountId)
          if (!ok) {
            throw new AutlifyContextError({
              status: 403,
              code: 'CONTEXT_FORBIDDEN',
              message: 'Api key not allowed to access this subaccount',
            })
          }
        }

        return { kind: 'subaccount', agencyId: k.agencyId, subAccountId: requestedSubAccountId }
      }

      return { kind: 'agency', agencyId: k.agencyId }
    }

    if (k.apiKeyKind === 'SUBACCOUNT') {
      if (!k.subAccountId) {
        throw new AutlifyContextError({
          status: 500,
          code: 'CONTEXT_INVALID',
          message: 'Subaccount api key missing subAccountId',
        })
      }
      if (requestedSubAccountId && requestedSubAccountId !== k.subAccountId) {
        throw new AutlifyContextError({
          status: 403,
          code: 'CONTEXT_FORBIDDEN',
          message: 'Subaccount header does not match api key scope',
        })
      }

      // Determine agencyId (from stored field or lookup)
      const agencyId =
        k.agencyId ||
        (
          await db.subAccount.findUnique({
            where: { id: k.subAccountId },
            select: { agencyId: true },
          })
        )?.agencyId

      if (!agencyId) {
        throw new AutlifyContextError({
          status: 404,
          code: 'CONTEXT_INVALID',
          message: 'Subaccount not found for api key',
        })
      }

      return { kind: 'subaccount', agencyId, subAccountId: k.subAccountId }
    }

    // USER api key: requires explicit context selection
    if (!requestedAgencyId && !requestedSubAccountId) {
      throw new AutlifyContextError({
        status: 400,
        code: 'CONTEXT_MISSING',
        message: 'Missing x-autlify-agency or x-autlify-subaccount header',
      })
    }

    // Membership must still be validated to prevent cross-org access.
    if (requestedSubAccountId) {
      const m = await requireSubAccountMembership({
        userId: k.ownerUserId,
        subAccountId: requestedSubAccountId,
      })
      if (requestedAgencyId && requestedAgencyId !== m.agencyId) {
        throw new AutlifyContextError({
          status: 403,
          code: 'CONTEXT_FORBIDDEN',
          message: 'Agency header does not match subaccount agency',
        })
      }
      return { kind: 'subaccount', agencyId: m.agencyId, subAccountId: requestedSubAccountId }
    }

    await requireAgencyMembership({ userId: k.ownerUserId, agencyId: requestedAgencyId! })
    return { kind: 'agency', agencyId: requestedAgencyId! }
  }

  // --- User session principal ---
  if (!requestedAgencyId && !requestedSubAccountId) {
    throw new AutlifyContextError({
      status: 400,
      code: 'CONTEXT_MISSING',
      message: 'Missing x-autlify-agency or x-autlify-subaccount header',
    })
  }

  if (requestedSubAccountId) {
    const m = await requireSubAccountMembership({
      userId: args.principal.userId,
      subAccountId: requestedSubAccountId,
    })
    if (requestedAgencyId && requestedAgencyId !== m.agencyId) {
      throw new AutlifyContextError({
        status: 403,
        code: 'CONTEXT_FORBIDDEN',
        message: 'Agency header does not match subaccount agency',
      })
    }
    return { kind: 'subaccount', agencyId: m.agencyId, subAccountId: requestedSubAccountId }
  }

  await requireAgencyMembership({ userId: args.principal.userId, agencyId: requestedAgencyId! })
  return { kind: 'agency', agencyId: requestedAgencyId! }
}
