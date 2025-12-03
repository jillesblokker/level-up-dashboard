/**
 * User-Scoped LocalStorage Utility
 * 
 * This ensures that localStorage keys are scoped to the current user,
 * preventing data conflicts when multiple users use the same browser.
 */

import { auth } from '@clerk/nextjs/server';

// Client-side user ID cache
let cachedUserId: string | null = null;

/**
 * Gets the current user ID (client-side only)
 */
export function getCurrentUserId(): string | null {
    if (typeof window === 'undefined') return null;

    // Return cached value if available
    if (cachedUserId) return cachedUserId;

    // Try to get from Clerk's client-side state
    try {
        // Check if Clerk is loaded
        const clerkLoaded = (window as any).__clerk_loaded;
        if (clerkLoaded) {
            const userId = (window as any).Clerk?.user?.id;
            if (userId) {
                cachedUserId = userId;
                return userId;
            }
        }
    } catch (e) {
        // Clerk not available yet
    }

    // Fallback: check if we have a stored user ID from a previous session
    try {
        const storedUserId = localStorage.getItem('__current_user_id');
        if (storedUserId) {
            cachedUserId = storedUserId;
            return storedUserId;
        }
    } catch (e) {
        console.warn('[User-Scoped Storage] Failed to get stored user ID:', e);
    }

    return null;
}

/**
 * Sets the current user ID (should be called on auth state change)
 */
export function setCurrentUserId(userId: string | null): void {
    if (typeof window === 'undefined') return;

    cachedUserId = userId;

    if (userId) {
        try {
            localStorage.setItem('__current_user_id', userId);
        } catch (e) {
            console.warn('[User-Scoped Storage] Failed to store user ID:', e);
        }
    } else {
        try {
            localStorage.removeItem('__current_user_id');
        } catch (e) {
            console.warn('[User-Scoped Storage] Failed to remove user ID:', e);
        }
    }
}

/**
 * Gets a user-scoped localStorage key
 */
export function getUserScopedKey(baseKey: string): string {
    const userId = getCurrentUserId();

    // If no user ID, use the base key (for backward compatibility during migration)
    if (!userId) {
        return baseKey;
    }

    return `user_${userId}_${baseKey}`;
}

/**
 * Gets an item from user-scoped localStorage
 */
export function getUserScopedItem(baseKey: string): string | null {
    if (typeof window === 'undefined') return null;

    const scopedKey = getUserScopedKey(baseKey);

    try {
        // Try to get user-scoped value first
        const scopedValue = localStorage.getItem(scopedKey);
        if (scopedValue !== null) {
            return scopedValue;
        }

        // REMOVED: Lazy migration fallback. 
        // We now rely solely on UserStorageInitializer to handle migration.
        // This prevents data leaking from one user to another via global keys.

        return null;
    } catch (e) {
        console.warn(`[User-Scoped Storage] Failed to get ${baseKey}:`, e);
        return null;
    }
}

/**
 * Sets an item in user-scoped localStorage
 */
export function setUserScopedItem(baseKey: string, value: string): void {
    if (typeof window === 'undefined') return;

    const scopedKey = getUserScopedKey(baseKey);

    try {
        localStorage.setItem(scopedKey, value);
    } catch (e) {
        console.warn(`[User-Scoped Storage] Failed to set ${baseKey}:`, e);
    }
}

/**
 * Removes an item from user-scoped localStorage
 */
export function removeUserScopedItem(baseKey: string): void {
    if (typeof window === 'undefined') return;

    const scopedKey = getUserScopedKey(baseKey);

    try {
        localStorage.removeItem(scopedKey);
    } catch (e) {
        console.warn(`[User-Scoped Storage] Failed to remove ${baseKey}:`, e);
    }
}

/**
 * Clears all user-scoped data for the current user
 */
export function clearUserScopedData(): void {
    if (typeof window === 'undefined') return;

    const userId = getCurrentUserId();
    if (!userId) return;

    const prefix = `user_${userId}_`;
    const keysToRemove: string[] = [];

    try {
        // Find all keys for this user
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(prefix)) {
                keysToRemove.push(key);
            }
        }

        // Remove them
        keysToRemove.forEach(key => localStorage.removeItem(key));

        console.log(`[User-Scoped Storage] Cleared ${keysToRemove.length} items for user ${userId}`);
    } catch (e) {
        console.warn('[User-Scoped Storage] Failed to clear user data:', e);
    }
}

/**
 * Migrates legacy localStorage data to user-scoped keys
 * Should be called once on app initialization
 */
export function migrateLegacyData(keysToMigrate: string[]): void {
    if (typeof window === 'undefined') return;

    const userId = getCurrentUserId();
    if (!userId) {
        console.log('[User-Scoped Storage] No user ID, skipping migration');
        return;
    }

    const migrationKey = `__migration_complete_${userId}`;

    // Check if migration already done for this user
    if (localStorage.getItem(migrationKey)) {
        return;
    }

    console.log('[User-Scoped Storage] Starting legacy data migration...');

    let migratedCount = 0;

    keysToMigrate.forEach(baseKey => {
        try {
            const legacyValue = localStorage.getItem(baseKey);
            if (legacyValue !== null) {
                const scopedKey = `user_${userId}_${baseKey}`;

                // Only migrate if scoped key doesn't exist
                if (!localStorage.getItem(scopedKey)) {
                    localStorage.setItem(scopedKey, legacyValue);
                    migratedCount++;
                    console.log(`[User-Scoped Storage] Migrated: ${baseKey} → ${scopedKey}`);

                    // IMPORTANT: Remove the legacy key to prevent it from leaking to other users
                    // This ensures "Clean Slate" for subsequent users
                    localStorage.removeItem(baseKey);
                }
            }
        } catch (e) {
            console.warn(`[User-Scoped Storage] Failed to migrate ${baseKey}:`, e);
        }
    });

    // Mark migration as complete
    localStorage.setItem(migrationKey, 'true');

    console.log(`[User-Scoped Storage] Migration complete. Migrated ${migratedCount} items.`);
}

/**
 * Force cleanup of legacy data (useful for fixing data leaks)
 */
export function cleanupLegacyData(keysToClean: string[]): void {
    if (typeof window === 'undefined') return;

    console.log('[User-Scoped Storage] Cleaning up legacy global keys...');
    let cleanedCount = 0;

    keysToClean.forEach(key => {
        if (localStorage.getItem(key) !== null) {
            localStorage.removeItem(key);
            cleanedCount++;
        }
    });

    console.log(`[User-Scoped Storage] Cleanup complete. Removed ${cleanedCount} legacy items.`);
}
