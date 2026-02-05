import 'server-only'

import type { NextRequest } from 'next/server'
import { getOrCreateSystemUser, SYSTEM_USER_EMAIL } from './system-user'

/**
 * Verifies that a request is an internal scheduled job call.
 *
 * Supported secrets:
 * - header: x-job-secret
 * - query : ?secret=
 */
export const assertJobSecret = (req: NextRequest) => {
  const configured = process.env.JOBS_SECRET
  if (!configured) return

  const provided = req.headers.get('x-job-secret') || new URL(req.url).searchParams.get('secret')
  if (provided !== configured) {
    throw new Error('UNAUTHORIZED')
  }
}

/**
 * Returns the system user used for internal job audit attribution.
 * This helper also ensures the user exists.
 */
export const getSystemJobActor = async () => {
  const u = await getOrCreateSystemUser()
  return {
    userId: u.id,
    email: SYSTEM_USER_EMAIL,
    name: u.name,
  }
}
