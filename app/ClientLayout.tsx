"use client"

import { useEffect } from "react"
import type React from "react"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import DevicePreview from "@/components/device-preview"
import { RealmProvider } from "@/lib/realm-context"
import { registerServiceWorker } from "./utils/registerSW"

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  useEffect(() => {
    registerServiceWorker();
  }, []);

  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <RealmProvider>
        <div className="min-h-screen bg-black">
          <div className="pt-[calc(4rem+env(safe-area-inset-top))] pb-[env(safe-area-inset-bottom)] px-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)] px-2 sm:px-4 md:px-8">
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

