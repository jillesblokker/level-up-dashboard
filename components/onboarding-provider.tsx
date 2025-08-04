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
  const openOnboardingRef = useRef(openOnboarding)
  const shouldShowOnboardingRef = useRef(shouldShowOnboarding)

  // Update refs when functions change
  useEffect(() => {
    openOnboardingRef.current = openOnboarding
    shouldShowOnboardingRef.current = shouldShowOnboarding
  }, [openOnboarding, shouldShowOnboarding])

  // Check if onboarding should be shown on mount (only for automatic opening)
  useEffect(() => {
    let timer: NodeJS.Timeout | undefined

    const checkIfReady = () => {
      if (isCheckingRef.current || hasShownOnboardingRef.current) return
      
      isCheckingRef.current = true
      
      // Wait for kingdom animation to complete (usually takes 3-5 seconds)
      const kingdomAnimationComplete = !document.querySelector('.kingdom-animation') || 
        document.querySelector('.kingdom-animation')?.classList.contains('completed');
      
      // Wait for user to be fully loaded and authenticated
      const userLoaded = typeof window !== 'undefined' && 
        !window.location.pathname.includes('/auth') &&
        !window.location.pathname.includes('/signin') &&
        !window.location.pathname.includes('/signup') &&
        !window.location.pathname.includes('/login') &&
        window.location.pathname !== '/';
      
      // Only auto-open if onboarding is not already open
      if (kingdomAnimationComplete && userLoaded && !hasShownOnboardingRef.current && !isOnboardingOpen) {
        hasShownOnboardingRef.current = true
        // Add additional delay to ensure everything is ready
        timer = setTimeout(() => {
          // Only call if onboarding is still not open (to prevent conflicts)
          if (!isOnboardingOpen) {
            openOnboardingRef.current(true) // Force open for automatic display
          }
        }, 2000)
      } else if (!hasShownOnboardingRef.current && !isOnboardingOpen) {
        // Check again in 1 second, but only if onboarding is not open
        setTimeout(checkIfReady, 1000)
      }
      
      isCheckingRef.current = false
    }

    // Only run automatic onboarding check if onboarding is not currently open
    // AND if we haven't already shown it manually
    if (shouldShowOnboardingRef.current() && !isOnboardingOpen && !hasShownOnboardingRef.current) {
      console.log('OnboardingProvider: shouldShowOnboarding is true, starting check')
      // Start checking after initial load
      setTimeout(checkIfReady, 3000)
    } else if (isOnboardingOpen) {
      // If onboarding is open (either manually or automatically), don't interfere
      console.log('OnboardingProvider: Onboarding is currently open, skipping automatic check')
      // Mark as shown to prevent future automatic checks
      hasShownOnboardingRef.current = true
    } else {
      console.log('OnboardingProvider: shouldShowOnboarding is false OR already shown - manual opening should still work')
      // Don't interfere with manual opening - let the useOnboarding hook handle it
    }

    return () => {
      if (timer) {
        clearTimeout(timer)
      }
    }
  }, [isOnboardingOpen]) // Only depend on isOnboardingOpen

  // Debug: Log modal state
  useEffect(() => {
    console.log('OnboardingProvider: isOnboardingOpen changed to:', isOnboardingOpen)
    
    // If modal opens, mark as shown to prevent automatic interference
    if (isOnboardingOpen) {
      hasShownOnboardingRef.current = true
    }
  }, [isOnboardingOpen])

  return (
    <>
      {children}
      <OnboardingModal
        isOpen={isOnboardingOpen}
        onClose={closeOnboarding}
        onComplete={completeOnboarding}
      />
      {console.log('OnboardingProvider: Rendering OnboardingModal with isOpen:', isOnboardingOpen)}
    </>
  )
} 