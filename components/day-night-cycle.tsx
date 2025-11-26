"use client"

import { useEffect, useState } from "react"
import { Moon, Sun } from "lucide-react"
import { cn } from "@/lib/utils"

export function DayNightCycle() {
    const [isNight, setIsNight] = useState(false)
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
        const checkTime = () => {
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

        checkTime()
        const interval = setInterval(checkTime, 60000) // Check every minute
        return () => clearInterval(interval)
    }, [])

    if (!mounted) return null

    return (
        <div className={cn(
            "fixed top-4 left-4 z-50 p-2 rounded-full border transition-all duration-1000",
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
