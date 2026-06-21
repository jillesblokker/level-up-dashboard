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
    <Card className="bg-zinc-950 border-orange-900/40  overflow-hidden mb-8">
      <CardHeader className="pb-3 border-b border-orange-900/20 bg-orange-950/10">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-bold text-orange-500 font-medieval flex items-center gap-2">
            <Target className="w-5 h-5" />
            Weekly Mini-Challenges
          </CardTitle>
          <span className="text-xs text-orange-200/50 uppercase tracking-wider font-bold">Resets Monday</span>
        </div>
      </CardHeader>
      <CardContent className="p-4 md:p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        {challenges.map(challenge => {
          const progress = calculateChallengeProgress(challenge, quests, weeklyGoldEarned)
          const pct = Math.min((progress / challenge.targetCount) * 100, 100)
          const isDone = progress >= challenge.targetCount

          return (
            <div key={challenge.id} className="bg-zinc-950 border border-orange-900/20 rounded-xl p-4 flex flex-col relative overflow-hidden group hover:border-orange-500/30 transition-colors">
              {isDone && (
                <div className="absolute inset-0 bg-green-950/20 z-0" />
              )}
              
              <div className="relative z-10 flex-1">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-bold text-orange-100 text-sm">{challenge.title}</h4>
                  {isDone ? (
                    <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                  ) : (
                    <span className="text-[10px] text-orange-400/80 font-bold bg-orange-500/10 px-2 py-0.5 rounded-full border border-orange-500/20">
                      {progress} / {challenge.targetCount}
                    </span>
                  )}
                </div>
                <p className="text-xs text-zinc-400 mb-4">{challenge.description}</p>
              </div>

              <div className="relative z-10 mt-auto">
                {!isDone ? (
                  <Progress value={pct} className="h-1.5 bg-zinc-900 mb-2">
                    <div className="h-full bg-orange-500" style={{ width: `${pct}%` }} />
                  </Progress>
                ) : (
                  <div className="h-1.5 mb-2" /> 
                )}
                
                <div className="flex items-center gap-2 text-[10px] font-bold">
                  <span className="text-zinc-500 uppercase">Reward:</span>
                  <span className="text-blue-400">+{challenge.rewardXP} XP</span>
                  <span className="text-yellow-500">+{challenge.rewardGold} Gold</span>
                </div>
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
