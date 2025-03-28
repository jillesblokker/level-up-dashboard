"use client"

import React from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface LeaderboardEntry {
  id: number
  name: string
  avatar: string
  xp: number
  level: number
  topCategory: string
  recentAchievement?: string
}

interface LeaderboardProps {
  entries: LeaderboardEntry[]
  timeframe: "weekly" | "monthly" | "all-time"
}

export function Leaderboard({ entries, timeframe }: LeaderboardProps) {
  return (
    <div className="space-y-8">
      {entries.map((entry) => (
        <div key={entry.id} className="flex items-center">
          <Avatar className="h-9 w-9">
            <AvatarImage src={entry.avatar} alt={entry.name} />
            <AvatarFallback>{entry.name[0]}</AvatarFallback>
          </Avatar>
          <div className="ml-4 space-y-1">
            <p className="text-sm font-medium leading-none">{entry.name}</p>
            <p className="text-sm text-muted-foreground">
              Level {entry.level} • {entry.xp} XP • {entry.topCategory}
            </p>
            {entry.recentAchievement && (
              <p className="text-sm text-green-500">
                🏆 {entry.recentAchievement}
              </p>
            )}
          </div>
          <div className="ml-auto font-medium">#{entry.id}</div>
        </div>
      ))}
    </div>
  )
}

export default Leaderboard

