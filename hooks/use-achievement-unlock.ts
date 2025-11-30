"use client"

import { useAuth } from '@clerk/nextjs'
import { useCallback } from 'react'
import { toast } from '@/components/ui/use-toast'

interface AchievementUnlockOptions {
    achievementId: string
    achievementName: string
    description?: string
    onSuccess?: () => void
    onError?: (error: Error) => void
}

/**
 * Custom hook for managing achievement unlocks with persistent storage
 * Ensures achievements are only unlocked once per user across sessions
 */
export function useAchievementUnlock() {
    const { getToken, userId } = useAuth()

    /**
     * Unlock an achievement if it hasn't been unlocked before
     * Uses localStorage to persist unlock status across sessions
     */
    const unlockAchievement = useCallback(
        async ({
            achievementId,
            achievementName,
            description,
            onSuccess,
            onError,
        }: AchievementUnlockOptions) => {
            if (!userId) {
                console.warn('[Achievement Unlock] No user ID available')
                return false
            }

            const storageKey = `unlocked_${achievementId}`

            // Check if already unlocked
            if (localStorage.getItem(storageKey)) {
                console.log(`[Achievement Unlock] Achievement ${achievementId} already unlocked`)
                return false
            }

            // Mark as unlocked immediately to prevent duplicate calls
            localStorage.setItem(storageKey, 'true')

            try {
                const token = await getToken({ template: 'supabase' })

                console.log(`[Achievement Unlock] Attempting to unlock achievement ${achievementId}`)

                const response = await fetch('/api/achievements/unlock', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                    body: JSON.stringify({ achievementId }),
                })

                if (response.ok) {
                    const result = await response.json()
                    console.log(`[Achievement Unlock] ✅ Successfully unlocked achievement ${achievementId}:`, result)

                    // Show toast notification
                    toast({
                        title: "New achievement",
                        description: description || `${achievementName} - Achievement unlocked!`,
                    })

                    onSuccess?.()
                    return true
                } else {
                    const error = await response.json()
                    console.error(`[Achievement Unlock] ❌ Failed to unlock achievement ${achievementId}:`, error)

                    // Remove the storage flag so it can be retried
                    localStorage.removeItem(storageKey)

                    toast({
                        title: "Error",
                        description: `Could not unlock the ${achievementName} achievement. Please try again later.`,
                        variant: "destructive",
                    })

                    onError?.(new Error(error.message || 'Failed to unlock achievement'))
                    return false
                }
            } catch (error) {
                console.error(`[Achievement Unlock] ❌ Error unlocking achievement ${achievementId}:`, error)

                // Remove the storage flag so it can be retried
                localStorage.removeItem(storageKey)

                onError?.(error as Error)
                return false
            }
        },
        [userId, getToken]
    )

    /**
     * Check if an achievement has been unlocked
     */
    const isAchievementUnlocked = useCallback((achievementId: string): boolean => {
        return localStorage.getItem(`unlocked_${achievementId}`) === 'true'
    }, [])

    /**
     * Clear unlock status for an achievement (useful for testing)
     */
    const clearAchievementUnlock = useCallback((achievementId: string) => {
        localStorage.removeItem(`unlocked_${achievementId}`)
    }, [])

    return {
        unlockAchievement,
        isAchievementUnlocked,
        clearAchievementUnlock,
    }
}
