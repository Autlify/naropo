import 'server-only'

/**
 * Cache Utilities Index
 * 
 * Centralized exports for caching functions.
 * Use these cached getters instead of heavy DB queries.
 * 
 * NOTE: Server-only. Don't import in client components.
 */

// User cache - drop-in replacement for getCurrentUser({ withFullUser: true, redirectIfNotFound: false });
export {
  getCurrentUser,
  requireUser,
  requireFullUser,
  getOptionalUser,
  getOptionalFullUser,
  type CachedUser as AuthUserDetails,
} from '@/lib/core/cache/current-user'

// Memory cache - for cross-request TTL caching
export {
  memoryCache,
  invalidateNamespace,
  invalidateWhere,
  invalidateByContains,
  getCacheStats,
  type MemoryCacheOptions,
} from '@/lib/core/cache/memory-cache'
