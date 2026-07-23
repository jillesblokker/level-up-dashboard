"use client"

import { useState, useEffect, createContext, useContext, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { getUserScopedItem, setUserScopedItem } from '@/lib/user-scoped-storage'
import { smartLogger } from '@/lib/smart-logger'
import { OnboardingModal } from '@/components/onboarding/OnboardingModal'
import { getUserPreference, setUserPreference } from '@/lib/user-preferences-manager'
import { useUser } from '@clerk/nextjs'

interface OnboardingState {
    hasCompletedOnboarding: boolean
    hasSkippedOnboarding: boolean
    hasHiddenGateway: boolean
    lastShownAt: number | null
}

interface OnboardingContextType {
    onboardingState: OnboardingState
    isOnboardingOpen: boolean
    showGateway: boolean
    shouldShowOnboarding: () => boolean
    openOnboarding: (forceOpen?: boolean) => void
    closeOnboarding: () => void
    completeOnboarding: () => void
    skipOnboarding: () => void
    hideGateway: () => void
    resetOnboarding: () => void
    debugOnboardingState: () => void
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined)

interface OnboardingProviderProps {
    children: ReactNode
}

export function OnboardingProvider({ children }: OnboardingProviderProps) {
    // ALL hooks must be declared at the top level — no early returns before this point
    const [mounted, setMounted] = useState(false)
    const [onboardingState, setOnboardingState] = useState<OnboardingState>({
        hasCompletedOnboarding: false,
        hasSkippedOnboarding: false,
        hasHiddenGateway: false,
        lastShownAt: null
    })
    const [isOnboardingOpen, setIsOnboardingOpen] = useState(false)
    const [showGateway, setShowGateway] = useState(false)

    const { user, isLoaded: isUserLoaded } = useUser()

    useEffect(() => {
        setMounted(true)
    }, [])

    // Load onboarding state from localStorage and Supabase
    useEffect(() => {
        // 1. Initial load from localStorage (fast/fallback)
        const savedLocalState = getUserScopedItem('onboarding-state')
        if (savedLocalState) {
            try {
                const parsed = JSON.parse(savedLocalState)
                setOnboardingState(parsed)
            } catch (e) { }
        }

        // 2. Sync from Supabase if user is logged in
        if (isUserLoaded && user) {
            getUserPreference('onboarding-state').then(dbState => {
                if (dbState && typeof dbState === 'object') {
                    const typedState = dbState as OnboardingState

                    // Deep equality check to prevent loops
                    const isSame = JSON.stringify(typedState) === JSON.stringify(onboardingState)
                    if (!isSame) {
                        setOnboardingState(typedState)
                        setUserScopedItem('onboarding-state', JSON.stringify(typedState))
                        smartLogger.info('useOnboarding', 'SYNC_FROM_DB_COMPLETE', { dbState: typedState })
                    }
                }
            })
        }
    }, [user, isUserLoaded])

    // Save onboarding state to localStorage and Supabase
    const saveOnboardingState = (newState: Partial<OnboardingState>) => {
        const updatedState = { ...onboardingState, ...newState }
        setOnboardingState(updatedState)
        setUserScopedItem('onboarding-state', JSON.stringify(updatedState))

        // Always attempt saving preference to Supabase (setUserPreference manages auth session check)
        setUserPreference('onboarding-state', updatedState).catch(err => {
            smartLogger.error('useOnboarding', 'DB_SAVE_ERROR', err)
        })

        smartLogger.info('useOnboarding', 'STATE_SAVED', {
            previousState: onboardingState,
            newState: updatedState,
            changes: newState
        })
    }

    const shouldShowOnboarding = () => {
        if (!onboardingState.hasCompletedOnboarding && !onboardingState.hasSkippedOnboarding) {
            return true
        }
        if (onboardingState.hasCompletedOnboarding && onboardingState.lastShownAt) {
            const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000)
            if (onboardingState.lastShownAt < thirtyDaysAgo) {
                return true
            }
        }
        return false
    }

    const debugOnboardingState = () => {
        smartLogger.info('useOnboarding', 'DEBUG_STATE', {
            onboardingState,
            isOnboardingOpen,
            shouldShowResult: shouldShowOnboarding(),
            localStorage: getUserScopedItem('onboarding-state')
        })
    }

    const openOnboarding = (forceOpen: boolean = false) => {
        if (forceOpen) {
            setIsOnboardingOpen(true)
            return
        }
        if (shouldShowOnboarding()) {
            if (!onboardingState.hasHiddenGateway) {
                setShowGateway(true)
            } else {
                setIsOnboardingOpen(true)
            }
            saveOnboardingState({ lastShownAt: Date.now() })
        }
    }

    const hideGateway = () => {
        setShowGateway(false)
        saveOnboardingState({ hasHiddenGateway: true })
    }

    const closeOnboarding = () => {
        setIsOnboardingOpen(false)
    }

    const completeOnboarding = () => {
        saveOnboardingState({
            hasCompletedOnboarding: true,
            lastShownAt: Date.now()
        })
        closeOnboarding()
    }

    const skipOnboarding = () => {
        saveOnboardingState({
            hasSkippedOnboarding: true,
            lastShownAt: Date.now()
        })
        closeOnboarding()
    }

    const resetOnboarding = () => {
        saveOnboardingState({
            hasCompletedOnboarding: false,
            hasSkippedOnboarding: false,
            lastShownAt: null
        })
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('reset-onboarding-provider'))
        }
    }

    const contextValue: OnboardingContextType = {
        onboardingState,
        isOnboardingOpen,
        showGateway,
        shouldShowOnboarding,
        openOnboarding,
        closeOnboarding,
        completeOnboarding,
        skipOnboarding,
        hideGateway,
        resetOnboarding,
        debugOnboardingState
    }

    // NOTE: We do NOT use an early return here (e.g. `if (!mounted) return ...`)
    // because that would violate Rules of Hooks — all hooks above must always run.
    // Instead we conditionally render the modal inside the JSX.
    return (
        <OnboardingContext.Provider value={contextValue}>
            {children}
            {mounted && (
                <OnboardingModal
                    isOpen={isOnboardingOpen}
                    onClose={closeOnboarding}
                    onComplete={completeOnboarding}
                    onSkip={skipOnboarding}
                />
            )}
        </OnboardingContext.Provider>
    )
}

export function useOnboarding() {
    const context = useContext(OnboardingContext)
    if (context === undefined) {
        throw new Error('useOnboarding must be used within an OnboardingProvider')
    }
    return context
}
