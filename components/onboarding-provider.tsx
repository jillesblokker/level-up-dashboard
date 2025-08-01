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
    let timer: NodeJS.Timeout | undefined
    let hasShownOnboarding = false
    let isChecking = false

    const checkIfReady = () => {
      if (isChecking || hasShownOnboarding) return
      
      isChecking = true
      
      // Wait for kingdom animation to complete (usually takes 3-5 seconds)
      const kingdomAnimationComplete = !document.querySelector('.kingdom-animation') || 
        document.querySelector('.kingdom-animation')?.classList.contains('completed');
      
      // Wait for user to be fully loaded
      const userLoaded = typeof window !== 'undefined' && 
        !window.location.pathname.includes('/auth') &&
        !window.location.pathname.includes('/signin') &&
        !window.location.pathname.includes('/signup');
      
      if (kingdomAnimationComplete && userLoaded && !hasShownOnboarding) {
        hasShownOnboarding = true
        // Add additional delay to ensure everything is ready
        timer = setTimeout(() => {
          openOnboarding()
        }, 2000)
      } else if (!hasShownOnboarding) {
        // Check again in 1 second
        setTimeout(checkIfReady, 1000)
      }
      
      isChecking = false
    }

    if (shouldShowOnboarding()) {
      // Start checking after initial load
      setTimeout(checkIfReady, 3000)
    }

    return () => {
      if (timer) {
        clearTimeout(timer)
      }
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