'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Hammer, Sparkles, Trophy, CheckCircle2, RotateCcw, Footprints, Compass } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { addToCharacterStat } from '@/lib/character-stats-service'

import Image from 'next/image'

interface PlankLabyrinthModalProps {
  isOpen: boolean
  onClose: () => void
}

interface LabyrinthNode {
  id: number
  label: string
  icon: string
}

interface DailyExpedition {
  name: string
  subtitle: string
  badge: string
  buldourQuote: string
  rewardTitle: string
  nodes: LabyrinthNode[]
}

const DAILY_EXPEDITIONS: DailyExpedition[] = [
  // Sunday (0)
  {
    name: 'Royal garden maze',
    subtitle: 'Navigate the sovereign hedge maze to the sunlit terrace.',
    badge: 'Sunday expedition',
    buldourQuote: 'Watch the thorn bushes! Keep your boots planted firm on the marble tiles.',
    rewardTitle: 'Rose terrace reconnected',
    nodes: [
      { id: 1, label: 'Rose archway', icon: '🌹' },
      { id: 2, label: 'Marble fountain', icon: '⛲' },
      { id: 3, label: 'Topiary court', icon: '🌳' },
      { id: 4, label: 'Sundial patio', icon: '☀️' },
      { id: 5, label: 'Sovereign throne', icon: '👑' }
    ]
  },
  // Monday (1)
  {
    name: 'Citadel ramparts',
    subtitle: 'Realign the paving stepping stones sequentially to reconnect the king’s shrine.',
    badge: 'Monday expedition',
    buldourQuote: 'Measure thrice, chisel once! Every grand citadel is paved one stepping stone at a time.',
    rewardTitle: 'King’s shrine reconnected',
    nodes: [
      { id: 1, label: 'Town square', icon: '🏛️' },
      { id: 2, label: 'Craftsmen bridge', icon: '🌁' },
      { id: 3, label: 'Market bazaar', icon: '🏪' },
      { id: 4, label: 'Citadel gate', icon: '🏰' },
      { id: 5, label: 'King’s shrine', icon: '⛩️' }
    ]
  },
  // Tuesday (2)
  {
    name: 'Sunken watercourse',
    subtitle: 'Cross the harbor canal stones safely before the tide rushes in.',
    badge: 'Tuesday expedition',
    buldourQuote: 'Slippery moss on the river stones! Step true and mind the rushing current.',
    rewardTitle: 'Sunken grotto discovered',
    nodes: [
      { id: 1, label: 'Harbor docks', icon: '⚓' },
      { id: 2, label: 'Lilypad ford', icon: '🪷' },
      { id: 3, label: 'Whispering falls', icon: '🌊' },
      { id: 4, label: 'Coral grotto', icon: '🐚' },
      { id: 5, label: 'Sunken temple', icon: '🏛️' }
    ]
  },
  // Wednesday (3)
  {
    name: 'Enchanted glade',
    subtitle: 'Tread softly across the rootbridges into the fae heartwood.',
    badge: 'Wednesday expedition',
    buldourQuote: 'Ancient roots run deep. The forest spirits only open the path to disciplined steps.',
    rewardTitle: 'Sacred spring blessed',
    nodes: [
      { id: 1, label: 'Forest threshold', icon: '🌲' },
      { id: 2, label: 'Starlight clearing', icon: '✨' },
      { id: 3, label: 'Ancient hollow', icon: '🦉' },
      { id: 4, label: 'Fairy circle', icon: '🍄' },
      { id: 5, label: 'Sacred spring', icon: '⛲' }
    ]
  },
  // Thursday (4)
  {
    name: 'Volcanic ridge trail',
    subtitle: 'Step across cooled basalt stepping stones above the molten fissures.',
    badge: 'Thursday expedition',
    buldourQuote: 'Hot embers below! Test each black stone before putting your full weight down.',
    rewardTitle: 'Molten vault reached',
    nodes: [
      { id: 1, label: 'Ember foothill', icon: '🌋' },
      { id: 2, label: 'Obsidian bridge', icon: '🌉' },
      { id: 3, label: 'Basalt spire', icon: '🏔️' },
      { id: 4, label: 'Dragon roost', icon: '🐉' },
      { id: 5, label: 'Molten vault', icon: '💎' }
    ]
  },
  // Friday (5)
  {
    name: 'High aerie walkway',
    subtitle: 'Cross the suspension skywalk between mountain pinnacles.',
    badge: 'Friday expedition',
    buldourQuote: 'Don’t look down into the clouds! Keep your eyes on the next weathered oak plank.',
    rewardTitle: 'Celestial peak climbed',
    nodes: [
      { id: 1, label: 'Mountain foot', icon: '🧗' },
      { id: 2, label: 'Cloud ropebridge', icon: '☁️' },
      { id: 3, label: 'Griffin perch', icon: '🦅' },
      { id: 4, label: 'Star observatory', icon: '🔭' },
      { id: 5, label: 'Celestial peak', icon: '🌌' }
    ]
  },
  // Saturday (6)
  {
    name: 'Forgotten catacombs',
    subtitle: 'Decode the numbered runestones along the crypt passage.',
    badge: 'Saturday expedition',
    buldourQuote: 'Dark corridors make cowards of the hasty. One careful step at a time uncovers the gold.',
    rewardTitle: 'Treasure crypt unlocked',
    nodes: [
      { id: 1, label: 'Crypt portal', icon: '🗝️' },
      { id: 2, label: 'Runic hallway', icon: '📜' },
      { id: 3, label: 'Stone archway', icon: '🏛️' },
      { id: 4, label: 'Shadow altar', icon: '🕯️' },
      { id: 5, label: 'Treasure crypt', icon: '👑' }
    ]
  }
]

export function PlankLabyrinthModal({ isOpen, onClose }: PlankLabyrinthModalProps) {
  const { toast } = useToast()
  const [visitedNodes, setVisitedNodes] = useState<number[]>([1])
  const [isCompleted, setIsCompleted] = useState(false)

  // Determine current day of week expedition
  const expedition = useMemo(() => {
    const dayOfWeek = new Date().getDay() // 0 to 6
    return DAILY_EXPEDITIONS[dayOfWeek] || DAILY_EXPEDITIONS[1]!
  }, [])

  useEffect(() => {
    if (!isOpen) return
    const today = new Date().toDateString()
    const lastLabyrinth = localStorage.getItem('plank_labyrinth_solve_date')
    if (lastLabyrinth === today) {
      setIsCompleted(true)
      setVisitedNodes([1, 2, 3, 4, 5])
    } else {
      setIsCompleted(false)
      setVisitedNodes([1])
    }
  }, [isOpen])

  const handleNodeClick = async (id: number) => {
    if (isCompleted) return
    const nextExpected = visitedNodes.length + 1
    if (id === nextExpected) {
      const nextVisited = [...visitedNodes, id]
      setVisitedNodes(nextVisited)
      if (nextVisited.length === expedition.nodes.length) {
        setIsCompleted(true)
        const today = new Date().toDateString()
        localStorage.setItem('plank_labyrinth_solve_date', today)
        await addToCharacterStat('gold', 250, 'plank-labyrinth-solve')
        await addToCharacterStat('build_tokens', 3, 'plank-labyrinth-solve')
        toast({
          title: `🧱 ${expedition.name} mastered!`,
          description: `${expedition.rewardTitle}! Awarded +250 gold & 3x crafting blocks.`,
        })
      }
    } else if (!visitedNodes.includes(id)) {
      toast({
        title: "⚡ Path blocked",
        description: `Follow the sequential path! Step on landmark #${nextExpected} next.`,
        variant: "destructive"
      })
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(op) => { if (!op) onClose() }}>
      <DialogContent className="max-w-md w-full bg-[#120e0b] border border-amber-800/40 text-amber-100 p-5 sm:p-6 rounded-2xl shadow-2xl font-serif text-center overflow-hidden z-[100]">
        <DialogHeader className="px-4 sm:px-8">
          <div className="mx-auto w-12 h-12 rounded-full bg-amber-950 border border-amber-500/40 flex items-center justify-center mb-2 shadow-lg">
            <Footprints className="w-6 h-6 text-amber-400 animate-pulse" />
          </div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-950/60 border border-amber-500/30 text-[10px] font-mono text-amber-400 font-bold mx-auto mb-1">
            <Compass className="w-3 h-3 text-amber-400" />
            {expedition.badge}
          </div>
          <DialogTitle className="text-xl sm:text-2xl font-medieval text-amber-300 break-words">
            {expedition.name}
          </DialogTitle>
          <DialogDescription className="text-xs text-zinc-300 italic leading-relaxed pt-1">
            {expedition.subtitle} Step sequentially from landmark 1 to 5!
          </DialogDescription>
        </DialogHeader>

        {/* Buldour Avatar & Story Banner */}
        <div className="flex items-center gap-3 bg-gradient-to-r from-amber-950/50 via-zinc-950 to-zinc-950 border border-amber-500/30 p-2.5 rounded-2xl shadow-md my-1 text-left">
          <div className="relative w-11 h-11 rounded-full overflow-hidden border-2 border-amber-500/60 shadow-[0_0_10px_rgba(245,158,11,0.3)] shrink-0 bg-amber-950 flex items-center justify-center">
            <Image
              src="/images/creatures/Buldour.webp"
              alt="Buldour"
              fill
              className="object-cover"
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-bold font-serif text-amber-300 flex items-center gap-1.5">
              <span>Buldour</span>
              <span className="text-[10px] font-mono text-amber-400/90 font-bold bg-amber-950/60 px-1.5 py-0.2 rounded border border-amber-500/30">Fortress builder</span>
            </div>
            <p className="text-xs text-zinc-200 font-serif italic leading-snug pt-0.5">
              {isCompleted ? (
                <span>&ldquo;Solid as granite! The path is paved true. No dungeon earthquake can crack this foundation!&rdquo;</span>
              ) : (
                <span>&ldquo;{expedition.buldourQuote}&rdquo;</span>
              )}
            </p>
          </div>
        </div>

        <div className="my-3 p-3 sm:p-4 bg-zinc-950/90 rounded-2xl border border-amber-950/60 space-y-3">
          <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
            {expedition.nodes.map((node) => {
              const isVisited = visitedNodes.includes(node.id)
              const isNext = visitedNodes.length + 1 === node.id
              return (
                <button
                  key={node.id}
                  onClick={() => handleNodeClick(node.id)}
                  className={`p-2 sm:p-3 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all duration-200 cursor-pointer min-h-[68px] ${
                    isVisited
                      ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.3)]'
                      : isNext
                      ? 'bg-amber-950/80 border-amber-500/50 text-amber-200 animate-bounce'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-600 opacity-60'
                  }`}
                >
                  <span className="text-lg sm:text-xl">{node.icon}</span>
                  <span className="text-[9px] font-bold font-mono">#{node.id}</span>
                  <span className="text-[8px] sm:text-[9px] font-serif text-zinc-400 truncate max-w-full hidden sm:block">
                    {node.label}
                  </span>
                </button>
              )
            })}
          </div>

          {isCompleted && (
            <div className="p-3 bg-amber-500/20 border border-amber-400/50 rounded-xl text-xs font-bold text-amber-300 animate-in fade-in leading-relaxed text-center">
              ✨ Master builder’s lesson proven! Paving steadily without skipping reconnected the trail. Awarded +250 gold & 3x crafting blocks.
            </div>
          )}
        </div>

        <Button
          onClick={onClose}
          className="w-full bg-amber-600 hover:bg-amber-500 text-black font-medieval font-bold shadow-lg shadow-amber-950/50 py-2 sm:py-2.5 rounded-xl border border-amber-400/50"
        >
          {isCompleted ? 'Close expedition' : 'Close for now'}
        </Button>
      </DialogContent>
    </Dialog>
  )
}
