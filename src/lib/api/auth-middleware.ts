import { NextResponse } from 'next/server';
import { auth } from '@/auth';

/**
 * Requires authentication and returns the session.
 * Throws a Response error if unauthenticated.
 * 
 * @returns The authenticated session
 * @throws Response with 401 status if unauthenticated
 * 
 * @example
 * export const GET = withErrorHandler(async (req: Request) => {
 *   const session = await requireAuth();
 *   const userId = session.user.id;
 *   // ... rest of handler
 * });
 */
export async function requireAuth() {
  const session = await auth();
  
  if (!session?.user?.id) {
    throw NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }
  
  return session;
}

/**
 * Gets the current session or returns null if unauthenticated.
 * Does not throw an error.
 * 
 * @returns The session or null
 */
export async function getSession() {
  return auth();
}
