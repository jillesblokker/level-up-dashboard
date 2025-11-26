"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Trophy, Target, Zap } from "lucide-react"

interface DailyProgressCardProps {
    completedCount: number
    totalCount: number
    currentLevel: number
    currentXP: number
    xpToNextLevel: number
    currentGold: number
}

export function DailyProgressCard({
    completedCount,
    totalCount,
    currentLevel,
    currentXP,
    xpToNextLevel,
    currentGold
}: DailyProgressCardProps) {
    const completionPercentage = (completedCount / totalCount) * 100
    const xpPercentage = (currentXP / xpToNextLevel) * 100

    return (
        <Card className="bg-gradient-to-br from-amber-900/20 to-amber-950/20 border-amber-700/30 shadow-lg">
            <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Daily Quests Progress */}
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-amber-400">
                            <Target className="w-5 h-5" />
                            <span className="font-semibold">Today&apos;s Quests</span>
                        </div>
                        <div className="text-3xl font-bold text-white">
                            {completedCount}/{totalCount}
                        </div>
                        <Progress value={completionPercentage} className="h-2 bg-amber-950/50" />
                        <p className="text-sm text-amber-200/70">
                            {totalCount - completedCount} quests remaining
                        </p>
                    </div>

                    {/* Level Progress */}
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-blue-400">
                            <Zap className="w-5 h-5" />
                            <span className="font-semibold">Level Progress</span>
                        </div>
                        <div className="text-3xl font-bold text-white">
                            Level {currentLevel}
                        </div>
                        <Progress value={xpPercentage} className="h-2 bg-blue-950/50" />
                        <p className="text-sm text-blue-200/70">
                            {currentXP}/{xpToNextLevel} XP
                        </p>
                    </div>

                    {/* Gold & Next Goal */}
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-yellow-400">
                            <Trophy className="w-5 h-5" />
                            <span className="font-semibold">Treasury</span>
                        </div>
                        <div className="text-3xl font-bold text-white">
                            {currentGold} 💰
                        </div>
                        <div className="h-2" /> {/* Spacer to align with other cards */}
                        <p className="text-sm text-yellow-200/70">
                            Complete quests to earn more gold
                        </p>
                    </div>
                </div>

                {/* Motivational Message */}
                {completedCount === 0 && (
                    <div className="mt-4 p-3 bg-amber-900/20 border border-amber-700/30 rounded-lg">
                        <p className="text-center text-amber-200 text-sm">
                            🗡️ <strong>Begin your adventure!</strong> Complete your first quest to earn rewards.
                        </p>
                    </div>
                )}

                {completedCount > 0 && completedCount < totalCount && (
                    <div className="mt-4 p-3 bg-amber-900/20 border border-amber-700/30 rounded-lg">
                        <p className="text-center text-amber-200 text-sm">
                            ⚔️ <strong>Well done, adventurer!</strong> {totalCount - completedCount} more {totalCount - completedCount === 1 ? 'quest' : 'quests'} await.
                        </p>
                    </div>
                )}

                {completedCount === totalCount && (
                    <div className="mt-4 p-3 bg-green-900/20 border border-green-700/30 rounded-lg">
                        <p className="text-center text-green-200 text-sm">
                            🏆 <strong>Victory!</strong> All quests completed today. Return tomorrow for new challenges!
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
