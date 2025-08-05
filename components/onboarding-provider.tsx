"use client"

import { useEffect, useRef } from 'react'
// import { useOnboarding } from '@/hooks/use-onboarding'
// import { OnboardingModal } from './onboarding/OnboardingModal'

interface OnboardingProviderProps {
  children: React.ReactNode
}

export function OnboardingProvider({ children }: OnboardingProviderProps) {
  console.log('OnboardingProvider: Temporarily disabled to prevent crashes')
  
  // Temporarily disabled all onboarding functionality
  return (
    <>
      {children}
      {/* OnboardingModal temporarily disabled */}
    </>
  )
} 