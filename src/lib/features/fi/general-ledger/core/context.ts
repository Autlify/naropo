/**
 * GL Context Manager
 * Single source of truth for GL context resolution
 * Replaces duplicated getContext() pattern across action files
 * 
 * @namespace Autlify.Lib.Features.FI.GL.Core.Context
 */

'use server'

import { auth } from '@/auth'
import { db } from '@/lib/db'

/** Context type for GL operations */
export type GLContextType = 'AGENCY' | 'SUBACCOUNT'

/** Result of context resolution */
export interface GLContext {
  userId: string
  agencyId?: string
  subAccountId?: string
  contextType: GLContextType
}

/** Error result for context resolution */
export interface GLContextError {
  error: string
  code: 'NO_SESSION' | 'NO_CONTEXT' | 'INVALID_CONTEXT'
}

/** Context resolution result */
export type GLContextResult = 
  | { success: true; context: GLContext }
  | { success: false; error: GLContextError }

/**
 * Get the current GL context from session
 * Resolves agency or subaccount based on active session
 * 
 * @returns GLContextResult with context or error
 */
export const getGLContext = async (): Promise<GLContextResult> => {
  const session = await auth()
  if (!session?.user?.id) {
    return {
      success: false,
      error: {
        error: 'Unauthorized: No session found',
        code: 'NO_SESSION',
      },
    }
  }

  const dbSession = await db.session.findFirst({
    where: { userId: session.user.id },
    orderBy: { lastActiveAt: 'desc' },
    select: { activeAgencyId: true, activeSubAccountId: true },
  })

  if (!dbSession?.activeAgencyId && !dbSession?.activeSubAccountId) {
    return {
      success: false,
      error: {
        error: 'No active agency or subaccount context',
        code: 'NO_CONTEXT',
      },
    }
  }

  // Determine context type - SubAccount takes precedence when active
  const contextType: GLContextType = dbSession.activeSubAccountId 
    ? 'SUBACCOUNT' 
    : 'AGENCY'

  return {
    success: true,
    context: {
      userId: session.user.id,
      agencyId: dbSession.activeAgencyId ?? undefined,
      subAccountId: dbSession.activeSubAccountId ?? undefined,
      contextType,
    },
  }
}

/**
 * Require agency context - fails if in subaccount context
 * Use for agency-only features like consolidation
 * 
 * @returns GLContext or throws error
 */
export const requireAgencyContext = async (): Promise<GLContext> => {
  const result = await getGLContext()
  
  if (!result.success) {
    throw new Error(result.error.error)
  }

  if (!result.context.agencyId) {
    throw new Error('Agency context required for this operation')
  }

  // For agency-only operations, ensure we're not in subaccount context
  if (result.context.subAccountId && result.context.contextType === 'SUBACCOUNT') {
    throw new Error('This feature is only available at Agency level')
  }

  return result.context
}

/**
 * Require any valid context (agency or subaccount)
 * Use for features available to both
 * 
 * @returns GLContext or throws error
 */
export const requireAnyContext = async (): Promise<GLContext> => {
  const result = await getGLContext()
  
  if (!result.success) {
    throw new Error(result.error.error)
  }

  if (!result.context.agencyId && !result.context.subAccountId) {
    throw new Error('Agency or SubAccount context required')
  }

  return result.context
}

// Note: Utility functions getContextWhereClause and getContextCreateData
// have been moved to ./utils.ts to avoid 'use server' restrictions
