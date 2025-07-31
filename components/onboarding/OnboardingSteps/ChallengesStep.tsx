import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Target, Trophy, Star, Zap } from 'lucide-react'

interface ChallengesStepProps {
  onNext: () => void
  onPrevious: () => void
  isFirstStep: boolean
  isLastStep: boolean
  stepData: any
}

export function ChallengesStep({ onNext }: ChallengesStepProps) {
  const [selectedChallenge, setSelectedChallenge] = useState<string | null>(null)
  const [completedChallenges, setCompletedChallenges] = useState<Set<string>>(new Set())

  const challenges = [
    {
      id: '1',
      name: 'Push-up',
      description: 'Start in high plank, keep core tight, lower to near-ground, push up (3x12)',
      difficulty: 'Medium',
      reward: '50 XP + 25 Gold',
      icon: Target,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/20',
      category: 'Push Day (Chest, Shoulders, Triceps)'
    },
    {
      id: '2',
      name: 'Plank',
      description: 'Hold high plank position, keep core tight, breathe steady (3x45 sec)',
      difficulty: 'Medium',
      reward: '50 XP + 25 Gold',
      icon: Trophy,
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/20',
      category: 'Core & Flexibility'
    },
    {
      id: '3',
      name: 'Burpee',
      description: 'Squat, jump to plank, jump in, explode up – repeat (3x15)',
      difficulty: 'Hard',
      reward: '75 XP + 35 Gold',
      icon: Star,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/20',
      category: 'HIIT & Full Body'
    }
  ]

  const milestones = [
    {
      id: '1',
      name: 'Workout Consistency',
      description: 'Complete 7 workout challenges in a week',
      progress: 3,
      total: 7,
      icon: Zap,
      color: 'text-green-400',
      bgColor: 'bg-green-500/20'
    },
    {
      id: '2',
      name: 'Strength Builder',
      description: 'Complete 20 strength-based challenges',
      progress: 12,
      total: 20,
      icon: Trophy,
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/20'
    }
  ]

  const handleChallengeComplete = (challengeId: string) => {
    setCompletedChallenges(prev => new Set([...prev, challengeId]))
  }

  return (
    <div className="w-full max-w-2xl space-y-4 md:space-y-6">
      {/* Challenges Section */}
      <div className="space-y-3 md:space-y-4">
        <h3 className="text-base md:text-lg font-semibold text-white">Challenges</h3>
        <p className="text-sm text-gray-400 mb-3">
          Higher stakes quests with greater rewards. Complete challenges to earn bonus experience and gold.
        </p>
        <div className="space-y-2 md:space-y-3">
          {challenges.map((challenge) => {
            const Icon = challenge.icon
            const isCompleted = completedChallenges.has(challenge.id)
            
            return (
              <Card 
                key={challenge.id} 
                className={`bg-gray-800/50 border transition-all duration-300 cursor-pointer ${
                  isCompleted 
                    ? 'border-green-500/50 bg-green-500/10' 
                    : 'border-amber-800/20 hover:border-amber-500/40'
                }`}
                onClick={() => handleChallengeComplete(challenge.id)}
              >
                <CardContent className="p-3 md:p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 md:space-x-3">
                      <div className={`w-8 h-8 md:w-10 md:h-10 ${challenge.bgColor} rounded-lg flex items-center justify-center`}>
                        <Icon className={`h-4 w-4 md:h-5 md:w-5 ${challenge.color}`} />
                      </div>
                      <div>
                        <h4 className="font-medium text-white text-sm md:text-base">{challenge.name}</h4>
                        <p className="text-xs md:text-sm text-gray-400">{challenge.description}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge variant="secondary" className="text-xs">
                            {challenge.difficulty}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {challenge.reward}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    {isCompleted && (
                      <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs">✓</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Milestones Section */}
      <div className="space-y-3 md:space-y-4">
        <h3 className="text-base md:text-lg font-semibold text-white">Milestones</h3>
        <p className="text-sm text-gray-400 mb-3">
          Long-term goals to work towards. Milestones unlock new features and content.
        </p>
        <div className="space-y-2 md:space-y-3">
          {milestones.map((milestone) => {
            const Icon = milestone.icon
            const progress = (milestone.progress / milestone.total) * 100
            
            return (
              <Card key={milestone.id} className="bg-gray-800/50 border border-amber-800/20">
                <CardContent className="p-3 md:p-4">
                  <div className="flex items-center space-x-2 md:space-x-3">
                    <div className={`w-8 h-8 md:w-10 md:h-10 ${milestone.bgColor} rounded-lg flex items-center justify-center`}>
                      <Icon className={`h-4 w-4 md:h-5 md:w-5 ${milestone.color}`} />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-white text-sm md:text-base">{milestone.name}</h4>
                      <p className="text-xs md:text-sm text-gray-400">{milestone.description}</p>
                      <div className="mt-2">
                        <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                          <span>Progress</span>
                          <span>{milestone.progress} / {milestone.total}</span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <div 
                            className="bg-amber-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Interactive Demo */}
      <div className="text-center space-y-3">
        <p className="text-sm text-gray-400">
          Click on a challenge to complete it and see your rewards!
        </p>
        {completedChallenges.size > 0 && (
          <div className="bg-amber-500/20 border border-amber-500/40 rounded-lg p-3">
            <p className="text-amber-400 font-medium">
              Great! You&apos;ve completed {completedChallenges.size} challenge{completedChallenges.size !== 1 ? 's' : ''} and earned rewards!
            </p>
          </div>
        )}
      </div>
    </div>
  )
} 