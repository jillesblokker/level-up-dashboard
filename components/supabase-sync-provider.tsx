'use client'

import { logger } from "@/lib/logger";

import { useSupabaseSync } from '@/hooks/use-supabase-sync'
import { useEffect } from 'react'

interface SupabaseSyncProviderProps {
  children: React.ReactNode
}

export function SupabaseSyncProvider({ children }: SupabaseSyncProviderProps) {
  const { isSyncing, lastSync, isSignedIn } = useSupabaseSync()

  // Log sync status for debugging
  useEffect(() => {
    if (isSignedIn) {
      logger.debug('Supabase sync enabled for user')
      if (isSyncing) {
        logger.debug('Syncing data...')
      }
      if (lastSync) {
        logger.debug('Last sync:', lastSync.toLocaleString())
      }
    } else {
      logger.debug('Supabase sync disabled - user not signed in')
    }
  }, [isSignedIn, isSyncing, lastSync])

  return <>{children}</>
}
