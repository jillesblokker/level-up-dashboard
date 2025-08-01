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
  const openOnboarding = () => {
    console.log('useOnboarding: openOnboarding called')
    setIsOnboardingOpen(true)
    saveOnboardingState({ lastShownAt: Date.now() })
  }

  // Close onboarding
  const closeOnboarding = () => {
    console.log('useOnboarding: closeOnboarding called')
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