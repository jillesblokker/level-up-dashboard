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
        "fixed inset-0 z-50 flex items-center justify-center",
        "bg-black/80 backdrop-blur-sm",
        "transition-all duration-300 ease-in-out",
        isOpen ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"
      )}

    >


      <div className="relative w-full max-w-4xl mx-4 flex flex-col items-center justify-center h-full max-h-[90vh]">
        <Card className="relative w-full overflow-hidden flex flex-col bg-gray-950 border-amber-900/40 shadow-2xl text-gray-100">
          {/* Header */}
          <div className="flex-none flex items-center justify-between p-4 md:p-6 border-b border-amber-900/30 bg-gradient-to-r from-amber-900/80 to-black/80">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-amber-500/20 border border-amber-500/40 rounded-full flex items-center justify-center backdrop-blur-sm">
                <BookOpen className="w-4 h-4 text-amber-400" />
              </div>
              <div>
                <h2 className="text-lg md:text-xl font-bold text-white font-serif tracking-wide">Welcome to Thrivehaven</h2>
                <p className="text-amber-200/60 text-xs md:text-sm">Let&apos;s get you started on your journey</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-amber-200/60 hover:text-white hover:bg-amber-900/40"
              aria-label="Close onboarding"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Content - Scrollable Area */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar bg-black/40">
            <div className="min-h-[300px] flex flex-col justify-center">
              {currentStepComponent}
            </div>
          </div>

          {/* Footer */}
          <div className="flex-none flex items-center justify-between p-4 md:p-6 border-t border-amber-900/30 bg-black/60 backdrop-blur-sm">
            <div className="flex items-center space-x-3">
              <div className="flex space-x-1.5">
                {ONBOARDING_STEPS.map((_, index) => (
                  <div
                    key={index}
                    className={cn(
                      "w-1.5 h-1.5 rounded-full transition-all duration-300",
                      index === currentStep
                        ? "bg-amber-500 w-4 shadow-[0_0_8px_rgba(245,158,11,0.5)]"
                        : "bg-gray-700"
                    )}
                  />
                ))}
              </div>
              <span className="text-xs text-amber-500/60 font-medium">
                Step {currentStep + 1} of {ONBOARDING_STEPS.length}
              </span>
            </div>

            <div className="flex space-x-3">
              {currentStep > 0 && (
                <Button
                  variant="ghost"
                  onClick={handlePrevious}
                  className="text-amber-200/60 hover:text-white hover:bg-amber-900/20"
                  aria-label="Previous step"
                >
                  Back
                </Button>
              )}

              {currentStep < ONBOARDING_STEPS.length - 1 ? (
                <Button
                  onClick={handleNext}
                  className="bg-amber-600 hover:bg-amber-500 text-white border border-amber-500/50 shadow-[0_0_10px_rgba(217,119,6,0.2)]"
                  aria-label="Next step"
                >
                  Next Quest
                </Button>
              ) : (
                <Button
                  onClick={handleComplete}
                  className="bg-green-700 hover:bg-green-600 text-white border border-green-500/50 shadow-[0_0_10px_rgba(21,128,61,0.3)] animate-pulse"
                  aria-label="Complete onboarding"
                >
                  Enter Kingdom
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