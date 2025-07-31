import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface OnboardingSkipProps {
  onSkip: () => void
  isSkipping: boolean
  onSkipConfirm: () => void
  onSkipCancel: () => void
}

export function OnboardingSkip({ onSkip, isSkipping, onSkipConfirm, onSkipCancel }: OnboardingSkipProps) {
  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={onSkip}
        className="text-gray-400 hover:text-amber-400 hover:bg-amber-500/10"
        aria-label="Skip tutorial"
      >
        <X className="h-4 w-4 mr-2" />
        Skip
      </Button>

      <AlertDialog open={isSkipping} onOpenChange={onSkipCancel}>
        <AlertDialogContent className="bg-gray-900 border border-amber-800/20">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Skip Tutorial?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-300">
              Are you sure you want to skip the tutorial? You can always access it later from the settings menu.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              onClick={onSkipCancel}
              className="text-gray-400 hover:text-gray-300"
            >
              Continue Tutorial
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={onSkipConfirm}
              className="bg-amber-500 hover:bg-amber-600 text-black"
            >
              Skip Tutorial
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
} 