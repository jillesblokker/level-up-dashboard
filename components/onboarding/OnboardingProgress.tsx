import { Progress } from '@/components/ui/progress'

interface OnboardingProgressProps {
  progress: number
  currentStep: number
  totalSteps: number
}

export function OnboardingProgress({ progress, currentStep, totalSteps }: OnboardingProgressProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-amber-400 font-medium">Progress</span>
        <span className="text-gray-400">Step {currentStep} of {totalSteps}</span>
      </div>
      <Progress 
        value={progress} 
        className="h-2 bg-gray-700"
        style={{
          '--progress-background': 'rgb(245 158 11)',
          '--progress-foreground': 'rgb(245 158 11)'
        } as React.CSSProperties}
      />
    </div>
  )
} 