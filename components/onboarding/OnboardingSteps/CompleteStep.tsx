import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Crown, Star, Coins, MapIcon, CheckCircle } from 'lucide-react'

interface CompleteStepProps {
  onNext: () => void
  onPrevious: () => void
  isFirstStep: boolean
  isLastStep: boolean
  stepData: any
}

export function CompleteStep({ onNext }: CompleteStepProps) {
  const summaryItems = [
    {
      icon: Star,
      title: 'Complete Quests',
      description: 'Earn gold and experience through daily tasks',
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/20'
    },
    {
      icon: Coins,
      title: 'Earn Gold',
      description: 'Use rewards to buy tiles and items',
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/20'
    },
    {
      icon: MapIcon,
      title: 'Buy & Place Tiles',
      description: 'Build your kingdom one tile at a time',
      color: 'text-green-400',
      bgColor: 'bg-green-500/20'
    },
    {
      icon: Crown,
      title: 'Create Your Kingdom',
      description: 'Watch your realm grow with every tile',
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/20'
    }
  ]

  const nextSteps = [
    'Complete your first quest',
    'Buy your first tile',
    'Start building your kingdom',
    'Level up and unlock new content'
  ]

  return (
    <div className="w-full max-w-2xl space-y-6">
      {/* Congratulations */}
      <div className="text-center space-y-4">
        <div className="w-20 h-20 mx-auto bg-gradient-to-br from-amber-500 to-amber-600 rounded-full flex items-center justify-center mb-4">
          <CheckCircle className="h-10 w-10 text-black" />
        </div>
        <h3 className="text-2xl font-bold text-white">
          You're Ready!
        </h3>
        <p className="text-gray-300 text-lg">
          You now understand the core gameplay loop. Your kingdom awaits!
        </p>
      </div>

      {/* Gameplay Summary */}
      <div className="space-y-4">
        <h4 className="text-lg font-semibold text-white">What You've Learned</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {summaryItems.map((item, index) => {
            const Icon = item.icon
            return (
              <Card key={index} className="bg-gray-800/50 border border-amber-800/20">
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3">
                    <div className={`w-10 h-10 ${item.bgColor} rounded-lg flex items-center justify-center flex-shrink-0`}>
                      <Icon className={`h-5 w-5 ${item.color}`} />
                    </div>
                    <div>
                      <h5 className="font-semibold text-white mb-1">{item.title}</h5>
                      <p className="text-sm text-gray-400">{item.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Next Steps */}
      <div className="space-y-4">
        <h4 className="text-lg font-semibold text-white">Your Next Steps</h4>
        <Card className="bg-amber-500/10 border border-amber-500/20">
          <CardContent className="p-4">
            <div className="space-y-3">
              {nextSteps.map((step, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-black">{index + 1}</span>
                  </div>
                  <span className="text-gray-300">{step}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tips */}
      <div className="space-y-3">
        <h4 className="text-md font-semibold text-white">Pro Tips</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
            <h5 className="font-medium text-blue-400 mb-1">Daily Quests</h5>
            <p className="text-sm text-gray-300">
              Complete quests daily to maintain a steady flow of gold and experience.
            </p>
          </div>
          <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
            <h5 className="font-medium text-green-400 mb-1">Strategic Building</h5>
            <p className="text-sm text-gray-300">
              Plan your kingdom layout carefully to maximize efficiency and aesthetics.
            </p>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="text-center pt-4">
        <Button 
          onClick={onNext}
          className="bg-amber-500 hover:bg-amber-600 text-black font-semibold px-8 py-3"
        >
          Start Your Adventure
        </Button>
        <p className="text-sm text-gray-400 mt-2">
          You can always access this tutorial again from the settings menu
        </p>
      </div>
    </div>
  )
} 