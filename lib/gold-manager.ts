import { logger } from "@/lib/logger";
import { toast } from "@/components/ui/use-toast";
import { dedupedToast } from "@/lib/toast-utils";
import { emitGoldGained } from "@/lib/kingdom-events";
import { getCharacterStats, addToCharacterStat } from "@/lib/character-stats-service";
import { createGoldGainedNotification } from "@/lib/notifications";
import { fetchWithAuth } from '@/lib/fetchWithAuth';
import { getAchievementMessage, getAchievementIdFromSource } from "@/lib/achievement-messages";

import { formatCleanName } from "@/lib/utils";

// Enhanced gold manager with database transaction logging
export async function gainGold(amount: number, source: string, metadata?: any) {
  try {
    // Get current stats using the unified service
    const currentStats = getCharacterStats();

    // Add gold using the unified service (handles validation and syncing)
    addToCharacterStat('gold', amount, source);

    // Log transaction to database for audit trail
    const newBalance = currentStats.gold + amount;
    await logGoldTransaction(amount, newBalance, 'gain', source, metadata);

    // Emit kingdom event for tracking weekly progress
    emitGoldGained(amount, source);

    // Only create notification for non-achievement sources
    if (!source.startsWith('achievement-')) {
      createGoldGainedNotification(amount, source);
    }

    // Dispatch gold gain event for perk bonuses
    const goldGainEvent = new CustomEvent("gold-gain", {
      detail: { amount, source }
    });
    window.dispatchEvent(goldGainEvent);

    // Show improved toast notification for achievements
    const achievementId = getAchievementIdFromSource(source);
    const achievementMessage = achievementId ? getAchievementMessage(achievementId) : null;

    if (achievementMessage) {
      toast({
        title: achievementMessage.title,
        description: achievementMessage.description,
      });
    } else {
      const cleanName = formatCleanName(source);
      let title = "Gold gained 💰";
      let description = `+${amount} gold from ${cleanName.toLowerCase()}`;

      if (source === 'kingdom-tile-reward') {
        title = "Kingdom prosperity 🏰";
        description = `Your kingdom flourishes! +${amount} gold collected.`;
      } else if (source.startsWith('quest-')) {
        title = "Quest reward ⚔️";
        description = `Quest completed! Earned +${amount} gold.`;
      } else if (source.startsWith('achievement-')) {
        title = "Achievement unlocked 🏆";
        description = `Legendary deed! Earned +${amount} gold.`;
      } else if (source.startsWith('tile-collect:')) {
        title = "Resources collected 🏗️";
        description = `${cleanName} produced +${amount} gold.`;
      } else if (source.startsWith('citizen-collect:')) {
        title = "Citizen contribution 🤝";
        description = `${cleanName} gathered +${amount} gold for the realm.`;
      } else if (source === 'sheep-shave') {
        title = "Sheep shaved 🐑";
        description = `You shivered Shaun! +${amount} gold earned.`;
      } else if (source === 'penguin-play') {
        title = "Noot noot 🐧";
        description = `Petting penguin! +${amount} gold found.`;
      }

      // Check if gold alerts are muted for minor collections
      const isMuted = typeof window !== 'undefined' && localStorage.getItem("mute-gold-toasts") === "true";
      const isMinor = source === 'kingdom-tile-reward' || 
                      source.startsWith('tile-collect:') || 
                      source.startsWith('citizen-collect:') || 
                      source === 'sheep-shave' || 
                      source === 'penguin-play';

      if (!isMuted || !isMinor) {
        if (isMinor) {
          // Batch rapid-fire minor collections into a single updating toast
          const dedupeKey = source.startsWith('tile-collect:') ? 'tile-collect'
            : source.startsWith('citizen-collect:') ? 'citizen-collect'
            : source;
          dedupedToast(dedupeKey, { title, description, windowMs: 2000 });
        } else {
          toast({ title, description });
        }
      }
    }

    return { ...currentStats, gold: currentStats.gold + amount };
  } catch (error) {
    logger.error("Error managing gold:", error);
    return null;
  }
}

export async function spendGold(amount: number, source: string, metadata?: any) {
  try {
    // Get current stats using the character stats manager
    const currentStats = getCharacterStats();
    const cleanReason = formatCleanName(source).toLowerCase() || 'purchase';

    // Check if player has enough gold
    if (currentStats.gold < amount) {
      toast({
        title: "Insufficient gold",
        description: `You need ${amount} gold for ${cleanReason}. You currently have ${currentStats.gold} gold.`,
        variant: "destructive",
      });
      return false;
    }

    // Subtract gold from stats using synchronous update for immediate effect
    addToCharacterStat('gold', -amount, source);

    // Log transaction to database for audit trail
    const newBalance = currentStats.gold - amount;

    try {
      await logGoldTransaction(-amount, newBalance, 'spend', source, metadata);
    } catch (error) {
      logger.warn('[Gold Manager] Failed to log transaction, but continuing:', error);
    }

    // Emit kingdom event for tracking weekly progress (negative amount)
    emitGoldGained(-amount, source);

    // Dispatch gold spend event for perk bonuses
    const goldSpendEvent = new CustomEvent("gold-spend", {
      detail: { amount, source }
    });
    window.dispatchEvent(goldSpendEvent);

    // Show toast notification
    toast({
      title: "Gold spent 💰",
      description: `-${amount} gold for ${cleanReason}`,
    });

    return true;
  } catch (error) {
    logger.error("[Gold Manager] Error spending gold:", error);
    return false;
  }
}

export function hasEnoughGold(amount: number): boolean {
  try {
    const stats = getCharacterStats();
    return stats.gold >= amount;
  } catch (error) {
    logger.error("Error checking gold balance:", error);
    return false;
  }
}

// New function to log gold transactions to database
async function logGoldTransaction(
  amount: number,
  balanceAfter: number,
  transactionType: 'gain' | 'spend',
  source: string,
  metadata?: any
) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);

    fetchWithAuth('/api/gold-transactions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
      body: JSON.stringify({
        amount,
        balanceAfter,
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