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
  Palette,
  ChevronDown,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Icons } from "@/components/icons"
import { Progress } from "@/components/ui/progress"
import { Coins } from "lucide-react"
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
import { CharacterStats, calculateExperienceForLevel, calculateLevelFromExperience, calculateLevelProgress } from "@/types/character"
import { Logo } from "@/components/logo";
import { useUser } from "@clerk/nextjs";
import { getCharacterStats } from '@/lib/character-data-manager';

interface MobileNavProps {
  tabs?: { value: string; label: string }[]
  activeTab?: string
  onTabChange?: (value: string) => void
}

export function MobileNav({ tabs, activeTab, onTabChange }: MobileNavProps) {
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
    // Load character stats from Supabase
    async function loadCharacterStats() {
      // TODO: get userId from context/auth
      const userId = typeof window !== 'undefined' ? localStorage.getItem('userId') : undefined;
      if (!userId) return;
      const stats = await getCharacterStats(userId);
      setCharacterStats(stats || {
        level: 1,
        experience: 0,
        experienceToNextLevel: 100,
        gold: 1000,
        titles: {
          equipped: "Novice Adventurer",
          unlocked: 5,
          total: 20
        },
        perks: {
          active: 3,
          total: 10
        }
      });
    }
    loadCharacterStats();
    // Listen for character stats updates
    window.addEventListener("character-stats-update", loadCharacterStats)
    return () => {
      window.removeEventListener("character-stats-update", loadCharacterStats)
    }
  }, [])
  
  const mainNavItems = [
    { href: "/kingdom", label: "Kingdom", icon: Crown },
    { href: "/quests", label: "Tasks", icon: Compass },
    { href: "/realm", label: "Realm", icon: MapIcon },
    { href: "/achievements", label: "Achievements", icon: Trophy },
    { href: "/character", label: "Character", icon: User },
  ]

  const accountItems = [
    { href: "/profile", label: "Profile", icon: User },
    { href: "/requirements", label: "Requirements", icon: ClipboardCheck },
    { href: "/design-system", label: "Design System", icon: Palette },
  ]
  
  const isActive = (path: string) => pathname === path
  
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black border-b border-gray-800 h-16 flex items-center justify-between px-2">
      {/* Mobile nav bar: logo, hamburger */}
      <div className="flex flex-1 items-center justify-between gap-2 w-full">
        {/* Logo (left) */}
        <div className="flex items-center">
          <Link href="/kingdom" aria-label="Go to Kingdom (Home)">
            <Logo variant="icon" size="md" />
          </Link>
        </div>
        {/* Centered Thrivehaven title */}
        <div className="flex-1 flex justify-center items-center">
          <span className="text-2xl font-bold text-amber-400 tracking-wide">Thrivehaven</span>
        </div>
        {/* Hamburger menu (right) */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 p-0"
              aria-label="Open menu"
            >
              <Menu className="h-6 w-6 text-amber-400" />
            </Button>
          </SheetTrigger>
          <SheetContent 
            side="right" 
            className="w-full max-w-[90vw] sm:max-w-[320px] p-2 bg-gray-900 border-gray-800"
            aria-modal="true"
            aria-label="main-menu-sheet"
          >
            <div className="flex flex-col h-full">
              {/* Stats section */}
              <div className="flex items-center space-x-4 py-4 border-b border-gray-800">
                <div className="flex items-center space-x-2">
                  <div className="text-sm font-medium text-gray-400">
                    Level {characterStats.level}
                  </div>
                  <Progress value={calculateLevelProgress(characterStats.experience)} className="w-24 h-2" />
                  <div className="flex items-center space-x-1">
                    <Coins className="h-4 w-4 text-amber-400" />
                    <span className="text-sm font-medium text-gray-100">{characterStats.gold}</span>
                  </div>
                </div>
              </div>
              {/* Notifications section */}
              <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-800">
                <span className="text-amber-400"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg></span>
                <span className="font-semibold text-white">Notifications</span>
                {/* NotificationCenter with badge */}
                <div className="ml-auto">
                  {/* @ts-ignore-next-line */}
                  {typeof window !== 'undefined' && require('@/components/notification-center').NotificationCenter && (
                    require('@/components/notification-center').NotificationCenter()
                  )}
                </div>
              </div>
              {/* Tabs Dropdown (if tabs are provided) */}
              {tabs && tabs.length > 0 && (
                <div className="px-4 py-2 border-b border-gray-800">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="w-full flex justify-between items-center">
                        {tabs.find(tab => tab.value === activeTab)?.label || "Select"}
                        <ChevronDown className="h-4 w-4 ml-2" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-full">
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
                </div>
              )}
              {/* Main Navigation */}
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
                      "flex items-center gap-3 px-6 py-4 text-gray-400 hover:bg-gray-800/50 hover:text-amber-400 hover:border-b-2 hover:border-amber-400 transition-all duration-200 border-b border-gray-800 font-semibold",
                      isActive(item.href) && "text-amber-400 bg-gray-800/50 border-b-2 border-amber-400"
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    <span className="font-cardo">{item.label}</span>
                  </Link>
                ))}
              </div>
              {/* Account Settings - Expandable Section */}
              <div className="py-2">
                <ExpandableAccountSettings />
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  )
} 

// ExpandableAccountSettings component
function ExpandableAccountSettings() {
  const [expanded, setExpanded] = useState(false);
  const { user, isLoaded } = useUser();
  const getAvatarInitial = () => {
    const name = (user?.unsafeMetadata?.['user_name'] as string) || user?.username || user?.emailAddresses?.[0]?.emailAddress || '';
    return name && typeof name === 'string' ? name.charAt(0).toUpperCase() : 'U';
  };
  return (
    <div>
      <button
        className="flex items-center gap-3 px-6 py-4 w-full text-left text-white font-semibold focus:outline-none"
        onClick={() => setExpanded((v) => !v)}
        // eslint-disable-next-line jsx-a11y/aria-proptypes
        aria-expanded={expanded ? 'true' : 'false'}
        aria-controls="account-settings-panel"
      >
        <div className="flex items-center">
          <img
            src={user?.imageUrl || ''}
            alt="avatar"
            className="h-8 w-8 rounded-full object-cover object-center border border-amber-400"
            onError={(e) => { (e.target as HTMLImageElement).src = ''; }}
          />
        </div>
        <span>Account settings</span>
        <ChevronDown className={`ml-auto transition-transform ${expanded ? 'rotate-180' : ''}`} />
      </button>
      {expanded && (
        <div id="account-settings-panel" className="bg-gray-800 rounded-b-md px-6 py-4 space-y-2">
          <div className="font-medium text-white">{String(user?.unsafeMetadata?.['user_name'] || user?.username || user?.emailAddresses?.[0]?.emailAddress || '')}</div>
          <div className="text-xs text-gray-400 mb-2">{String(user?.emailAddresses?.[0]?.emailAddress || '')}</div>
          <Link href="/profile" className="block py-2 text-gray-200 hover:text-amber-400 hover:border-b-2 hover:border-amber-400 transition-all duration-200 font-semibold">Profile</Link>
          <Link href="/requirements" className="block py-2 text-gray-200 hover:text-amber-400 hover:border-b-2 hover:border-amber-400 transition-all duration-200 font-semibold">Requirements</Link>
          <Link href="/design-system" className="block py-2 text-gray-200 hover:text-amber-400 hover:border-b-2 hover:border-amber-400 transition-all duration-200 font-semibold">Design System</Link>
          <Link href="/stored-data" className="block py-2 text-gray-200 hover:text-amber-400 hover:border-b-2 hover:border-amber-400 transition-all duration-200 font-semibold">Stored Data</Link>
          <form action={require('@/app/actions/auth').logout} className="mt-2">
            <button type="submit" className="w-full text-left text-red-400 hover:text-red-600 py-2">Log out</button>
          </form>
        </div>
      )}
    </div>
  );
} 