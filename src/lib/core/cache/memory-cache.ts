import 'server-only'

/**
 * Simple in-memory TTL cache for hot paths.
 * 
 * Use this for data that:
 * - Changes infrequently (subscriptions, roles, entitlements)
 * - Is expensive to compute/fetch
 * - Can tolerate brief staleness (30-60s)
 * 
 * For data that must be fresh, use React `cache()` instead (per-request only).
 * 
 * @example
 * ```ts
 * const getCachedEntitlements = memoryCache(
 *   'entitlements',
 *   async (agencyId: string) => resolveEffectiveEntitlements({ ... }),
 *   { ttlMs: 60_000 }
 * )
 * 
 * // Later in code:
 * const entitlements = await getCachedEntitlements(agencyId)
 * ```
 */

type CacheEntry<T> = {
  value: T
  expiresAt: number
}

const caches = new Map<string, Map<string, CacheEntry<any>>>()

export type MemoryCacheOptions = {
  /** Time-to-live in milliseconds. Default: 60_000 (1 minute) */
  ttlMs?: number
  /** Max entries per namespace to prevent unbounded growth. Default: 1000 */
  maxEntries?: number
}

function getOrCreateNamespace(namespace: string): Map<string, CacheEntry<any>> {
  let ns = caches.get(namespace)
  if (!ns) {
    ns = new Map()
    caches.set(namespace, ns)
  }
  return ns
}

function evictEntries(ns: Map<string, CacheEntry<any>>, now: number, maxEntries: number): void {
  // First pass: cheap prune of expired keys.
  for (const [key, entry] of ns) {
    if (entry.expiresAt <= now) ns.delete(key)
  }

  if (ns.size < maxEntries) return

  // Second pass: trim oldest insertion-ordered keys down to ~80% capacity.
  const targetSize = Math.floor(maxEntries * 0.8)
  const removeCount = Math.max(1, ns.size - targetSize)

  const iter = ns.keys()
  for (let i = 0; i < removeCount; i++) {
    const next = iter.next()
    if (next.done) break
    ns.delete(next.value)
  }
}

/**
 * Create a memoized async function with TTL caching.
 * 
 * @param namespace - Unique name for this cache (e.g., 'entitlements', 'permissions')
 * @param fn - Async function to cache
 * @param options - Cache options
 */
export function memoryCache<TArgs extends any[], TResult>(
  namespace: string,
  fn: (...args: TArgs) => Promise<TResult>,
  options: MemoryCacheOptions = {}
): (...args: TArgs) => Promise<TResult> {
  const { ttlMs = 60_000, maxEntries = 1000 } = options

  return async (...args: TArgs): Promise<TResult> => {
    const ns = getOrCreateNamespace(namespace)
    const key = JSON.stringify(args)
    const now = Date.now()

    // Check cache hit
    const entry = ns.get(key)
    if (entry && entry.expiresAt > now) {
      return entry.value
    }

    // Cache miss - compute value
    const value = await fn(...args)

    // Evict stale / oldest entries if at capacity.
    if (ns.size >= maxEntries) {
      evictEntries(ns, now, maxEntries)
    }

    ns.set(key, { value, expiresAt: now + ttlMs })
    return value
  }
}

/**
 * Invalidate all entries in a namespace.
 */
export function invalidateNamespace(namespace: string): void {
  caches.get(namespace)?.clear()
}

/**
 * Invalidate specific entries matching a predicate.
 */
export function invalidateWhere(namespace: string, predicate: (key: string) => boolean): void {
  const ns = caches.get(namespace)
  if (!ns) return
  for (const [key] of ns) {
    if (predicate(key)) {
      ns.delete(key)
    }
  }
}

/**
 * Invalidate entries containing a specific ID (common pattern for agency/user invalidation).
 */
export function invalidateByContains(namespace: string, searchString: string): void {
  invalidateWhere(namespace, (key) => key.includes(searchString))
}

/**
 * Get cache stats for debugging.
 */
export function getCacheStats(): Record<string, { size: number; validEntries: number }> {
  const now = Date.now()
  const stats: Record<string, { size: number; validEntries: number }> = {}
  
  for (const [namespace, ns] of caches) {
    let validEntries = 0
    for (const [, entry] of ns) {
      if (entry.expiresAt > now) validEntries++
    }
    stats[namespace] = { size: ns.size, validEntries }
  }
  
  return stats
}
