import { useState, useEffect } from 'react'
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
  const [canClick, setCanClick] = useState(false)

  // Prevent immediate clicking
  useEffect(() => {
    console.log('OnboardingSkip: Component mounted, setting up click delay')
    const timer = setTimeout(() => {
      console.log('OnboardingSkip: Click delay expired, enabling clicks')
      setCanClick(true)
    }, 1000) // 1 second delay

    return () => clearTimeout(timer)
  }, [])

  const handleSkipClick = (e: React.MouseEvent) => {
    console.log('OnboardingSkip: Skip button clicked manually', { canClick, timestamp: Date.now() })
    
    if (!canClick) {
      console.log('OnboardingSkip: Click blocked due to delay')
      e.preventDefault()
      e.stopPropagation()
      return
    }
    
    e.preventDefault()
    e.stopPropagation()
    onSkip()
  }

  const handleSkipConfirm = (e: React.MouseEvent) => {
    console.log('OnboardingSkip: Skip confirmed manually')
    e.preventDefault()
    e.stopPropagation()
    onSkipConfirm()
  }

  const handleSkipCancel = (e: React.MouseEvent) => {
    console.log('OnboardingSkip: Skip cancelled manually')
    e.preventDefault()
    e.stopPropagation()
    onSkipCancel()
  }

  console.log('OnboardingSkip: Rendering with isSkipping:', isSkipping, 'canClick:', canClick)

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleSkipClick}
        className="text-gray-400 hover:text-amber-400 hover:bg-amber-500/10"
        aria-label="Skip tutorial"
        tabIndex={-1}
        disabled={!canClick}
        onFocus={() => console.log('OnboardingSkip: Skip button focused', { canClick, timestamp: Date.now() })}
        onBlur={() => console.log('OnboardingSkip: Skip button blurred')}
        onKeyDown={(e) => {
          console.log('OnboardingSkip: Skip button keydown:', e.key, { canClick, timestamp: Date.now() })
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
          }
        }}
        onMouseEnter={() => console.log('OnboardingSkip: Skip button mouse enter')}
        onMouseLeave={() => console.log('OnboardingSkip: Skip button mouse leave')}
      >
        <X className="h-4 w-4 mr-2" />
        Skip {!canClick && '(disabled)'}
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
              onClick={handleSkipCancel}
              className="flex-1 bg-gray-800/80 hover:bg-gray-700/80 text-gray-300 border border-gray-600/50 hover:border-gray-500/50 transition-all duration-200"
            >
              Continue Tutorial
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleSkipConfirm}
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