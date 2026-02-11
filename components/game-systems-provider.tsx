"use client"

import React from 'react'
import { Toaster } from "@/components/ui/toaster"
import { Toaster as SonnerToaster } from "@/components/ui/sonner"
import LocalStorageMigrator from '@/components/local-storage-migrator'
import { KingdomNotificationManager } from '@/components/kingdom-notification-manager'
import { DayNightCycle } from '@/components/day-night-cycle'
import { InstallPrompt } from '@/components/install-prompt'
import { PerformanceMonitor } from '@/components/performance-monitor'
import { CharacterStatsSync } from '@/components/character-stats-sync'
import { QuickAddProvider } from '@/components/quick-add-provider'
import { KeyboardShortcutsProvider } from '@/components/keyboard-shortcuts'
import { ParticleProvider } from '@/components/ui/particles'
import { SeasonalHuntWrapper } from '@/components/seasonal-hunt-wrapper'
import { UserStorageInitializer } from '@/components/user-storage-initializer'

/**
 * Consolidates all "Manager" and "System" level providers/components
 * to clean up the root layout. These are components that don't render
 * visible UI immediately but manage background game state/events.
 */
export function GameSystemsProvider({ children }: { children: React.ReactNode }) {
    return (
        <QuickAddProvider>
            <KeyboardShortcutsProvider />
            <ParticleProvider>
                <div className="flex flex-col h-full">
                    <CharacterStatsSync />
                    {children}
                    <SeasonalHuntWrapper />
                </div>

                {/* Background Systems */}
                <UserStorageInitializer />
                <LocalStorageMigrator />
                <KingdomNotificationManager />
                <DayNightCycle />
                <Toaster />
                <SonnerToaster />
                <InstallPrompt />
                <PerformanceMonitor />
            </ParticleProvider>
        </QuickAddProvider>
    )
}
