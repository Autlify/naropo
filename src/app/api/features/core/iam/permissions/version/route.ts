import 'server-only'

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { getAccessSnapshotVersionForUser } from '@/lib/features/iam/authz/access-snapshot'
import { getAuthedUserIdCached } from '@/lib/features/iam/authz/session'
import {
  isPermissionStateStale,
  readPermissionStateCookie,
  writePermissionStateCookie,
} from '@/lib/features/iam/authz/permission-state-cookie'
import { readScopeContextCookie } from '@/lib/core/scope-context/cookie'

function buildPermissionEtag(params: {
  userId: string
  scopeKey: string
  permissionHash: string
  permissionVersion: number
}): string {
  const hashPrefix = params.permissionHash.slice(0, 16)
  return `W/"perm-${params.userId}-${params.scopeKey}-${params.permissionVersion}-${hashPrefix}"`
}

export async function GET(req: NextRequest) {
  try {
    const userId = await getAuthedUserIdCached()
    if (!userId) {
      return NextResponse.json(
        { ok: false, reason: 'UNAUTHENTICATED', message: 'Unauthenticated' },
        { status: 401 }
      )
    }

    const agencyIdParam = req.nextUrl.searchParams.get('agencyId') || undefined
    const subAccountIdParam = req.nextUrl.searchParams.get('subAccountId') || undefined

    if (!agencyIdParam && !subAccountIdParam) {
      return NextResponse.json(
        {
          ok: false,
          reason: 'INVALID_REQUEST',
          message: 'Missing scope: provide agencyId or subAccountId',
        },
        { status: 400 }
      )
    }

    const scope =
      subAccountIdParam
        ? { kind: 'subaccount' as const, subAccountId: subAccountIdParam }
        : { kind: 'agency' as const, agencyId: agencyIdParam! }

    let agencyId: string
    let subAccountId: string | null = null

    if (scope.kind === 'agency') {
      const membership = await db.agencyMembership.findFirst({
        where: {
          userId,
          agencyId: scope.agencyId,
          isActive: true,
        },
        select: { agencyId: true },
      })
      if (!membership) {
        return NextResponse.json(
          { ok: false, reason: 'FORBIDDEN', message: 'No agency membership for requested context' },
          { status: 403 }
        )
      }
      agencyId = membership.agencyId
    } else {
      const membership = await db.subAccountMembership.findFirst({
        where: {
          userId,
          subAccountId: scope.subAccountId,
          isActive: true,
        },
        select: {
          subAccountId: true,
          SubAccount: {
            select: { agencyId: true },
          },
        },
      })
      if (!membership) {
        return NextResponse.json(
          { ok: false, reason: 'FORBIDDEN', message: 'No subaccount membership for requested context' },
          { status: 403 }
        )
      }
      agencyId = membership.SubAccount.agencyId
      subAccountId = membership.subAccountId
    }

    const snapshot = await getAccessSnapshotVersionForUser({
      userId,
      scope: scope.kind === 'subaccount' ? 'SUBACCOUNT' : 'AGENCY',
      agencyId,
      subAccountId,
    })

    if (!snapshot) {
      return NextResponse.json(
        { ok: false, reason: 'NO_SNAPSHOT', message: 'No access snapshot for requested context' },
        { status: 404 }
      )
    }

    const etag = buildPermissionEtag({
      userId,
      scopeKey: snapshot.scopeKey,
      permissionHash: snapshot.permissionHash,
      permissionVersion: snapshot.permissionVersion,
    })

    const currentState = {
      u: userId,
      s: snapshot.scopeKey,
      h: snapshot.permissionHash,
      v: snapshot.permissionVersion,
      t: snapshot.updatedAt.getTime(),
    } as const

    const cachedPermissionState = await readPermissionStateCookie()
    const permissionStateChanged =
      !!cachedPermissionState &&
      cachedPermissionState.u === currentState.u &&
      cachedPermissionState.s === currentState.s &&
      (cachedPermissionState.h !== currentState.h || cachedPermissionState.v !== currentState.v)

    const scopeContextCookie = await readScopeContextCookie()
    const scopeContextPermissionHash = scopeContextCookie?.partial?.permissionHash
    const scopeContextChanged =
      typeof scopeContextPermissionHash === 'string' &&
      scopeContextPermissionHash.length > 0 &&
      scopeContextPermissionHash !== snapshot.permissionHash.slice(0, scopeContextPermissionHash.length)

    const changed = permissionStateChanged || scopeContextChanged
    const cookieStale = isPermissionStateStale(cachedPermissionState, currentState)

    if (cookieStale) {
      await writePermissionStateCookie(currentState)
    }

    const headers = new Headers()
    headers.set('ETag', etag)
    headers.set('Last-Modified', snapshot.updatedAt.toUTCString())
    headers.set('Cache-Control', 'private, no-cache, must-revalidate')

    const ifNoneMatch = req.headers.get('if-none-match')
    if (ifNoneMatch === etag && !changed) {
      return new NextResponse(null, { status: 304, headers })
    }

    return NextResponse.json(
      {
        ok: true,
        scopeKey: snapshot.scopeKey,
        permissionHash: snapshot.permissionHash,
        permissionVersion: snapshot.permissionVersion,
        updatedAt: snapshot.updatedAt.toISOString(),
        etag,
        changed,
        cookieUpdated: cookieStale,
      },
      { headers }
    )
  } catch {
    return NextResponse.json(
      { ok: false, reason: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}
