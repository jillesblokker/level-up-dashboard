/**
 * Cache Manager for Quest Data
 * Prevents stale cached data from causing quest completion issues
 */

export interface CacheMetadata {
  timestamp: number;
  date: string;
  version: string;
}

export interface QuestCache {
  data: any[];
  metadata: CacheMetadata;
}

const CACHE_VERSION = '1.0.0';
const MAX_CACHE_AGE_MS = 60 * 60 * 1000; // 1 hour
const EMERGENCY_CACHE_AGE_MS = 30 * 60 * 1000; // 30 minutes

export class QuestCacheManager {
  private static instance: QuestCacheManager;
  
  private constructor() {}
  
  static getInstance(): QuestCacheManager {
    if (!QuestCacheManager.instance) {
      QuestCacheManager.instance = new QuestCacheManager();
    }
    return QuestCacheManager.instance;
  }
  
  /**
   * Store quest data with metadata
   */
  storeQuests(quests: any[]): void {
    if (!Array.isArray(quests) || quests.length === 0) {
      console.warn('[Cache Manager] Attempted to store invalid quest data');
      return;
    }
    
    const metadata: CacheMetadata = {
      timestamp: Date.now(),
      date: new Date().toISOString().slice(0, 10),
      version: CACHE_VERSION
    };
    
    const cacheData: QuestCache = {
      data: quests,
      metadata
    };
    
    try {
      localStorage.setItem('quest-cache', JSON.stringify(cacheData));
      localStorage.setItem('quest-cache-timestamp', metadata.timestamp.toString());
      localStorage.setItem('quest-cache-date', metadata.date);
      console.log('[Cache Manager] Quest data cached successfully:', {
        questsCount: quests.length,
        timestamp: new Date(metadata.timestamp).toLocaleString(),
        date: metadata.date
      });
    } catch (error) {
      console.error('[Cache Manager] Failed to store quest cache:', error);
      this.clearCache();
    }
  }
  
  /**
   * Retrieve quest data if cache is valid
   */
  getQuests(): any[] | null {
    try {
      const cacheData = localStorage.getItem('quest-cache');
      if (!cacheData) {
        return null;
      }
      
      const parsed: QuestCache = JSON.parse(cacheData);
      
      // Validate cache structure
      if (!parsed.data || !parsed.metadata || !Array.isArray(parsed.data)) {
        console.warn('[Cache Manager] Invalid cache structure, clearing');
        this.clearCache();
        return null;
      }
      
      // Check cache age
      const now = Date.now();
      const cacheAge = now - parsed.metadata.timestamp;
      
      if (cacheAge > MAX_CACHE_AGE_MS) {
        console.log('[Cache Manager] Cache expired, clearing');
        this.clearCache();
        return null;
      }
      
      // Check if cache is from today
      const today = new Date().toISOString().slice(0, 10);
      if (parsed.metadata.date !== today) {
        console.log('[Cache Manager] Cache from different date, clearing');
        this.clearCache();
        return null;
      }
      
      // Check version compatibility
      if (parsed.metadata.version !== CACHE_VERSION) {
        console.log('[Cache Manager] Cache version mismatch, clearing');
        this.clearCache();
        return null;
      }
      
      console.log('[Cache Manager] Valid cache found:', {
        questsCount: parsed.data.length,
        cacheAge: Math.round(cacheAge / 1000 / 60) + ' minutes'
      });
      
      return parsed.data;
    } catch (error) {
      console.error('[Cache Manager] Error reading cache:', error);
      this.clearCache();
      return null;
    }
  }
  
  /**
   * Get quests as emergency fallback (very recent cache only)
   */
  getQuestsAsFallback(): any[] | null {
    try {
      const cacheTimestamp = localStorage.getItem('quest-cache-timestamp');
      if (!cacheTimestamp) {
        return null;
      }
      
      const cacheAge = Date.now() - parseInt(cacheTimestamp);
      if (cacheAge > EMERGENCY_CACHE_AGE_MS) {
        console.log('[Cache Manager] Emergency cache too old');
        return null;
      }
      
      const quests = this.getQuests();
      if (quests) {
        console.log('[Cache Manager] Using emergency fallback cache');
        return quests;
      }
      
      return null;
    } catch (error) {
      console.error('[Cache Manager] Error reading emergency cache:', error);
      return null;
    }
  }
  
  /**
   * Clear all quest-related cache
   */
  clearCache(): void {
    const keysToRemove = [
      'quest-cache',
      'quest-cache-timestamp', 
      'quest-cache-date',
      'cached-quests',
      'quest-cache-timestamp-ms'
    ];
    
    keysToRemove.forEach(key => {
      try {
        localStorage.removeItem(key);
      } catch (error) {
        console.warn(`[Cache Manager] Failed to remove ${key}:`, error);
      }
    });
    
    console.log('[Cache Manager] Cache cleared');
  }
  
  /**
   * Check if cache exists and is valid
   */
  hasValidCache(): boolean {
    return this.getQuests() !== null;
  }
  
  /**
   * Get cache statistics for debugging
   */
  getCacheStats(): {
    hasCache: boolean;
    cacheAge?: string;
    questsCount?: number;
    date?: string;
    isValid: boolean;
  } {
    try {
      const cacheData = localStorage.getItem('quest-cache');
      if (!cacheData) {
        return { hasCache: false, isValid: false };
      }
      
      const parsed: QuestCache = JSON.parse(cacheData);
      const now = Date.now();
      const cacheAge = now - parsed.metadata.timestamp;
      const today = new Date().toISOString().slice(0, 10);
      
      const isValid = cacheAge <= MAX_CACHE_AGE_MS && 
                     parsed.metadata.date === today &&
                     parsed.metadata.version === CACHE_VERSION;
      
      return {
        hasCache: true,
        cacheAge: Math.round(cacheAge / 1000 / 60) + ' minutes',
        questsCount: parsed.data?.length || 0,
        date: parsed.metadata.date,
        isValid
      };
    } catch (error) {
      return { hasCache: false, isValid: false };
    }
  }
}

// Export singleton instance
export const questCacheManager = QuestCacheManager.getInstance();
