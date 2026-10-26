import { logger } from "@/lib/logger";
import { toast } from "@/components/ui/use-toast"
import { calculateLevelFromExperience, calculateExperienceToNextLevel, CharacterStats } from "@/types/character"
export { calculateLevelFromExperience, calculateExperienceToNextLevel }
import { createLevelUpNotification, createExperienceGainedNotification } from "@/lib/notifications"
import { emitExperienceGained } from "@/lib/kingdom-events"
import { getCharacterStats, addToCharacterStat, updateCharacterStats } from "@/lib/character-stats-service"
import { gainMana } from "@/lib/mana-manager"
import { getCurrentTitle } from "@/lib/title-manager"
import { notificationService } from "@/lib/notification-service"
import { fetchWithAuth } from '@/lib/fetchWithAuth'
import { loadKingdomGrid } from '@/lib/supabase-persistence-client'
import { calculateKingdomBonuses } from '@/lib/kingdom-utils'
import { getActivePerks } from '@/lib/active-perks-manager'

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
    const clerk = (typeof window !== 'undefined') ? ((window as any).__clerk || (window as any).Clerk || (window as any).clerk) : undefined;
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
    logger.error('Error loading perks:', error);
    return [];
  }
}

// Calculate bonus XP from character perks based on quest category
// Perk IDs match text-content.ts: perk-might, perk-knowledge, perk-honor, perk-castle, perk-craft, perk-vitality
function calculatePerkBonus(baseAmount: number, category: string, equippedPerks: Perk[]): number {
  let totalBonus = 0;
  const cat = category.toLowerCase();

  for (const perk of equippedPerks) {
    let bonusPercentage = 0;

    // Each perk grants +10% XP per level for its matching category
    switch (perk.id) {
      case "perk-might":
        if (cat === 'might') bonusPercentage = perk.level * 10;
        break;
      case "perk-knowledge":
        if (cat === 'knowledge') bonusPercentage = perk.level * 10;
        break;
      case "perk-honor":
        if (cat === 'honor') bonusPercentage = perk.level * 10;
        break;
      case "perk-castle":
        if (cat === 'castle') bonusPercentage = perk.level * 10;
        break;
      case "perk-craft":
        if (cat === 'craft') bonusPercentage = perk.level * 10;
        break;
      case "perk-vitality":
        if (cat === 'vitality' || cat === 'wellness') bonusPercentage = perk.level * 10;
        break;
      // Legacy perk IDs for backward compatibility
      case "p1":
        if (cat === 'might') bonusPercentage = perk.level * 10;
        break;
      case "p4":
        if (cat === 'knowledge') bonusPercentage = perk.level * 10;
        break;
      case "p5":
        if (cat === 'vitality' || cat === 'wellness') bonusPercentage = perk.level * 15;
        break;
    }

    if (bonusPercentage > 0) {
      totalBonus += Math.floor(baseAmount * (bonusPercentage / 100));
    }
  }

  return totalBonus;
}

// Calculate bonus XP from active potion perks (e.g. "Exp draught +25% quest EXP")
function calculateActiveBuffBonus(baseAmount: number): number {
  try {
    const activePerks = getActivePerks();
    const now = new Date();
    for (const perk of activePerks) {
      if (new Date(perk.expires_at) <= now) continue;
      // Match the Exp draught buff
      if (perk.perk_name === 'Exp draught' || perk.effect?.includes('+25% quest EXP')) {
        return Math.floor(baseAmount * 0.25);
      }
    }
  } catch (e) {
    logger.warn('[Experience Manager] Error reading active buffs:', e);
  }
  return 0;
}

// Calculate bonus XP from kingdom tile bonuses (libraries, mills, etc.)
function calculateKingdomXpBonus(baseAmount: number, grid: any[][] | null): number {
  if (!grid || !Array.isArray(grid) || grid.length === 0) return 0;
  try {
    const bonuses = calculateKingdomBonuses(grid);
    if (bonuses.xpBonusPercent > 0) {
      return Math.floor(baseAmount * (bonuses.xpBonusPercent / 100));
    }
  } catch (e) {
    logger.warn('[Experience Manager] Error calculating kingdom XP bonus:', e);
  }
  return 0;
}

export async function gainExperience(amount: number, source: string, category: string = 'general') {
  try {
    // Get current stats using the unified service
    const currentStats = getCharacterStats()

    // Get equipped perks and calculate bonus
    const equippedPerks = await getEquippedPerks()
    const perkBonus = calculatePerkBonus(amount, category, equippedPerks)
    let totalAmount = amount + perkBonus

    // Active potion buff bonus (e.g. Exp draught +25%)
    const buffBonus = calculateActiveBuffBonus(amount);
    totalAmount += buffBonus;

    // Kingdom tile XP bonuses (libraries, mills, castles, daily-hub, windmill)
    try {
      const clerk = (typeof window !== 'undefined') ? ((window as any).__clerk || (window as any).Clerk || (window as any).clerk) : undefined;
      const uid = clerk?.user?.id;
      if (uid) {
        const gridData = await loadKingdomGrid(uid);
        const kingdomXpBonus = calculateKingdomXpBonus(amount, gridData);
        if (kingdomXpBonus > 0) {
          totalAmount += kingdomXpBonus;
        }
      }
    } catch (e) {
      logger.error('Failed to check kingdom synergy for EXP:', e);
    }

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

    // Habit completion awards +25 Willpower Mana
    gainMana(25);

    // Create notification for experience gained
    if (totalAmount > 0) {
      createExperienceGainedNotification(totalAmount, source, 0)
    }

    // Check for level up
    const oldLevel = currentStats.level
    if (newLevel > oldLevel) {
      // Level up notification
      createLevelUpNotification(newLevel)

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
    logger.error('[Experience Manager] Error gaining experience:', error)
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
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);

    fetchWithAuth('/api/experience-transactions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
      body: JSON.stringify({
        amount,
        totalAfter,
        transactionType,
        source,
        metadata
      }),
    }).then(res => {
      clearTimeout(timeoutId);
    }).catch(() => {
      clearTimeout(timeoutId);
    });
  } catch {}
}