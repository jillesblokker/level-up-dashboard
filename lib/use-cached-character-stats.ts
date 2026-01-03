"use client"

import { useState, useEffect, useCallback } from 'react';
import { cachedFetch, invalidateCache, CACHE_KEYS } from './fetch-cache';
import { fetchWithAuth } from './fetchWithAuth';

interface CachedCharacterStats {
    gold: number;
    experience: number;
    level: number;
    health: number;
    max_health: number;
    build_tokens: number;
    streak_tokens: number;
    kingdom_expansions: number;
    display_name?: string;
    title?: string;
}

const DEFAULT_STATS: CachedCharacterStats = {
    gold: 500,
    experience: 0,
    level: 1,
    health: 100,
    max_health: 100,
    build_tokens: 0,
    streak_tokens: 0,
    kingdom_expansions: 0,
    display_name: 'Adventurer',
    title: 'Novice',
};

/**
 * Hook for fetching character stats with caching.
 * Uses in-memory cache to reduce API calls and speed up UI.
 * 
 * Key features:
 * - 30-second cache TTL
 * - Request deduplication (multiple components won't trigger duplicate fetches)
 * - Manual refresh capability
 * - Optimistic local cache
 */
export function useCachedCharacterStats() {
    const [stats, setStats] = useState<CachedCharacterStats>(DEFAULT_STATS);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const fetchStats = useCallback(async (forceRefresh = false) => {
        setIsLoading(true);
        setError(null);

        try {
            const data = await cachedFetch<CachedCharacterStats>(
                CACHE_KEYS.CHARACTER_STATS,
                async () => {
                    const response = await fetchWithAuth('/api/character-stats');
                    if (!response.ok) {
                        throw new Error(`Failed to fetch stats: ${response.status}`);
                    }
                    const json = await response.json();
                    return json.stats || DEFAULT_STATS;
                },
                { forceRefresh, ttl: 30000 } // 30 second cache
            );

            setStats(data);
            return data;
        } catch (err) {
            const error = err instanceof Error ? err : new Error('Unknown error');
            setError(error);
            console.error('[useCachedCharacterStats] Error:', error);
            return null;
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Initial fetch
    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    // Listen for stats update events (from other parts of the app)
    useEffect(() => {
        const handleUpdate = () => {
            // Invalidate cache and refetch
            invalidateCache(CACHE_KEYS.CHARACTER_STATS);
            fetchStats(true);
        };

        window.addEventListener('character-stats-update', handleUpdate);
        return () => window.removeEventListener('character-stats-update', handleUpdate);
    }, [fetchStats]);

    const refresh = useCallback(() => {
        invalidateCache(CACHE_KEYS.CHARACTER_STATS);
        return fetchStats(true);
    }, [fetchStats]);

    return {
        stats,
        isLoading,
        error,
        refresh,
        // Convenience accessors
        gold: stats.gold,
        experience: stats.experience,
        level: stats.level,
        buildTokens: stats.build_tokens,
        displayName: stats.display_name,
    };
}
