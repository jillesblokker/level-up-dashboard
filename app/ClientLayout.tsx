"use client"

import { useEffect, useState } from "react"
import type React from "react"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import DevicePreview from "@/components/device-preview"
import { RealmProvider } from "@/lib/realm-context"
import { registerServiceWorker } from "./utils/registerSW"
import { JournalModal } from "@/components/chronicle/JournalModal"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isJournalOpen, setIsJournalOpen] = useState(false)

  useEffect(() => {
    registerServiceWorker();

    // Nightly Journal Logic
    const checkJournal = async () => {
      const now = new Date();
      const currentHour = now.getHours();

      // Trigger after 18:00
      if (currentHour >= 18) {
        const today = now.toISOString().split('T')[0];

        // 1. Check LocalStorage (Fast Check)
        const lastAttempt = localStorage.getItem('last_journal_attempt');
        if (lastAttempt === today) return;

        // 2. Check Database (Authority)
        const supabase = createClientComponentClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
          const { count } = await supabase.from('chronicle_entries')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .eq('entry_date', today);

          // If no entry today, open modal
          if (count === 0) {
            // Add slight delay so it interacts nicely with load
            setTimeout(() => setIsJournalOpen(true), 2000);
          }
        }
      }
    }

    checkJournal();
  }, []);

  const closeJournal = () => {
    setIsJournalOpen(false)
    // Mark as attempted today so we don't nag
    localStorage.setItem('last_journal_attempt', new Date().toISOString().split('T')[0] || '')
  }

  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <RealmProvider>
        <div className="min-h-screen bg-black">
          <div className="pt-[calc(4rem+env(safe-area-inset-top))] md:pt-16 main-content-wrapper" style={{ overscrollBehavior: 'none' }}>
            {children}
          </div>
        </div>
        <Toaster />
        <JournalModal isOpen={isJournalOpen} onClose={closeJournal} />
        <div className="hidden">
          <DevicePreview />
        </div>
      </RealmProvider>
    </ThemeProvider>
  )
}
