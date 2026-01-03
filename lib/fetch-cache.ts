/**
 * SIMPLE FETCH CACHE
 * 
 * Lightweight request caching for reducing duplicate API calls.
 * Works without external dependencies.
 */

interface CacheEntry<T> {
    data: T;
    timestamp: number;
    expiresAt: number;
}

interface CacheOptions {
    /** Time in milliseconds before cache expires. Default: 30 seconds */
    ttl?: number;
    /** Force refresh, ignoring cache */
    forceRefresh?: boolean;
}

// In-memory cache
const cache = new Map<string, CacheEntry<unknown>>();

// Pending requests to deduplicate concurrent calls
const pendingRequests = new Map<string, Promise<unknown>>();

const DEFAULT_TTL = 30 * 1000; // 30 seconds

/**
 * Fetches data with caching and request deduplication.
 * 
 * @param key Unique cache key
 * @param fetcher Async function that fetches the data
 * @param options Cache options
 * @returns Cached or fresh data
 */
export async function cachedFetch<T>(
    key: string,
    fetcher: () => Promise<T>,
    options: CacheOptions = {}
): Promise<T> {
    const { ttl = DEFAULT_TTL, forceRefresh = false } = options;
    const now = Date.now();

    // Check cache first (unless force refresh)
    if (!forceRefresh) {
        const cached = cache.get(key) as CacheEntry<T> | undefined;
        if (cached && cached.expiresAt > now) {
            return cached.data;
        }
    }

    // Check if there's already a pending request for this key (deduplication)
    const pending = pendingRequests.get(key) as Promise<T> | undefined;
    if (pending) {
        return pending;
    }

    // Create new fetch request
    const fetchPromise = (async () => {
        try {
            const data = await fetcher();

            // Store in cache
            cache.set(key, {
                data,
                timestamp: now,
                expiresAt: now + ttl,
            });

            return data;
        } finally {
            // Clear pending request
            pendingRequests.delete(key);
        }
    })();

    // Store as pending
    pendingRequests.set(key, fetchPromise);

    return fetchPromise;
}

/**
 * Invalidates a specific cache entry.
 * @param key Cache key to invalidate
 */
export function invalidateCache(key: string): void {
    cache.delete(key);
}

/**
 * Invalidates all cache entries matching a prefix.
 * @param prefix Key prefix to match
 */
export function invalidateCacheByPrefix(prefix: string): void {
    for (const key of cache.keys()) {
        if (key.startsWith(prefix)) {
            cache.delete(key);
        }
    }
}

/**
 * Clears the entire cache.
 */
export function clearCache(): void {
    cache.clear();
}

/**
 * Gets cache statistics for debugging.
 */
export function getCacheStats(): { size: number; keys: string[] } {
    return {
        size: cache.size,
        keys: Array.from(cache.keys()),
    };
}

// Pre-defined cache keys for consistency
export const CACHE_KEYS = {
    CHARACTER_STATS: 'character-stats',
    INVENTORY: (userId: string) => `inventory:${userId}`,
    KINGDOM_GRID: (userId: string) => `kingdom-grid:${userId}`,
    QUESTS: 'quests',
    ACHIEVEMENTS: 'achievements',
} as const;
