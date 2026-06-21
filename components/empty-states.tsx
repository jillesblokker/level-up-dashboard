"use client"

import { Trophy, Plus, Search, Target, Castle, Coins } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

interface EmptyStateProps {
  title: string
  description: string
  icon?: React.ReactNode
  action?: {
    label: string
    onClick: () => void
  }
  className?: string
}

export function EmptyState({ 
  title, 
  description, 
  icon = <Trophy className="w-16 h-16 text-gray-400" />,
  action,
  className = ""
}: EmptyStateProps) {
  return (
    <Card className={`bg-gray-900/50 border-gray-800/30 ${className}`}>
      <CardContent className="p-8 text-center">
        <div className="flex flex-col items-center gap-4">
          {icon}
          <h3 className="text-lg font-semibold text-gray-300">{title}</h3>
          <p className="text-gray-400 max-w-md">{description}</p>
          {action && (
            <Button onClick={action.onClick} className="bg-amber-500 hover:bg-amber-600">
              <Plus className="w-4 h-4 mr-2" />
              {action.label}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export function EmptyQuests({ onAddQuest }: { onAddQuest: () => void }) {
  return (
    <EmptyState
      title="No Quests Available"
      description="Start your journey by adding your first quest. Complete quests to earn gold and experience!"
      icon={<Target className="w-16 h-16 text-amber-400" />}
      action={{
        label: "Add Your First Quest",
        onClick: onAddQuest
      }}
    />
  )
}

export function EmptyChallenges({ onAddChallenge }: { onAddChallenge: () => void }) {
  return (
    <EmptyState
      title="No Challenges Yet"
      description="Take on challenges to test your skills and earn greater rewards!"
      icon={<Trophy className="w-16 h-16 text-blue-400" />}
      action={{
        label: "Add Challenge",
        onClick: onAddChallenge
      }}
    />
  )
}

export function EmptyMilestones({ onAddMilestone }: { onAddMilestone: () => void }) {
  return (
    <EmptyState
      title="No Milestones Set"
      description="Set meaningful milestones to track your long-term progress and achievements!"
      icon={<Target className="w-16 h-16 text-purple-400" />}
      action={{
        label: "Create Milestone",
        onClick: onAddMilestone
      }}
    />
  )
}

export function EmptyKingdom({ onBuyTile }: { onBuyTile: () => void }) {
  return (
    <EmptyState
      title="Your Kingdom Awaits"
      description="Start building your kingdom by purchasing and placing your first tile!"
      icon={<Castle className="w-16 h-16 text-green-400" />}
      action={{
        label: "Buy First Tile",
        onClick: onBuyTile
      }}
    />
  )
}

export function EmptyInventory({ onEarnGold }: { onEarnGold: () => void }) {
  return (
    <EmptyState
      title="No Items Yet"
      description="Complete quests and explore to earn gold, then buy items to enhance your character!"
      icon={<Coins className="w-16 h-16 text-yellow-400" />}
      action={{
        label: "Earn Gold",
        onClick: onEarnGold
      }}
    />
  )
}

export function EmptySearch({ searchTerm }: { searchTerm: string }) {
  return (
    <EmptyState
      title="No Results Found"
      description={`No items match "${searchTerm}". Try adjusting your search terms or browse all items.`}
      icon={<Search className="w-16 h-16 text-gray-400" />}
    />
  )
}

export function EmptyAchievements() {
  return (
    <EmptyState
      title="No Achievements Yet"
      description="Complete quests, challenges, and explore your kingdom to unlock achievements!"
      icon={<Trophy className="w-16 h-16 text-amber-400" />}
    />
  )
} 