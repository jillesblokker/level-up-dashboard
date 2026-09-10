"use client"

import { useEffect, useState } from "react"
import { Moon, Sun } from "lucide-react"
import { cn } from "@/lib/utils"
import { CollectibleRune } from "@/components/runes/collectible-rune"

export function DayNightCycle() {
    const [isNight, setIsNight] = useState(false)
    const [mounted, setMounted] = useState(false)
    const [isEnabled, setIsEnabled] = useState(true)
    const [isScrolledDown, setIsScrolledDown] = useState(false)

    useEffect(() => {
        let lastScrollY = typeof window !== 'undefined' ? window.scrollY : 0;
        const handleScroll = () => {
            if (typeof window === 'undefined' || window.innerWidth >= 640) {
                setIsScrolledDown(false);
                return;
            }
            const currentScrollY = window.scrollY;
            if (currentScrollY > 80 && currentScrollY > lastScrollY) {
                setIsScrolledDown(true);
            } else if (currentScrollY < lastScrollY || currentScrollY <= 40) {
                setIsScrolledDown(false);
            }
            lastScrollY = currentScrollY;
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        // Only run on client
        if (typeof window === 'undefined') return;

        setMounted(true)

        // Initial state from localStorage (after mount)
        const savedSetting = localStorage.getItem("day-night-cycle-enabled")
        if (savedSetting !== null) {
            const enabled = savedSetting === "true";
            setIsEnabled(enabled);
            if (!enabled) {
                document.documentElement.classList.remove('medieval-night');
                document.body.classList.remove('medieval-night');
            }
        }

        const updateThemeColor = (night: boolean) => {
            const color = night ? '#0b1329' : '#f59e0b';
            const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
            if (meta) meta.setAttribute('content', color);
        }

        const checkTime = () => {
            // Re-check setting on each interval
            const currentSetting = localStorage.getItem("day-night-cycle-enabled")
            const currentlyEnabled = currentSetting === null || currentSetting === "true"

            if (!currentlyEnabled) {
                document.documentElement.classList.remove('medieval-night')
                document.body.classList.remove('medieval-night')
                setIsNight(false)
                return
            }

            const hour = new Date().getHours()
            // Night is between 8 PM (20:00) and 6 AM (06:00)
            const nightTime = hour >= 20 || hour < 6
            setIsNight(nightTime)

            if (nightTime) {
                document.documentElement.classList.add('medieval-night')
                updateThemeColor(true)
            } else {
                document.documentElement.classList.remove('medieval-night')
                document.body.classList.remove('medieval-night')
                updateThemeColor(false)
            }
        }

        // Listen for immediate setting changes
        const handleSettingsChange = (e: any) => {
            if (e.detail && typeof e.detail.enabled === 'boolean') {
                setIsEnabled(e.detail.enabled)
                if (!e.detail.enabled) {
                    document.documentElement.classList.remove('medieval-night')
                    document.body.classList.remove('medieval-night')
                    updateThemeColor(false) // Reset to day color when disabled
                } else {
                    checkTime() // Re-evaluate immediately if enabled
                }
            }
        }

        let interval: NodeJS.Timeout | null = null;

        const startInterval = () => {
            stopInterval();
            checkTime();
            interval = setInterval(checkTime, 60000); // Check every minute
        }

        const stopInterval = () => {
            if (interval) clearInterval(interval);
            interval = null;
        }

        const handleVisibilityChange = () => {
            if (document.hidden) {
                stopInterval();
            } else {
                startInterval();
            }
        };

        window.addEventListener('settings:dayNightChanged', handleSettingsChange)
        document.addEventListener('visibilitychange', handleVisibilityChange);

        startInterval();

        return () => {
            stopInterval();
            window.removeEventListener('settings:dayNightChanged', handleSettingsChange)
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        }
    }, [])

    if (!mounted || !isEnabled) return null

    return (
        <div className={cn(
            "fixed top-4 right-4 lg:landscape:bottom-4 lg:landscape:left-4 lg:landscape:top-auto lg:landscape:right-auto z-50 p-2 rounded-full border transition-all duration-300",
            isScrolledDown ? "opacity-0 -translate-y-12 pointer-events-none sm:opacity-100 sm:translate-y-0 sm:pointer-events-auto" : "opacity-100 translate-y-0",
            isNight
                ? "bg-zinc-900 border-zinc-700 text-blue-200 shadow-[0_0_15px_rgba(59,130,246,0.5)]"
                : "bg-amber-100/80 border-amber-300 text-amber-600 shadow-[0_0_15px_rgba(245,158,11,0.5)]"
        )}>
            {isNight ? (
                <Moon className="w-5 h-5 animate-pulse" />
            ) : (
                <Sun className="w-5 h-5 animate-[spin_10s_linear_infinite] will-change-transform transform-gpu" />
            )}
            <CollectibleRune
                id="hagalaz_weather"
                runeId="hagalaz"
                symbol="ᚺ"
                name="Hagalaz"
                meaning="Atmospheric upheaval, hail, and elemental transformation"
                className="ml-1 text-xs"
            />
        </div>
    )
}
