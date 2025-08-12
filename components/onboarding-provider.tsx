"use client"

import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { OnboardingModal } from './onboarding/OnboardingModal'

interface OnboardingProviderProps {
  children: React.ReactNode
}

export function OnboardingProvider({ children }: OnboardingProviderProps) {
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false)
  const [hasShownOnboarding, setHasShownOnboarding] = useState(false)
  
  // Memoize functions to prevent unnecessary re-renders
  const openOnboarding = useCallback(() => {
    setIsOnboardingOpen(true)
  }, [])
  
  const closeOnboarding = useCallback(() => {
    setIsOnboardingOpen(false)
  }, [])
  
  const completeOnboarding = useCallback(() => {
    setHasShownOnboarding(true)
    setIsOnboardingOpen(false)
    // Save to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('onboarding-completed', 'true')
    }
  }, [])
  
  // Check if onboarding should be shown on mount (only once)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const completed = localStorage.getItem('onboarding-completed')
      if (completed === 'true') {
        setHasShownOnboarding(true)
      }
    }
  }, [])
  
  // Expose onboarding functions globally for the guide button (only when isOnboardingOpen changes)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const globalWindow = window as any
      globalWindow.openOnboarding = openOnboarding
      globalWindow.closeOnboarding = closeOnboarding
      globalWindow.completeOnboarding = completeOnboarding
      globalWindow.isOnboardingOpen = isOnboardingOpen
    }
  }, [isOnboardingOpen, openOnboarding, closeOnboarding, completeOnboarding])
  
  // Memoize the modal component to prevent unnecessary re-renders
  const modalComponent = useMemo(() => (
    <OnboardingModal
      isOpen={isOnboardingOpen}
      onClose={closeOnboarding}
      onComplete={completeOnboarding}
    />
  ), [isOnboardingOpen, closeOnboarding, completeOnboarding])
  
  return (
    <>
      {children}
      {modalComponent}
    </>
  )
} 