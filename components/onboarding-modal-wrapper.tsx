"use client"

import { useEffect, useRef } from 'react'
import { useOnboarding } from '@/hooks/use-onboarding'
import { OnboardingModal } from './onboarding/OnboardingModal'

export function OnboardingModalWrapper() {
  const {
    isOnboardingOpen,
    closeOnboarding,
    completeOnboarding
  } = useOnboarding()

  // Use refs to persist state across re-renders
  const hasShownOnboardingRef = useRef(false)
  const isCheckingRef = useRef(false)
  const lastIsOnboardingOpenRef = useRef(isOnboardingOpen)

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
    if (lastIsOnboardingOpenRef.current !== isOnboardingOpen) {
      lastIsOnboardingOpenRef.current = isOnboardingOpen
    }
  }, [isOnboardingOpen])

  // Ensure we always render with the latest state
  const modalKey = `onboarding-modal-${isOnboardingOpen ? 'open' : 'closed'}-${Date.now()}`
  
  return (
    <OnboardingModal
      key={modalKey}
      isOpen={isOnboardingOpen}
      onClose={closeOnboarding}
      onComplete={completeOnboarding}
    />
  )
} 