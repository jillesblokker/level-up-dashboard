import { toast } from "@/components/ui/use-toast"
import { showScrollToast } from "@/lib/toast-utils"
import { calculateLevelFromExperience, calculateExperienceForLevel, CharacterStats } from "@/types/character"

export function gainExperience(amount: number, source: string) {
  try {
    // Get current stats
    const savedStats = localStorage.getItem("character-stats")
    const currentStats = savedStats ? JSON.parse(savedStats) as CharacterStats : {
      level: 1,
      experience: 0,
      experienceToNextLevel: 100,
      gold: 1000,
      titles: {
        equipped: "",
        unlocked: 0,
        total: 10
      },
      perks: {
        active: 0,
        total: 5
      }
    }

    // Calculate new stats
    const newExperience = currentStats.experience + amount
    const newLevel = calculateLevelFromExperience(newExperience)
    const newStats: CharacterStats = {
      ...currentStats,
      experience: newExperience,
      level: newLevel,
      experienceToNextLevel: calculateExperienceForLevel(newLevel)
    }

    // Save to localStorage
    localStorage.setItem("character-stats", JSON.stringify(newStats))

    // Dispatch event to notify components
    window.dispatchEvent(new Event("character-stats-update"))

    // Show toast notifications
    if (newLevel > currentStats.level) {
      toast({
        title: "Level Up!",
        description: `You've reached level ${newLevel}!`,
      })
    }

    toast({
      title: "Experience Gained!",
      description: `+${amount} XP from ${source}`,
    })

    return newStats
  } catch (error) {
    console.error("Error managing experience:", error)
    return null
  }
} 