"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
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
  Palette
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Icons } from "@/components/icons"
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet"
import { cn } from "@/lib/utils"

interface MobileNavProps {
  goldBalance?: number
}

export function MobileNav({ goldBalance = 0 }: MobileNavProps) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  
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

        {/* Stats */}
        <div className="flex items-center gap-4">
          {/* Level */}
          <div className="flex items-center gap-1.5">
            <span className="text-sm text-gray-400">Level</span>
            <span className="text-amber-400 font-bold">1</span>
          </div>

          {/* Gold */}
          <div className="flex items-center gap-1.5">
            <Icons.coins className="w-4 h-4 text-amber-400" />
            <span className="text-gray-100">{goldBalance}</span>
          </div>

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