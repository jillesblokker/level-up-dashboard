"use client"

import { useEffect, useState } from "react"
import { X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { StrengthWorkoutForm } from "@/components/strength-workout-form"
import { CelebrationEffect } from "@/components/celebration-effect"

interface StrengthModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (exercise: string, reps: number) => void
}

export function StrengthModal({ open, onOpenChange, onSubmit }: StrengthModalProps) {
  const [mounted, setMounted] = useState(false)
  const [showCelebration, setShowCelebration] = useState(false)

  // Handle mounting to avoid hydration issues
  useEffect(() => {
    setMounted(true)
  }, [])

  const handleSubmit = (exercise: string, reps: number) => {
    // Check if we should celebrate 100 pushups
    if (exercise.toLowerCase() === "push-ups" && reps === 100) {
      setShowCelebration(true)

      // Hide celebration after a few seconds
      setTimeout(() => {
        setShowCelebration(false)
        onSubmit(exercise, reps)
      }, 3000)
    } else {
      onSubmit(exercise, reps)
    }
  }

  if (!mounted) return null
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity animate-in fade-in"
        onClick={() => onOpenChange(false)}
      />

      {/* Modal */}
      <div className="fixed z-50 w-full max-w-lg scale-100 rounded-lg bg-background p-6 opacity-100 shadow-lg animate-in fade-in-90 slide-in-from-bottom-10 sm:rounded-lg md:w-full">
        <div className="flex flex-col space-y-1.5 text-center sm:text-left">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold leading-none tracking-tight">Log Strength Workout</h2>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => onOpenChange(false)}>
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">Track your strength progress and earn XP</p>
        </div>

        <div className="mt-6">
          <StrengthWorkoutForm onSubmit={handleSubmit} />
        </div>

        {/* Celebration overlay */}
        {showCelebration && <CelebrationEffect message="Amazing! 100 Push-ups Club Achievement Unlocked! +100 XP" />}
      </div>
    </div>
  )
}

