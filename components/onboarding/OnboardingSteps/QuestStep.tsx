import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Sword, Brain, Crown, Castle, Hammer, Heart, Sun, PersonStanding, CheckCircle } from 'lucide-react'

interface QuestStepProps {
  onNext: () => void
  onPrevious: () => void
  isFirstStep: boolean
  isLastStep: boolean
  stepData: any
}

export function QuestStep({ onNext }: QuestStepProps) {
  const [completedQuests, setCompletedQuests] = useState<Set<string>>(new Set())

  const questCategories = [
    { id: 'might', name: 'Might', icon: Sword, color: 'text-red-400', bgColor: 'bg-red-500/20' },
    { id: 'knowledge', name: 'Knowledge', icon: Brain, color: 'text-blue-400', bgColor: 'bg-blue-500/20' },
    { id: 'honor', name: 'Honor', icon: Crown, color: 'text-yellow-400', bgColor: 'bg-yellow-500/20' },
    { id: 'castle', name: 'Castle', icon: Castle, color: 'text-purple-400', bgColor: 'bg-purple-500/20' },
    { id: 'craft', name: 'Craft', icon: Hammer, color: 'text-orange-400', bgColor: 'bg-orange-500/20' },
    { id: 'vitality', name: 'Vitality', icon: Heart, color: 'text-pink-400', bgColor: 'bg-pink-500/20' },
    { id: 'wellness', name: 'Wellness', icon: Sun, color: 'text-green-400', bgColor: 'bg-green-500/20' },
    { id: 'exploration', name: 'Exploration', icon: PersonStanding, color: 'text-cyan-400', bgColor: 'bg-cyan-500/20' }
  ]

  const sampleQuests = [
    { id: '1', name: 'Morning Exercise', category: 'might', xp: 25, gold: 15, completed: false },
    { id: '2', name: 'Read 30 Minutes', category: 'knowledge', xp: 20, gold: 10, completed: false },
    { id: '3', name: 'Help Someone', category: 'honor', xp: 30, gold: 20, completed: false }
  ]

  const handleQuestComplete = (questId: string) => {
    setCompletedQuests(prev => new Set([...prev, questId]))
  }

  return (
    <div className="w-full max-w-2xl space-y-6">
      {/* Quest Categories */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white mb-3">Quest Categories</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {questCategories.map((category) => {
            const Icon = category.icon
            return (
              <Card key={category.id} className="bg-gray-800/50 border border-amber-800/20 hover:border-amber-500/40 transition-all duration-300">
                <CardContent className="p-3 text-center">
                  <div className={`w-8 h-8 mx-auto mb-2 ${category.bgColor} rounded-lg flex items-center justify-center`}>
                    <Icon className={`h-4 w-4 ${category.color}`} />
                  </div>
                  <p className="text-xs font-medium text-white">{category.name}</p>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Sample Quests */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white mb-3">Sample Quests</h3>
        <div className="space-y-3">
          {sampleQuests.map((quest) => {
            const category = questCategories.find(c => c.id === quest.category)
            const Icon = category?.icon || Sword
            const isCompleted = completedQuests.has(quest.id)
            
            return (
              <Card 
                key={quest.id} 
                className={`bg-gray-800/50 border transition-all duration-300 cursor-pointer ${
                  isCompleted 
                    ? 'border-green-500/50 bg-green-500/10' 
                    : 'border-amber-800/20 hover:border-amber-500/40'
                }`}
                onClick={() => handleQuestComplete(quest.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 ${category?.bgColor || 'bg-amber-500/20'} rounded-lg flex items-center justify-center`}>
                        <Icon className={`h-4 w-4 ${category?.color || 'text-amber-400'}`} />
                      </div>
                      <div>
                        <h4 className="font-medium text-white">{quest.name}</h4>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge variant="secondary" className="text-xs">
                            +{quest.xp} XP
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            +{quest.gold} Gold
                          </Badge>
                        </div>
                      </div>
                    </div>
                    {isCompleted && (
                      <CheckCircle className="h-5 w-5 text-green-400" />
                    )}
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
          Click on a quest to complete it and see your rewards!
        </p>
        {completedQuests.size > 0 && (
          <div className="bg-amber-500/20 border border-amber-500/40 rounded-lg p-3">
            <p className="text-amber-400 font-medium">
              Great! You've completed {completedQuests.size} quest{completedQuests.size !== 1 ? 's' : ''} and earned rewards!
            </p>
          </div>
        )}
      </div>
    </div>
  )
} 