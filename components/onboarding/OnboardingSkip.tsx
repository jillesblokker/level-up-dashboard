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
        <AlertDialogContent className="bg-gray-900/95 backdrop-blur-sm border border-amber-800/30 max-w-sm mx-auto shadow-2xl">
          <AlertDialogHeader className="text-center pb-6">
            <div className="mx-auto mb-4 w-12 h-12 bg-amber-500/20 rounded-full flex items-center justify-center">
              <X className="h-6 w-6 text-amber-400" />
            </div>
            <AlertDialogTitle className="text-lg font-bold text-white mb-3">
              Skip Tutorial?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-300 text-sm leading-relaxed px-2">
              You can always access the tutorial later from the Guide menu in your account settings.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-col sm:flex-row gap-3 pt-2">
            <AlertDialogCancel 
              onClick={onSkipCancel}
              className="flex-1 bg-gray-800/80 hover:bg-gray-700/80 text-gray-300 border border-gray-600/50 hover:border-gray-500/50 transition-all duration-200"
            >
              Continue Tutorial
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={onSkipConfirm}
              className="flex-1 bg-amber-500 hover:bg-amber-600 text-black font-semibold transition-all duration-200 shadow-lg hover:shadow-amber-500/25"
            >
              Skip Tutorial
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
} 