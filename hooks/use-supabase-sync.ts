'use client'

import { useEffect, useState } from 'react'
import { useUser } from '@clerk/nextjs'

export function useSupabaseSync() {
  const { user, isSignedIn } = useUser()
  const [isSyncing, setIsSyncing] = useState(false)
  const [lastSync, setLastSync] = useState<Date | null>(null)

  // Store Clerk user ID in localStorage for services
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
          // Sync is now handled by individual components using the new API endpoints
          console.log('Data sync handled by individual components')
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
    return undefined
  }, [isSignedIn, user?.id])

  // Sync on online/offline status change
  useEffect(() => {
    const handleOnline = () => {
      if (isSignedIn && user?.id) {
        console.log('Online status restored - sync handled by components')
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