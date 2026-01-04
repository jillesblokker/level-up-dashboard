"use client"

import { useCallback, useRef } from 'react'
import { useAuth } from '@clerk/nextjs'
import { toast } from '@/components/ui/use-toast'

/**
 * Hook to trigger achievement catch-up check
 * This will check the current state and unlock any achievements that should have been unlocked
 */
export function useAchievementCatchUp() {
    const { getToken, userId } = useAuth()
    const hasCheckedRef = useRef(false)

    const triggerCatchUp = useCallback(async (showToast = true) => {
        // Only run once per session
        if (hasCheckedRef.current || !userId) return null

        // Check localStorage to see if we've run catch-up recently (within last hour)
        const lastCatchUp = localStorage.getItem('achievement_catchup_last')
        if (lastCatchUp) {
            const lastTime = parseInt(lastCatchUp)
            const oneHourAgo = Date.now() - (60 * 60 * 1000)
            if (lastTime > oneHourAgo) {
                console.log('[Achievement Catch-Up] Skipping - ran recently')
                hasCheckedRef.current = true
                return null
            }
        }

        try {
            const token = await getToken({ template: 'supabase' })

            const response = await fetch('/api/achievements/catch-up', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            })

            if (!response.ok) {
                console.error('[Achievement Catch-Up] API error:', response.status)
                return null
            }

            const result = await response.json()
            console.log('[Achievement Catch-Up] Result:', result)

            // Update last catch-up time
            localStorage.setItem('achievement_catchup_last', Date.now().toString())
            hasCheckedRef.current = true

            // Show toast if achievements were unlocked
            if (showToast && result.newlyUnlocked && result.newlyUnlocked.length > 0) {
                toast({
                    title: "🏆 Achievements Unlocked!",
                    description: result.message,
                })
            }

            return result
        } catch (error) {
            console.error('[Achievement Catch-Up] Error:', error)
            return null
        }
    }, [userId, getToken])

    const forceCatchUp = useCallback(async () => {
        // Reset the check flag and localStorage to force a new check
        hasCheckedRef.current = false
        localStorage.removeItem('achievement_catchup_last')
        return triggerCatchUp(true)
    }, [triggerCatchUp])

    return {
        triggerCatchUp,
        forceCatchUp
    }
}
