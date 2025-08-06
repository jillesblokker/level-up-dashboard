"use client"

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Trophy, Coins, Zap, Castle, Target, Calendar } from 'lucide-react'
import { Progress } from '@/components/ui/progress'

interface ProgressStats {
  questsCompleted: number
  totalQuests: number
  goldEarned: number
  xpGained: number
  kingdomTiles: number
  currentStreak: number
  achievements: number
  level: number
}

interface ProgressDashboardProps {
  stats: ProgressStats
  className?: string
}

export function ProgressDashboard({ stats, className = "" }: ProgressDashboardProps) {
  const questProgress = stats.totalQuests > 0 ? (stats.questsCompleted / stats.totalQuests) * 100 : 0
  
  return (
    <Card className={`bg-gradient-to-br from-gray-900 to-gray-800 border-amber-800/30 ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-amber-400">
          <Target className="h-5 w-5" />
          Your Journey Progress
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Quests */}
          <div className="text-center p-4 bg-amber-800/20 rounded-lg">
            <Trophy className="w-8 h-8 text-amber-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">{stats.questsCompleted}</div>
            <div className="text-sm text-gray-400">Quests Completed</div>
            <Progress value={questProgress} className="mt-2" />
          </div>
          
          {/* Gold */}
          <div className="text-center p-4 bg-green-800/20 rounded-lg">
            <Coins className="w-8 h-8 text-green-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">{stats.goldEarned}</div>
            <div className="text-sm text-gray-400">Gold Earned</div>
          </div>
          
          {/* Experience */}
          <div className="text-center p-4 bg-blue-800/20 rounded-lg">
            <Zap className="w-8 h-8 text-blue-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">{stats.xpGained}</div>
            <div className="text-sm text-gray-400">Experience Gained</div>
          </div>
          
          {/* Kingdom */}
          <div className="text-center p-4 bg-purple-800/20 rounded-lg">
            <Castle className="w-8 h-8 text-purple-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">{stats.kingdomTiles}</div>
            <div className="text-sm text-gray-400">Kingdom Tiles</div>
          </div>
        </div>
        
        {/* Additional Stats */}
        <div className="grid grid-cols-3 gap-4 mt-6">
          <div className="text-center">
            <Calendar className="w-6 h-6 text-amber-400 mx-auto mb-1" />
            <div className="text-lg font-bold text-white">{stats.currentStreak}</div>
            <div className="text-xs text-gray-400">Day Streak</div>
          </div>
          
          <div className="text-center">
            <Trophy className="w-6 h-6 text-yellow-400 mx-auto mb-1" />
            <div className="text-lg font-bold text-white">{stats.achievements}</div>
            <div className="text-xs text-gray-400">Achievements</div>
          </div>
          
          <div className="text-center">
            <Target className="w-6 h-6 text-blue-400 mx-auto mb-1" />
            <div className="text-lg font-bold text-white">{stats.level}</div>
            <div className="text-xs text-gray-400">Level</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 