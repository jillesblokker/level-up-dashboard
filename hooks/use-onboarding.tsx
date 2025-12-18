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
    const [onboardingState, setOnboardingState] = useState<OnboardingState>({
        hasCompletedOnboarding: false,
        hasSkippedOnboarding: false,
        hasHiddenGateway: false,
        lastShownAt: null
    })
    const [isOnboardingOpen, setIsOnboardingOpen] = useState(false)
    const [showGateway, setShowGateway] = useState(false)

    // Debug: Log state changes
    useEffect(() => {
        smartLogger.debug('useOnboarding', 'STATE_CHANGED', {
            isOnboardingOpen,
            onboardingState,
            timestamp: Date.now()
        })
    }, [isOnboardingOpen, onboardingState])

    const { user, isLoaded: isUserLoaded } = useUser()

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
                if (dbState) {
                    setOnboardingState(dbState)
                    // Update local storage to match DB
                    setUserScopedItem('onboarding-state', JSON.stringify(dbState))
                    smartLogger.info('useOnboarding', 'SYNC_FROM_DB_COMPLETE', { dbState })
                }
            })
        }
    }, [user, isUserLoaded])

    // Save onboarding state to localStorage and Supabase
    const saveOnboardingState = (newState: Partial<OnboardingState>) => {
        const updatedState = { ...onboardingState, ...newState }
        setOnboardingState(updatedState)
        setUserScopedItem('onboarding-state', JSON.stringify(updatedState))

        // Save to DB if logged in
        if (user) {
            setUserPreference('onboarding-state', updatedState)
        }

        smartLogger.info('useOnboarding', 'STATE_SAVED', {
            previousState: onboardingState,
            newState: updatedState,
            changes: newState,
            persistedInDB: !!user
        })
    }

    // Check if onboarding should be shown
    const shouldShowOnboarding = () => {
        smartLogger.debug('useOnboarding', 'SHOULD_SHOW_CHECK', {
            currentState: onboardingState,
            stackTrace: new Error().stack
        })

        // Show if never completed and never skipped
        if (!onboardingState.hasCompletedOnboarding && !onboardingState.hasSkippedOnboarding) {
            smartLogger.info('useOnboarding', 'SHOULD_SHOW_TRUE', {
                reason: 'never_completed_or_skipped',
                state: onboardingState
            })
            return true
        }

        // Show if completed but it's been more than 30 days
        if (onboardingState.hasCompletedOnboarding && onboardingState.lastShownAt) {
            const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000)
            if (onboardingState.lastShownAt < thirtyDaysAgo) {
                smartLogger.info('useOnboarding', 'SHOULD_SHOW_TRUE', {
                    reason: 'completed_but_30_days_ago',
                    lastShownAt: onboardingState.lastShownAt,
                    thirtyDaysAgo,
                    daysSinceLastShown: Math.floor((Date.now() - onboardingState.lastShownAt) / (24 * 60 * 60 * 1000))
                })
                return true
            }
        }

        smartLogger.info('useOnboarding', 'SHOULD_SHOW_FALSE', {
            reason: 'conditions_not_met',
            state: onboardingState
        })
        return false
    }

    // Debug function to log current state
    const debugOnboardingState = () => {
        smartLogger.info('useOnboarding', 'DEBUG_STATE', {
            onboardingState,
            isOnboardingOpen,
            shouldShowResult: shouldShowOnboarding(),
            localStorage: getUserScopedItem('onboarding-state')
        })
    }

    // Open onboarding
    const openOnboarding = (forceOpen: boolean = false) => {
        smartLogger.info('useOnboarding', 'OPEN_ONBOARDING_CALLED', {
            forceOpen,
            currentIsOnboardingOpen: isOnboardingOpen,
            currentOnboardingState: onboardingState,
            callStack: new Error().stack?.split('\n').slice(1, 4).join('\n'),
            timestamp: new Date().toISOString()
        })

        // If forceOpen is true, always open regardless of state
        if (forceOpen) {
            smartLogger.info('useOnboarding', 'FORCE_OPEN_ONBOARDING', {
                action: 'force_open',
                previousState: isOnboardingOpen,
                reason: 'manual_trigger_override',
                bypassChecks: true
            })
            setIsOnboardingOpen(true)
            // Don't update lastShownAt when force opening to prevent immediate closure
            smartLogger.info('useOnboarding', 'FORCE_OPEN_COMPLETE', {
                newState: true,
                message: 'Modal should now be visible',
                nextSteps: [
                    'OnboardingModal should receive isOpen=true',
                    'Modal should reset internal state',
                    'Modal should become visible to user'
                ]
            })
            return
        }

        // Otherwise, check if it should be shown
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

    // Close onboarding
    const closeOnboarding = () => {
        smartLogger.info('useOnboarding', 'CLOSE_ONBOARDING', {
            action: 'close_onboarding',
            previousState: isOnboardingOpen
        })
        setIsOnboardingOpen(false)
    }

    // Complete onboarding
    const completeOnboarding = () => {
        smartLogger.info('useOnboarding', 'COMPLETE_ONBOARDING', {
            action: 'complete_onboarding',
            stackTrace: new Error().stack
        })
        saveOnboardingState({
            hasCompletedOnboarding: true,
            lastShownAt: Date.now()
        })
        closeOnboarding()
    }

    // Skip onboarding
    const skipOnboarding = () => {
        smartLogger.info('useOnboarding', 'SKIP_ONBOARDING', {
            action: 'skip_onboarding'
        })
        saveOnboardingState({
            hasSkippedOnboarding: true,
            lastShownAt: Date.now()
        })
        closeOnboarding()
    }

    // Reset onboarding (for testing or admin purposes)
    const resetOnboarding = () => {
        smartLogger.info('useOnboarding', 'RESET_ONBOARDING', {
            action: 'reset_onboarding',
            previousState: onboardingState
        })
        saveOnboardingState({
            hasCompletedOnboarding: false,
            hasSkippedOnboarding: false,
            lastShownAt: null
        })

        // Also reset the provider's hasShownOnboardingRef if it exists
        if (typeof window !== 'undefined') {
            // Dispatch a custom event to reset the provider's state
            window.dispatchEvent(new CustomEvent('reset-onboarding-provider'))
            smartLogger.info('useOnboarding', 'RESET_EVENT_DISPATCHED', {
                event: 'reset-onboarding-provider',
                message: 'Event dispatched to reset provider state'
            })
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

    return (
        <OnboardingContext.Provider value={contextValue}>
            {children}
            <OnboardingModal
                isOpen={isOnboardingOpen}
                onClose={closeOnboarding}
                onComplete={completeOnboarding}
            />
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
