"use client"

import { useEffect, useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Target, CheckCircle2 } from 'lucide-react'
import { WeeklyChallenge, getWeeklyChallenges, getCurrentWeekNumber, calculateChallengeProgress } from '@/lib/weekly-challenges'
// No import needed for Quest
import { useAuth, useUser } from '@clerk/nextjs'

interface WeeklyChallengesCardProps {
  quests: any[]
  weeklyGoldEarned: number
}

export function WeeklyChallengesCard({ quests, weeklyGoldEarned }: WeeklyChallengesCardProps) {
  const { user } = useUser()
  const weekNumber = getCurrentWeekNumber()
  
  const challenges = useMemo(() => {
    if (!user?.id) return []
    return getWeeklyChallenges(user.id, weekNumber)
  }, [user?.id, weekNumber])

  if (!user?.id || challenges.length === 0) return null

  return (
    <Card className="bg-zinc-950 border-orange-900/40 overflow-hidden h-full flex flex-col">
      <CardHeader className="pb-3 border-b border-orange-900/20 bg-orange-950/10">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-bold text-orange-500 font-medieval flex items-center gap-2">
            <Target className="w-5 h-5" />
            Weekly mini-challenges
          </CardTitle>
          <span className="text-xs text-orange-200/70 tracking-wider font-mono font-bold flex items-center gap-1">
            ⏱️ {(() => {
              const now = new Date();
              const day = now.getDay();
              const daysUntilMonday = ((8 - day) % 7) || 7;
              const nextMonday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + daysUntilMonday);
              const diffMs = Math.max(0, nextMonday.getTime() - now.getTime());
              const daysLeft = Math.floor(diffMs / (1000 * 60 * 60 * 24));
              const hoursLeft = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
              return `${daysLeft}d ${hoursLeft}h left`;
            })()}
          </span>
        </div>
      </CardHeader>
      <CardContent className="p-4 md:p-5 flex-1 flex flex-col gap-3.5 justify-between">
        {challenges.map(challenge => {
          const progress = calculateChallengeProgress(challenge, quests, weeklyGoldEarned)
          const pct = Math.min((progress / challenge.targetCount) * 100, 100)
          const isDone = progress >= challenge.targetCount

          return (
            <div
              key={challenge.id}
              className={`flex-1 rounded-xl p-4 flex flex-col justify-between relative overflow-hidden transition-all duration-200 border ${
                isDone
                  ? 'bg-emerald-950/20 border-emerald-500/30'
                  : 'bg-zinc-900/60 border-orange-900/25 hover:border-orange-500/40 hover:bg-orange-950/15'
              }`}
            >
              <div className="relative z-10">
                <div className="flex justify-between items-start gap-2 mb-1.5">
                  <h4 className="font-bold text-orange-100 text-sm">{challenge.title}</h4>
                  {isDone ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      Completed
                    </span>
                  ) : (
                    <span className="text-[10px] text-orange-400 font-mono font-bold bg-orange-500/10 px-2 py-0.5 rounded-full border border-orange-500/20 shrink-0">
                      {progress} / {challenge.targetCount}
                    </span>
                  )}
                </div>
                <p className="text-xs text-zinc-400 line-clamp-2">{challenge.description}</p>
              </div>

              <div className="relative z-10 mt-3 space-y-2">
                <div className="flex items-center justify-between text-[10px] font-mono">
                  <span className="text-zinc-500">Progress</span>
                  <span className="text-orange-400 font-bold">{Math.round(pct)}%</span>
                </div>
                <Progress value={pct} className="h-1.5 bg-zinc-950 border border-white/5 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      isDone
                        ? 'bg-emerald-500'
                        : 'bg-gradient-to-r from-orange-600 to-amber-500'
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </Progress>
                
                <div className="flex items-center justify-between pt-0.5 text-[11px] font-bold">
                  <span className="text-zinc-500 text-[10px] font-medium">Reward:</span>
                  <div className="flex items-center gap-2 font-mono text-[11px]">
                    <span className="text-blue-400">+{challenge.rewardXP} XP</span>
                    <span className="text-amber-400">+{challenge.rewardGold} gold</span>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
