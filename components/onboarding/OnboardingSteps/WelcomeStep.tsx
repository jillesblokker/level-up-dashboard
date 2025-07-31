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
    <div className="w-full max-w-2xl space-y-6">
      {/* Hero Section */}
      <div className="text-center space-y-4">
        <div className="w-24 h-24 mx-auto bg-gradient-to-br from-amber-500 to-amber-600 rounded-full flex items-center justify-center mb-4">
          <Crown className="h-12 w-12 text-black" />
        </div>
        <h3 className="text-xl font-semibold text-white">
          Welcome to Level Up Habit God
        </h3>
        <p className="text-gray-300 text-lg leading-relaxed">
          Transform your daily habits into an epic kingdom-building adventure. 
          Complete quests, earn rewards, and watch your realm grow with every achievement.
        </p>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {features.map((feature, index) => {
          const Icon = feature.icon
          return (
            <Card key={index} className="bg-gray-800/50 border border-amber-800/20 hover:border-amber-500/40 transition-all duration-300">
              <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 bg-amber-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Icon className="h-5 w-5 text-amber-400" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-white mb-1">{feature.title}</h4>
                    <p className="text-sm text-gray-400">{feature.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Call to Action */}
      <div className="text-center pt-4">
        <Button 
          onClick={onNext}
          className="bg-amber-500 hover:bg-amber-600 text-black font-semibold px-8 py-3"
        >
          Start Your Journey
        </Button>
      </div>
    </div>
  )
} 