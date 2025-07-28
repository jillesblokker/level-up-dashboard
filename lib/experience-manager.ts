import { toast } from "@/components/ui/use-toast"
import { calculateLevelFromExperience, calculateExperienceToNextLevel, CharacterStats } from "@/types/character"
import { createLevelUpNotification, createExperienceGainedNotification } from "@/lib/notifications"
import { emitExperienceGained } from "@/lib/kingdom-events"
import { getCharacterStats, addToCharacterStatSync, updateCharacterStatSync } from "@/lib/character-stats-manager"
import { getCurrentTitle } from "@/lib/title-manager"
import { notificationService } from "@/lib/notification-service"

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
    // Get current stats using the character stats manager
    const currentStats = getCharacterStats()

    // Get equipped perks and calculate bonus
    const equippedPerks = getEquippedPerks()
    const perkBonus = calculatePerkBonus(amount, category, equippedPerks)
    const totalAmount = amount + perkBonus

    // Calculate new stats
    const newExperience = currentStats.experience + totalAmount
    const newLevel = calculateLevelFromExperience(newExperience)
    
    // Update stats using the character stats manager (synchronous for immediate effect)
    addToCharacterStatSync('experience', totalAmount);
    updateCharacterStatSync('level', newLevel);

    // Emit kingdom event for tracking weekly progress
    emitExperienceGained(totalAmount, source)

    // Create notification for experience gained
    if (!source.startsWith('achievement-')) {
      createExperienceGainedNotification(amount, source, perkBonus)
    }

    // Check for level up and title unlocks
    if (newLevel > currentStats.level) {
      createLevelUpNotification(newLevel);
      
      // Check for new title unlock
      const oldTitle = getCurrentTitle(currentStats.level);
      const newTitle = getCurrentTitle(newLevel);
      
      if (newTitle.id !== oldTitle.id) {
        // New title unlocked!
        notificationService.addNotification(
          "New Title Unlocked! 👑",
          `Congratulations! You are now a ${newTitle.name}! ${newTitle.description}`,
          "achievement",
          "high",
          {
            label: "View Character",
            href: "/character",
          }
        );
      }
      
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

    return { ...currentStats, experience: newExperience, level: newLevel }
  } catch (error) {
    console.error("Error managing experience:", error)
    return null
  }
} 