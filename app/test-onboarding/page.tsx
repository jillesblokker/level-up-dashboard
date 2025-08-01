"use client"

import { useOnboarding } from '@/hooks/use-onboarding'
import { Button } from '@/components/ui/button'

export default function TestOnboardingPage() {
  const { 
    openOnboarding, 
    closeOnboarding, 
    isOnboardingOpen, 
    shouldShowOnboarding, 
    debugOnboardingState,
    resetOnboarding 
  } = useOnboarding()

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Onboarding Test Page</h1>
      
      <div className="space-y-4">
        <div className="p-4 border rounded">
          <h2 className="text-lg font-semibold mb-2">Current State</h2>
          <p>Is Open: {isOnboardingOpen ? 'Yes' : 'No'}</p>
          <p>Should Show: {shouldShowOnboarding() ? 'Yes' : 'No'}</p>
        </div>

        <div className="space-y-2">
          <Button 
            onClick={() => openOnboarding()}
            className="w-full"
          >
            Open Onboarding (Normal)
          </Button>
          
          <Button 
            onClick={() => openOnboarding(true)}
            className="w-full"
            variant="secondary"
          >
            Force Open Onboarding
          </Button>
          
          <Button 
            onClick={closeOnboarding}
            className="w-full"
            variant="outline"
          >
            Close Onboarding
          </Button>
          
          <Button 
            onClick={debugOnboardingState}
            className="w-full"
            variant="outline"
          >
            Debug State
          </Button>
          
          <Button 
            onClick={resetOnboarding}
            className="w-full"
            variant="destructive"
          >
            Reset Onboarding State
          </Button>
        </div>
      </div>
    </div>
  )
} 