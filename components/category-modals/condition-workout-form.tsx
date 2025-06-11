"use client"

import type React from "react"
import { useState } from "react"
import { Activity } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"

interface ConditionWorkoutFormProps {
  onSubmit: (activity: string, duration: number, distance?: number) => void
}

export function ConditionWorkoutForm({ onSubmit }: ConditionWorkoutFormProps) {
  const [activity, setActivity] = useState("Running")
  const [duration, setDuration] = useState<number>(0)
  const [distance, setDistance] = useState<number | undefined>(undefined)
  const [trackDistance, setTrackDistance] = useState(false)

  const activities = ["Running", "Cycling", "Swimming", "HIIT", "Walking", "Rowing", "Stair Climbing", "Elliptical"]

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (duration > 0) {
      onSubmit(activity, duration, trackDistance ? distance : undefined)
    }
  }

  // Calculate estimated XP based on duration and activity type
  const calculateXP = () => {
    if (duration <= 0) return 0

    // Base XP: 1 XP per minute
    let xp = duration

    // Bonus XP for tracked distance
    if (trackDistance && distance && distance > 0) {
      xp += Math.floor(distance * 5) // 5 XP per km/mile
    }

    // Activity intensity multiplier
    const intensityMultiplier = {
      Running: 1.5,
      Cycling: 1.2,
      Swimming: 1.8,
      HIIT: 2.0,
      Walking: 0.8,
      Rowing: 1.6,
      "Stair Climbing": 1.7,
      Elliptical: 1.1,
    }

    xp = Math.floor(xp * (intensityMultiplier[activity as keyof typeof intensityMultiplier] || 1))

    return xp
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 py-4">
      <div className="space-y-2">
        <Label htmlFor="activity">Activity Type</Label>
        <Select value={activity} onValueChange={setActivity}>
          <SelectTrigger id="activity">
            <SelectValue placeholder="Select activity" />
          </SelectTrigger>
          <SelectContent>
            {activities.map((act) => (
              <SelectItem key={act} value={act}>
                {act}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="duration">Duration (minutes)</Label>
        <Input
          id="duration"
          type="number"
          min="1"
          placeholder="Enter duration in minutes"
          value={duration || ""}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDuration(Number.parseInt(e.target.value) || 0)}
        />
      </div>

      <div className="flex items-center space-x-2">
        <Switch id="track-distance" checked={trackDistance} onCheckedChange={setTrackDistance} />
        <Label htmlFor="track-distance">Track distance</Label>
      </div>

      {trackDistance && (
        <div className="space-y-2">
          <Label htmlFor="distance">Distance (km)</Label>
          <Input
            id="distance"
            type="number"
            min="0.1"
            step="0.1"
            placeholder="Enter distance in km"
            value={distance || ""}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDistance(Number.parseFloat(e.target.value) || 0)}
          />
        </div>
      )}

      <div className="flex items-center gap-2 pt-2">
        <div className="bg-blue-500 rounded-full p-2 text-white">
          <Activity className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium">
            {duration > 0
              ? `${duration} min ${activity}${trackDistance && distance ? ` (${distance} km)` : ""}`
              : "Enter your workout"}
          </p>
          {duration > 0 && <p className="text-xs text-muted-foreground">You&apos;ll earn +{calculateXP()} XP</p>}
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={duration <= 0}>
        Log Workout
      </Button>
    </form>
  )
}

