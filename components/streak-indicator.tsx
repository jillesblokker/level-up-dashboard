"use client"

import { Map, Shield, Compass, Navigation, ShieldAlert } from "lucide-react"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface StreakIndicatorProps {
    currentStreak: number
    isCompletedToday: boolean
}

function getExpeditionDetails(streak: number) {
    if (streak <= 7) return { name: "Whispering Woods", icon: <Compass className="w-4 h-4" /> }
    if (streak <= 14) return { name: "Crystal Peaks", icon: <Map className="w-4 h-4" /> }
    if (streak <= 30) return { name: "Sunken Sea", icon: <Navigation className="w-4 h-4" /> }
    return { name: "Astral Realms", icon: <Compass className="w-4 h-4" /> }
}

export function StreakIndicator({ currentStreak, isCompletedToday }: StreakIndicatorProps) {
    const isPaused = currentStreak === 0 && !isCompletedToday;
    const displayStreak = Math.max(1, currentStreak);
    const exp = getExpeditionDetails(displayStreak);

    // Calculate if streak is at risk (< 12h remaining)
    const now = new Date();
    const nextMidnight = new Date(now);
    nextMidnight.setHours(24, 0, 0, 0);
    const msUntilReset = nextMidnight.getTime() - now.getTime();
    const hoursUntilReset = msUntilReset / (1000 * 60 * 60);
    const isAtRisk = !isCompletedToday && currentStreak > 0 && hoursUntilReset < 12;

    const displayIcon = isAtRisk ? <ShieldAlert className="w-4 h-4 text-red-500 animate-pulse drop-shadow-[0_0_8px_rgba(239,68,68,0.6)]" /> : exp.icon;

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <div className={cn(
                        "flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all duration-300",
                        isCompletedToday
                            ? "bg-indigo-950/40 border-indigo-500/50 text-indigo-400 shadow-[0_0_10px_rgba(99,102,241,0.2)]"
                            : isPaused 
                                ? "bg-amber-950/40 border-amber-700/50 text-amber-500" 
                                : "bg-zinc-900 border-zinc-700 text-zinc-400"
                    )}>
                        <div className="relative">
                            <div className={cn(
                                "transition-all duration-500",
                                isCompletedToday ? "text-indigo-500 animate-pulse" : isPaused ? "text-amber-500" : (isAtRisk ? "text-red-500" : "text-zinc-500")
                            )}>
                                {displayIcon}
                            </div>
                        </div>
                        <span className={cn("font-bold font-serif text-sm", isAtRisk && "text-red-400")}>
                            {isPaused ? "Expedition Paused" : (isAtRisk ? "Streak at Risk!" : `Day ${displayStreak}`)}
                        </span>
                        {!isPaused && !isAtRisk && <span className="text-xs tracking-wider opacity-80 hidden sm:inline">of the {exp.name}</span>}
                        {isAtRisk && <span className="text-xs tracking-wider opacity-90 hidden sm:inline text-red-400/80">{Math.floor(hoursUntilReset)}h left</span>}
                    </div>
                </TooltipTrigger>
                <TooltipContent className="bg-black border border-indigo-900 text-indigo-100 p-3 max-w-xs">
                    <div className="space-y-2">
                        <div className="font-bold flex items-center gap-2">
                            {exp.icon}
                            <span>{exp.name} Expedition</span>
                        </div>
                        <p className="text-xs text-zinc-300">
                            {isCompletedToday
                                ? "You've continued your journey today. Great work!"
                                : isPaused 
                                    ? "Your journey is paused. Complete a habit to resume travel."
                                    : isAtRisk
                                        ? "Your streak shield is cracking! Complete a quest soon to protect your streak."
                                        : "Complete at least one quest today to continue your journey."}
                        </p>
                    </div>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    )
}
