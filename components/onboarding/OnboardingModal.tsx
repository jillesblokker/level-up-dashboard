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

  // Debug: Log modal state
  useEffect(() => {
    console.log('OnboardingModal: isOpen changed to:', isOpen)
  }, [isOpen])

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      console.log('OnboardingModal: Resetting state for new modal session')
      setCurrentStep(0)
      setCompletedSteps(new Set())
      setIsSkipping(false)
    }
  }, [isOpen])

  // Focus management - focus the modal container when it opens
  useEffect(() => {
    if (isOpen) {
      console.log('OnboardingModal: Modal opened, managing focus')
      // Focus the modal container to prevent auto-focus on buttons
      const modalContainer = document.querySelector('[data-modal-container]')
      if (modalContainer) {
        (modalContainer as HTMLElement).focus()
      }
    }
  }, [isOpen])

  // Debug: Track onClose calls
  const handleClose = () => {
    console.log('OnboardingModal: onClose called from modal')
    console.log('OnboardingModal: onClose stack trace:', new Error().stack)
    onClose()
  }

  const handleNext = () => {
    console.log('OnboardingModal: handleNext called, currentStep:', currentStep)
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      setCompletedSteps(prev => new Set([...prev, currentStep]))
      setCurrentStep(currentStep + 1)
    } else {
      handleComplete()
    }
  }

  const handlePrevious = () => {
    console.log('OnboardingModal: handlePrevious called, currentStep:', currentStep)
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleComplete = () => {
    console.log('OnboardingModal: handleComplete called')
    setCompletedSteps(prev => new Set([...prev, currentStep]))
    onComplete()
    handleClose()
  }

  const handleSkip = () => {
    console.log('OnboardingModal: handleSkip called')
    setIsSkipping(true)
  }

  const handleSkipConfirm = () => {
    console.log('OnboardingModal: handleSkipConfirm called')
    handleClose()
  }

  const handleSkipCancel = () => {
    console.log('OnboardingModal: handleSkipCancel called')
    setIsSkipping(false)
  }

  const currentStepData = ONBOARDING_STEPS[currentStep] as OnboardingStep | undefined
  
  // Safety check for undefined currentStepData
  if (!currentStepData) {
    console.error('Invalid currentStep:', currentStep)
    return null
  }
  
  const CurrentStepComponent = currentStepData.component
  const progress = ((currentStep + 1) / ONBOARDING_STEPS.length) * 100

  console.log('OnboardingModal: Rendering with isOpen:', isOpen, 'currentStep:', currentStep)

  if (!isOpen) {
    console.log('OnboardingModal: Not rendering (isOpen is false)')
    return null
  }

  console.log('OnboardingModal: Rendering modal content')

  // Minimal modal for testing
  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      data-modal-container
      tabIndex={-1}
    >
      <div className="w-full max-w-2xl bg-gradient-to-br from-gray-900/95 to-gray-800/95 border border-amber-800/20 shadow-2xl p-6 rounded-lg">
        <h2 className="text-xl font-bold text-white mb-4">Onboarding Modal Test</h2>
        <p className="text-gray-300 mb-4">This is a minimal test modal to isolate the issue.</p>
        <p className="text-sm text-gray-400 mb-4">Step: {currentStep + 1} of {ONBOARDING_STEPS.length}</p>
        
        <div className="flex justify-end space-x-2">
          <button
            onClick={handlePrevious}
            disabled={currentStep === 0}
            className="px-4 py-2 text-amber-400 hover:text-amber-300 disabled:opacity-50"
          >
            Previous
          </button>
          <button
            onClick={handleNext}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-black font-semibold"
          >
            {currentStep === ONBOARDING_STEPS.length - 1 ? 'Complete' : 'Next'}
          </button>
          <button
            onClick={handleClose}
            className="px-4 py-2 text-gray-400 hover:text-amber-400"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
} 