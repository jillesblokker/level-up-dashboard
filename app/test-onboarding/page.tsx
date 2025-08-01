"use client"

import { useOnboarding } from '@/hooks/use-onboarding'
import { Button } from '@/components/ui/button'
import { useState } from 'react'

export default function TestOnboardingPage() {
  const { 
    openOnboarding, 
    closeOnboarding, 
    isOnboardingOpen, 
    shouldShowOnboarding, 
    debugOnboardingState,
    resetOnboarding 
  } = useOnboarding()

  const [testModalOpen, setTestModalOpen] = useState(false)

  const testSimpleModal = () => {
    console.log('Test: Opening simple modal')
    setTestModalOpen(true)
    setTimeout(() => {
      console.log('Test: Closing simple modal after 3 seconds')
      setTestModalOpen(false)
    }, 3000)
  }

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Onboarding Test Page</h1>
      
      <div className="space-y-4">
        <div className="p-4 border rounded">
          <h2 className="text-lg font-semibold mb-2">Current State</h2>
          <p>Is Open: {isOnboardingOpen ? 'Yes' : 'No'}</p>
          <p>Should Show: {shouldShowOnboarding() ? 'Yes' : 'No'}</p>
          <p>Test Modal Open: {testModalOpen ? 'Yes' : 'No'}</p>
        </div>

        <div className="space-y-2">
          <Button 
            onClick={() => {
              console.log('Test: Normal openOnboarding called')
              openOnboarding()
            }}
            className="w-full"
          >
            Open Onboarding (Normal)
          </Button>
          
          <Button 
            onClick={() => {
              console.log('Test: Force openOnboarding called')
              openOnboarding(true)
            }}
            className="w-full"
            variant="secondary"
          >
            Force Open Onboarding
          </Button>
          
          <Button 
            onClick={() => {
              console.log('Test: closeOnboarding called')
              closeOnboarding()
            }}
            className="w-full"
            variant="outline"
          >
            Close Onboarding
          </Button>
          
          <Button 
            onClick={() => {
              console.log('Test: debugOnboardingState called')
              debugOnboardingState()
            }}
            className="w-full"
            variant="outline"
          >
            Debug State
          </Button>
          
          <Button 
            onClick={() => {
              console.log('Test: resetOnboarding called')
              resetOnboarding()
            }}
            className="w-full"
            variant="destructive"
          >
            Reset Onboarding State
          </Button>

          <Button 
            onClick={testSimpleModal}
            className="w-full"
            variant="outline"
          >
            Test Simple Modal (3s)
          </Button>
        </div>
      </div>

      {/* Simple test modal */}
      {testModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
          <div className="bg-white p-8 rounded-lg">
            <h2 className="text-xl font-bold mb-4">Test Modal</h2>
            <p>This is a simple test modal to verify modal rendering works.</p>
            <p>It will close automatically in 3 seconds.</p>
          </div>
        </div>
      )}
    </div>
  )
} 