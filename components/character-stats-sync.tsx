"use client"

import { useEffect } from 'react'
import { fetchFreshCharacterStats } from '@/lib/character-stats-manager'
import { useAuth } from '@clerk/nextjs'

export function CharacterStatsSync() {
    const { isSignedIn, isLoaded } = useAuth()

    useEffect(() => {
        if (isLoaded && isSignedIn) {
            console.log('[CharacterStatsSync] Fetching fresh stats on mount...')
            fetchFreshCharacterStats('background-sync')
                .then(stats => {
                    if (stats) {
                        console.log('[CharacterStatsSync] Stats synced successfully:', stats.level)
                    }
                })
                .catch(err => console.error('[CharacterStatsSync] Failed to sync stats:', err))
        }
    }, [isLoaded, isSignedIn])

    return null
}
