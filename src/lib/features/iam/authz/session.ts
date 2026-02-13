import 'server-only'

import { cache } from 'react'
import { auth } from '@/auth'

export const getAuthedSessionCached = cache(async () => auth())

export const getAuthedUserIdCached = cache(async (): Promise<string | null> => {
  const session = await getAuthedSessionCached()
  return session?.user?.id ?? null
})
