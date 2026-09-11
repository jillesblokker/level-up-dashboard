"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Crown, Compass, MapIcon, User, Users, LayoutGrid, X, Trophy, Shield, Sword, ShoppingBag, Sun, Ship, BookOpen, Globe, Bell, Settings } from "lucide-react"
import { cn } from "@/lib/utils"
import { notificationService } from "@/lib/notification-service"
import { useState, useEffect } from "react"
import { useNavigationAudio } from "@/components/audio-provider"
import { useHaptics, HapticPatterns } from "@/lib/haptics"

export function BottomNav() {
    const pathname = usePathname()
    const router = useRouter()
    const [unreadCount, setUnreadCount] = useState(0)
    const [isMoreOpen, setIsMoreOpen] = useState(false)
    const [touchStartY, setTouchStartY] = useState<number | null>(null)
    const [dragOffset, setDragOffset] = useState(0)
    const { onPageChange } = useNavigationAudio()
    const { trigger } = useHaptics()

    useEffect(() => {
        // Initial count
        setUnreadCount(notificationService.getUnreadCount())

        // Listen for new notifications
        const handleNewNotification = () => {
            setUnreadCount(notificationService.getUnreadCount())
        }

        window.addEventListener('newNotification', handleNewNotification)
        window.addEventListener('storage', handleNewNotification)

        return () => {
            window.removeEventListener('newNotification', handleNewNotification)
            window.removeEventListener('storage', handleNewNotification)
        }
    }, [])

    // Close sheet upon route change
    useEffect(() => {
        setIsMoreOpen(false)
        setDragOffset(0)
    }, [pathname])

    const primaryNavItems = [
        { href: "/kingdom", label: "Kingdom", icon: Crown },
        { href: "/quests", label: "Tasks", icon: Compass },
        { href: "/realm", label: "Realm", icon: MapIcon },
        { href: "/social", label: "Tavern", icon: Users },
        { href: "/profile", label: "Profile", icon: User },
    ]

    const secondaryDestinations = [
        { href: "/achievements", label: "Achievements & runes", desc: "Codex, trophies & cards", icon: Trophy, color: "text-yellow-400 border-yellow-500/30 bg-yellow-950/40" },
        { href: "/character", label: "Hero character vault", desc: "Equipment, pets & stats", icon: Shield, color: "text-amber-400 border-amber-500/30 bg-amber-950/40" },
        { href: "/dungeon", label: "Dungeon keep", desc: "3v3 elemental battles", icon: Sword, color: "text-purple-400 border-purple-500/30 bg-purple-950/40" },
        { href: "/market", label: "Royal market & bazaar", desc: "Trading post & mystery packs", icon: ShoppingBag, color: "text-emerald-400 border-emerald-500/30 bg-emerald-950/40" },
        { href: "/daily-hub", label: "Daily habit hub", desc: "Morning focus & streak", icon: Sun, color: "text-amber-300 border-amber-500/30 bg-amber-950/40" },
        { href: "/kingdom?tab=airship", label: "Airship harbor", desc: "Habit ether voyages", icon: Ship, color: "text-cyan-400 border-cyan-500/30 bg-cyan-950/40" },
        { href: "/tales", label: "Tales & chronicle", desc: "Stories, archives & journal", icon: BookOpen, color: "text-blue-400 border-blue-500/30 bg-blue-950/40" },
        { href: "/worldmap", label: "World map", desc: "Observatory & provinces", icon: Globe, color: "text-indigo-400 border-indigo-500/30 bg-indigo-950/40" },
        { href: "/notifications", label: "Action notifications", desc: "Dares, raids & alerts", icon: Bell, color: "text-red-400 border-red-500/30 bg-red-950/40", badge: unreadCount > 0 ? unreadCount : undefined },
        { href: "/settings", label: "Settings & audio", desc: "Preferences & controls", icon: Settings, color: "text-zinc-400 border-zinc-500/30 bg-zinc-900/60" },
    ]

    const secondaryPaths: string[] = secondaryDestinations.map(d => d.href.split('?')[0] || '')
    const isSecondaryActive = !!pathname && secondaryPaths.some(path => path !== '' && pathname.startsWith(path))

    const handleTouchStart = (e: React.TouchEvent) => {
        if (e.touches && e.touches[0]) {
            setTouchStartY(e.touches[0].clientY)
        }
    }

    const handleTouchMove = (e: React.TouchEvent) => {
        if (touchStartY === null || !e.touches || !e.touches[0]) return
        const currentY = e.touches[0].clientY
        const diff = currentY - touchStartY
        if (diff > 0) {
            setDragOffset(diff)
        }
    }

    const handleTouchEnd = () => {
        if (dragOffset > 70) {
            setIsMoreOpen(false)
        }
        setDragOffset(0)
        setTouchStartY(null)
    }

    return (
        <>
            {/* Realm Navigator Bottom Sheet Modal */}
            {isMoreOpen && (
                <div
                    className="lg:landscape:hidden fixed inset-0 z-50 flex items-end justify-center bg-black/80 backdrop-blur-sm animate-fadeIn"
                    onClick={() => setIsMoreOpen(false)}
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        onTouchStart={handleTouchStart}
                        onTouchMove={handleTouchMove}
                        onTouchEnd={handleTouchEnd}
                        style={{
                            transform: dragOffset > 0 ? `translateY(${dragOffset}px)` : undefined,
                            transition: dragOffset === 0 ? 'transform 0.2s ease-out' : 'none'
                        }}
                        className="w-full max-w-lg bg-zinc-950 border-t-2 border-amber-500/60 shadow-[0_-16px_48px_rgba(0,0,0,0.95)] rounded-t-3xl p-4 sm:p-5 text-white flex flex-col gap-3.5 max-h-[85dvh] overflow-y-auto pb-[calc(env(safe-area-inset-bottom,0px)+5.5rem)] animate-slideUp"
                    >
                        {/* iOS-Style Top Drag Handle Bar */}
                        <div className="w-12 h-1.5 bg-amber-500/40 rounded-full mx-auto cursor-grab active:cursor-grabbing mb-0.5" />

                        {/* Modal Header */}
                        <div className="flex items-center justify-between pb-2.5 border-b border-zinc-800">
                            <div className="flex items-center gap-2">
                                <span className="text-xl">🧭</span>
                                <div>
                                    <h3 className="font-serif font-bold text-base text-amber-300 leading-none">
                                        Realm destinations
                                    </h3>
                                    <p className="text-[11px] text-zinc-400 mt-0.5">
                                        Fast travel to any kingdom district
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsMoreOpen(false)}
                                className="p-1.5 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
                                aria-label="Close destinations menu"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Destinations Grid */}
                        <div className="grid grid-cols-2 gap-2.5 pt-1">
                            {secondaryDestinations.map((dest) => {
                                const Icon = dest.icon
                                const active = !!pathname && pathname.startsWith(dest.href.split('?')[0] || '')
                                return (
                                    <button
                                        key={dest.href}
                                        type="button"
                                        onClick={() => {
                                            onPageChange()
                                            trigger(HapticPatterns.tabSwitch)
                                            setIsMoreOpen(false)
                                            router.push(dest.href)
                                        }}
                                        className={cn(
                                            "flex items-start gap-2.5 p-2.5 rounded-xl border text-left transition-all active:scale-95 touch-manipulation relative group",
                                            active
                                                ? "bg-amber-950/80 border-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.25)]"
                                                : "bg-zinc-900/90 border-zinc-800 hover:border-amber-700/60 hover:bg-zinc-900"
                                        )}
                                    >
                                        <div className={cn("p-1.5 rounded-lg border shrink-0 mt-0.5", dest.color)}>
                                            <Icon className="w-4 h-4" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-1.5">
                                                <span className="font-serif font-bold text-xs text-zinc-100 group-hover:text-amber-300 truncate">
                                                    {dest.label}
                                                </span>
                                                {dest.badge && (
                                                    <span className="px-1.5 py-0.2 rounded-full bg-red-500 text-white font-mono text-[9px] font-bold">
                                                        {dest.badge}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-[10px] text-zinc-400 truncate mt-0.5">
                                                {dest.desc}
                                            </p>
                                        </div>
                                    </button>
                                )
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* Bottom Navigation Bar */}
            <nav
                className="lg:landscape:hidden fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-t from-zinc-950 via-zinc-900/98 to-zinc-900/95 border-t border-amber-800/25 shadow-[0_-4px_24px_rgba(0,0,0,0.85)]"
                style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 0.5rem)' }}
            >
                <div className="flex items-center justify-around px-1 py-1.5">
                    {primaryNavItems.map((item) => {
                        const Icon = item.icon
                        const active = pathname === item.href

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => {
                                    setIsMoreOpen(false)
                                    onPageChange()
                                    trigger(HapticPatterns.tabSwitch)
                                }}
                                className={cn(
                                    "flex flex-col items-center justify-center min-w-[48px] px-1 py-1 rounded-lg transition-all duration-200 touch-manipulation",
                                    active
                                        ? "bg-amber-900/30 text-amber-400"
                                        : "text-zinc-400 hover:text-amber-400 hover:bg-amber-900/10 active:bg-amber-900/20"
                                )}
                                aria-label={`Navigate to ${item.label}`}
                            >
                                <Icon className={cn(
                                    "w-5 h-5 mb-0.5 transition-all duration-200",
                                    active && "scale-110"
                                )} />
                                <span className={cn(
                                    "text-[10px] font-medium transition-all duration-200",
                                    active && "font-semibold text-amber-400 shadow-amber-500/10"
                                )}>
                                    {item.label}
                                </span>
                            </Link>
                        )
                    })}

                    {/* More / Realm Navigator Trigger */}
                    <button
                        type="button"
                        onClick={() => {
                            trigger(HapticPatterns.tabSwitch)
                            setIsMoreOpen(!isMoreOpen)
                        }}
                        className={cn(
                            "flex flex-col items-center justify-center min-w-[48px] px-1 py-1 rounded-lg transition-all duration-200 touch-manipulation relative",
                            (isMoreOpen || isSecondaryActive)
                                ? "bg-amber-900/30 text-amber-400"
                                : "text-zinc-400 hover:text-amber-400 hover:bg-amber-900/10 active:bg-amber-900/20"
                        )}
                        aria-label="Open more destinations"
                    >
                        <LayoutGrid className={cn(
                            "w-5 h-5 mb-0.5 transition-all duration-200",
                            (isMoreOpen || isSecondaryActive) && "scale-110 text-amber-400"
                        )} />
                        <span className={cn(
                            "text-[10px] font-medium transition-all duration-200",
                            (isMoreOpen || isSecondaryActive) && "font-semibold text-amber-400 shadow-amber-500/10"
                        )}>
                            More
                        </span>
                        {unreadCount > 0 && !isSecondaryActive && (
                            <span className="absolute top-0.5 right-2 w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                        )}
                    </button>
                </div>
            </nav>
        </>
    )
}
