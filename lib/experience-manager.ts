import { toast } from "@/components/ui/use-toast"
import { calculateLevelFromExperience, calculateExperienceToNextLevel, CharacterStats } from "@/types/character"
import { createLevelUpNotification, createExperienceGainedNotification } from "@/lib/notifications"
import { emitExperienceGained } from "@/lib/kingdom-events"
import { getCharacterStats, addToCharacterStat, updateCharacterStats } from "@/lib/character-stats-service"
import { getCurrentTitle } from "@/lib/title-manager"
import { notificationService } from "@/lib/notification-service"
import { fetchWithAuth } from '@/lib/fetchWithAuth'

interface Perk {
  id: string;
  name: string;
  category: string;
  level: number;
  equipped: boolean;
}

// Get equipped perks (Supabase user preference first, fallback to localStorage)
async function getEquippedPerks(): Promise<Perk[]> {
  try {
    // Try server preference via API helper
    const clerk = (typeof window !== 'undefined') ? (window as any).__clerk : undefined;
    const uid = clerk?.user?.id;
    if (uid) {
      const res = await fetchWithAuth(`/api/user-preferences?preference_key=character-perks`, { method: 'GET' });
      if (res.ok) {
        const json = await res.json();
        const value = json?.data?.preference_value || json?.data?.value;
        if (value) {
          const perks = JSON.parse(value);
          return Array.isArray(perks) ? perks.filter((p: Perk) => p.equipped) : [];
        }
      }
    }
  } catch { }
  // Fallback to local
  try {
    const savedPerks = localStorage.getItem('character-perks');
    if (!savedPerks) return [];
    const perks = JSON.parse(savedPerks);
    return Array.isArray(perks) ? perks.filter((p: Perk) => p.equipped) : [];
  } catch (error) {
    console.error('Error loading perks:', error);
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

export async function gainExperience(amount: number, source: string, category: string = 'general') {
  try {
    // Get current stats using the unified service
    const currentStats = getCharacterStats()

    // Get equipped perks and calculate bonus
    const equippedPerks = await getEquippedPerks()
    const perkBonus = calculatePerkBonus(amount, category, equippedPerks)
    const totalAmount = amount + perkBonus

    // Calculate new stats locally
    const newExperience = currentStats.experience + totalAmount
    const newLevel = calculateLevelFromExperience(newExperience)

    // Update stats using the unified service (handles state, event, and sync)
    // We update both experience and level at once to ensure consistency
    updateCharacterStats({
      experience: newExperience,
      level: newLevel
    }, source);

    // Log experience transaction to database for audit trail
    await logExperienceTransaction(totalAmount, newExperience, 'gain', source, { category, perkBonus, baseAmount: amount });

    // Emit kingdom event for tracking weekly progress
    emitExperienceGained(totalAmount, source)

    // Create notification for experience gained
    if (totalAmount > 0) {
      createExperienceGainedNotification(totalAmount, source, 0)
    }

    // Check for level up
    const oldLevel = currentStats.level
    if (newLevel > oldLevel) {
      // Level up notification
      createExperienceGainedNotification(
        newLevel - oldLevel,
        'level-up',
        0
      )

      // Dispatch level up event
      const levelUpEvent = new CustomEvent('level-up', {
        detail: { oldLevel, newLevel, totalExperience: newExperience }
      })
      window.dispatchEvent(levelUpEvent)
    }

    return {
      success: true,
      amount: totalAmount,
      newExperience,
      newLevel,
      perkBonus,
      leveledUp: newLevel > oldLevel
    }
  } catch (error) {
    console.error('[Experience Manager] Error gaining experience:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// New function to log experience transactions to database
async function logExperienceTransaction(
  amount: number,
  totalAfter: number,
  transactionType: 'gain' | 'spend',
  source: string,
  metadata?: any
) {
  try {
    const response = await fetchWithAuth('/api/experience-transactions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount,
        totalAfter,
        transactionType,
        source,
        metadata
      }),
    });

    if (!response.ok) {
      console.warn('[Experience Manager] Failed to log transaction to database:', response.status);
    } else {
      // Removed debugging log
    }
  } catch (error) {
    console.warn('[Experience Manager] Error logging transaction:', error);
    // Don't fail the main operation if logging fails
  }
}