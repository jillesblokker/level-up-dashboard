'use client'

import { useEffect, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { SyncService } from '@/lib/supabase-services'

export function useSupabaseSync() {
  const { user, isSignedIn } = useUser()
  const [isSyncing, setIsSyncing] = useState(false)
  const [lastSync, setLastSync] = useState<Date | null>(null)

  // Store Clerk user ID in localStorage for Supabase services
  useEffect(() => {
    if (user?.id && typeof window !== 'undefined') {
      localStorage.setItem('clerk-user-id', user.id)
    }
  }, [user?.id])

  // Sync data when user signs in
  useEffect(() => {
    if (isSignedIn && user?.id) {
      const syncData = async () => {
        setIsSyncing(true)
        try {
          await SyncService.syncAllData()
          setLastSync(new Date())
        } catch (error) {
          console.error('Sync failed:', error)
        } finally {
          setIsSyncing(false)
        }
      }

      // Initial sync
      syncData()

      // Set up periodic sync (every 5 minutes)
      const interval = setInterval(syncData, 5 * 60 * 1000)

      return () => clearInterval(interval)
    }
  }, [isSignedIn, user?.id])

  // Sync on online/offline status change
  useEffect(() => {
    const handleOnline = () => {
      if (isSignedIn && user?.id) {
        SyncService.syncAllData()
      }
    }

    window.addEventListener('online', handleOnline)
    return () => window.removeEventListener('online', handleOnline)
  }, [isSignedIn, user?.id])

  return {
    isSyncing,
    lastSync,
    isSignedIn,
    userId: user?.id
  }
} 