"use client"

import { Flame, Shield } from "lucide-react"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface StreakIndicatorProps {
    currentStreak: number
    isCompletedToday: boolean
}

export function StreakIndicator({ currentStreak, isCompletedToday }: StreakIndicatorProps) {
    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <div className={cn(
                        "flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all duration-300",
                        isCompletedToday
                            ? "bg-orange-950/40 border-orange-500/50 text-orange-400 shadow-[0_0_10px_rgba(249,115,22,0.2)]"
                            : "bg-gray-900/40 border-gray-700 text-gray-400"
                    )}>
                        <div className="relative">
                            <Flame className={cn(
                                "w-4 h-4 transition-all duration-500",
                                isCompletedToday ? "text-orange-500 fill-orange-500 animate-pulse" : "text-gray-500"
                            )} />
                            {isCompletedToday && (
                                <div className="absolute inset-0 blur-sm bg-orange-500/50 rounded-full animate-pulse" />
                            )}
                        </div>
                        <span className="font-bold font-mono text-sm">{currentStreak}</span>
                        <span className="text-xs uppercase tracking-wider opacity-80">Day Streak</span>
                    </div>
                </TooltipTrigger>
                <TooltipContent className="bg-black border border-orange-900 text-orange-100 p-3 max-w-xs">
                    <div className="space-y-2">
                        <div className="font-bold flex items-center gap-2">
                            <Flame className="w-4 h-4 text-orange-500" />
                            <span>Keep the flame alive!</span>
                        </div>
                        <p className="text-xs text-gray-300">
                            {isCompletedToday
                                ? "You've extended your streak today. Great work!"
                                : "Complete at least one quest today to maintain your streak."}
                        </p>
                        {!isCompletedToday && currentStreak > 0 && (
                            <div className="flex items-center gap-2 text-xs text-red-400 mt-2 bg-red-950/30 p-1.5 rounded">
                                <Shield className="w-3 h-3" />
                                <span>Streak at risk!</span>
                            </div>
                        )}
                    </div>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    )
}
