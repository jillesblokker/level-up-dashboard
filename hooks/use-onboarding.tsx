"use client"

import { useState, useEffect, createContext, useContext, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { getUserScopedItem, setUserScopedItem } from '@/lib/user-scoped-storage'
import { smartLogger } from '@/lib/smart-logger'

interface OnboardingState {
  hasCompletedOnboarding: boolean
  hasSkippedOnboarding: boolean
  lastShownAt: number | null
}

interface OnboardingContextType {
  onboardingState: OnboardingState
  isOnboardingOpen: boolean
  shouldShowOnboarding: () => boolean
  openOnboarding: (forceOpen?: boolean) => void
  closeOnboarding: () => void
  completeOnboarding: () => void
  skipOnboarding: () => void
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
    lastShownAt: null
  })
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false)

  // Debug: Log state changes
  useEffect(() => {
    smartLogger.debug('useOnboarding', 'STATE_CHANGED', {
      isOnboardingOpen,
      onboardingState,
      timestamp: Date.now()
    })
  }, [isOnboardingOpen, onboardingState])

  // Load onboarding state from localStorage
  useEffect(() => {
    const savedState = getUserScopedItem('onboarding-state')
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState)
        setOnboardingState(parsed)
        smartLogger.info('useOnboarding', 'STATE_LOADED', {
          loadedState: parsed,
          source: 'localStorage'
        })
      } catch (error) {
        smartLogger.error('useOnboarding', 'STATE_PARSE_ERROR', {
          error: error instanceof Error ? error.message : String(error),
          savedState
        })
      }
    } else {
      smartLogger.info('useOnboarding', 'NO_SAVED_STATE', {
        message: 'No saved onboarding state found'
      })
    }
  }, [])

  // Save onboarding state to localStorage
  const saveOnboardingState = (newState: Partial<OnboardingState>) => {
    const updatedState = { ...onboardingState, ...newState }
    setOnboardingState(updatedState)
    setUserScopedItem('onboarding-state', JSON.stringify(updatedState))

    smartLogger.info('useOnboarding', 'STATE_SAVED', {
      previousState: onboardingState,
      newState: updatedState,
      changes: newState
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
      smartLogger.info('useOnboarding', 'OPEN_ONBOARDING_NORMAL', {
        action: 'normal_open',
        reason: 'should_show_is_true',
        shouldShowResult: shouldShowOnboarding()
      })
      setIsOnboardingOpen(true)
      saveOnboardingState({ lastShownAt: Date.now() })
    } else {
      smartLogger.info('useOnboarding', 'OPEN_ONBOARDING_SKIPPED', {
        action: 'skip_open',
        reason: 'should_show_is_false',
        shouldShowResult: shouldShowOnboarding(),
        onboardingState: onboardingState
      })
    }
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
    shouldShowOnboarding,
    openOnboarding,
    closeOnboarding,
    completeOnboarding,
    skipOnboarding,
    resetOnboarding,
    debugOnboardingState
  }

  return (
    <OnboardingContext.Provider value={contextValue}>
      {children}
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