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

// Get equipped perks from localStorage
function getEquippedPerks(): Perk[] {
  try {
    const savedPerks = localStorage.getItem("character-perks");
    if (!savedPerks) return [];
    
    const perks = JSON.parse(savedPerks);
    return perks.filter((p: Perk) => p.equipped);
  } catch (error) {
    console.error("Error loading perks:", error);
    return [];
  }
}

// Calculate bonus XP from perks based on activity category
function calculatePerkBonus(baseAmount: number, category: string, equippedPerks: Perk[]): number {
  let totalBonus = 0;

  for (const perk of equippedPerks) {
    let bonusPercentage = 0;

    switch (perk.id) {
      case "p1": // Strength Mastery
        if (category === "Might") {
          bonusPercentage = perk.level * 10;
        }
        break;
      case "p2": // Endurance Training
        if (category === "Endurance") {
          bonusPercentage = perk.level * 10;
        }
        break;
      case "p4": // Quick Learner
        if (category === "Wisdom") {
          bonusPercentage = perk.level * 10;
        }
        break;
      case "p5": // Nutritional Expert
        if (category === "Vitality") {
          bonusPercentage = perk.level * 15;
        }
        break;
      case "p6": // Rest Master
        if (category === "Resilience") {
          bonusPercentage = perk.level * 10;
        }
        break;
    }

    if (bonusPercentage > 0) {
      totalBonus += Math.floor(baseAmount * (bonusPercentage / 100));
    }
  }

  return totalBonus;
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