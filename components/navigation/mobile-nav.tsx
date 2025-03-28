"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { 
  Crown, 
  MapIcon, 
  Compass, 
  User, 
  ChevronsLeftRight, 
  Building, 
  Bell, 
  Settings, 
  ChevronDown, 
  Save,
  Menu
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Icons } from "@/components/icons"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"

interface MobileNavProps {
  goldBalance?: number
  onSaveMap?: () => void
  tabs?: {
    value: string;
    label: string;
  }[];
  activeTab?: string;
  onTabChange?: (value: string) => void;
}

interface MobileLinkProps {
  href: string
  onOpenChange?: (open: boolean) => void
  children: React.ReactNode
  className?: string
}

function MobileLink({
  href,
  onOpenChange,
  className,
  children,
}: MobileLinkProps) {
  return (
    <Link
      href={href}
      onClick={() => onOpenChange?.(false)}
      className={cn(
        "text-foreground/70 transition-colors hover:text-foreground",
        className
      )}
    >
      {children}
    </Link>
  )
}

export function MobileNav({ 
  goldBalance = 0, 
  onSaveMap,
  tabs,
  activeTab,
  onTabChange
}: MobileNavProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [tabMenuOpen, setTabMenuOpen] = useState(false)
  
  // Main navigation links with their icons
  const mainLinks = [
    { href: "/", label: "Kingdom", icon: Crown },
    { href: "/realm", label: "Realm", icon: MapIcon },
    { href: "/character", label: "Character", icon: User },
    { href: "/quests", label: "Quests", icon: Compass },
    { href: "/expansion", label: "Expansion", icon: ChevronsLeftRight },
    { href: "/guildhall", label: "Guildhall", icon: Building },
  ]

  // Utility links with their icons
  const utilityLinks = [
    { href: "/notifications", label: "Notifications", icon: Bell, badge: 3 },
    { href: "/settings", label: "Settings", icon: Settings }
  ]
  
  // The first 3 links to show directly in the mobile nav
  const visibleLinks = mainLinks.slice(0, 3)
  
  // The rest of the links to show in the dropdown
  const dropdownLinks = mainLinks.slice(3)
  
  // Handle tabs for mobile view
  const [visibleTabs, setVisibleTabs] = useState<typeof tabs>([])
  const [dropdownTabs, setDropdownTabs] = useState<typeof tabs>([])
  
  useEffect(() => {
    if (tabs) {
      // Show first 3 tabs directly, rest in dropdown
      setVisibleTabs(tabs?.slice(0, 3))
      setDropdownTabs(tabs?.slice(3))
    }
  }, [tabs])
  
  // Close all menus when the pathname changes (navigation occurs)
  useEffect(() => {
    setOpen(false)
    setMenuOpen(false)
    setTabMenuOpen(false)
  }, [pathname])
  
  const isActive = (path: string) => {
    return pathname === path
  }
  
  // Conditionally show the Save Map button only on the realm page
  const showSaveMap = pathname === "/realm"
  
  return (
    <div className="flex flex-col">
      <nav className="sticky top-0 z-50 flex items-center justify-between p-4 bg-gradient-to-b from-blue-900 to-blue-950 border-b border-blue-800/30">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-lg font-semibold">
            <span className="text-amber-400">Trivehaven</span>
          </Link>
          
          {/* Page title for current path */}
          <span className="hidden sm:inline text-sm text-blue-200/70">
            {pathname === "/" && "Kingdom"}
            {pathname === "/realm" && "Realm Builder"}
            {pathname === "/character" && "Character"}
            {pathname === "/quests" && "Quests"}
            {pathname === "/expansion" && "Expansion"}
            {pathname === "/guildhall" && "Guildhall"}
          </span>
        </div>
        
        {/* Central Navigation - Only visible on small screens and up */}
        <div className="hidden sm:flex absolute left-1/2 -translate-x-1/2 gap-1">
          {visibleLinks.map((link) => (
            <Link 
              key={link.href}
              href={link.href}
              className={`px-3 py-2 text-sm rounded-md flex items-center gap-1 transition-colors ${
                isActive(link.href) 
                  ? "bg-blue-800/70 text-white" 
                  : "text-blue-100 hover:bg-blue-800/50 hover:text-white"
              }`}
            >
              <link.icon className="w-4 h-4" />
              <span className="hidden md:inline">{link.label}</span>
            </Link>
          ))}
          
          {/* More dropdown */}
          {dropdownLinks.length > 0 && (
            <div className="relative">
              <Button
                variant="outline"
                size="sm"
                className={`px-3 py-2 text-sm rounded-md border-blue-700 ${
                  menuOpen 
                    ? "bg-blue-800/70 text-white" 
                    : "bg-blue-900/50 text-blue-100 hover:bg-blue-800/50 hover:text-white"
                }`}
                onClick={() => setMenuOpen(!menuOpen)}
              >
                More
                <ChevronDown className="h-4 w-4 ml-1" />
              </Button>
              
              {menuOpen && (
                <div className="absolute top-full mt-1 right-0 z-50 bg-blue-900 border border-blue-800/30 rounded-md shadow-lg py-1 min-w-[150px]">
                  {dropdownLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`flex items-center gap-2 px-4 py-2 text-sm ${
                        isActive(link.href) 
                          ? "bg-blue-800/70 text-white" 
                          : "text-blue-100 hover:bg-blue-800/50 hover:text-white"
                      }`}
                      onClick={() => setMenuOpen(false)}
                    >
                      <link.icon className="w-4 h-4" />
                      <span>{link.label}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-blue-100">
            <Icons.coins className="w-4 h-4 text-amber-400" />
            <span>{goldBalance} gold</span>
          </div>
          {showSaveMap && onSaveMap && (
            <Button onClick={onSaveMap} variant="outline" size="sm" className="hidden sm:flex border-blue-700 bg-blue-900/50 text-blue-100 hover:bg-blue-800 hover:text-white">
              Save Map
            </Button>
          )}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                className="mr-2 px-0 text-base hover:bg-transparent focus-visible:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 md:hidden"
              >
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="pr-0">
              <MobileLink
                href="/"
                className="flex items-center"
                onOpenChange={setOpen}
              >
                <Crown className="mr-2 h-4 w-4 text-amber-400" />
                <span className="font-bold">Level Up Kingdom</span>
              </MobileLink>
              <ScrollArea className="my-4 h-[calc(100vh-8rem)] pb-10">
                <div className="flex flex-col space-y-3">
                  <MobileLink href="/realm" onOpenChange={setOpen}>
                    Realm
                  </MobileLink>
                  <MobileLink href="/shop" onOpenChange={setOpen}>
                    Shop
                  </MobileLink>
                  <MobileLink href="/quests" onOpenChange={setOpen}>
                    Quests
                  </MobileLink>
                  <MobileLink href="/inventory" onOpenChange={setOpen}>
                    Inventory
                  </MobileLink>
                </div>
              </ScrollArea>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
      
      {/* Tab navigation for pages that need tabs */}
      {tabs && tabs.length > 0 && (
        <div className="sticky top-[60px] z-40 p-4 pb-0 bg-gradient-to-b from-blue-950 to-blue-950/70">
          <div className="w-full overflow-x-auto">
            <div className="flex gap-1 min-w-max">
              {/* Show first 3 tabs */}
              {visibleTabs?.map((tab) => (
                <Button
                  key={tab?.value}
                  variant="ghost"
                  size="sm"
                  className={`text-sm rounded-md py-1 px-3 ${
                    activeTab === tab?.value
                      ? "bg-blue-800/70 text-white"
                      : "text-blue-100 hover:bg-blue-800/50 hover:text-white"
                  }`}
                  onClick={() => onTabChange?.(tab?.value)}
                >
                  {tab?.label}
                </Button>
              ))}
              
              {/* Dropdown for additional tabs */}
              {dropdownTabs && dropdownTabs.length > 0 && (
                <div className="relative">
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`text-sm rounded-md py-1 px-3 ${
                      tabMenuOpen 
                        ? "bg-blue-800/70 text-white" 
                        : "text-blue-100 hover:bg-blue-800/50 hover:text-white"
                    }`}
                    onClick={() => setTabMenuOpen(!tabMenuOpen)}
                  >
                    More
                    <ChevronDown className={`h-3 w-3 ml-1 transition-transform duration-200 ${tabMenuOpen ? 'rotate-180' : ''}`} />
                  </Button>
                  
                  {tabMenuOpen && (
                    <div className="absolute top-full mt-1 left-0 z-[100] bg-blue-900 border border-blue-800/30 rounded-md shadow-lg py-1 min-w-[150px]">
                      {dropdownTabs?.map((tab) => (
                        <Button
                          key={tab?.value}
                          variant="ghost"
                          size="sm"
                          className={`w-full justify-start text-sm px-4 py-2 ${
                            activeTab === tab?.value
                              ? "bg-blue-800/70 text-white"
                              : "text-blue-100 hover:bg-blue-800/50 hover:text-white"
                          }`}
                          onClick={() => {
                            onTabChange?.(tab?.value);
                            setTabMenuOpen(false);
                          }}
                        >
                          {tab?.label}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 