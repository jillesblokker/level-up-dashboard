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

    if (shouldShowOnboarding()) {
      // Wait for kingdom animation and user to be fully loaded
      // Check if we're on the main page and kingdom animation is complete
      const checkIfReady = () => {
        // Wait for kingdom animation to complete (usually takes 3-5 seconds)
        const kingdomAnimationComplete = !document.querySelector('.kingdom-animation') || 
          document.querySelector('.kingdom-animation')?.classList.contains('completed');
        
        // Wait for user to be fully loaded
        const userLoaded = typeof window !== 'undefined' && 
          !window.location.pathname.includes('/auth') &&
          !window.location.pathname.includes('/signin') &&
          !window.location.pathname.includes('/signup');
        
        if (kingdomAnimationComplete && userLoaded) {
          // Add additional delay to ensure everything is ready
          timer = setTimeout(() => {
            openOnboarding()
          }, 2000)
        } else {
          // Check again in 500ms
          setTimeout(checkIfReady, 500)
        }
      }
      
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