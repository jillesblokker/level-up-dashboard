"use client"

import { useEffect } from 'react'
import { useOnboarding } from '@/hooks/use-onboarding'
import { OnboardingModal } from './onboarding/OnboardingModal'

interface OnboardingProviderProps {
  children: React.ReactNode
}

export function OnboardingProvider({ children }: OnboardingProviderProps) {
  const {
    onboardingState,
    isOnboardingOpen,
    shouldShowOnboarding,
    openOnboarding,
    closeOnboarding,
    completeOnboarding,
    skipOnboarding
  } = useOnboarding()

  // Check if onboarding should be shown on mount
  useEffect(() => {
    if (shouldShowOnboarding()) {
      // Add a small delay to ensure the app is fully loaded
      const timer = setTimeout(() => {
        openOnboarding()
      }, 1000)

      return () => clearTimeout(timer)
    }
  }, [shouldShowOnboarding, openOnboarding])

  return (
    <>
      {children}
      <OnboardingModal
        isOpen={isOnboardingOpen}
        onClose={closeOnboarding}
        onComplete={completeOnboarding}
      />
    </>
  )
} 