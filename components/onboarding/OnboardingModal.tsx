"use client"

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { X, ChevronLeft, ChevronRight, BookOpen } from 'lucide-react'
import { cn } from '@/lib/utils'
import { smartLogger } from '@/lib/smart-logger'
import { OnboardingProgress } from './OnboardingProgress'
import { OnboardingSkip } from './OnboardingSkip'
import { WelcomeStep } from './OnboardingSteps/WelcomeStep'
import { QuestStep } from './OnboardingSteps/QuestStep'
import { ChallengesStep } from './OnboardingSteps/ChallengesStep'
import { GoldStep } from './OnboardingSteps/GoldStep'
import { TileStep } from './OnboardingSteps/TileStep'
import { KingdomStep } from './OnboardingSteps/KingdomStep'
import { ProgressionStep } from './OnboardingSteps/ProgressionStep'
import { CompleteStep } from './OnboardingSteps/CompleteStep'
import { createPortal } from 'react-dom'

interface OnboardingModalProps {
  isOpen: boolean
  onClose: () => void
  onComplete: () => void
}

export type OnboardingStep = {
  id: string
  title: string
  subtitle: string
  component: React.ComponentType<any>
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Thrivehaven',
    subtitle: 'Every adventure is in need for a quest to achieve greatness',
    component: WelcomeStep
  },
  {
    id: 'quests',
    title: 'Complete Quests',
    subtitle: 'Earn gold and experience through daily tasks',
    component: QuestStep
  },
  {
    id: 'challenges',
    title: 'Take on Challenges',
    subtitle: 'Higher stakes quests with greater rewards',
    component: ChallengesStep
  },
  {
    id: 'gold',
    title: 'Earn Gold',
    subtitle: 'Use your rewards to build your kingdom',
    component: GoldStep
  },
  {
    id: 'tiles',
    title: 'Buy & Place Tiles',
    subtitle: 'Build your kingdom one tile at a time',
    component: TileStep
  },
  {
    id: 'kingdom',
    title: 'Create Your Kingdom',
    subtitle: 'Watch your realm grow with every tile',
    component: KingdomStep
  },
  {
    id: 'progression',
    title: 'Level Up & Unlock',
    subtitle: 'Gain experience and unlock new content',
    component: ProgressionStep
  },
  {
    id: 'complete',
    title: "You&apos;re Ready!",
    subtitle: 'Your kingdom awaits',
    component: CompleteStep
  }
]

export function OnboardingModal({ isOpen, onClose, onComplete }: OnboardingModalProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set())
  const [isSkipping, setIsSkipping] = useState(false)
  const [canClose, setCanClose] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  
  // Ensure component is mounted before using portal
  useEffect(() => {
    setIsMounted(true)
  }, [])
  
  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      smartLogger.info('OnboardingModal', 'MODAL_OPENED', {
        action: 'reset_state',
        previousStep: currentStep,
        previousCompletedSteps: Array.from(completedSteps),
        triggerSource: 'force_open_from_guide_button',
        timestamp: new Date().toISOString()
      })
      
      setCurrentStep(0)
      setCompletedSteps(new Set())
      setIsSkipping(false)
      setCanClose(false)
    }
  }, [isOpen])

  // Focus management - focus the modal container when it opens
  useEffect(() => {
    if (isOpen) {
      // Don't focus anything automatically - let user interact naturally
      
      // Debug: Check if modal is in DOM and ensure it's visible
      setTimeout(() => {
        const modal = document.querySelector('[data-modal-container="onboarding-standalone"]') as HTMLElement || 
                     document.querySelector('[data-modal-container="onboarding"]') as HTMLElement
        if (modal) {
          
          
          smartLogger.info('OnboardingModal', 'VISIBILITY_ENFORCED', {
            action: 'enforce_modal_visibility',
            modalFound: true
          })
        } else {
          smartLogger.error('OnboardingModal', 'MODAL_NOT_FOUND', {
            action: 'modal_not_found_in_dom',
            selector: '[data-modal-container="onboarding-standalone"]'
          })
        }
      }, 100)
    }
  }, [isOpen])

  // Track onClose calls
  const handleClose = () => {
    if (!canClose) {
      return
    }
    
    onClose()
  }
  
  // Debug canClose changes
  useEffect(() => {
  }, [canClose])

  const handleNext = () => {
    // Only allow progression if user actually clicked the button
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      setCompletedSteps(prev => new Set([...prev, currentStep]))
      setCurrentStep(currentStep + 1)
    } else {
      // Complete onboarding when user clicks "Start Playing"
      handleComplete()
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleComplete = () => {
    setCompletedSteps(prev => new Set([...prev, currentStep]))
    onComplete()
    handleClose()
  }

  const handleSkip = () => {
    setIsSkipping(true)
  }

  const handleSkipConfirm = () => {
    handleClose()
  }

  const handleSkipCancel = () => {
    setIsSkipping(false)
  }

  const currentStepData = ONBOARDING_STEPS[currentStep] as OnboardingStep | undefined
  
  // Safety check for undefined currentStepData
  if (!currentStepData) {
    return null
  }
  
  const CurrentStepComponent = currentStepData.component
  const progress = ((currentStep + 1) / ONBOARDING_STEPS.length) * 100
  
  const currentStepComponent = React.createElement(ONBOARDING_STEPS[currentStep]?.component || WelcomeStep, {
    onNext: handleNext,
    onPrevious: handlePrevious,
    isFirstStep: currentStep === 0,
    isLastStep: currentStep === ONBOARDING_STEPS.length - 1,
    stepData: { currentStep, totalSteps: ONBOARDING_STEPS.length }
  })

  // Don't render anything until mounted
  if (!isMounted) {
    return null
  }

  // Don't render if not open
  if (!isOpen) {
    return null
  }

  // Create portal content with aggressive debugging styles
  const modalContent = (
    <div
      data-modal-container="onboarding-standalone"
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6",
        "bg-black/80 backdrop-blur-sm",
        "transition-all duration-300 ease-in-out",
        isOpen ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"
      )}
    >
      <div className="relative w-full max-w-3xl max-h-[90vh] mx-auto flex flex-col">
        <Card className="relative overflow-hidden flex flex-col max-h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 sm:p-6 border-b bg-gradient-to-r from-amber-600 to-amber-700 flex-shrink-0">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
                <BookOpen className="w-4 h-4 text-amber-800" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-white">Welcome to Thrivehaven</h2>
                <p className="text-amber-100 text-sm">Let&apos;s get you started on your journey</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-white hover:bg-amber-700 hover:text-white"
              aria-label="Close onboarding"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Content - Scrollable */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            <div className="min-h-[250px] sm:min-h-[350px]">
              {currentStepComponent}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-4 sm:p-6 border-t bg-gray-50 flex-shrink-0">
            <div className="flex items-center space-x-2">
              <div className="flex space-x-1">
                {ONBOARDING_STEPS.map((_, index) => (
                  <div
                    key={index}
                    className={cn(
                      "w-2 h-2 rounded-full transition-colors",
                      index === currentStep ? "bg-amber-600" : "bg-gray-300"
                    )}
                  />
                ))}
              </div>
              <span className="text-sm text-gray-600 hidden sm:inline">
                Step {currentStep + 1} of {ONBOARDING_STEPS.length}
              </span>
            </div>
            
            <div className="flex space-x-2">
              {currentStep > 0 && (
                <Button
                  variant="outline"
                  onClick={handlePrevious}
                  aria-label="Previous step"
                  size="sm"
                  className="sm:size-default border-amber-500 text-amber-900 hover:bg-amber-50 font-semibold"
                >
                  <span className="hidden sm:inline">Previous</span>
                  <span className="sm:hidden">←</span>
                </Button>
              )}
              
              {currentStep < ONBOARDING_STEPS.length - 1 ? (
                <Button 
                  onClick={handleNext} 
                  aria-label="Next step"
                  size="sm"
                  className="sm:size-default bg-amber-600 hover:bg-amber-700 text-white"
                >
                  <span className="hidden sm:inline">Next</span>
                  <span className="sm:hidden">→</span>
                </Button>
              ) : (
                <Button 
                  onClick={handleComplete} 
                  aria-label="Complete onboarding"
                  size="sm"
                  className="sm:size-default bg-amber-600 hover:bg-amber-700 text-white"
                >
                  <span className="hidden sm:inline">Get Started</span>
                  <span className="sm:hidden">Start</span>
                </Button>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  )

  // Use portal to render modal at the top level of the DOM
  if (typeof window !== 'undefined' && document.body) {
    return createPortal(modalContent, document.body)
  }
  
  return modalContent
} 