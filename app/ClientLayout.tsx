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
          <div className="pt-[calc(4rem+env(safe-area-inset-top))] pb-4 main-content-wrapper" style={{ overscrollBehavior: 'none' }}>
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

