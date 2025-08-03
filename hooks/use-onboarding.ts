import { useState, useEffect } from 'react'

interface OnboardingState {
  hasCompletedOnboarding: boolean
  hasSkippedOnboarding: boolean
  lastShownAt: number | null
}

export function useOnboarding() {
  const [onboardingState, setOnboardingState] = useState<OnboardingState>({
    hasCompletedOnboarding: false,
    hasSkippedOnboarding: false,
    lastShownAt: null
  })
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false)

  // Debug: Log state changes
  useEffect(() => {
    console.log('useOnboarding: isOnboardingOpen changed to:', isOnboardingOpen)
  }, [isOnboardingOpen])

  // Load onboarding state from localStorage
  useEffect(() => {
    const savedState = localStorage.getItem('onboarding-state')
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState)
        setOnboardingState(parsed)
      } catch (error) {
        console.error('Failed to parse onboarding state:', error)
      }
    }
  }, [])

  // Save onboarding state to localStorage
  const saveOnboardingState = (newState: Partial<OnboardingState>) => {
    const updatedState = { ...onboardingState, ...newState }
    setOnboardingState(updatedState)
    localStorage.setItem('onboarding-state', JSON.stringify(updatedState))
  }

  // Check if onboarding should be shown
  const shouldShowOnboarding = () => {
    // Show if never completed and never skipped
    if (!onboardingState.hasCompletedOnboarding && !onboardingState.hasSkippedOnboarding) {
      return true
    }

    // Show if completed but it's been more than 30 days
    if (onboardingState.hasCompletedOnboarding && onboardingState.lastShownAt) {
      const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000)
      if (onboardingState.lastShownAt < thirtyDaysAgo) {
        return true
      }
    }

    return false
  }

  // Debug function to check onboarding state
  const debugOnboardingState = () => {
    console.log('Onboarding State:', onboardingState)
    console.log('Should Show:', shouldShowOnboarding())
    console.log('Is Open:', isOnboardingOpen)
  }

  // Open onboarding
  const openOnboarding = (forceOpen: boolean = false) => {
    console.log('useOnboarding: openOnboarding called', forceOpen ? '(forced)' : '')
    
    // If forceOpen is true, always open regardless of state
    if (forceOpen) {
      console.log('useOnboarding: Force opening onboarding')
      setIsOnboardingOpen(true)
      // Don't update lastShownAt when force opening to prevent immediate closure
      return
    }
    
    // Otherwise, check if it should be shown
    if (shouldShowOnboarding()) {
      console.log('useOnboarding: Opening onboarding (should show is true)')
      setIsOnboardingOpen(true)
      saveOnboardingState({ lastShownAt: Date.now() })
    } else {
      console.log('useOnboarding: Not opening onboarding (should show is false)')
    }
  }

  // Close onboarding
  const closeOnboarding = () => {
    console.log('useOnboarding: closeOnboarding called')
    console.log('useOnboarding: closeOnboarding stack trace:', new Error().stack)
    setIsOnboardingOpen(false)
  }

  // Complete onboarding
  const completeOnboarding = () => {
    saveOnboardingState({
      hasCompletedOnboarding: true,
      lastShownAt: Date.now()
    })
    closeOnboarding()
  }

  // Skip onboarding
  const skipOnboarding = () => {
    saveOnboardingState({
      hasSkippedOnboarding: true,
      lastShownAt: Date.now()
    })
    closeOnboarding()
  }

  // Reset onboarding (for testing or admin purposes)
  const resetOnboarding = () => {
    saveOnboardingState({
      hasCompletedOnboarding: false,
      hasSkippedOnboarding: false,
      lastShownAt: null
    })
  }

  return {
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
} 