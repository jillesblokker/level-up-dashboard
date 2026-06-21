"use client"

import { cn } from "@/lib/utils"
import { motion } from "framer-motion"
import { Crown, Star, Shield, Zap, Lock, CheckCircle2 } from "lucide-react"

interface Milestone {
  level: number
  label: string
  description: string
  type: 'title' | 'perk' | 'ascension'
  isUnlocked: boolean
}

interface LegacyRoadmapProps {
  currentLevel: number
  className?: string
}

const ROADMAP_DATA: Milestone[] = [
  { level: 0, label: "Squire", description: "Beginning of the journey", type: 'title', isUnlocked: true },
  { level: 10, label: "Knight", description: "Combat training begins", type: 'title', isUnlocked: false },
  { level: 20, label: "Might Mastery", description: "Perk: +10% Might Rewards", type: 'perk', isUnlocked: false },
  { level: 25, label: "Knowledge Seeker", description: "Perk: +10% Knowledge Rewards", type: 'perk', isUnlocked: false },
  { level: 30, label: "Viscount", description: "Regional leadership", type: 'title', isUnlocked: false },
  { level: 40, label: "Count", description: "High noble status", type: 'title', isUnlocked: false },
  { level: 50, label: "Legendary Hero", description: "Title: Legend of the Realm", type: 'title', isUnlocked: false },
  { level: 60, label: "Duke", description: "Ruler of a Duchy", type: 'title', isUnlocked: false },
  { level: 80, label: "King", description: "Supreme ruler of the realm", type: 'title', isUnlocked: false },
  { level: 100, label: "Godhood", description: "Transcendent Ascension", type: 'ascension', isUnlocked: false },
]

export function LegacyRoadmap({ currentLevel, className }: LegacyRoadmapProps) {
  return (
    <div className={cn("relative w-full overflow-hidden py-10", className)}>
      <div className="relative flex justify-between items-start px-4 overflow-x-auto no-scrollbar gap-12 min-w-[1000px]">
        {/* Background track line */}
        <div className="absolute top-[52px] left-[80px] right-[80px] h-[3px] bg-zinc-800 -translate-y-1/2 z-10 pointer-events-none" />
        
        {/* Progress Line */}
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(100, (currentLevel / 100) * 100)}%` }}
          className="absolute top-[52px] left-[80px] right-[80px] h-[3px] bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)] -translate-y-1/2 z-10 origin-left pointer-events-none"
        />

        {ROADMAP_DATA.map((milestone, idx) => {
          const isUnlocked = currentLevel >= milestone.level
          const prevMilestone = idx > 0 ? ROADMAP_DATA[idx - 1] : null
          const isNext = !isUnlocked && (idx === 0 || (prevMilestone && currentLevel >= prevMilestone.level))

          return (
            <div key={idx} className="flex flex-col items-center gap-4 relative z-20 group">
              {/* Level Indicator */}
              <div className={cn(
                "text-xs font-bold transition-colors duration-300",
                isUnlocked ? "text-amber-500" : "text-zinc-400"
              )}>
                LVL {milestone.level}
              </div>

              {/* Node */}
              <motion.div
                whileHover={{ scale: 1.2 }}
                className={cn(
                  "w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all duration-500",
                  isUnlocked 
                    ? "bg-zinc-900 border-amber-500 text-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.3)]" 
                    : isNext 
                      ? "bg-zinc-900 border-zinc-400 text-zinc-400 animate-pulse" 
                      : "bg-zinc-950 border-zinc-800 text-zinc-700"
                )}
              >
                {isUnlocked ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : milestone.type === 'title' ? (
                  <Crown className="w-5 h-5" />
                ) : milestone.type === 'perk' ? (
                  <Zap className="w-5 h-5" />
                ) : (
                  <Star className="w-5 h-5" />
                )}
              </motion.div>

              {/* Label */}
              <div className="text-center w-32">
                <div className={cn(
                  "text-sm font-bold truncate",
                  isUnlocked ? "text-white" : "text-zinc-400"
                )}>
                  {milestone.label}
                </div>
                <div className="text-[10px] text-zinc-400 line-clamp-2 mt-1">
                  {milestone.description}
                </div>
              </div>

              {/* Connector shadow for group hover */}
              <div className="absolute -inset-2 rounded-xl bg-amber-500/0 group-hover:bg-amber-500/5 transition-colors duration-300 pointer-events-none" />
            </div>
          )
        })}
      </div>
    </div>
  )
}

