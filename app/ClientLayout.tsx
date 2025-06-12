"use client"

import { useEffect } from "react"
import type React from "react"
import { usePathname } from "next/navigation"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import DevicePreview from "@/components/device-preview"
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

  useEffect(() => {
    registerServiceWorker();
  }, []);

  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <RealmProvider>
        <div className="min-h-screen bg-black">
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

