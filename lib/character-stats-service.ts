/**
 * UNIFIED CHARACTER STATS SERVICE
 * 
 * This service provides a single source of truth for character stats management.
 * It handles:
 * - Optimistic local updates for immediate UI feedback
 * - Batched server syncs to prevent race conditions
 * - Automatic conflict resolution (local wins for progressive stats)
 * - Event broadcasting for UI updates
 * 
 * CRITICAL RULES:
 * 1. ALL stat updates MUST go through this service
 * 2. Local state is ALWAYS the source of truth for reads
 * 3. Server is the backup and sync target
 * 4. Progressive stats (gold, XP) can only increase
 */

import { getUserScopedItem, setUserScopedItem } from './user-scoped-storage';

export interface CharacterStats {
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
    updated_at?: string;
}

class CharacterStatsService {
    private static instance: CharacterStatsService;
    private syncQueue: Array<Partial<CharacterStats>> = [];
    private syncTimer: NodeJS.Timeout | null = null;
    private isSyncing = false;
    private lastSyncTime = 0;
    private readonly SYNC_DEBOUNCE_MS = 2000; // Wait 2s before syncing
    private readonly MIN_SYNC_INTERVAL_MS = 3000; // Min 3s between syncs

    private constructor() {
        // Initialize event listeners
        if (typeof window !== 'undefined') {
            // Sync on page unload to prevent data loss
            window.addEventListener('beforeunload', () => {
                this.flushSync();
            });
        }
    }

    public static getInstance(): CharacterStatsService {
        if (!CharacterStatsService.instance) {
            CharacterStatsService.instance = new CharacterStatsService();
        }
        return CharacterStatsService.instance;
    }

    /**
     * Get current stats from local storage (ALWAYS use this for reads)
     */
    public getStats(): CharacterStats {
        if (typeof window === 'undefined') {
            return this.getDefaultStats();
        }

        try {
            const stored = getUserScopedItem('character-stats');
            if (stored) {
                const stats = JSON.parse(stored);
                return {
                    gold: stats.gold || 0,
                    experience: stats.experience || 0,
                    level: stats.level || 1,
                    health: stats.health || 100,
                    max_health: stats.max_health || 100,
                    build_tokens: stats.build_tokens || stats.buildTokens || 0,
                    streak_tokens: stats.streak_tokens || stats.streakTokens || 0,
                    kingdom_expansions: parseInt(getUserScopedItem('kingdom-grid-expansions') || '0', 10),
                    display_name: stats.display_name || 'Adventurer',
                    title: stats.title || 'Novice'
                };
            }
        } catch (error) {
            console.error('[CharacterStatsService] Error reading stats:', error);
        }

        return this.getDefaultStats();
    }

    /**
     * Update stats locally and queue for server sync
     * This is the ONLY method that should modify stats
     */
    public updateStats(updates: Partial<CharacterStats>, source: string = 'unknown'): void {
        if (typeof window === 'undefined') {
            console.warn('[CharacterStatsService] Cannot update stats on server side');
            return;
        }

        const currentStats = this.getStats();

        // Apply updates with validation
        const newStats = { ...currentStats };

        // Handle progressive stats (can only increase)
        if (updates.gold !== undefined) {
            const goldDelta = updates.gold - currentStats.gold;

            newStats.gold = Math.max(currentStats.gold, updates.gold);
        }

        if (updates.experience !== undefined) {
            const xpDelta = updates.experience - currentStats.experience;

            newStats.experience = Math.max(currentStats.experience, updates.experience);
        }

        // Handle other stats (can change freely)
        if (updates.level !== undefined) newStats.level = updates.level;
        if (updates.health !== undefined) newStats.health = updates.health;
        if (updates.max_health !== undefined) newStats.max_health = updates.max_health;
        if (updates.build_tokens !== undefined) newStats.build_tokens = updates.build_tokens;
        if (updates.streak_tokens !== undefined) newStats.streak_tokens = updates.streak_tokens;
        if (updates.kingdom_expansions !== undefined) newStats.kingdom_expansions = updates.kingdom_expansions;
        if (updates.display_name !== undefined) newStats.display_name = updates.display_name;
        if (updates.title !== undefined) newStats.title = updates.title;

        // Save to local storage immediately
        this.saveToLocalStorage(newStats);

        // Queue for server sync
        this.queueSync(updates, source);

        // Broadcast update event
        window.dispatchEvent(new Event('character-stats-update'));


    }

    /**
     * Add to a specific stat (most common operation)
     */
    public addToStat(stat: keyof CharacterStats, amount: number, source: string = 'unknown'): void {
        const currentStats = this.getStats();
        const currentValue = (currentStats[stat] as number) || 0;
        const newValue = currentValue + amount;

        if ((stat === 'gold' || stat === 'experience') && amount < 0) {
            // Decrease check suppressed
        }

        // Ensure no negative values
        const safeValue = Math.max(0, newValue);

        this.updateStats({ [stat]: safeValue } as Partial<CharacterStats>, source);
    }

    /**
     * Fetch fresh stats from server and merge with local
     * Use this sparingly - only on page load or explicit refresh
     */
    public async fetchAndMerge(): Promise<CharacterStats> {
        try {
            const { fetchWithAuth } = await import('./fetchWithAuth');
            const response = await fetchWithAuth('/api/character-stats', {
                method: 'GET',
            });

            if (response.ok) {
                const result = await response.json();
                const serverStats = result.stats;

                if (serverStats) {
                    const localStats = this.getStats();

                    // Merge: local wins for progressive stats, server wins for others
                    const mergedStats: CharacterStats = {
                        gold: Math.max(serverStats.gold || 0, localStats.gold || 0),
                        experience: Math.max(serverStats.experience || 0, localStats.experience || 0),
                        level: Math.max(serverStats.level || 1, localStats.level || 1),
                        health: serverStats.health || 100,
                        max_health: serverStats.max_health || 100,
                        build_tokens: Math.max(serverStats.build_tokens || 0, localStats.build_tokens || 0),
                        streak_tokens: Math.max(serverStats.streak_tokens || 0, localStats.streak_tokens || 0),
                        kingdom_expansions: Math.max(serverStats.kingdom_expansions || 0, localStats.kingdom_expansions || 0),
                        display_name: serverStats.display_name || localStats.display_name || 'Adventurer',
                        title: serverStats.title || localStats.title || 'Novice',
                        updated_at: serverStats.updated_at
                    };

                    // If local is ahead, trigger a sync
                    if (mergedStats.gold > (serverStats.gold || 0) ||
                        mergedStats.experience > (serverStats.experience || 0)) {
                        console.log('[CharacterStatsService] Local stats ahead of server, syncing...');
                        this.saveToLocalStorage(mergedStats);
                        this.queueSync(mergedStats, 'fetch-and-merge');
                    } else {
                        this.saveToLocalStorage(mergedStats);
                    }

                    window.dispatchEvent(new Event('character-stats-update'));
                    return mergedStats;
                }
            }
        } catch (error) {
            console.error('[CharacterStatsService] Error fetching stats:', error);
        }

        return this.getStats();
    }

    /**
     * Queue stats for server sync (debounced and batched)
     */
    private queueSync(updates: Partial<CharacterStats>, source: string): void {
        this.syncQueue.push(updates);

        // Clear existing timer
        if (this.syncTimer) {
            clearTimeout(this.syncTimer);
        }

        // Schedule sync
        this.syncTimer = setTimeout(() => {
            this.performSync(source);
        }, this.SYNC_DEBOUNCE_MS);
    }

    /**
     * Perform actual server sync
     */
    private async performSync(source: string): Promise<void> {
        // Check rate limit
        const now = Date.now();
        if (now - this.lastSyncTime < this.MIN_SYNC_INTERVAL_MS) {
            console.log('[CharacterStatsService] Sync rate limited, will retry');
            // Reschedule
            this.syncTimer = setTimeout(() => this.performSync(source), this.MIN_SYNC_INTERVAL_MS);
            return;
        }

        if (this.isSyncing || this.syncQueue.length === 0) {
            return;
        }

        this.isSyncing = true;
        this.lastSyncTime = now;

        try {
            // Get current local stats (source of truth)
            const currentStats = this.getStats();

            // Prepare payload
            const payload = {
                stats: {
                    gold: currentStats.gold,
                    experience: currentStats.experience,
                    level: currentStats.level,
                    health: currentStats.health,
                    max_health: currentStats.max_health,
                    build_tokens: currentStats.build_tokens,
                    streak_tokens: currentStats.streak_tokens,
                    kingdom_expansions: currentStats.kingdom_expansions,
                    display_name: currentStats.display_name,
                    title: currentStats.title
                }
            };

            // Send to server
            const { fetchWithAuth } = await import('./fetchWithAuth');
            const response = await fetchWithAuth('/api/character-stats', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (response.ok) {

                // Clear queue
                this.syncQueue = [];
            } else {

            }
        } catch (error) {
            console.error('[CharacterStatsService] Sync error:', error);
        } finally {
            this.isSyncing = false;
        }
    }

    /**
     * Force immediate sync (use on page unload)
     */
    private flushSync(): void {
        if (this.syncTimer) {
            clearTimeout(this.syncTimer);
        }
        if (this.syncQueue.length > 0) {
            // Use synchronous XHR for unload (not ideal but necessary)
            const currentStats = this.getStats();
            const payload = JSON.stringify({ stats: currentStats });

            // This is a last resort - modern browsers may block this
            navigator.sendBeacon?.('/api/character-stats', payload);
        }
    }

    /**
     * Save to local storage
     */
    private saveToLocalStorage(stats: CharacterStats): void {
        const localStorageStats = {
            gold: stats.gold,
            experience: stats.experience,
            level: stats.level,
            health: stats.health,
            max_health: stats.max_health,
            build_tokens: stats.build_tokens,
            streak_tokens: stats.streak_tokens,
            display_name: stats.display_name,
            title: stats.title
        };

        setUserScopedItem('character-stats', JSON.stringify(localStorageStats));

        if (stats.kingdom_expansions !== undefined) {
            setUserScopedItem('kingdom-grid-expansions', String(stats.kingdom_expansions));
        }

        setUserScopedItem('character-stats-last-local-update', Date.now().toString());
    }

    /**
     * Get default stats
     */
    private getDefaultStats(): CharacterStats {
        return {
            gold: 500,
            experience: 0,
            level: 1,
            health: 100,
            max_health: 100,
            build_tokens: 0,
            streak_tokens: 0,
            kingdom_expansions: 0,
            display_name: 'Adventurer',
            title: 'Novice'
        };
    }
}

// Export singleton instance
export const characterStatsService = CharacterStatsService.getInstance();

// Export convenience functions (these are the ONLY functions that should be used)
export const getCharacterStats = () => characterStatsService.getStats();
export const updateCharacterStats = (updates: Partial<CharacterStats>, source?: string) =>
    characterStatsService.updateStats(updates, source);
export const addToCharacterStat = (stat: keyof CharacterStats, amount: number, source?: string) =>
    characterStatsService.addToStat(stat, amount, source);
export const fetchFreshCharacterStats = () => characterStatsService.fetchAndMerge();
