"use client"

import React from 'react'
import Image from 'next/image'
import { Trophy, Plus, Search, Target, Castle, Coins, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface EmptyStateProps {
  title: string
  description: string
  icon?: React.ReactNode
  creatureImage?: string
  creatureName?: string
  action?: {
    label: string
    onClick: () => void
  }
  className?: string
}

export function EmptyState({ 
  title, 
  description, 
  icon = <Trophy className="w-8 h-8 text-amber-400" />,
  creatureImage,
  creatureName,
  action,
  className = ""
}: EmptyStateProps) {
  return (
    <div className={`relative overflow-hidden rounded-2xl border-2 border-amber-600/40 bg-gradient-to-b from-[#18110b] via-[#0f0b07] to-[#0a0705] p-6 sm:p-8 text-center space-y-4 shadow-2xl ${className}`}>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-600/10 via-transparent to-transparent pointer-events-none" />

      {/* Living Creature or Icon */}
      <div className="flex items-center justify-center relative z-10">
        {creatureImage ? (
          <div className="relative w-16 h-16 rounded-2xl border-2 border-amber-500/40 bg-zinc-950/90 shadow-xl overflow-hidden shrink-0">
            <Image
              src={creatureImage}
              alt={creatureName || "Companion"}
              fill
              className="object-contain p-1"
              unoptimized
            />
          </div>
        ) : (
          <div className="w-14 h-14 rounded-2xl bg-amber-950/50 border-2 border-amber-600/40 flex items-center justify-center text-amber-300 shadow-xl">
            {icon}
          </div>
        )}
      </div>

      <div className="space-y-1.5 max-w-md mx-auto relative z-10">
        <h3 className="text-base sm:text-lg font-serif font-bold text-amber-200">{title}</h3>
        <p className="text-xs text-amber-300/80 leading-relaxed font-sans">{description}</p>
      </div>

      {action && (
        <div className="pt-1 relative z-10 flex justify-center">
          <Button
            onClick={action.onClick}
            className="btn-primary-cta text-xs px-6 py-2.5 h-auto shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 font-serif font-bold"
          >
            <Plus className="w-4 h-4" />
            {action.label}
          </Button>
        </div>
      )}
    </div>
  )
}

export function EmptyQuests({ onAddQuest }: { onAddQuest: () => void }) {
  return (
    <EmptyState
      title="No quests available"
      description="Leaf tends to the habit garden: 'Plant your first daily habit today to earn gold, essences, and level up your character!'"
      creatureImage="/images/creatures/Leaf.webp"
      creatureName="Leaf"
      action={{
        label: "Add your first quest",
        onClick: onAddQuest
      }}
    />
  )
}

export function EmptyChallenges({ onAddChallenge }: { onAddChallenge: () => void }) {
  return (
    <EmptyState
      title="No challenges yet"
      description="Flamio stokes the forge: 'Take on weekly challenges to test your stamina and earn rare honor!'"
      creatureImage="/images/creatures/Flamio.webp"
      creatureName="Flamio"
      action={{
        label: "Add a challenge",
        onClick: onAddChallenge
      }}
    />
  )
}

export function EmptyMilestones({ onAddMilestone }: { onAddMilestone: () => void }) {
  return (
    <EmptyState
      title="No milestones set"
      description="Turtoisy inspects the foundation stone: 'Set lifelong cumulative milestones to track your enduring progress over time!'"
      creatureImage="/images/creatures/Turtoisy.webp"
      creatureName="Turtoisy"
      action={{
        label: "Create a milestone",
        onClick: onAddMilestone
      }}
    />
  )
}

export function EmptyKingdom({ onBuyTile }: { onBuyTile: () => void }) {
  return (
    <EmptyState
      title="Your kingdom awaits"
      description="Rockie stacks the masonry: 'Purchase and place your first realm tile to start earning passive taxes!'"
      creatureImage="/images/creatures/Rockie.webp"
      creatureName="Rockie"
      action={{
        label: "Buy first tile",
        onClick: onBuyTile
      }}
    />
  )
}

export function EmptyInventory({ onEarnGold }: { onEarnGold: () => void }) {
  return (
    <EmptyState
      title="No items discovered yet"
      description="Rockie peers into your pouch: 'Complete quests and explore the market to gather powerful equipment and gear!'"
      creatureImage="/images/creatures/Rockie.webp"
      creatureName="Rockie"
      action={{
        label: "Embark on quests to earn gold",
        onClick: onEarnGold
      }}
    />
  )
}

export function EmptySearch({ searchTerm }: { searchTerm: string }) {
  return (
    <EmptyState
      title="No scrolls match your search"
      description={`Sage Owl checks the library archives: "No records found matching '${searchTerm}'. Adjust your query or view all items."`}
      creatureImage="/images/creatures/Sage_owl.webp"
      creatureName="Sage Owl"
      icon={<Search className="w-8 h-8 text-amber-400" />}
    />
  )
}

export function EmptyAchievements() {
  return (
    <EmptyState
      title="No achievements unlocked yet"
      description="Sage Owl unrolls the royal hall of records: 'Complete quests, challenges, and build your kingdom to carve your name among legends!'"
      creatureImage="/images/creatures/Sage_owl.webp"
      creatureName="Sage Owl"
    />
  )
} 