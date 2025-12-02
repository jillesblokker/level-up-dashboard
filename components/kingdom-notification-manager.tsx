"use client"

import { useEffect, useState, useRef } from "react"
import { useToast } from "@/components/ui/use-toast"
import { fetchWithAuth } from "@/lib/fetchWithAuth"
import { useAuth } from "@clerk/nextjs"
import { useNotifications } from "@/hooks/use-notifications"

export function KingdomNotificationManager() {
    const { toast } = useToast()
    const { isSignedIn, isLoaded } = useAuth()
    const [readyCount, setReadyCount] = useState(0)
    const lastReadyCountRef = useRef(0)
    const { sendNotification, permission } = useNotifications()

    // Poll for timer updates
    useEffect(() => {
        if (!isLoaded || !isSignedIn) return

        const checkTimers = async () => {
            try {
                // Fetch timers from API
                const res = await fetchWithAuth('/api/property-timers', { method: 'GET' })
                if (res && res.ok) {
                    const json = await res.json()
                    const timers = json?.data || []

                    const now = Date.now()
                    const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000)
                    let currentReadyCount = 0

                    timers.forEach((t: any) => {
                        const endTime = typeof t.end_time === 'string' ? new Date(t.end_time).getTime() : t.end_time
                        const isReady = now >= endTime
                        const isStale = endTime < thirtyDaysAgo

                        if (isReady && !isStale) {
                            currentReadyCount++
                        }
                    })

                    setReadyCount(currentReadyCount)

                    window.dispatchEvent(new CustomEvent('kingdom-buildings-ready', {
                        detail: { count: currentReadyCount }
                    }))

                    // Show toast and notification if we went from 0 to some ready buildings
                    if (lastReadyCountRef.current === 0 && currentReadyCount > 0) {
                        toast({
                            title: "Kingdom Resources Ready!",
                            description: `${currentReadyCount} building${currentReadyCount > 1 ? 's are' : ' is'} ready to collect in your Kingdom.`,
                            duration: 5000,
                        })

                        // Send system notification if app is hidden
                        if (document.hidden && permission === 'granted') {
                            sendNotification("Kingdom Resources Ready!", {
                                body: `${currentReadyCount} building${currentReadyCount > 1 ? 's are' : ' is'} ready to collect.`,
                                tag: 'kingdom-resources'
                            })
                        }
                    }

                    lastReadyCountRef.current = currentReadyCount
                }
            } catch (error) {
                console.error("[KingdomNotifications] Error checking kingdom timers:", error)
            }
        }

        // Check immediately
        checkTimers()

        // Check every 10 seconds for more responsive updates
        const interval = setInterval(checkTimers, 10000)

        // Listen for collection events to update immediately
        const handleCollection = () => {
            // Wait a moment for the API to update, then check
            setTimeout(checkTimers, 500)
        }

        window.addEventListener('kingdom-building-collected', handleCollection)

        return () => {
            clearInterval(interval)
            window.removeEventListener('kingdom-building-collected', handleCollection)
        }
    }, [isLoaded, isSignedIn, toast, permission, sendNotification])

    return null
}
