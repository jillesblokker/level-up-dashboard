"use client"

import { useEffect, useRef, useState } from 'react'
import { OnboardingModal } from './onboarding/OnboardingModal'

export function OnboardingModalWrapper() {
  const [isClient, setIsClient] = useState(false);
  const [onboardingState, setOnboardingState] = useState({
    isOnboardingOpen: false,
    closeOnboarding: () => {},
    completeOnboarding: () => {}
  });

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isClient) {
      try {
        const { useOnboarding } = require('@/hooks/use-onboarding');
        const hook = useOnboarding();
        setOnboardingState(hook);
      } catch (error) {
        console.warn('Onboarding hook not available:', error);
      }
    }
  }, [isClient]);

  // Use refs to persist state across re-renders
  const hasShownOnboardingRef = useRef(false)
  const isCheckingRef = useRef(false)
  const lastIsOnboardingOpenRef = useRef(onboardingState.isOnboardingOpen)

  // Listen for reset events from the useOnboarding hook
  useEffect(() => {
    const handleResetOnboarding = () => {
      hasShownOnboardingRef.current = false
    }

    window.addEventListener('reset-onboarding-provider', handleResetOnboarding)
    
    return () => {
      window.removeEventListener('reset-onboarding-provider', handleResetOnboarding)
    }
  }, [])

  // Track state changes
  useEffect(() => {
    if (lastIsOnboardingOpenRef.current !== onboardingState.isOnboardingOpen) {
      lastIsOnboardingOpenRef.current = onboardingState.isOnboardingOpen
    }
  }, [onboardingState.isOnboardingOpen])

  // Don't render until client-side
  if (!isClient) {
    return null;
  }

  // Ensure we always render with the latest state
  const modalKey = `onboarding-modal-${onboardingState.isOnboardingOpen ? 'open' : 'closed'}-${Date.now()}`
  
  return (
    <OnboardingModal
      key={modalKey}
      isOpen={onboardingState.isOnboardingOpen}
      onClose={onboardingState.closeOnboarding}
      onComplete={onboardingState.completeOnboarding}
    />
  )
} 