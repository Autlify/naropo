import 'server-only'

import { verifyApiKeyToken, type ApiKeyKind } from '@/lib/features/iam/authn/api-key'
import { getAutlifyApiKeyHeader } from '@/lib/features/iam/authn/headers'
import { getAuthedUserIdCached } from '@/lib/features/iam/authz/session'

export type UserPrincipal = {
  kind: 'user'
  userId: string
}

export type ApiKeyPrincipal = {
  kind: 'apiKey'
  apiKeyId: string
  apiKeyKind: ApiKeyKind
  ownerUserId: string
  agencyId: string | null
  subAccountId: string | null
  allowedSubAccountIds: string[]
  permissionKeys: string[]
}

export type Principal = UserPrincipal | ApiKeyPrincipal

export const getBearerToken = (headers: Headers): string | null => {
  const raw = headers.get('authorization') || headers.get('Authorization')
  if (!raw) return null

  const parts = raw.trim().split(/\s+/, 2)
  if (parts.length !== 2) return null
  if (parts[0].toLowerCase() !== 'bearer') return null
  return parts[1]
}

export const getPrincipalFromRequest = async (req: Request): Promise<Principal | null> => {
  const token = getBearerToken(req.headers) || getAutlifyApiKeyHeader(req.headers)
  if (token) {
    const apiKey = await verifyApiKeyToken({ token })
    if (!apiKey) return null
    return {
      kind: 'apiKey',
      apiKeyId: apiKey.id,
      apiKeyKind: apiKey.kind,
      ownerUserId: apiKey.ownerUserId,
      agencyId: apiKey.agencyId,
      subAccountId: apiKey.subAccountId,
      allowedSubAccountIds: apiKey.allowedSubAccountIds,
      permissionKeys: apiKey.permissionKeys,
    }
  }

  const userId = await getAuthedUserIdCached()
  if (!userId) return null
  return { kind: 'user', userId }
}
