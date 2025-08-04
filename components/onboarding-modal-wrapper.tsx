"use client"

import { useEffect, useRef } from 'react'
import { useOnboarding } from '@/hooks/use-onboarding'
import { OnboardingModal } from './onboarding/OnboardingModal'

export function OnboardingModalWrapper() {
  console.log('OnboardingModalWrapper: Component re-rendered')
  
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
      console.log('OnboardingModalWrapper: Received reset-onboarding-provider event')
      hasShownOnboardingRef.current = false
      console.log('OnboardingModalWrapper: Reset hasShownOnboardingRef to false')
    }

    window.addEventListener('reset-onboarding-provider', handleResetOnboarding)
    
    return () => {
      window.removeEventListener('reset-onboarding-provider', handleResetOnboarding)
    }
  }, [])

  // Track state changes and force re-render if needed
  useEffect(() => {
    console.log('OnboardingModalWrapper: isOnboardingOpen changed to:', isOnboardingOpen)
    console.log('OnboardingModalWrapper: hasShownOnboardingRef.current:', hasShownOnboardingRef.current)
    
    if (lastIsOnboardingOpenRef.current !== isOnboardingOpen) {
      console.log('OnboardingModalWrapper: State changed from', lastIsOnboardingOpenRef.current, 'to', isOnboardingOpen)
      lastIsOnboardingOpenRef.current = isOnboardingOpen
      
      // Force a re-render if the state changed
      if (isOnboardingOpen) {
        console.log('OnboardingModalWrapper: Forcing re-render for open state')
        // Small delay to ensure state is properly updated
        setTimeout(() => {
          console.log('OnboardingModalWrapper: Re-rendering with isOpen:', isOnboardingOpen)
        }, 0)
      }
    }
  }, [isOnboardingOpen])

  // Debug: Log modal state and force visibility
  useEffect(() => {
    console.log('OnboardingModalWrapper: isOnboardingOpen changed to:', isOnboardingOpen)
    console.log('OnboardingModalWrapper: hasShownOnboardingRef.current:', hasShownOnboardingRef.current)
    
    // If modal opens, mark as shown to prevent automatic interference
    if (isOnboardingOpen) {
      hasShownOnboardingRef.current = true
      console.log('OnboardingModalWrapper: Marking onboarding as shown to prevent automatic interference')
      
      // Force modal to be visible after a short delay
      setTimeout(() => {
        const modal = document.querySelector('[data-modal-container="onboarding-standalone"]') as HTMLElement ||
                     document.querySelector('[data-modal-container="onboarding"]') as HTMLElement
        if (modal) {
          console.log('OnboardingModalWrapper: Force ensuring modal visibility')
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
          
          console.log('OnboardingModalWrapper: Modal visibility enforced')
        } else {
          console.log('OnboardingModalWrapper: Modal not found in DOM')
        }
      }, 100)
    }
  }, [isOnboardingOpen])

  // Ensure we always render with the latest state
  const modalKey = `onboarding-modal-${isOnboardingOpen ? 'open' : 'closed'}-${Date.now()}`
  
  console.log('OnboardingModalWrapper: Rendering OnboardingModal with isOpen:', isOnboardingOpen, 'key:', modalKey)
  
  return (
    <OnboardingModal
      key={modalKey}
      isOpen={isOnboardingOpen}
      onClose={closeOnboarding}
      onComplete={completeOnboarding}
    />
  )
} 