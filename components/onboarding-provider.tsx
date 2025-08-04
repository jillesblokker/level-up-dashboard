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
  const lastIsOnboardingOpenRef = useRef(isOnboardingOpen)

  // Update refs when functions change
  useEffect(() => {
    openOnboardingRef.current = openOnboarding
    shouldShowOnboardingRef.current = shouldShowOnboarding
  }, [openOnboarding, shouldShowOnboarding])

  // Listen for reset events from the useOnboarding hook
  useEffect(() => {
    const handleResetOnboarding = () => {
      console.log('OnboardingProvider: Received reset-onboarding-provider event')
      hasShownOnboardingRef.current = false
      console.log('OnboardingProvider: Reset hasShownOnboardingRef to false')
    }

    window.addEventListener('reset-onboarding-provider', handleResetOnboarding)
    
    return () => {
      window.removeEventListener('reset-onboarding-provider', handleResetOnboarding)
    }
  }, [])

  // Track state changes and force re-render if needed
  useEffect(() => {
    if (lastIsOnboardingOpenRef.current !== isOnboardingOpen) {
      console.log('OnboardingProvider: State changed from', lastIsOnboardingOpenRef.current, 'to', isOnboardingOpen)
      lastIsOnboardingOpenRef.current = isOnboardingOpen
      
      // Force a re-render if the state changed
      if (isOnboardingOpen) {
        console.log('OnboardingProvider: Forcing re-render for open state')
        // Small delay to ensure state is properly updated
        setTimeout(() => {
          console.log('OnboardingProvider: Re-rendering with isOpen:', isOnboardingOpen)
        }, 0)
      }
    }
  }, [isOnboardingOpen])

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
            console.log('OnboardingProvider: Auto-opening onboarding')
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
  }, []) // Remove isOnboardingOpen dependency to prevent interference

  // Debug: Log modal state and force visibility
  useEffect(() => {
    console.log('OnboardingProvider: isOnboardingOpen changed to:', isOnboardingOpen)
    console.log('OnboardingProvider: hasShownOnboardingRef.current:', hasShownOnboardingRef.current)
    
    // If modal opens, mark as shown to prevent automatic interference
    if (isOnboardingOpen) {
      hasShownOnboardingRef.current = true
      console.log('OnboardingProvider: Marking onboarding as shown to prevent automatic interference')
      
      // Force modal to be visible after a short delay
      setTimeout(() => {
        const modal = document.querySelector('[data-modal-container="onboarding"]') as HTMLElement
        if (modal) {
          console.log('OnboardingProvider: Force ensuring modal visibility')
          modal.style.position = 'fixed'
          modal.style.top = '0'
          modal.style.left = '0'
          modal.style.width = '100vw'
          modal.style.height = '100vh'
          modal.style.zIndex = '9999'
          modal.style.display = 'flex'
          modal.style.alignItems = 'center'
          modal.style.justifyContent = 'center'
          modal.style.backgroundColor = 'rgba(0, 0, 0, 0.8)'
          modal.style.backdropFilter = 'blur(4px)'
          modal.style.visibility = 'visible'
          modal.style.opacity = '1'
          modal.style.border = '3px solid red'
          modal.style.outline = '3px solid yellow'
          modal.style.pointerEvents = 'auto'
          
          // Force modal to be the topmost element
          document.body.appendChild(modal)
          
          console.log('OnboardingProvider: Modal visibility enforced')
        } else {
          console.log('OnboardingProvider: Modal not found in DOM')
        }
      }, 100)
    }
  }, [isOnboardingOpen])

  // Ensure we always render with the latest state
  const modalKey = `onboarding-modal-${isOnboardingOpen ? 'open' : 'closed'}-${Date.now()}`
  
  console.log('OnboardingProvider: Rendering OnboardingModal with isOpen:', isOnboardingOpen, 'key:', modalKey)
  
  return (
    <>
      {children}
      <OnboardingModal
        key={modalKey}
        isOpen={isOnboardingOpen}
        onClose={closeOnboarding}
        onComplete={completeOnboarding}
      />
    </>
  )
} 