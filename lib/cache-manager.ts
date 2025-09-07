import { useState, useEffect, useCallback } from 'react';

// Cache configuration
interface CacheConfig {
  ttl: number; // Time to live in milliseconds
  maxSize: number; // Maximum number of items
  storage: 'memory' | 'localStorage' | 'sessionStorage';
}

interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class CacheManager {
  private memoryCache = new Map<string, CacheItem<any>>();
  private config: CacheConfig;

  constructor(config: CacheConfig) {
    this.config = config;
  }

  // Set cache item
  set<T>(key: string, data: T, customTtl?: number): void {
    const ttl = customTtl || this.config.ttl;
    const item: CacheItem<T> = {
      data,
      timestamp: Date.now(),
      ttl,
    };

    // Store in memory
    this.memoryCache.set(key, item);

    // Store in browser storage if configured
    if (this.config.storage !== 'memory') {
      try {
        const storage = this.config.storage === 'localStorage' 
          ? localStorage 
          : sessionStorage;
        storage.setItem(`cache_${key}`, JSON.stringify(item));
      } catch (error) {
        console.warn('Failed to store cache item:', error);
      }
    }

    // Cleanup if over max size
    this.cleanup();
  }

  // Get cache item
  get<T>(key: string): T | null {
    // Try memory first
    let item = this.memoryCache.get(key);
    
    // Try browser storage if not in memory
    if (!item && this.config.storage !== 'memory') {
      try {
        const storage = this.config.storage === 'localStorage' 
          ? localStorage 
          : sessionStorage;
        const stored = storage.getItem(`cache_${key}`);
        if (stored) {
          item = JSON.parse(stored);
          // Restore to memory cache
          this.memoryCache.set(key, item);
        }
      } catch (error) {
        console.warn('Failed to retrieve cache item:', error);
      }
    }

    if (!item) return null;

    // Check if expired
    if (Date.now() - item.timestamp > item.ttl) {
      this.delete(key);
      return null;
    }

    return item.data;
  }

  // Delete cache item
  delete(key: string): void {
    this.memoryCache.delete(key);
    
    if (this.config.storage !== 'memory') {
      try {
        const storage = this.config.storage === 'localStorage' 
          ? localStorage 
          : sessionStorage;
        storage.removeItem(`cache_${key}`);
      } catch (error) {
        console.warn('Failed to delete cache item:', error);
      }
    }
  }

  // Clear all cache
  clear(): void {
    this.memoryCache.clear();
    
    if (this.config.storage !== 'memory') {
      try {
        const storage = this.config.storage === 'localStorage' 
          ? localStorage 
          : sessionStorage;
        // Clear all cache keys
        const keys = Object.keys(storage).filter(key => key.startsWith('cache_'));
        keys.forEach(key => storage.removeItem(key));
      } catch (error) {
        console.warn('Failed to clear cache:', error);
      }
    }
  }

  // Cleanup expired items
  private cleanup(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    this.memoryCache.forEach((item, key) => {
      if (now - item.timestamp > item.ttl) {
        expiredKeys.push(key);
      }
    });

    expiredKeys.forEach(key => this.delete(key));

    // Remove oldest items if over max size
    if (this.memoryCache.size > this.config.maxSize) {
      const entries = Array.from(this.memoryCache.entries());
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      
      const toRemove = entries.slice(0, this.memoryCache.size - this.config.maxSize);
      toRemove.forEach(([key]) => this.delete(key));
    }
  }

  // Get cache stats
  getStats() {
    const now = Date.now();
    let oldestTimestamp = now;
    
    this.memoryCache.forEach((item) => {
      if (item.timestamp < oldestTimestamp) {
        oldestTimestamp = item.timestamp;
      }
    });
    
    const cacheAge = oldestTimestamp === now ? 0 : now - oldestTimestamp;
    
    return {
      size: this.memoryCache.size,
      maxSize: this.config.maxSize,
      storage: this.config.storage,
      isValid: this.hasValidCache(),
      hasCache: this.memoryCache.size > 0,
      cacheAge: cacheAge,
      questsCount: this.memoryCache.size,
      date: oldestTimestamp === now ? 'No cache' : new Date(oldestTimestamp).toLocaleString(),
    };
  }

  // Check if cache has valid data
  hasValidCache(): boolean {
    const now = Date.now();
    let hasValid = false;
    
    this.memoryCache.forEach((item) => {
      if (now - item.timestamp <= item.ttl) {
        hasValid = true;
      }
    });
    
    return hasValid;
  }
}

// Create cache instances for different data types
export const questCache = new CacheManager({
  ttl: 5 * 60 * 1000, // 5 minutes
  maxSize: 100,
  storage: 'localStorage',
});

export const kingdomCache = new CacheManager({
  ttl: 2 * 60 * 1000, // 2 minutes
  maxSize: 50,
  storage: 'localStorage',
});

export const userCache = new CacheManager({
  ttl: 10 * 60 * 1000, // 10 minutes
  maxSize: 20,
  storage: 'localStorage',
});

export const statsCache = new CacheManager({
  ttl: 1 * 60 * 1000, // 1 minute
  maxSize: 30,
  storage: 'memory',
});

// React hook for cached data fetching
export function useCachedData<T>(
  key: string,
  fetcher: () => Promise<T>,
  cacheManager: CacheManager = questCache,
  dependencies: any[] = []
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    // Check cache first
    const cached = cacheManager.get<T>(key);
    if (cached) {
      setData(cached);
      return;
    }

    // Fetch fresh data
    setLoading(true);
    setError(null);

    try {
      const freshData = await fetcher();
      cacheManager.set(key, freshData);
      setData(freshData);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  }, [key, fetcher, cacheManager, ...dependencies]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refetch = useCallback(() => {
    cacheManager.delete(key);
    fetchData();
  }, [key, fetchData, cacheManager]);

  return { data, loading, error, refetch };
}

// Utility function for API calls with caching
export async function cachedFetch<T>(
  url: string,
  options: RequestInit = {},
  cacheManager: CacheManager = questCache,
  ttl?: number
): Promise<T> {
  const cacheKey = `fetch_${url}_${JSON.stringify(options)}`;
  
  // Check cache first
  const cached = cacheManager.get<T>(cacheKey);
  if (cached) {
    return cached;
  }

  // Fetch fresh data
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  
  // Cache the result
  cacheManager.set(cacheKey, data, ttl);
  
  return data;
}