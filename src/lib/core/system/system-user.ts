import 'server-only'

import { db } from '@/lib/db'

/**
 * A non-loginable "service principal" user used for internal jobs.
 * This is NOT a real inbox and must never be allowed to sign in via UI/OAuth.
 */
export const SYSTEM_USER_EMAIL = 'system@autlify.com'
export const SYSTEM_USER_NAME = 'Autlify System'

export type SystemUser = {
  id: string
  email: string
  name: string
}

export const getOrCreateSystemUser = async (): Promise<SystemUser> => {
  const existing = await db.user.findUnique({
    where: { email: SYSTEM_USER_EMAIL },
    select: { id: true, email: true, name: true },
  })

  if (existing) {
    return {
      id: existing.id,
      email: existing.email,
      name: existing.name ?? SYSTEM_USER_NAME,
    }
  }

  const created = await db.user.create({
    data: {
      email: SYSTEM_USER_EMAIL,
      name: SYSTEM_USER_NAME,
      emailVerified: new Date(),
      password: null,
    },
    select: { id: true, email: true, name: true },
  })

  return { id: created.id, email: created.email, name: created.name }
}
