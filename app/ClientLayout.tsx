"use client"

import { useState, useEffect } from "react"
import type React from "react"
import { usePathname } from "next/navigation"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import DevicePreview from "@/components/device-preview"
import { DbProvider } from "@/lib/db-context"
import { MobileNav } from "@/components/navigation/mobile-nav"
import { NavBar } from "@/components/nav-bar"
import { toast } from "@/components/ui/use-toast"
import { RealmProvider } from "@/lib/realm-context"

// Define the type for headerImages
interface HeaderImages {
  realm: string;
  character: string;
  quests: string;
  guildhall: string;
  achievements: string;
  kingdom: string;
}

// Create a global state object for header images
if (typeof window !== 'undefined') {
  // @ts-ignore
  window.headerImages = window.headerImages || {
    realm: localStorage.getItem("realm-header-image") || "/images/realm-header.jpg",
    character: localStorage.getItem("character-header-image") || "/images/character-header.jpg",
    quests: localStorage.getItem("quests-header-image") || "/images/quests-header.jpg",
    guildhall: localStorage.getItem("guildhall-header-image") || "/images/guildhall-header.jpg",
    achievements: localStorage.getItem("achievements-header-image") || "/images/achievements-header.jpg",
    kingdom: localStorage.getItem("kingdom-header-image") || "/images/kingdom-header.jpg",
  } as HeaderImages;
}

export default function ClientLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const pathname = usePathname()
  const [isFullscreen, setIsFullscreen] = useState(false)
  
  // Check for fullscreen parameter in URL
  useEffect(() => {
    const checkFullscreen = () => {
      const url = new URL(window.location.href)
      setIsFullscreen(url.searchParams.get('fullscreen') === 'true')
    }

    // Check on mount and when URL changes
    checkFullscreen()
    window.addEventListener('popstate', checkFullscreen)
    return () => window.removeEventListener('popstate', checkFullscreen)
  }, [pathname])

  // Save map function for the realm page
  const saveMap = () => {
    if (pathname === "/realm") {
      try {
        // Dispatch a custom event that the RealmPage component listens for
        const saveMapEvent = new Event('saveMap');
        window.dispatchEvent(saveMapEvent);
      } catch (error) {
        console.error("Error triggering save map:", error)
        toast({
          title: "Error Saving Map",
          description: "There was a problem saving your map.",
          variant: "destructive",
        })
      }
    }
  }

  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} disableTransitionOnChange>
      {/* Desktop Navigation (hidden on mobile) */}
      <div className="hidden md:block">
        {!isFullscreen && <NavBar />}
      </div>
      <DbProvider>
        <RealmProvider>
          <div className="flex min-h-screen flex-col">
            {/* Mobile Navigation (hidden on md and larger screens) */}
            <div className="block md:hidden">
              <MobileNav 
                onSaveMap={saveMap}
                // @ts-ignore - Use window.mobileNavProps if available
                tabs={typeof window !== 'undefined' && window.mobileNavProps ? window.mobileNavProps.tabs : undefined}
                // @ts-ignore
                activeTab={typeof window !== 'undefined' && window.mobileNavProps ? window.mobileNavProps.activeTab : undefined}
                // @ts-ignore
                onTabChange={typeof window !== 'undefined' && window.mobileNavProps ? window.mobileNavProps.onTabChange : undefined}
              />
            </div>
            
            {/* Main content with proper padding to account for fixed navigation */}
            <main className="flex-1 pt-16 md:pt-0">
              {children}
            </main>
          </div>
        </RealmProvider>
      </DbProvider>
      <Toaster />
      <div className="hidden">
        <DevicePreview />
      </div>
    </ThemeProvider>
  )
}

