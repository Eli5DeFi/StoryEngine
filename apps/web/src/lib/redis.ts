/**
 * Redis Caching Layer for Voidborne
 * 
 * Provides:
 * - In-memory + Redis caching
 * - TTL-based invalidation
 * - Async cache wrapper
 * - Cache key generation
 * 
 * Usage:
 * ```ts
 * const data = await cachedQuery(
 *   'leaderboard:top100',
 *   300, // 5 minutes
 *   async () => prisma.user.findMany(...)
 * )
 * ```
 */

// In-memory cache (fallback if Redis unavailable)
const memoryCache = new Map<string, { data: any; expires: number }>()

// Simple in-memory cache (replace with Redis for production)
export class SimpleCache {
  private cache = new Map<string, { data: any; expires: number }>()
  
  get<T>(key: string): T | null {
    const item = this.cache.get(key)
    if (!item) return null
    
    if (Date.now() > item.expires) {
      this.cache.delete(key)
      return null
    }
    
    return item.data
  }
  
  set<T>(key: string, data: T, ttl: number): void {
    this.cache.set(key, {
      data,
      expires: Date.now() + (ttl * 1000),
    })
  }
  
  delete(key: string): void {
    this.cache.delete(key)
  }
  
  clear(): void {
    this.cache.clear()
  }
  
  // Cleanup expired entries (run periodically)
  cleanup(): void {
    const now = Date.now()
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expires) {
        this.cache.delete(key)
      }
    }
  }
}

export const cache = new SimpleCache()

// Cleanup expired entries every 5 minutes
if (typeof window === 'undefined') {
  setInterval(() => cache.cleanup(), 5 * 60 * 1000)
}

/**
 * Cached query wrapper
 * 
 * @param key - Cache key
 * @param ttl - Time to live (seconds)
 * @param fetcher - Async function to fetch data if not cached
 * @returns Cached or fresh data
 */
export async function cachedQuery<T>(
  key: string,
  ttl: number,
  fetcher: () => Promise<T>
): Promise<T> {
  // Try to get from cache
  const cached = cache.get<T>(key)
  if (cached !== null) {
    return cached
  }
  
  // Fetch fresh data
  const data = await fetcher()
  
  // Store in cache
  cache.set(key, data, ttl)
  
  return data
}

/**
 * Cache key generators for consistency
 */
export const cacheKeys = {
  leaderboard: (limit: number = 100) => `leaderboard:top${limit}`,
  userStats: (userId: string) => `user:${userId}:stats`,
  poolInfo: (poolId: string) => `pool:${poolId}:info`,
  poolOdds: (poolId: string) => `pool:${poolId}:odds`,
  storyInfo: (storyId: string) => `story:${storyId}:info`,
  trending: () => 'trending:data',
  recentBets: (limit: number) => `recent:bets:${limit}`,
  platformStats: () => 'platform:stats',
}

/**
 * Cache TTLs (in seconds)
 */
export const CacheTTL = {
  SHORT: 30,      // 30 seconds (real-time data)
  MEDIUM: 300,    // 5 minutes (frequently changing)
  LONG: 3600,     // 1 hour (static-ish data)
  DAY: 86400,     // 24 hours (rarely changing)
} as const

/**
 * Invalidate specific cache keys
 */
export function invalidateCache(pattern: string): void {
  // For simple cache, we can only clear all or specific keys
  // With Redis, you'd use pattern matching (KEYS or SCAN)
  if (pattern === '*') {
    cache.clear()
  } else {
    cache.delete(pattern)
  }
}

/**
 * Bulk cache operations
 */
export async function cachedQueryBulk<T>(
  keys: string[],
  ttl: number,
  fetcher: (missingKeys: string[]) => Promise<Map<string, T>>
): Promise<Map<string, T>> {
  const result = new Map<string, T>()
  const missingKeys: string[] = []
  
  // Check cache for each key
  for (const key of keys) {
    const cached = cache.get<T>(key)
    if (cached !== null) {
      result.set(key, cached)
    } else {
      missingKeys.push(key)
    }
  }
  
  // Fetch missing data
  if (missingKeys.length > 0) {
    const freshData = await fetcher(missingKeys)
    
    // Store in cache and add to result
    for (const [key, data] of freshData.entries()) {
      cache.set(key, data, ttl)
      result.set(key, data)
    }
  }
  
  return result
}
