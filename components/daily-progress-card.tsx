"use client"

import { useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Trophy, Target, Zap } from "lucide-react"
import { formatCount, cn } from "@/lib/utils"

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

    useEffect(() => {
        if (completedCount >= 5) {
            const todayKey = `thrivehaven_sweetspot_${new Date().toISOString().slice(0, 10)}`;
            if (!sessionStorage.getItem(todayKey)) {
                sessionStorage.setItem(todayKey, 'celebrated');
                if (typeof window !== 'undefined') {
                    import('canvas-confetti').then(confetti => {
                        confetti.default({
                            particleCount: 100,
                            spread: 80,
                            origin: { y: 0.5 },
                            colors: ['#f59e0b', '#fbbf24', '#10b981', '#6366f1', '#ec4899']
                        });
                    }).catch(() => {});
                }
            }
        }
    }, [completedCount]);

    return (
        <Card className="bg-gradient-to-br from-amber-900/20 to-amber-950/20 border-amber-700/30 shadow-lg font-serif">
            <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Daily Quests Progress */}
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-amber-400">
                            <Target className="w-5 h-5" />
                            <span className="font-semibold">Today&apos;s Quests</span>
                        </div>
                        <div className="text-3xl font-bold text-white flex items-center gap-2 font-mono">
                            {completedCount}/{totalCount}
                            {completedCount >= 5 && (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/50 text-amber-300 font-sans font-bold animate-pulse">
                                    Great ✨
                                </span>
                            )}
                        </div>
                        <Progress
                            value={completionPercentage}
                            className={cn("h-2 bg-amber-950/50", completedCount >= 5 && "shadow-[0_0_12px_rgba(245,158,11,0.7)] border border-amber-400/40")}
                        />
                        <p className="text-sm text-amber-200/70 font-sans">
                            {formatCount(totalCount - completedCount, 'quest')} remaining
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

                {/* 5/10 Sweet Spot Milestone Celebration Banner */}
                {completedCount >= 5 && (
                    <div className="mt-4 p-3 bg-gradient-to-r from-amber-500/20 via-emerald-500/20 to-amber-500/20 border-2 border-amber-500/60 rounded-xl shadow-[0_0_20px_rgba(245,158,11,0.25)] flex items-center justify-between gap-3 animate-pulse font-serif">
                        <div className="flex items-center gap-2.5">
                            <span className="text-2xl">🎉</span>
                            <div>
                                <h4 className="text-sm font-bold text-amber-300">5/10 Daily sweet spot reached!</h4>
                                <p className="text-xs text-amber-200/80 font-sans">&ldquo;Great&rdquo; habit momentum unlocked for your kingdom.</p>
                            </div>
                        </div>
                        <span className="px-2.5 py-1 rounded-full bg-amber-500/30 border border-amber-400/50 text-[10px] font-bold text-amber-200 font-mono shrink-0">
                            Sweet spot active ✨
                        </span>
                    </div>
                )}

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
