"use client"

import type React from "react"
import { useState } from "react"
import { Book } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

interface KnowledgeWorkoutFormProps {
  onSubmit: (activity: string, amount: number, details?: string) => void
}

export function KnowledgeWorkoutForm({ onSubmit }: KnowledgeWorkoutFormProps) {
  const [activity, setActivity] = useState("Reading")
  const [amount, setAmount] = useState<number>(0)
  const [details, setDetails] = useState<string>("")

  const activities = [
    "Reading",
    "Course",
    "Podcast",
    "Educational Video",
    "Language Learning",
    "Writing",
    "Coding",
    "Research",
  ]

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (amount > 0) {
      onSubmit(activity, amount, details || undefined)
    }
  }

  // Get the appropriate label based on activity type
  const getAmountLabel = () => {
    switch (activity) {
      case "Reading":
        return "Pages read"
      case "Course":
        return "Minutes spent"
      case "Podcast":
        return "Minutes listened"
      case "Educational Video":
        return "Minutes watched"
      case "Language Learning":
        return "Minutes practiced"
      case "Writing":
        return "Words written"
      case "Coding":
        return "Minutes coding"
      case "Research":
        return "Minutes researching"
      default:
        return "Amount"
    }
  }

  // Calculate estimated XP based on activity and amount
  const calculateXP = () => {
    if (amount <= 0) return 0

    let xp = 0
    switch (activity) {
      case "Reading":
        xp = Math.floor(amount * 0.5) // 0.5 XP per page
        break
      case "Course":
        xp = Math.floor(amount * 0.6) // 0.6 XP per minute
        break
      case "Podcast":
        xp = Math.floor(amount * 0.4) // 0.4 XP per minute
        break
      case "Educational Video":
        xp = Math.floor(amount * 0.5) // 0.5 XP per minute
        break
      case "Language Learning":
        xp = Math.floor(amount * 0.7) // 0.7 XP per minute
        break
      case "Writing":
        xp = Math.floor(amount * 0.025) // 0.025 XP per word (25 XP per 1000 words)
        break
      case "Coding":
        xp = Math.floor(amount * 0.6) // 0.6 XP per minute
        break
      case "Research":
        xp = Math.floor(amount * 0.5) // 0.5 XP per minute
        break
      default:
        xp = amount
    }

    // Bonus for detailed notes
    if (details && details.length > 50) {
      xp = Math.floor(xp * 1.2) // 20% bonus for detailed notes
    }

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
        <Label htmlFor="amount">{getAmountLabel()}</Label>
        <Input
          id="amount"
          type="number"
          min="1"
          placeholder={`Enter ${getAmountLabel().toLowerCase()}`}
          value={amount || ""}
          onChange={(e) => setAmount(Number.parseInt(e.target.value) || 0)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="details">Notes (optional)</Label>
        <Textarea
          id="details"
          placeholder="Add details about what you learned"
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          className="h-24"
        />
      </div>

      <div className="flex items-center gap-2 pt-2">
        <div className="bg-purple-500 rounded-full p-2 text-white">
          <Book className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium">
            {amount > 0 ? `${amount} ${getAmountLabel().toLowerCase()} of ${activity}` : "Enter your learning activity"}
          </p>
          {amount > 0 && <p className="text-xs text-muted-foreground">You'll earn +{calculateXP()} XP</p>}
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={amount <= 0}>
        Log Activity
      </Button>
    </form>
  )
}

