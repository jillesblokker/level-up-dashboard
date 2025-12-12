import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Crown, Sword, MapIcon, Trophy } from 'lucide-react'

interface WelcomeStepProps {
  onNext: () => void
  onPrevious: () => void
  isFirstStep: boolean
  isLastStep: boolean
  stepData: any
}

export function WelcomeStep({ onNext }: WelcomeStepProps) {
  const features = [
    {
      icon: Sword,
      title: 'Complete Quests',
      description: 'Transform daily habits into epic adventures'
    },
    {
      icon: Crown,
      title: 'Build Your Kingdom',
      description: 'Create a realm that grows with your progress'
    },
    {
      icon: MapIcon,
      title: 'Explore & Expand',
      description: 'Discover new lands and unlock secrets'
    },
    {
      icon: Trophy,
      title: 'Achieve Greatness',
      description: 'Level up and become a legendary ruler'
    }
  ]

  return (
    <div className="w-full max-w-2xl space-y-4 md:space-y-6">
      {/* Hero Section */}
      <div className="text-center space-y-4">
        <div className="w-20 h-20 mx-auto bg-gradient-to-br from-amber-500/20 to-amber-600/20 border border-amber-500/30 rounded-full flex items-center justify-center relative group">
          <div className="absolute inset-0 bg-amber-500/10 rounded-full blur-xl group-hover:bg-amber-500/20 transition-all duration-500"></div>
          <Crown className="h-10 w-10 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]" />
        </div>

        <div className="space-y-2 max-w-lg mx-auto">
          <h3 className="text-2xl font-bold text-white font-serif tracking-wide">
            Your Kingdom Awaits
          </h3>
          <p className="text-gray-300 text-sm md:text-base leading-relaxed">
            Transform your daily habits into a legendary kingdom. Complete quests, earn gold, and expand your realm from a humble village to a mighty empire.
          </p>
        </div>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
        {features.map((feature, index) => {
          const Icon = feature.icon
          return (
            <Card key={index} className="bg-gray-900/40 border border-amber-900/30 hover:border-amber-500/40 hover:bg-gray-900/60 transition-all duration-300 group">
              <CardContent className="p-4 flex items-start space-x-3">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0 group-hover:bg-amber-500/20 transition-colors">
                  <Icon className="h-4 w-4 text-amber-500 group-hover:text-amber-400 group-hover:scale-110 transition-transform duration-300" />
                </div>
                <div>
                  <h4 className="font-semibold text-amber-100 text-sm mb-1">{feature.title}</h4>
                  <p className="text-xs text-gray-400 leading-snug">{feature.description}</p>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Helper Text */}
      <div className="text-center pt-2 opacity-60">
        <p className="text-amber-200/40 text-xs italic">
          Press &apos;Next Quest&apos; to begin the tutorial
        </p>
      </div>
    </div>
  )
} 