"use client" import { logger } from "@/lib/logger"; import { useEffect } from 'react'
import { fetchFreshCharacterStats } from '@/lib/character-stats-service'
import { useAuth } from '@clerk/nextjs' export function CharacterStatsSync() { const { isSignedIn, isLoaded } = useAuth() useEffect(() => { if (isLoaded && isSignedIn) { logger.debug('[CharacterStatsSync] Fetching fresh stats on mount...') fetchFreshCharacterStats() .then(stats => { if (stats) { logger.debug('[CharacterStatsSync] Stats synced successfully:', stats.level) } }) .catch(err => logger.error('[CharacterStatsSync] Failed to sync stats:', err)) } }, [isLoaded, isSignedIn]) return null
}
