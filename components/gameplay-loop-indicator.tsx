"use client"

import { ArrowRight, Trophy, Coins, Castle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

interface GameplayLoopIndicatorProps {
  questsCompleted?: number
  goldEarned?: number
  kingdomTiles?: number
  showProgress?: boolean
}

export function GameplayLoopIndicator({ 
  questsCompleted = 0, 
  goldEarned = 0, 
  kingdomTiles = 0,
  showProgress = true 
}: GameplayLoopIndicatorProps) {
  return (
    <Card className="bg-gradient-to-r from-amber-900/20 to-amber-800/20 border-amber-800/30">
      <CardContent className="p-4">
        <div className="flex items-center justify-center gap-2 text-sm text-amber-300 mb-2">
          <div className="flex items-center gap-1">
            <Trophy className="w-4 h-4" />
            <span>Quests</span>
          </div>
          <ArrowRight className="w-4 h-4" />
          <div className="flex items-center gap-1">
            <Coins className="w-4 h-4" />
            <span>Gold</span>
          </div>
          <ArrowRight className="w-4 h-4" />
          <div className="flex items-center gap-1">
            <Castle className="w-4 h-4" />
            <span>Kingdom</span>
          </div>
        </div>
        
        {showProgress && (
          <div className="grid grid-cols-3 gap-4 text-center text-xs">
            <div>
              <div className="text-amber-400 font-semibold">{questsCompleted}</div>
              <div className="text-gray-400">Completed</div>
            </div>
            <div>
              <div className="text-green-400 font-semibold">{goldEarned}</div>
              <div className="text-gray-400">Gold Earned</div>
            </div>
            <div>
              <div className="text-purple-400 font-semibold">{kingdomTiles}</div>
              <div className="text-gray-400">Tiles Placed</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 