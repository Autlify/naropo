import 'server-only'

import { cache } from 'react'
import crypto from 'crypto'
import { db } from '@/lib/db'
import type { AccessContextScope } from '@/generated/prisma/enums'
import { agencyScopeKey, subAccountScopeKey } from '@/lib/core/scope-key'
import { getAuthedUserIdCached } from '@/lib/features/iam/authz/session'
import { getGrantedPermissionKeysForRole } from '@/lib/features/iam/authz/role-permissions'

const LOCAL_TTL_MS = 60_000 // 1 minute - role/permissions change rarely

type AccessSnapshotPayload = {
  roleId: string | null
  permissionKeys: string[]
  permissionHash: string
}

type AccessSnapshotRecord = AccessSnapshotPayload & {
  version: number
  updatedAt: Date
}

export type AccessSnapshotVersionInfo = {
  userId: string
  scopeKey: string
  scope: AccessContextScope
  permissionHash: string
  permissionVersion: number
  updatedAt: Date
}

export type AccessSnapshotForUserParams = {
  userId: string
  scope: 'AGENCY' | 'SUBACCOUNT'
  agencyId: string
  subAccountId?: string | null
}

// in-memory TTL cache per warm instance
const localCache = new Map<string, { expiresAt: number; value: AccessSnapshotRecord }>()

function hashKeys(keys: string[]): string {
  const normalized = Array.from(new Set(keys.map((k) => k.trim()))).sort()
  return crypto.createHash('sha256').update(JSON.stringify(normalized)).digest('hex')
}

const getAgencyRoleIdForUserCached = cache(async (userId: string, agencyId: string) => {
  const membership = await db.agencyMembership.findFirst({
    where: { userId, agencyId, isActive: true },
    select: { roleId: true },
  })
  return membership?.roleId ?? null
})

const getSubAccountRoleIdForUserCached = cache(async (userId: string, subAccountId: string) => {
  const membership = await db.subAccountMembership.findFirst({
    where: { userId, subAccountId, isActive: true },
    select: { roleId: true },
  })
  return membership?.roleId ?? null
})

async function getActiveRoleId(params: {
  userId: string
  scope: 'AGENCY' | 'SUBACCOUNT'
  agencyId?: string
  subAccountId?: string
}): Promise<string | null> {
  if (params.scope === 'AGENCY') {
    if (!params.agencyId) return null
    return getAgencyRoleIdForUserCached(params.userId, params.agencyId)
  }

  if (!params.subAccountId) return null
  return getSubAccountRoleIdForUserCached(params.userId, params.subAccountId)
}

async function getPermissionKeysForRole(roleId: string): Promise<{ permissionKeys: string[]; permissionHash: string }> {
  const permissionKeys = await getGrantedPermissionKeysForRole(roleId)
  const permissionHash = hashKeys(permissionKeys)

  return { permissionKeys, permissionHash }
}

async function buildSnapshotForScope(params: {
  userId: string
  scope: 'AGENCY' | 'SUBACCOUNT'
  agencyId?: string
  subAccountId?: string
}): Promise<AccessSnapshotPayload | null> {
  const roleId = await getActiveRoleId(params)
  if (!roleId) return null

  const { permissionKeys, permissionHash } = await getPermissionKeysForRole(roleId)
  return { roleId, permissionKeys, permissionHash }
}

async function readOrBuildSnapshot(params: {
  userId: string
  scopeKey: string
  scope: AccessContextScope
  agencyId?: string
  subAccountId?: string
}): Promise<AccessSnapshotRecord | null> {
  // local TTL cache
  const localKey = `${params.userId}:${params.scopeKey}`
  const hit = localCache.get(localKey)
  if (hit && hit.expiresAt > Date.now()) return hit.value

  const existing = await db.accessContextSnapshot.findUnique({
    where: { userId_scopeKey: { userId: params.userId, scopeKey: params.scopeKey } },
    select: {
      roleId: true,
      permissionKeys: true,
      permissionHash: true,
      version: true,
      updatedAt: true,
      active: true,
    },
  })

  if (existing?.active) {
    const value = {
      roleId: existing.roleId ?? null,
      permissionKeys: (existing.permissionKeys as any) as string[],
      permissionHash: existing.permissionHash,
      version: existing.version,
      updatedAt: existing.updatedAt,
    }
    localCache.set(localKey, { expiresAt: Date.now() + LOCAL_TTL_MS, value })
    return value
  }

  // Build from current membership/role
  const built = await buildSnapshotForScope({
    userId: params.userId,
    scope: params.scope === 'SUBACCOUNT' ? 'SUBACCOUNT' : 'AGENCY',
    agencyId: params.agencyId,
    subAccountId: params.subAccountId,
  })
  if (!built) return null

  const persisted = await db.accessContextSnapshot.upsert({
    where: { userId_scopeKey: { userId: params.userId, scopeKey: params.scopeKey } },
    create: {
      userId: params.userId,
      scopeKey: params.scopeKey,
      scope: params.scope,
      roleId: built.roleId,
      permissionKeys: built.permissionKeys as any,
      permissionHash: built.permissionHash,
      active: true,
    },
    update: {
      scope: params.scope,
      roleId: built.roleId,
      permissionKeys: built.permissionKeys as any,
      permissionHash: built.permissionHash,
      active: true,
    },
    select: {
      roleId: true,
      permissionKeys: true,
      permissionHash: true,
      version: true,
      updatedAt: true,
    },
  })

  const value = {
    roleId: persisted.roleId ?? null,
    permissionKeys: (persisted.permissionKeys as any) as string[],
    permissionHash: persisted.permissionHash,
    version: persisted.version,
    updatedAt: persisted.updatedAt,
  }

  localCache.set(localKey, { expiresAt: Date.now() + LOCAL_TTL_MS, value })
  return value
}

export const getAgencyAccessSnapshot = cache(async (agencyId: string) => {
  const userId = await getAuthedUserIdCached()
  if (!userId) return null

  const snapshot = await readOrBuildSnapshot({
    userId,
    scopeKey: agencyScopeKey(agencyId),
    scope: 'AGENCY' as any,
    agencyId,
  })
  if (!snapshot) return null
  return {
    roleId: snapshot.roleId,
    permissionKeys: snapshot.permissionKeys,
    permissionHash: snapshot.permissionHash,
  }
})

export const getSubAccountAccessSnapshot = cache(async (subAccountId: string) => {
  const userId = await getAuthedUserIdCached()
  if (!userId) return null

  const snapshot = await readOrBuildSnapshot({
    userId,
    scopeKey: subAccountScopeKey(subAccountId),
    scope: 'SUBACCOUNT' as any,
    subAccountId,
  })
  if (!snapshot) return null
  return {
    roleId: snapshot.roleId,
    permissionKeys: snapshot.permissionKeys,
    permissionHash: snapshot.permissionHash,
  }
})

export async function invalidateAccessSnapshot(params: { userId: string; scopeKey: string }) {
  localCache.delete(`${params.userId}:${params.scopeKey}`)
  await db.accessContextSnapshot.deleteMany({
    where: { userId: params.userId, scopeKey: params.scopeKey },
  })
}

export async function invalidateAccessSnapshotsByRoleId(roleId: string) {
  const rows = await db.accessContextSnapshot.findMany({
    where: { roleId },
    select: { userId: true, scopeKey: true },
  })

  for (const r of rows) localCache.delete(`${r.userId}:${r.scopeKey}`)

  await db.accessContextSnapshot.deleteMany({ where: { roleId } })
}

export async function getAccessSnapshotVersionForUser(params: {
  userId: string
  scope: 'AGENCY' | 'SUBACCOUNT'
  agencyId: string
  subAccountId?: string | null
}): Promise<AccessSnapshotVersionInfo | null> {
  const scopeKey =
    params.scope === 'SUBACCOUNT'
      ? params.subAccountId
        ? subAccountScopeKey(params.subAccountId)
        : null
      : agencyScopeKey(params.agencyId)
  if (!scopeKey) return null

  const snapshot = await readOrBuildSnapshot({
    userId: params.userId,
    scopeKey,
    scope: params.scope as any,
    agencyId: params.agencyId,
    subAccountId: params.subAccountId ?? undefined,
  })

  if (!snapshot) return null

  return {
    userId: params.userId,
    scopeKey,
    scope: params.scope as any,
    permissionHash: snapshot.permissionHash,
    permissionVersion: snapshot.version,
    updatedAt: snapshot.updatedAt,
  }
}

export async function getAccessSnapshotForUser(
  params: AccessSnapshotForUserParams
): Promise<AccessSnapshotPayload | null> {
  const scopeKey =
    params.scope === 'SUBACCOUNT'
      ? params.subAccountId
        ? subAccountScopeKey(params.subAccountId)
        : null
      : agencyScopeKey(params.agencyId)
  if (!scopeKey) return null

  const snapshot = await readOrBuildSnapshot({
    userId: params.userId,
    scopeKey,
    scope: params.scope as any,
    agencyId: params.agencyId,
    subAccountId: params.subAccountId ?? undefined,
  })
  if (!snapshot) return null

  return {
    roleId: snapshot.roleId,
    permissionKeys: snapshot.permissionKeys,
    permissionHash: snapshot.permissionHash,
  }
}
