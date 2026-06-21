import { logger } from "@/lib/logger";
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
    logger.debug('OnboardingSkip: Component mounted, setting up click delay')
    const timer = setTimeout(() => {
      logger.debug('OnboardingSkip: Click delay expired, enabling clicks')
      setCanClick(true)
    }, 1000) // 1 second delay

    return () => clearTimeout(timer)
  }, [])

  const handleSkipClick = (e: React.MouseEvent) => {
    logger.debug('OnboardingSkip: Skip button clicked manually', { canClick, timestamp: Date.now() })
    
    if (!canClick) {
      logger.debug('OnboardingSkip: Click blocked due to delay')
      e.preventDefault()
      e.stopPropagation()
      return
    }
    
    e.preventDefault()
    e.stopPropagation()
    onSkip()
  }

  const handleSkipConfirm = (e: React.MouseEvent) => {
    logger.debug('OnboardingSkip: Skip confirmed manually')
    e.preventDefault()
    e.stopPropagation()
    onSkipConfirm()
  }

  const handleSkipCancel = (e: React.MouseEvent) => {
    logger.debug('OnboardingSkip: Skip cancelled manually')
    e.preventDefault()
    e.stopPropagation()
    onSkipCancel()
  }

  logger.debug('OnboardingSkip: Rendering with isSkipping:', isSkipping, 'canClick:', canClick)

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleSkipClick}
        className="text-zinc-400 hover:text-amber-400 hover:bg-amber-500/10"
        aria-label="Skip tutorial"
        tabIndex={-1}
        disabled={!canClick}
        onFocus={() => logger.debug('OnboardingSkip: Skip button focused', { canClick, timestamp: Date.now() })}
        onBlur={() => logger.debug('OnboardingSkip: Skip button blurred')}
        onKeyDown={(e) => {
          logger.debug('OnboardingSkip: Skip button keydown:', e.key, { canClick, timestamp: Date.now() })
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
          }
        }}
        onMouseEnter={() => logger.debug('OnboardingSkip: Skip button mouse enter')}
        onMouseLeave={() => logger.debug('OnboardingSkip: Skip button mouse leave')}
      >
        <X className="h-4 w-4 mr-2" />
        Skip {!canClick && '(disabled)'}
      </Button>

      <AlertDialog open={isSkipping} onOpenChange={onSkipCancel}>
        <AlertDialogContent className="bg-zinc-900/95  border border-amber-800/30 max-w-sm mx-auto shadow-2xl">
          <AlertDialogHeader className="text-center pb-6">
            <div className="mx-auto mb-4 w-12 h-12 bg-amber-500/20 rounded-full flex items-center justify-center">
              <X className="h-6 w-6 text-amber-400" />
            </div>
            <AlertDialogTitle className="text-lg font-bold text-white mb-3">
              Skip Tutorial?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-300 text-sm leading-relaxed px-2">
              You can always access the tutorial later from the Guide menu in your account settings.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-col sm:flex-row gap-3 pt-2">
            <AlertDialogCancel 
              onClick={handleSkipCancel}
              className="flex-1 bg-zinc-800/80 hover:bg-zinc-700/80 text-zinc-300 border border-zinc-600/50 hover:border-zinc-500/50 transition-all duration-200"
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