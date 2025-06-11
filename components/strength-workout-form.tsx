"use client"

import type React from "react"

import { useState } from "react"
import { Dumbbell } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface StrengthWorkoutFormProps {
  onSubmit: (exercise: string, reps: number) => void
}

export function StrengthWorkoutForm({ onSubmit }: StrengthWorkoutFormProps) {
  const [exercise, setExercise] = useState("Push-ups")
  const [reps, setReps] = useState<number>(0)

  const exercises = ["Push-ups", "Pull-ups", "Dips", "Squats", "Lunges", "Sit-ups", "Planks", "Burpees"]

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (reps > 0) {
      onSubmit(exercise, reps)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 py-4">
      <div className="space-y-2">
        <Label htmlFor="exercise">Exercise</Label>
        <Select value={exercise} onValueChange={setExercise}>
          <SelectTrigger id="exercise">
            <SelectValue placeholder="Select exercise" />
          </SelectTrigger>
          <SelectContent>
            {exercises.map((ex) => (
              <SelectItem key={ex} value={ex}>
                {ex}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="reps">How many?</Label>
        <Input
          id="reps"
          type="number"
          min="1"
          placeholder="Enter number of reps"
          value={reps || ""}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setReps(Number.parseInt(e.target.value) || 0)}
        />
      </div>

      <div className="flex items-center gap-2 pt-2">
        <div className="bg-red-500 rounded-full p-2 text-white">
          <Dumbbell className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium">{reps > 0 ? `${reps} ${exercise}` : "Enter your workout"}</p>
          {reps > 0 && <p className="text-xs text-muted-foreground">You&apos;ll earn +{Math.floor(reps / 10) * 5} XP</p>}
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={reps <= 0}>
        Log Workout
      </Button>
    </form>
  )
}

