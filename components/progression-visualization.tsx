"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { ArrowRight, Coins, Sword, Castle, Trophy, TrendingUp } from 'lucide-react'
import { getCharacterStats } from '@/lib/character-stats-service'
import { calculateLevelFromExperience } from '@/types/character'

interface ProgressionStep {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  value: number
  target: number
  color: string
  bgColor: string
}

export function ProgressionVisualization() {
  const [stats, setStats] = useState({
    experience: 0,
    gold: 0,
    level: 1,
    questsCompleted: 0,
    tilesPlaced: 0
  })
  const [recentActivity, setRecentActivity] = useState<Array<{
    type: 'quest' | 'gold' | 'tile'
    amount: number
    timestamp: Date
    description: string
  }>>([])

  useEffect(() => {
    const loadStats = () => {
      try {
        const characterStats = getCharacterStats()
        const level = characterStats.level || calculateLevelFromExperience(characterStats.experience || 0)

        // Get total XP from database-synced stats
        setStats(prev => ({
          ...prev,
          experience: characterStats.experience || 0,
          gold: characterStats.gold || 0,
          level
        }))
      } catch (error) {
        console.error('Error loading stats:', error)
      }
    }

    loadStats()

    // Listen for updates
    const handleStatsUpdate = () => loadStats()
    window.addEventListener('character-stats-update', handleStatsUpdate)

    return () => {
      window.removeEventListener('character-stats-update', handleStatsUpdate)
    }
  }, [])

  const progressionSteps: ProgressionStep[] = [
    {
      id: 'quests',
      title: 'Complete Quests',
      description: 'Earn experience and gold through daily tasks',
      icon: <Sword className="h-5 w-5" />,
      value: stats.questsCompleted,
      target: 10, // Example target
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10'
    },
    {
      id: 'gold',
      title: 'Accumulate Gold',
      description: 'Build your wealth to expand your kingdom',
      icon: <Coins className="h-5 w-5" />,
      value: stats.gold,
      target: 1000, // Example target
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10'
    },
    {
      id: 'tiles',
      title: 'Place Tiles',
      description: 'Transform your realm with new territories',
      icon: <Castle className="h-5 w-5" />,
      value: stats.tilesPlaced,
      target: 20, // Example target
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10'
    }
  ]

  const getProgressPercentage = (value: number, target: number) => {
    return Math.min((value / target) * 100, 100)
  }

  return (
    <div className="space-y-6">
      {/* Main Progression Loop */}
      <Card className="border-amber-800/20 bg-gradient-to-br from-gray-900 to-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-400">
            <TrendingUp className="h-5 w-5" />
            Your Kingdom Journey
          </CardTitle>
          <CardDescription className="text-gray-300">
            See how your quests lead to kingdom expansion
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Progression Steps */}
          <div className="grid gap-4 md:grid-cols-3">
            {progressionSteps.map((step, index) => (
              <div key={step.id} className="relative">
                <Card className={`border ${step.bgColor} hover:shadow-lg transition-all duration-300`}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`p-2 rounded-lg ${step.bgColor} ${step.color}`}>
                        {step.icon}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-white">{step.title}</h3>
                        <p className="text-sm text-gray-400">{step.description}</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-300">Progress</span>
                        <span className={`font-semibold ${step.color}`}>
                          {step.value} / {step.target}
                        </span>
                      </div>
                      <Progress
                        value={getProgressPercentage(step.value, step.target)}
                        className="h-2"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Arrow connector */}
                {index < progressionSteps.length - 1 && (
                  <div className="hidden md:block absolute top-1/2 -right-2 transform -translate-y-1/2 z-10">
                    <div className="bg-amber-500 p-1 rounded-full">
                      <ArrowRight className="h-4 w-4 text-white" />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Current Status */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="border-amber-800/20 bg-gradient-to-br from-gray-900 to-gray-800">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <Trophy className="h-5 w-5 text-amber-400" />
                  <h3 className="font-semibold text-white">Current Level</h3>
                </div>
                <div className="text-2xl font-bold text-amber-400 mb-2">
                  Level {stats.level}
                </div>
                <p className="text-sm text-gray-400">
                  {stats.experience} XP earned
                </p>
              </CardContent>
            </Card>

            <Card className="border-amber-800/20 bg-gradient-to-br from-gray-900 to-gray-800">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <Coins className="h-5 w-5 text-amber-400" />
                  <h3 className="font-semibold text-white">Kingdom Wealth</h3>
                </div>
                <div className="text-2xl font-bold text-amber-400 mb-2">
                  {stats.gold} Gold
                </div>
                <p className="text-sm text-gray-400">
                  Ready to expand your realm
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Progression Tips */}
          <div className="bg-amber-900/20 border border-amber-800/30 rounded-lg p-4">
            <h4 className="font-semibold text-amber-400 mb-2">Progression Tips</h4>
            <div className="space-y-2 text-sm text-gray-300">
              <p>• Complete daily quests to earn gold and experience</p>
              <p>• Use your gold to purchase tiles for your kingdom</p>
              <p>• Place tiles strategically to expand your realm</p>
              <p>• Higher level quests provide better rewards</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 