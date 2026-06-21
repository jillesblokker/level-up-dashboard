"use client"

import { useEffect, useState } from 'react'
import { X, Download, Share, Plus, Crown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'
import { setUserPreference, getUserPreference } from '@/lib/user-preferences-manager'

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function InstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
    const [showPrompt, setShowPrompt] = useState(false)
    const [isInstalled, setIsInstalled] = useState(false)
    const [isIOS, setIsIOS] = useState(false)
    const [dontShowAgain, setDontShowAgain] = useState(false)
    const [isInStandaloneMode, setIsInStandaloneMode] = useState(false)

    useEffect(() => {
        const checkInstallState = async () => {
            // Check if already installed
            const standalone = window.matchMedia('(display-mode: standalone)').matches
            setIsInStandaloneMode(standalone)

            if (standalone) {
                setIsInstalled(true)
                return
            }

            // Detect iOS
            const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream
            setIsIOS(iOS)

            // Check if user has permanently dismissed the prompt via database
            const permanentlyDismissed = await getUserPreference('pwa-install-permanent-dismiss')
            if (permanentlyDismissed === true) {
                return
            }

            // Check if user has dismissed the prompt before in this session/recently
            const dismissed = localStorage.getItem('pwa-install-dismissed')
            if (dismissed) {
                const dismissedDate = new Date(dismissed)
                const daysSinceDismissed = (Date.now() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24)

                // Show again after 7 days
                if (daysSinceDismissed < 7) {
                    return
                }
            }

            // For iOS, show prompt after delay
            if (iOS) {
                setTimeout(() => {
                    setShowPrompt(true)
                }, 30000) // 30 seconds
            }

            // For Android/Desktop
            const handler = (e: Event) => {
                e.preventDefault()
                setDeferredPrompt(e as BeforeInstallPromptEvent)

                // Show prompt after user has been on the site for 30 seconds
                setTimeout(() => {
                    setShowPrompt(true)
                }, 30000)
            }

            window.addEventListener('beforeinstallprompt', handler)

            return () => {
                window.removeEventListener('beforeinstallprompt', handler)
            }
        }

        checkInstallState()
    }, [])

    const handleInstall = async () => {
        if (!deferredPrompt) return

        deferredPrompt.prompt()
        const { outcome } = await deferredPrompt.userChoice

        if (outcome === 'accepted') {
            setShowPrompt(false)
            setDeferredPrompt(null)
            if (dontShowAgain) {
                await setUserPreference('pwa-install-permanent-dismiss', true)
            }
        }
    }

    const handleDismiss = async () => {
        setShowPrompt(false)
        localStorage.setItem('pwa-install-dismissed', new Date().toISOString())
        if (dontShowAgain) {
            await setUserPreference('pwa-install-permanent-dismiss', true)
        }
    }

    if (isInstalled || !showPrompt) {
        return null
    }

    return (
        <div className="fixed bottom-20 left-4 right-4 z-[90] md:left-auto md:right-4 md:w-[420px] animate-in slide-in-from-bottom-5 duration-500">
            {/* Medieval Scroll/Banner Design */}
            <div className="relative">
                {/* Ornate border corners */}
                <div className="absolute -top-2 -left-2 w-8 h-8 border-t-2 border-l-2 border-amber-500/50 rounded-tl-lg" />
                <div className="absolute -top-2 -right-2 w-8 h-8 border-t-2 border-r-2 border-amber-500/50 rounded-tr-lg" />
                <div className="absolute -bottom-2 -left-2 w-8 h-8 border-b-2 border-l-2 border-amber-500/50 rounded-bl-lg" />
                <div className="absolute -bottom-2 -right-2 w-8 h-8 border-b-2 border-r-2 border-amber-500/50 rounded-br-lg" />

                {/* Main content */}
                <div className={cn(
                    "relative overflow-hidden rounded-lg shadow-2xl",
                    "bg-gradient-to-br from-amber-950 via-amber-900 to-orange-950",
                    "border-2 border-amber-600/40",
                    "backdrop-blur-md"
                )}>
                    {/* Parchment texture overlay */}
                    <div className="absolute inset-0 opacity-10 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZmlsdGVyIGlkPSJub2lzZSI+PGZlVHVyYnVsZW5jZSB0eXBlPSJmcmFjdGFsTm9pc2UiIGJhc2VGcmVxdWVuY3k9IjAuOSIgbnVtT2N0YXZlcz0iNCIgLz48L2ZpbHRlcj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWx0ZXI9InVybCgjbm9pc2UpIiAvPjwvc3ZnPg==')]" />

                    {/* Close button */}
                    <button
                        onClick={handleDismiss}
                        className="absolute top-3 right-3 z-10 text-amber-300 hover:text-white transition-colors p-1 rounded-full hover:bg-amber-800/50"
                        aria-label="Dismiss"
                    >
                        <X className="h-5 w-5" />
                    </button>

                    <div className="relative p-6">
                        {/* Header with crown icon */}
                        <div className="flex items-start gap-4 mb-4">
                            <div className="flex-shrink-0 w-16 h-16 bg-gradient-to-br from-amber-500 to-amber-600 rounded-lg flex items-center justify-center shadow-lg border-2 border-amber-400/50">
                                <Crown className="w-8 h-8 text-amber-950" />
                            </div>

                            <div className="flex-1 min-w-0">
                                <h3 className="font-serif text-xl font-bold text-amber-100 mb-1 tracking-wide">
                                    Join the Kingdom
                                </h3>
                                <p className="text-sm text-amber-200/80 leading-relaxed">
                                    Install Level Up for instant access and a true hero&apos;s experience!
                                </p>
                            </div>
                        </div>

                        {/* Benefits list */}
                        <div className="mb-4 space-y-2 bg-black/20 rounded-lg p-3 border border-amber-700/30">
                            <div className="flex items-center gap-2 text-sm text-amber-100">
                                <span className="text-amber-500">⚔️</span>
                                <span>Quick access from your home screen</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-amber-100">
                                <span className="text-amber-500">🏰</span>
                                <span>Expand your realm on the world map</span>
                            </div>
                        </div>

                        {/* Install instructions */}
                        {isIOS ? (
                            <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                                <p className="text-xs text-amber-200 mb-2 font-semibold">iOS Installation:</p>
                                <ol className="text-xs text-amber-200/80 space-y-1 list-decimal list-inside">
                                    <li className="flex items-start gap-2">
                                        <span className="flex-shrink-0">1.</span>
                                        <span className="flex-1">Tap the <Share className="inline w-3 h-3 mx-1" /> Share button below</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="flex-shrink-0">2.</span>
                                        <span className="flex-1">Scroll and tap &ldquo;Add to Home Screen&rdquo; <Plus className="inline w-3 h-3 mx-1" /></span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="flex-shrink-0">3.</span>
                                        <span className="flex-1">Tap &ldquo;Add&rdquo; to install</span>
                                    </li>
                                </ol>
                            </div>
                        ) : (
                            <div className="flex gap-2 mb-4">
                                <Button
                                    onClick={handleInstall}
                                    className={cn(
                                        "flex-1 bg-gradient-to-r from-amber-500 to-amber-600",
                                        "hover:from-amber-400 hover:to-amber-500",
                                        "text-amber-950 font-bold shadow-lg",
                                        "border-2 border-amber-400/50",
                                        "transition-all duration-200 hover:scale-105"
                                    )}
                                >
                                    <Download className="w-4 h-4 mr-2" />
                                    Install Now
                                </Button>
                                <Button
                                    onClick={handleDismiss}
                                    variant="ghost"
                                    className="text-amber-200 hover:text-white hover:bg-amber-800/50 border border-amber-700/30"
                                >
                                    Later
                                </Button>
                            </div>
                        )}

                        <div className="flex items-center space-x-2 mt-2 px-1">
                            <Checkbox
                                id="pwa-dont-show"
                                checked={dontShowAgain}
                                onCheckedChange={(checked) => setDontShowAgain(checked === true)}
                                className="border-amber-500/50 data-[state=checked]:bg-amber-500 data-[state=checked]:text-amber-950"
                            />
                            <label htmlFor="pwa-dont-show" className="text-xs text-amber-200/60 cursor-pointer">
                                Don&apos;t show this invitation again
                            </label>
                        </div>

                        {isIOS && (
                            <Button
                                onClick={handleDismiss}
                                variant="ghost"
                                className="w-full mt-4 text-amber-200 hover:text-white hover:bg-amber-800/50 border border-amber-700/30"
                            >
                                Maybe Later
                            </Button>
                        )}
                    </div>

                    {/* Decorative bottom border */}
                    <div className="h-2 bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600" />
                </div>
            </div>
        </div>
    )
}
