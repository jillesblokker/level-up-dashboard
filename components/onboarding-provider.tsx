"use client"

import { useEffect, useRef, useState } from 'react'
import { OnboardingModal } from './onboarding/OnboardingModal'

interface OnboardingProviderProps {
  children: React.ReactNode
}

export function OnboardingProvider({ children }: OnboardingProviderProps) {
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false)
  const [hasShownOnboarding, setHasShownOnboarding] = useState(false)

  // Simple onboarding state management
  const openOnboarding = () => {
    console.log('OnboardingProvider: Opening onboarding')
    setIsOnboardingOpen(true)
  }

  const closeOnboarding = () => {
    console.log('OnboardingProvider: Closing onboarding')
    setIsOnboardingOpen(false)
    // Save to localStorage so it doesn't automatically reopen
    if (typeof window !== 'undefined') {
      localStorage.setItem('onboarding-completed', 'true')
    }
  }

  const completeOnboarding = () => {
    console.log('OnboardingProvider: Completing onboarding')
    setHasShownOnboarding(true)
    setIsOnboardingOpen(false)
    // Save to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('onboarding-completed', 'true')
    }
  }

  // Check if onboarding should be shown on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const completed = localStorage.getItem('onboarding-completed')
      if (completed !== 'true') {
        // Delay slightly to ensure smooth rendering
        setTimeout(() => setIsOnboardingOpen(true), 500)
      } else {
        setHasShownOnboarding(true)
      }
    }
  }, [])

  // Expose onboarding functions globally for the guide button
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const globalWindow = window as any
      globalWindow.openOnboarding = openOnboarding
      globalWindow.closeOnboarding = closeOnboarding
      globalWindow.completeOnboarding = completeOnboarding
      globalWindow.isOnboardingOpen = isOnboardingOpen
    }
  }, [isOnboardingOpen])

  console.log('OnboardingProvider: Rendering with isOpen:', isOnboardingOpen)

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