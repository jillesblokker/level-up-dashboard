"use client"

import { logger } from "@/lib/logger";
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { ArrowRight, Coins, Sword, Castle, Trophy, TrendingUp, Sparkles } from 'lucide-react'
import { getCharacterStats } from '@/lib/character-stats-service'
import { calculateLevelFromExperience } from '@/types/character'
import { formatGold } from '@/lib/utils'

export function ProgressionVisualization() {
  const [stats, setStats] = useState({
    experience: 0,
    gold: 0,
    level: 1,
    kingdomExpansions: 1,
    completedToday: 0
  })

  useEffect(() => {
    const loadStats = () => {
      try {
        const characterStats = getCharacterStats()
        const level = characterStats.level || calculateLevelFromExperience(characterStats.experience || 0)

        // Try reading today's completed habit count from storage
        let completedCount = 0
        try {
          const raw = localStorage.getItem('thrivehaven_habits_completed_today') || localStorage.getItem('daily_completed_count')
          if (raw) completedCount = parseInt(raw, 10) || 0
        } catch {}

        setStats({
          experience: characterStats.experience || 0,
          gold: characterStats.gold || 0,
          level,
          kingdomExpansions: characterStats.kingdom_expansions || 1,
          completedToday: completedCount
        })
      } catch (error) {
        logger.error('Error loading stats:', error)
      }
    }

    loadStats()

    const handleStatsUpdate = () => loadStats()
    window.addEventListener('character-stats-update', handleStatsUpdate)

    return () => {
      window.removeEventListener('character-stats-update', handleStatsUpdate)
    }
  }, [])

  // Calculate clean, sensible milestone targets
  const questTarget = 10;
  const goldMilestoneTarget = stats.gold < 10000 
    ? 10000 
    : stats.gold < 100000 
    ? 100000 
    : stats.gold < 1000000 
    ? 1000000 
    : Math.ceil((stats.gold + 1) / 1000000) * 1000000;
  
  const expansionTarget = Math.max(5, (Math.floor(stats.kingdomExpansions / 5) + 1) * 5);

  const getProgressPercentage = (value: number, target: number) => {
    if (target <= 0) return 0;
    return Math.min(Math.round((value / target) * 100), 100);
  }

  return (
    <div className="space-y-4">
      <Card className="border border-amber-950/30 bg-[#0f1115] shadow-xl rounded-2xl overflow-hidden">
        <CardHeader className="pb-3 border-b border-white/5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <CardTitle className="flex items-center gap-2 text-sm font-bold text-amber-400 font-cardo">
                <TrendingUp className="h-4 w-4 text-amber-400" />
                Kingdom expansion loop
              </CardTitle>
              <CardDescription className="text-xs text-zinc-400 mt-0.5">
                Complete daily habits to generate gold and expand your realm territories
              </CardDescription>
            </div>
            <Badge variant="outline" className="w-fit text-[10px] border-amber-500/30 text-amber-300 bg-amber-950/20 font-mono">
              Level {stats.level} ruler
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="pt-4 space-y-4">
          {/* Interactive 3-Pillar Expansion Loop */}
          <div className="grid gap-3 md:grid-cols-3">
            {/* Step 1: Quests */}
            <div className="relative p-3.5 rounded-xl border border-blue-500/20 bg-blue-950/10 flex flex-col justify-between space-y-3 hover:border-blue-500/40 transition-all">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 rounded-lg bg-blue-500/15 text-blue-400 border border-blue-500/30">
                    <Sword className="h-4 w-4" />
                  </div>
                  <Badge className="bg-blue-950/80 text-blue-300 border border-blue-500/30 text-[9px] font-mono">
                    Step 1
                  </Badge>
                </div>
                <h3 className="font-bold text-xs text-zinc-100">Complete quests</h3>
                <p className="text-[11px] text-zinc-400 mt-0.5 leading-snug">
                  Earn experience, gold tithes, and virtue energy
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-[11px] font-mono">
                  <span className="text-zinc-400">Daily target</span>
                  <span className="text-blue-300 font-bold">
                    {stats.completedToday} / {questTarget}
                  </span>
                </div>
                <Progress
                  value={getProgressPercentage(stats.completedToday, questTarget)}
                  className="h-1.5 bg-zinc-900"
                />
                <Button
                  asChild
                  size="sm"
                  variant="outline"
                  className="w-full mt-2 h-7 text-[11px] border-blue-500/30 text-blue-300 hover:bg-blue-950/40 hover:text-white"
                >
                  <Link href="/quests">
                    View quests <ArrowRight className="ml-1.5 h-3 w-3" />
                  </Link>
                </Button>
              </div>
            </div>

            {/* Step 2: Gold */}
            <div className="relative p-3.5 rounded-xl border border-amber-500/20 bg-amber-950/10 flex flex-col justify-between space-y-3 hover:border-amber-500/40 transition-all">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 rounded-lg bg-amber-500/15 text-amber-400 border border-amber-500/30">
                    <Coins className="h-4 w-4" />
                  </div>
                  <Badge className="bg-amber-950/80 text-amber-300 border border-amber-500/30 text-[9px] font-mono">
                    Step 2
                  </Badge>
                </div>
                <h3 className="font-bold text-xs text-zinc-100">Treasury wealth</h3>
                <p className="text-[11px] text-zinc-400 mt-0.5 leading-snug">
                  Fund kingdom tiles, citizen training, and potions
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-[11px] font-mono">
                  <span className="text-zinc-400">Treasury</span>
                  <span className="text-amber-300 font-bold">
                    {formatGold(stats.gold)} Gold
                  </span>
                </div>
                <Progress
                  value={getProgressPercentage(stats.gold, goldMilestoneTarget)}
                  className="h-1.5 bg-zinc-900"
                />
                <Button
                  asChild
                  size="sm"
                  variant="outline"
                  className="w-full mt-2 h-7 text-[11px] border-amber-500/30 text-amber-300 hover:bg-amber-950/40 hover:text-white"
                >
                  <Link href="/market">
                    Open market <ArrowRight className="ml-1.5 h-3 w-3" />
                  </Link>
                </Button>
              </div>
            </div>

            {/* Step 3: Tiles / Realm */}
            <div className="relative p-3.5 rounded-xl border border-purple-500/20 bg-purple-950/10 flex flex-col justify-between space-y-3 hover:border-purple-500/40 transition-all">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 rounded-lg bg-purple-500/15 text-purple-400 border border-purple-500/30">
                    <Castle className="h-4 w-4" />
                  </div>
                  <Badge className="bg-purple-950/80 text-purple-300 border border-purple-500/30 text-[9px] font-mono">
                    Step 3
                  </Badge>
                </div>
                <h3 className="font-bold text-xs text-zinc-100">Expand realm</h3>
                <p className="text-[11px] text-zinc-400 mt-0.5 leading-snug">
                  Claim territories and unlock passive tax yields
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-[11px] font-mono">
                  <span className="text-zinc-400">Expansions</span>
                  <span className="text-purple-300 font-bold">
                    {stats.kingdomExpansions} / {expansionTarget}
                  </span>
                </div>
                <Progress
                  value={getProgressPercentage(stats.kingdomExpansions, expansionTarget)}
                  className="h-1.5 bg-zinc-900"
                />
                <Button
                  asChild
                  size="sm"
                  variant="outline"
                  className="w-full mt-2 h-7 text-[11px] border-purple-500/30 text-purple-300 hover:bg-purple-950/40 hover:text-white"
                >
                  <Link href="/realm">
                    Build realm <ArrowRight className="ml-1.5 h-3 w-3" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 