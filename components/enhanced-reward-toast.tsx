"use client"

import { Coins, Star, Zap, Trophy } from 'lucide-react'
import { toast } from '@/components/ui/use-toast'
import { announceToScreenReader } from '@/lib/accessibility'

interface RewardData {
  gold?: number
  xp?: number
  source: string
  item?: string
  achievement?: string
}

export function showEnhancedRewardToast(reward: RewardData) {
  const { gold = 0, xp = 0, source, item, achievement } = reward
  
  // Create visual toast
  toast({
    title: "Rewards Earned!",
    description: (
      <div className="flex items-center gap-2">
        <div className="flex flex-col gap-1">
          {gold > 0 && (
            <div className="flex items-center gap-1 text-green-400">
              <Coins className="w-4 h-4" />
              <span>+{gold} Gold</span>
            </div>
          )}
          {xp > 0 && (
            <div className="flex items-center gap-1 text-blue-400">
              <Zap className="w-4 h-4" />
              <span>+{xp} XP</span>
            </div>
          )}
          {item && (
            <div className="flex items-center gap-1 text-purple-400">
              <Star className="w-4 h-4" />
              <span>Found {item}</span>
            </div>
          )}
          {achievement && (
            <div className="flex items-center gap-1 text-amber-400">
              <Trophy className="w-4 h-4" />
              <span>{achievement}</span>
            </div>
          )}
          <div className="text-xs text-gray-400 mt-1">from {source}</div>
        </div>
      </div>
    ),
    duration: 4000,
  })
  
  // Announce to screen readers
  const announcement = [
    gold > 0 && `Earned ${gold} gold`,
    xp > 0 && `Earned ${xp} experience`,
    item && `Found ${item}`,
    achievement && `Achievement unlocked: ${achievement}`,
    `from ${source}`
  ].filter(Boolean).join('. ')
  
  announceToScreenReader(announcement)
}

export function showQuestCompletionToast(questName: string, gold: number, xp: number) {
  showEnhancedRewardToast({
    gold,
    xp,
    source: `completing ${questName}`,
  })
}

export function showAchievementToast(achievementName: string, gold: number, xp: number) {
  showEnhancedRewardToast({
    gold,
    xp,
    source: 'achievement',
    achievement: achievementName,
  })
}

export function showItemFoundToast(itemName: string, xp: number) {
  showEnhancedRewardToast({
    xp,
    source: 'exploration',
    item: itemName,
  })
} 