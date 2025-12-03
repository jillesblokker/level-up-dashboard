"use client"

import { useEffect } from 'react';
import { useAuth, useUser } from '@clerk/nextjs';
import { setCurrentUserId, migrateLegacyData } from '@/lib/user-scoped-storage';

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
                'onboarding-state'
            ];

            migrateLegacyData(keysToMigrate);
        } else {
            console.log('[UserStorageInitializer] User logged out');

            // Clear the user ID
            setCurrentUserId(null);
        }
    }, [userId, isLoaded]);

    return null;
}
