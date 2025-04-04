"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, useEffect } from "react"
import { 
  Crown, 
  MapIcon,
  Trophy,
  ClipboardCheck,
  Menu,
  X,
  User,
  Building,
  Compass,
  Settings,
  Palette,
  ChevronDown
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Icons } from "@/components/icons"
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { CharacterStats, calculateExperienceForLevel, calculateLevelFromExperience } from "@/types/character"

interface MobileNavProps {
  onSaveMap?: () => void
  tabs?: { value: string; label: string }[]
  activeTab?: string
  onTabChange?: (value: string) => void
}

export function MobileNav({ onSaveMap, tabs, activeTab, onTabChange }: MobileNavProps) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [characterStats, setCharacterStats] = useState<CharacterStats>({
    level: 1,
    experience: 0,
    experienceToNextLevel: 100,
    gold: 0,
    titles: {
      equipped: "",
      unlocked: 0,
      total: 10
    },
    perks: {
      active: 0,
      total: 5
    }
  })

  useEffect(() => {
    // Load character stats from localStorage
    const loadCharacterStats = () => {
      try {
        const savedStats = localStorage.getItem("character-stats")
        if (savedStats) {
          const stats = JSON.parse(savedStats) as CharacterStats
          const currentLevel = calculateLevelFromExperience(stats.experience)
          setCharacterStats({
            ...stats,
            level: currentLevel,
            experienceToNextLevel: calculateExperienceForLevel(currentLevel)
          })
        }
      } catch (error) {
        console.error("Error loading character stats:", error)
      }
    }
    loadCharacterStats()

    // Listen for character stats updates
    const handleStatsUpdate = () => loadCharacterStats()
    window.addEventListener("character-stats-update", handleStatsUpdate)
    
    return () => {
      window.removeEventListener("character-stats-update", handleStatsUpdate)
    }
  }, [])
  
  const mainNavItems = [
    { href: "/", label: "Kingdom", icon: Crown },
    { href: "/realm", label: "Realm", icon: MapIcon },
    { href: "/achievements", label: "Achievements", icon: Trophy },
    { href: "/character", label: "Character", icon: User },
    { href: "/guildhall", label: "Guildhall", icon: Building },
    { href: "/quests", label: "Quests", icon: Compass },
  ]

  const accountItems = [
    { href: "/profile", label: "Profile", icon: User },
    { href: "/requirements", label: "Requirements", icon: ClipboardCheck },
    { href: "/design-system", label: "Design System", icon: Palette },
  ]
  
  const isActive = (path: string) => pathname === path
  
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black border-b border-gray-800">
      <div className="flex items-center justify-between px-4 h-16">
        {/* Logo */}
        <Link href="/" className="flex items-center">
          <span className="text-lg font-cardo text-amber-400">Thrivehaven</span>
        </Link>

        {/* Stats and Controls */}
        <div className="flex items-center gap-2">
          {/* Level */}
          <div className="flex items-center gap-1.5">
            <span className="text-sm text-gray-400">Level</span>
            <span className="text-amber-400 font-bold">{characterStats.level}</span>
          </div>

          {/* Gold */}
          <div className="flex items-center gap-1.5">
            <Icons.coins className="w-4 h-4 text-amber-400" />
            <span className="text-gray-100">{characterStats.gold}</span>
          </div>

          {/* Tabs Dropdown (if tabs are provided) */}
          {tabs && tabs.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-1">
                  {tabs.find(tab => tab.value === activeTab)?.label || "Select"}
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[calc(100vw-2rem)] mx-4">
                {tabs.map((tab) => (
                  <DropdownMenuItem
                    key={tab.value}
                    onClick={() => onTabChange?.(tab.value)}
                    className={cn(
                      activeTab === tab.value && "bg-accent"
                    )}
                  >
                    {tab.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Menu Button */}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 p-0"
              >
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent 
              side="right" 
              className="w-full sm:max-w-[300px] p-0 bg-gray-900 border-gray-800"
            >
              <div className="flex flex-col h-full">
                {/* Main Navigation */}
                <div className="flex-1">
                  <div className="py-2">
                    <div className="px-6 py-2">
                      <h2 className="text-sm font-semibold text-gray-400">Navigation</h2>
                    </div>
                    {mainNavItems.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setOpen(false)}
                        className={cn(
                          "flex items-center gap-3 px-6 py-4 text-gray-400 hover:bg-gray-800/50 transition-colors border-b border-gray-800",
                          isActive(item.href) && "text-amber-400 bg-gray-800/50"
                        )}
                      >
                        <item.icon className="h-5 w-5" />
                        <span className="font-cardo">{item.label}</span>
                      </Link>
                    ))}
                  </div>

                  {/* Account Section */}
                  <div className="py-2">
                    <div className="px-6 py-2">
                      <h2 className="text-sm font-semibold text-gray-400">Account</h2>
                    </div>
                    {accountItems.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setOpen(false)}
                        className={cn(
                          "flex items-center gap-3 px-6 py-4 text-gray-400 hover:bg-gray-800/50 transition-colors border-b border-gray-800",
                          isActive(item.href) && "text-amber-400 bg-gray-800/50"
                        )}
                      >
                        <item.icon className="h-5 w-5" />
                        <span className="font-cardo">{item.label}</span>
                      </Link>
                    ))}
                  </div>
                </div>

                {/* Close Button */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-4 right-4"
                  onClick={() => setOpen(false)}
                >
                  <X className="h-5 w-5" />
                  <span className="sr-only">Close menu</span>
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  )
} 