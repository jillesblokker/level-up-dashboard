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
        <AlertDialogContent className="bg-gray-900 border border-amber-800/20 max-w-md mx-auto">
          <AlertDialogHeader className="text-center pb-4">
            <AlertDialogTitle className="text-xl font-bold text-white mb-2">
              Skip Tutorial?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-300 text-base leading-relaxed">
              Are you sure you want to skip the tutorial? You can always access it later from the Guide menu.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex gap-3 pt-4">
            <AlertDialogCancel 
              onClick={onSkipCancel}
              className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-600 hover:border-gray-500"
            >
              Continue Tutorial
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={onSkipConfirm}
              className="flex-1 bg-amber-500 hover:bg-amber-600 text-black font-semibold"
            >
              Skip Tutorial
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
} 