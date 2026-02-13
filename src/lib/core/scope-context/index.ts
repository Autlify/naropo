/**
 * Scope Context Module
 * 
 * Provides unified context loading with cookie caching for reduced DB queries.
 * 
 * @example
 * ```ts
 * import { getScopeContext } from '@/lib/core/scope-context'
 * 
 * // In a server component or API route
 * const ctx = await getScopeContext({ agencyId: 'xxx' })
 * if (ctx.enabledFeatures.includes('fi.general_ledger.balances')) {
 *   // Show GL feature
 * }
 * ```
 */

export type { ScopeContext, CompactScopeContext, ExtractedScope } from './types'

export { loadScopeContext, extractScopeFromPath, getAgencyIdForSubAccount } from './load'

export {
  SCOPE_CONTEXT_COOKIE,
  readScopeContextCookie,
  writeScopeContextCookie,
  clearScopeContextCookie,
  isContextStale,
} from './cookie'

export { compactify, expandCompact, encodeCompact, decodeCompact } from './encode'
