"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
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
    title: "You're Ready!",
    subtitle: 'Your kingdom awaits',
    component: CompleteStep
  }
]

export function OnboardingModal({ isOpen, onClose, onComplete }: OnboardingModalProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set())
  const [isSkipping, setIsSkipping] = useState(false)
  const [canClose, setCanClose] = useState(false)

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(0)
      setCompletedSteps(new Set())
      setIsSkipping(false)
      setCanClose(false)
      
      // Allow closing after 3 seconds (increased from 1 second)
      setTimeout(() => {
        setCanClose(true)
      }, 3000)
    }
  }, [isOpen])

  // Focus management - focus the modal container when it opens
  useEffect(() => {
    if (isOpen) {
      // Focus the modal container to prevent auto-focus on buttons
      const modalContainer = document.querySelector('[data-modal-container]')
      if (modalContainer) {
        (modalContainer as HTMLElement).focus()
      }
    }
  }, [isOpen])

  // Track onClose calls
  const handleClose = () => {
    if (!canClose) {
      return
    }
    
    onClose()
  }

  const handleNext = () => {
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      setCompletedSteps(prev => new Set([...prev, currentStep]))
      setCurrentStep(currentStep + 1)
    } else {
      // Restored auto-completion for full onboarding experience
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

  if (!isOpen) {
    return null
  }

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      data-modal-container
      tabIndex={-1}
      onClick={(e) => {
        // Prevent clicks on the backdrop from closing the modal
        if (e.target === e.currentTarget) {
          e.preventDefault()
          e.stopPropagation()
        }
      }}
      onKeyDown={(e) => {
        // Prevent escape key from closing modal during onboarding
        if (e.key === 'Escape') {
          e.preventDefault()
          e.stopPropagation()
        }
      }}
    >
      <Card className="w-full max-w-2xl bg-gradient-to-br from-gray-900/95 to-gray-800/95 border border-amber-800/20 shadow-2xl h-[90vh] flex flex-col">
        <CardContent className="p-0 flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 md:p-6 border-b border-amber-800/20 flex-shrink-0">
            <div className="flex-1">
              <OnboardingProgress progress={progress} currentStep={currentStep + 1} totalSteps={ONBOARDING_STEPS.length} />
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-4 md:p-6">
              <div className="text-center mb-4 md:mb-6">
                <h2 className="text-xl md:text-2xl font-bold text-white mb-2">{currentStepData.title}</h2>
                <p className="text-amber-400 text-base md:text-lg">{currentStepData.subtitle}</p>
              </div>

              <div className="min-h-[200px] md:min-h-[300px] flex items-center justify-center">
                <CurrentStepComponent 
                  onNext={handleNext}
                  onPrevious={handlePrevious}
                  isFirstStep={currentStep === 0}
                  isLastStep={currentStep === ONBOARDING_STEPS.length - 1}
                  stepData={currentStepData}
                />
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between p-4 md:p-6 border-t border-amber-800/20 flex-shrink-0">
            <Button
              variant="ghost"
              onClick={handlePrevious}
              disabled={currentStep === 0}
              className="text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 text-sm md:text-base"
              tabIndex={-1}
              onFocus={() => {}}
              onBlur={() => {}}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                }
              }}
            >
              <ChevronLeft className="h-4 w-4 mr-1 md:mr-2" />
              <span className="hidden sm:inline">Previous</span>
            </Button>

            <div className="flex items-center gap-1 md:gap-2">
              {ONBOARDING_STEPS.map((_, index) => (
                <div
                  key={index}
                  className={cn(
                    "w-1.5 h-1.5 md:w-2 md:h-2 rounded-full transition-all duration-300",
                    index === currentStep 
                      ? "bg-amber-500" 
                      : completedSteps.has(index)
                        ? "bg-amber-400/50"
                        : "bg-gray-600"
                  )}
                />
              ))}
            </div>

            <Button
              onClick={handleNext}
              className="bg-amber-500 hover:bg-amber-600 text-black font-semibold text-sm md:text-base"
              tabIndex={-1}
              onFocus={() => {}}
              onBlur={() => {}}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                }
              }}
              onMouseEnter={() => {}}
              onMouseLeave={() => {}}
            >
              {currentStep === ONBOARDING_STEPS.length - 1 ? 'Start Playing' : 'Next'}
              <ChevronRight className="h-4 w-4 ml-1 md:ml-2" />
            </Button>
          </div>

          {/* Close Button - Fixed at bottom */}
          <div className="flex justify-center p-4 border-t border-amber-800/20 flex-shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                handleClose()
              }}
              disabled={!canClose}
              className="text-gray-400 hover:text-amber-400 hover:bg-amber-500/10 disabled:opacity-50"
              aria-label="Close tutorial"
              tabIndex={-1}
              onFocus={() => {}}
              onBlur={() => {}}
              onMouseEnter={() => {}}
              onMouseLeave={() => {}}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                }
              }}
            >
              Close Tutorial {!canClose && '(disabled)'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 