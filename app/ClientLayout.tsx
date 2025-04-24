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
import { registerServiceWorker } from "./utils/registerSW"

// Define the type for headerImages
interface HeaderImages {
  realm: string;
  character: string;
  quests: string;
  guildhall: string;
  achievements: string;
  kingdom: string;
}

// Initialize header images with default values
const defaultHeaderImages: HeaderImages = {
  realm: "/images/realm-header.jpg",
  character: "/images/character-header.jpg",
  quests: "/images/quests-header.jpg",
  guildhall: "/images/guildhall-header.jpg",
  achievements: "/images/achievements-header.jpg",
  kingdom: "/images/kingdom-header.jpg",
}

// Initialize global state for header images
if (typeof window !== 'undefined') {
  const storedHeaderImages: HeaderImages = {
    realm: localStorage.getItem("realm-header-image") || defaultHeaderImages.realm,
    character: localStorage.getItem("character-header-image") || defaultHeaderImages.character,
    quests: localStorage.getItem("quests-header-image") || defaultHeaderImages.quests,
    guildhall: localStorage.getItem("guildhall-header-image") || defaultHeaderImages.guildhall,
    achievements: localStorage.getItem("achievements-header-image") || defaultHeaderImages.achievements,
    kingdom: localStorage.getItem("kingdom-header-image") || defaultHeaderImages.kingdom,
  };
  window.headerImages = storedHeaderImages;
}

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
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

  useEffect(() => {
    registerServiceWorker();
  }, []);

  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <RealmProvider>
        <div className="min-h-screen bg-black">
          <NavBar />
          <div className="pt-[calc(4rem+env(safe-area-inset-top))] pb-[env(safe-area-inset-bottom)]">
            {children}
          </div>
        </div>
        <Toaster />
        <div className="hidden">
          <DevicePreview />
        </div>
      </RealmProvider>
    </ThemeProvider>
  )
}

