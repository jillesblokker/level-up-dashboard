"use client"

import type React from "react"
import { useState } from "react"
import { Coffee } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"

interface NutritionWorkoutFormProps {
  onSubmit: (mealType: string, description: string, macros?: { protein: number; carbs: number; fat: number }) => void
}

export function NutritionWorkoutForm({ onSubmit }: NutritionWorkoutFormProps) {
  const [mealType, setMealType] = useState("Breakfast")
  const [description, setDescription] = useState("")
  const [trackMacros, setTrackMacros] = useState(false)
  const [protein, setProtein] = useState<number>(0)
  const [carbs, setCarbs] = useState<number>(0)
  const [fat, setFat] = useState<number>(0)

  const mealTypes = ["Breakfast", "Lunch", "Dinner", "Snack", "Pre-workout", "Post-workout", "Hydration"]

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (description) {
      const macros = trackMacros ? { protein, carbs, fat } : undefined
      onSubmit(mealType, description, macros)
    }
  }

  // Calculate estimated XP based on meal type and tracking
  const calculateXP = () => {
    if (!description) return 0

    // Base XP values for different meal types
    const baseXP = {
      Breakfast: 15,
      Lunch: 15,
      Dinner: 15,
      Snack: 5,
      "Pre-workout": 10,
      "Post-workout": 10,
      Hydration: 8,
    }

    let xp = baseXP[mealType as keyof typeof baseXP] || 10

    // Bonus for tracking macros
    if (trackMacros) {
      if (protein > 0 || carbs > 0 || fat > 0) {
        xp += 5
      }

      // Bonus for balanced meal (has all three macros)
      if (protein > 0 && carbs > 0 && fat > 0) {
        xp += 5
      }
    }

    // Bonus for detailed description
    if (description.length > 50) {
      xp += 5
    }

    return xp
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 py-4">
      <div className="space-y-2">
        <Label htmlFor="mealType">Meal Type</Label>
        <Select value={mealType} onValueChange={setMealType}>
          <SelectTrigger id="mealType">
            <SelectValue placeholder="Select meal type" />
          </SelectTrigger>
          <SelectContent>
            {mealTypes.map((type) => (
              <SelectItem key={type} value={type}>
                {type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          placeholder="Describe what you ate/drank"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      <div className="flex items-center space-x-2">
        <Switch id="track-macros" checked={trackMacros} onCheckedChange={setTrackMacros} />
        <Label htmlFor="track-macros">Track macros</Label>
      </div>

      {trackMacros && (
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="protein">Protein (g)</Label>
            <Input
              id="protein"
              type="number"
              min="0"
              placeholder="0"
              value={protein || ""}
              onChange={(e) => setProtein(Number.parseInt(e.target.value) || 0)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="carbs">Carbs (g)</Label>
            <Input
              id="carbs"
              type="number"
              min="0"
              placeholder="0"
              value={carbs || ""}
              onChange={(e) => setCarbs(Number.parseInt(e.target.value) || 0)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="fat">Fat (g)</Label>
            <Input
              id="fat"
              type="number"
              min="0"
              placeholder="0"
              value={fat || ""}
              onChange={(e) => setFat(Number.parseInt(e.target.value) || 0)}
            />
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 pt-2">
        <div className="bg-green-500 rounded-full p-2 text-white">
          <Coffee className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium">
            {description
              ? `${mealType}: ${description.substring(0, 30)}${description.length > 30 ? "..." : ""}`
              : "Enter your meal details"}
          </p>
          {description && <p className="text-xs text-muted-foreground">You'll earn +{calculateXP()} XP</p>}
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={!description}>
        Log Nutrition
      </Button>
    </form>
  )
}

