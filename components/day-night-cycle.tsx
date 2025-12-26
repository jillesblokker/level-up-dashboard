"use client"

import { useEffect, useState } from "react"
import { Moon, Sun } from "lucide-react"
import { cn } from "@/lib/utils"

export function DayNightCycle() {
    const [isNight, setIsNight] = useState(false)
    const [mounted, setMounted] = useState(false)
    const [isEnabled, setIsEnabled] = useState(true)

    useEffect(() => {
        // Only run on client
        if (typeof window === 'undefined') return;

        setMounted(true)

        // Initial state from localStorage (after mount)
        const savedSetting = localStorage.getItem("day-night-cycle-enabled")
        if (savedSetting !== null) {
            setIsEnabled(savedSetting === "true")
        }

        const checkTime = () => {
            // Re-check setting on each interval
            const currentSetting = localStorage.getItem("day-night-cycle-enabled")
            const currentlyEnabled = currentSetting === null || currentSetting === "true"

            if (!currentlyEnabled) {
                document.documentElement.classList.remove('medieval-night')
                setIsNight(false)
                return
            }

            const hour = new Date().getHours()
            // Night is between 8 PM (20:00) and 6 AM (06:00)
            const nightTime = hour >= 20 || hour < 6
            setIsNight(nightTime)

            if (nightTime) {
                document.documentElement.classList.add('medieval-night')
            } else {
                document.documentElement.classList.remove('medieval-night')
            }
        }

        // Listen for immediate setting changes
        const handleSettingsChange = (e: any) => {
            if (e.detail && typeof e.detail.enabled === 'boolean') {
                setIsEnabled(e.detail.enabled)
                if (!e.detail.enabled) {
                    document.documentElement.classList.remove('medieval-night')
                } else {
                    checkTime() // Re-evaluate immediately if enabled
                }
            }
        }

        window.addEventListener('settings:dayNightChanged', handleSettingsChange)

        checkTime()
        const interval = setInterval(checkTime, 60000) // Check every minute
        return () => {
            clearInterval(interval)
            window.removeEventListener('settings:dayNightChanged', handleSettingsChange)
        }
    }, [])

    if (!mounted || !isEnabled) return null

    return (
        <div className={cn(
            "fixed top-4 right-4 lg:landscape:bottom-4 lg:landscape:left-4 lg:landscape:top-auto lg:landscape:right-auto z-50 p-2 rounded-full border transition-all duration-1000",
            isNight
                ? "bg-slate-900/80 border-slate-700 text-blue-200 shadow-[0_0_15px_rgba(59,130,246,0.5)]"
                : "bg-amber-100/80 border-amber-300 text-amber-600 shadow-[0_0_15px_rgba(245,158,11,0.5)]"
        )}>
            {isNight ? (
                <Moon className="w-5 h-5 animate-pulse" />
            ) : (
                <Sun className="w-5 h-5 animate-[spin_10s_linear_infinite]" />
            )}
        </div>
    )
}
