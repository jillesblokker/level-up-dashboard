"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Crown, Compass, MapIcon, User, Users } from "lucide-react"
import { cn } from "@/lib/utils"
import { notificationService } from "@/lib/notification-service"
import { useState, useEffect } from "react"
import { useNavigationAudio } from "@/components/audio-provider"
import { useHaptics, HapticPatterns } from "@/lib/haptics"


export function BottomNav() {
    const pathname = usePathname()
    const [unreadCount, setUnreadCount] = useState(0)
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
        // Also listen for storage events in case notifications change in another tab
        window.addEventListener('storage', handleNewNotification)

        return () => {
            window.removeEventListener('newNotification', handleNewNotification)
            window.removeEventListener('storage', handleNewNotification)
        }
    }, [])

    const navItems = [
        { href: "/kingdom", label: "Kingdom", icon: Crown },
        { href: "/quests", label: "Tasks", icon: Compass },
        { href: "/realm", label: "Realm", icon: MapIcon },
        { href: "/social", label: "Tavern", icon: Users },
        { href: "/profile", label: "Profile", icon: User },
    ]

    const isActive = (path: string) => pathname === path

    return (
        <nav
            className="lg:landscape:hidden fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-t from-gray-900 via-gray-900/98 to-gray-900/95 border-t border-amber-800/20 backdrop-blur-xl pb-safe"
            style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 0.5rem)' }}
        >
            <div className="flex items-center justify-around px-1 py-1">
                {navItems.map((item) => {
                    const Icon = item.icon
                    const active = isActive(item.href)

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => {
                                onPageChange()
                                trigger(HapticPatterns.tabSwitch)
                            }}
                            className={cn(
                                "flex flex-col items-center justify-center min-w-[56px] px-2 py-1 rounded-lg transition-all duration-200 touch-manipulation",
                                active
                                    ? "bg-amber-900/30 text-amber-400"
                                    : "text-gray-400 hover:text-amber-400 hover:bg-amber-900/10 active:bg-amber-900/20"
                            )}
                            aria-label={`Navigate to ${item.label}`}
                        >
                            <Icon className={cn(
                                "w-6 h-6 mb-1 transition-all duration-200",
                                active && "scale-110"
                            )} />
                            <span className={cn(
                                "text-[10px] font-medium transition-all duration-200",
                                active && "font-semibold text-amber-500 shadow-amber-500/10"
                            )}>
                                {item.label}
                            </span>
                        </Link>
                    )
                })}
            </div>
        </nav>
    )
}
