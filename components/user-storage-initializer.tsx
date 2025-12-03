"use client"

import { useEffect } from 'react';
import { useAuth, useUser } from '@clerk/nextjs';
import { setCurrentUserId, migrateLegacyData, cleanupLegacyData } from '@/lib/user-scoped-storage';

/**
 * Initializes user-scoped localStorage on auth state change
 * This component should be mounted in the root layout
 */
export function UserStorageInitializer() {
    const { userId, isLoaded } = useAuth();
    const { user } = useUser();

    useEffect(() => {
        if (!isLoaded) return;

        if (userId) {
            console.log('[UserStorageInitializer] User logged in:', userId);

            // Set the current user ID for scoped storage
            setCurrentUserId(userId);

            // Migrate legacy data to user-scoped keys
            // These are the critical keys that need to be user-specific
            const keysToMigrate = [
                'character-stats',
                'kingdom-grid',
                'kingdom-grid-expansions',
                'quest-progress',
                'challenge-progress',
                'milestone-progress',
                'tarot-last-draw-date',
                'tarot-active-card',
                'checked-quests',
                'quest-stats',
                'kingdom-inventory',
                'character-inventory',
                'kingdom-equipped-items',
                'active-potion-perks',
                'character-perks',
                'streaks',
                'property-timers',
                'achievements',
                'onboarding-state',
                'creature-store'  // Added to fix achievement leak
            ];

            migrateLegacyData(keysToMigrate);

            // ALWAYS cleanup legacy data after migration to prevent leaks to other users
            // This runs for every user login to ensure global keys are removed
            // Even if this user just migrated, we clean up to protect future users
            cleanupLegacyData(keysToMigrate);
        } else {
            console.log('[UserStorageInitializer] User logged out');

            // Clear the user ID
            setCurrentUserId(null);
        }
    }, [userId, isLoaded]);

    return null;
}
