"use client"

import { useEffect, useState, useRef } from "react"
import { useToast } from "@/components/ui/use-toast"
import { fetchWithAuth } from "@/lib/fetchWithAuth"
import { useAuth } from "@clerk/nextjs"

export function KingdomNotificationManager() {
    const { toast } = useToast()
    const { isSignedIn, isLoaded } = useAuth()
    const [readyCount, setReadyCount] = useState(0)
    const lastReadyCountRef = useRef(0)

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
                    let currentReadyCount = 0

                    timers.forEach((t: any) => {
                        const endTime = typeof t.end_time === 'string' ? new Date(t.end_time).getTime() : t.end_time
                        if (now >= endTime) {
                            currentReadyCount++
                        }
                    })

                    setReadyCount(currentReadyCount)

                    // Dispatch event for other components (like Navbar)
                    window.dispatchEvent(new CustomEvent('kingdom-buildings-ready', {
                        detail: { count: currentReadyCount }
                    }))

                    // Show toast if we went from 0 to some ready buildings
                    if (lastReadyCountRef.current === 0 && currentReadyCount > 0) {
                        toast({
                            title: "Kingdom Resources Ready!",
                            description: `${currentReadyCount} building${currentReadyCount > 1 ? 's are' : ' is'} ready to collect in your Kingdom.`,
                            duration: 5000,
                        })
                    }

                    lastReadyCountRef.current = currentReadyCount
                }
            } catch (error) {
                console.error("Error checking kingdom timers:", error)
            }
        }

        // Check immediately
        checkTimers()

        // Check every 60 seconds
        const interval = setInterval(checkTimers, 60000)

        return () => clearInterval(interval)
    }, [isLoaded, isSignedIn, toast])

    return null // This component doesn't render anything visible itself
}
