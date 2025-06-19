'use client'

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
      console.log('Supabase sync enabled for user')
      if (isSyncing) {
        console.log('Syncing data...')
      }
      if (lastSync) {
        console.log('Last sync:', lastSync.toLocaleString())
      }
    } else {
      console.log('Supabase sync disabled - user not signed in')
    }
  }, [isSignedIn, isSyncing, lastSync])

  return <>{children}</>
}
