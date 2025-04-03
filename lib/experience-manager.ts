import { toast } from "@/components/ui/use-toast"
import { showScrollToast } from "@/lib/toast-utils"
import { calculateLevelFromExperience, calculateExperienceForLevel, CharacterStats } from "@/types/character"

interface Perk {
  id: string;
  name: string;
  category: string;
  level: number;
  equipped: boolean;
}

function getEquippedPerks(): Perk[] {
  try {
    const perksData = localStorage.getItem("character-perks")
    return perksData ? JSON.parse(perksData).filter((p: Perk) => p.equipped) : []
  } catch (error) {
    console.error("Error loading perks:", error)
    return []
  }
}

function calculatePerkBonus(amount: number, category: string, perks: Perk[]): number {
  let bonus = 0
  
  perks.forEach(perk => {
    if (perk.equipped && perk.level > 0) {
      // Apply category-specific bonuses
      if (perk.category.toLowerCase() === category.toLowerCase()) {
        bonus += amount * (0.1 * perk.level) // 10% per level for category-specific perks
      }
      // Apply general bonuses
      if (perk.category.toLowerCase() === 'general') {
        bonus += amount * (0.05 * perk.level) // 5% per level for general perks
      }
    }
  })
  
  return Math.round(bonus)
}

export function gainExperience(amount: number, source: string, category: string = 'general') {
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

    // Get equipped perks and calculate bonus
    const equippedPerks = getEquippedPerks()
    const perkBonus = calculatePerkBonus(amount, category, equippedPerks)
    const totalAmount = amount + perkBonus

    // Calculate new stats
    const newExperience = currentStats.experience + totalAmount
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

    if (perkBonus > 0) {
      toast({
        title: "Experience Gained!",
        description: `+${amount} XP from ${source}\n+${perkBonus} XP from perks\nTotal: +${totalAmount} XP`,
      })
    } else {
      toast({
        title: "Experience Gained!",
        description: `+${amount} XP from ${source}`,
      })
    }

    return newStats
  } catch (error) {
    console.error("Error managing experience:", error)
    return null
  }
} 