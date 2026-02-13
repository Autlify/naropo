import 'server-only'

import crypto from 'crypto'
import { cookies } from 'next/headers'

export const PERMISSION_STATE_COOKIE = 'autlify.permission-state'
const PERMISSION_STATE_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 60 // 60 days

export type PermissionStateCookieValue = {
  u: string // userId
  s: string // scopeKey
  h: string // permissionHash
  v: number // permission snapshot version
  t: number // snapshot updatedAt (unix ms)
}

const getSigningKey = (): string => {
  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET
  if (!secret) throw new Error('AUTH_SECRET is required for permission-state cookies')
  return secret
}

function signPayload(payload: string): string {
  const hmac = crypto.createHmac('sha256', getSigningKey())
  hmac.update(payload)
  return hmac.digest('base64url')
}

function decodeAndVerify(value: string): PermissionStateCookieValue | null {
  const [payload, signature] = value.split('.')
  if (!payload || !signature) return null

  const expected = signPayload(payload)
  const a = Buffer.from(signature)
  const b = Buffer.from(expected)
  if (a.length !== b.length) return null
  if (!crypto.timingSafeEqual(a, b)) return null

  try {
    const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf-8'))
    if (
      !parsed ||
      typeof parsed.u !== 'string' ||
      typeof parsed.s !== 'string' ||
      typeof parsed.h !== 'string' ||
      typeof parsed.v !== 'number' ||
      typeof parsed.t !== 'number'
    ) {
      return null
    }
    return parsed as PermissionStateCookieValue
  } catch {
    return null
  }
}

export async function readPermissionStateCookie(): Promise<PermissionStateCookieValue | null> {
  const store = await cookies()
  const raw = store.get(PERMISSION_STATE_COOKIE)?.value
  if (!raw) return null
  return decodeAndVerify(raw)
}

export async function writePermissionStateCookie(value: PermissionStateCookieValue): Promise<void> {
  const payload = Buffer.from(JSON.stringify(value), 'utf-8').toString('base64url')
  const signature = signPayload(payload)
  const store = await cookies()
  store.set(PERMISSION_STATE_COOKIE, `${payload}.${signature}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: PERMISSION_STATE_COOKIE_MAX_AGE_SECONDS,
  })
}

export function isPermissionStateStale(
  cached: PermissionStateCookieValue | null,
  current: PermissionStateCookieValue
): boolean {
  if (!cached) return true
  return (
    cached.u !== current.u ||
    cached.s !== current.s ||
    cached.h !== current.h ||
    cached.v !== current.v ||
    cached.t !== current.t
  )
}
