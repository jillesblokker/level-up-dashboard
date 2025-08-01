"use client"

import { useEffect, useRef } from 'react'
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

  // Use refs to persist state across re-renders
  const hasShownOnboardingRef = useRef(false)
  const isCheckingRef = useRef(false)

  // Check if onboarding should be shown on mount
  useEffect(() => {
    let timer: NodeJS.Timeout | undefined

    const checkIfReady = () => {
      if (isCheckingRef.current || hasShownOnboardingRef.current) return
      
      isCheckingRef.current = true
      
      // Wait for kingdom animation to complete (usually takes 3-5 seconds)
      const kingdomAnimationComplete = !document.querySelector('.kingdom-animation') || 
        document.querySelector('.kingdom-animation')?.classList.contains('completed');
      
      // Wait for user to be fully loaded
      const userLoaded = typeof window !== 'undefined' && 
        !window.location.pathname.includes('/auth') &&
        !window.location.pathname.includes('/signin') &&
        !window.location.pathname.includes('/signup');
      
      if (kingdomAnimationComplete && userLoaded && !hasShownOnboardingRef.current) {
        hasShownOnboardingRef.current = true
        // Add additional delay to ensure everything is ready
        timer = setTimeout(() => {
          openOnboarding()
        }, 2000)
      } else if (!hasShownOnboardingRef.current) {
        // Check again in 1 second
        setTimeout(checkIfReady, 1000)
      }
      
      isCheckingRef.current = false
    }

    if (shouldShowOnboarding()) {
      console.log('OnboardingProvider: shouldShowOnboarding is true, starting check')
      // Start checking after initial load
      setTimeout(checkIfReady, 3000)
    } else {
      console.log('OnboardingProvider: shouldShowOnboarding is false')
    }

    return () => {
      if (timer) {
        clearTimeout(timer)
      }
    }
  }, [shouldShowOnboarding, openOnboarding])

  // Debug: Log modal state
  useEffect(() => {
    console.log('OnboardingProvider: isOnboardingOpen changed to:', isOnboardingOpen)
  }, [isOnboardingOpen])

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