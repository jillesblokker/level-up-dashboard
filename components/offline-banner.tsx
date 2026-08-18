"use client"

import { useEffect, useState } from 'react'
import { Wifi, WifiOff } from 'lucide-react'

/**
 * OfflineBanner — shows a minimal status strip when the device loses internet.
 * Automatically hides when reconnected (after a brief "syncing" flash).
 * Designed to never obscure critical content — sits below the top nav bar.
 */
export function OfflineBanner() {
  const [isOnline, setIsOnline] = useState(true)
  const [showReconnected, setShowReconnected] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    setIsOnline(navigator.onLine)

    const handleOffline = () => {
      setIsOnline(false)
      setShowReconnected(false)
    }

    const handleOnline = () => {
      setIsOnline(true)
      setShowReconnected(true)
      // Auto-hide the "reconnected" message after 3 seconds
      const timer = setTimeout(() => setShowReconnected(false), 3000)
      return () => clearTimeout(timer)
    }

    window.addEventListener('offline', handleOffline)
    window.addEventListener('online', handleOnline)

    return () => {
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('online', handleOnline)
    }
  }, [])

  if (!mounted) return null

  // Offline state — persistent warning strip
  if (!isOnline) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="fixed top-14 left-0 right-0 z-50 flex items-center justify-center gap-2 bg-amber-950/95 border-b border-amber-700/60 text-amber-200 text-xs font-semibold py-2 px-4 backdrop-blur-sm shadow-lg"
      >
        <WifiOff className="w-3.5 h-3.5 shrink-0 text-amber-400" />
        <span>Working offline — changes saved locally and will sync when reconnected</span>
      </div>
    )
  }

  // Briefly show reconnection confirmation
  if (showReconnected) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="fixed top-14 left-0 right-0 z-50 flex items-center justify-center gap-2 bg-emerald-950/95 border-b border-emerald-700/60 text-emerald-200 text-xs font-semibold py-2 px-4 backdrop-blur-sm shadow-lg animate-in fade-in-0 slide-in-from-top-1 duration-300"
      >
        <Wifi className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
        <span>Reconnected! Syncing your progress to the kingdom cloud...</span>
      </div>
    )
  }

  return null
}
