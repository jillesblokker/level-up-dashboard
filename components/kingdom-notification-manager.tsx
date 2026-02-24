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
    const [unreadNotifications, setUnreadNotifications] = useState<any[]>([])
    const toastedNotificationIds = useRef<Set<string>>(new Set())
    const { sendNotification, permission } = useNotifications()

    // Poll for timer updates and social notifications
    useEffect(() => {
        if (!isLoaded || !isSignedIn) return

        let timerInterval: NodeJS.Timeout | null = null;
        let notifInterval: NodeJS.Timeout | null = null;

        const checkTimers = async () => {
            // Don't poll if the tab is hidden to save Vercel limits
            if (document.hidden) return;

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

        const checkSocialNotifications = async () => {
            // Don't poll if the tab is hidden to save Vercel limits
            if (document.hidden) return;

            try {
                const res = await fetchWithAuth('/api/notifications', { method: 'GET' })
                if (res && res.ok) {
                    const json = await res.json()
                    const notifications = json?.notifications || []
                    const unread = notifications.filter((n: any) => !n.is_read)

                    setUnreadNotifications(unread)

                    unread.forEach((n: any) => {
                        if (!toastedNotificationIds.current.has(n.id)) {
                            toastedNotificationIds.current.add(n.id)

                            // Determine content based on type
                            let title = "New Notification"
                            let body = "You have a new activity in the realm."

                            if (n.type === 'quest_received') {
                                title = "New Quest Received! 📜"
                                body = `${n.data?.senderName || 'An ally'} sent you a quest: ${n.data?.questName}`
                            } else if (n.type === 'quest_completed_ally') {
                                title = "Quest Completed! ✨"
                                body = `${n.data?.senderName || 'An ally'} completed the quest you sent!`
                            }

                            toast({
                                title,
                                description: body,
                                duration: 8000,
                            })

                            if (document.hidden && permission === 'granted') {
                                sendNotification(title, {
                                    body,
                                    tag: `notif-${n.id}`,
                                    icon: '/icons/icon-192x192.png'
                                })
                            }
                        }
                    })
                }
            } catch (error) {
                console.error("[KingdomNotifications] Error checking social notifications:", error)
            }
        }

        const startPolling = () => {
            stopPolling();
            // Check immediately when starting
            checkTimers();
            checkSocialNotifications();
            // Check timers every 60 seconds (was 10s), notifications every 120 seconds (was 30s)
            timerInterval = setInterval(checkTimers, 60000);
            notifInterval = setInterval(checkSocialNotifications, 120000);
        };

        const stopPolling = () => {
            if (timerInterval) clearInterval(timerInterval);
            if (notifInterval) clearInterval(notifInterval);
            timerInterval = null;
            notifInterval = null;
        };

        const handleVisibilityChange = () => {
            if (document.hidden) {
                stopPolling();
            } else {
                startPolling();
            }
        };

        // Initial start
        startPolling();

        document.addEventListener('visibilitychange', handleVisibilityChange);

        // Listen for collection events to update immediately
        const handleCollection = () => {
            setTimeout(checkTimers, 500)
        }

        window.addEventListener('kingdom-building-collected', handleCollection)

        return () => {
            stopPolling();
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('kingdom-building-collected', handleCollection)
        }
    }, [isLoaded, isSignedIn, toast, permission, sendNotification])

    return null
}
