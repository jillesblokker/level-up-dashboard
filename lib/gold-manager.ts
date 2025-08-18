import { toast } from "@/components/ui/use-toast";
import { emitGoldGained } from "@/lib/kingdom-events";
import { getCharacterStats, addToCharacterStatSync } from "@/lib/character-stats-manager";
import { createGoldGainedNotification } from "@/lib/notifications";
import { fetchWithAuth } from '@/lib/fetchWithAuth';

// Enhanced gold manager with database transaction logging
export async function gainGold(amount: number, source: string, metadata?: any) {
  try {
    // Get current stats using the character stats manager
    const currentStats = getCharacterStats();

    // Add gold to stats using synchronous update for immediate effect
    addToCharacterStatSync('gold', amount);

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

    // Show toast notification
    toast({
      title: "Gold Gained!",
      description: `+${amount} gold from ${source}`,
    });

    return { ...currentStats, gold: currentStats.gold + amount };
  } catch (error) {
    console.error("Error managing gold:", error);
    return null;
  }
}

export async function spendGold(amount: number, source: string, metadata?: any) {
  try {
    // Get current stats using the character stats manager
    const currentStats = getCharacterStats();

    // Check if player has enough gold
    if (currentStats.gold < amount) {
      toast({
        title: "Insufficient Gold",
        description: `You need ${amount} gold for ${source}. You have ${currentStats.gold} gold.`,
        variant: "destructive",
      });
      return false;
    }

    // Subtract gold from stats using synchronous update for immediate effect
    addToCharacterStatSync('gold', -amount);

    // Log transaction to database for audit trail
    const newBalance = currentStats.gold - amount;
    await logGoldTransaction(-amount, newBalance, 'spend', source, metadata);

    // Emit kingdom event for tracking weekly progress (negative amount)
    emitGoldGained(-amount, source);

    // Dispatch gold spend event for perk bonuses
    const goldSpendEvent = new CustomEvent("gold-spend", {
      detail: { amount, source }
    });
    window.dispatchEvent(goldSpendEvent);

    // Show toast notification
    toast({
      title: "Gold Spent!",
      description: `-${amount} gold for ${source}`,
    });

    return true;
  } catch (error) {
    console.error("Error spending gold:", error);
    return false;
  }
}

export function hasEnoughGold(amount: number): boolean {
  try {
    const stats = getCharacterStats();
    return stats.gold >= amount;
  } catch (error) {
    console.error("Error checking gold balance:", error);
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
    const response = await fetchWithAuth('/api/gold-transactions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount,
        balanceAfter,
        transactionType,
        source,
        metadata
      }),
    });

    if (!response.ok) {
      console.warn('[Gold Manager] Failed to log transaction to database:', response.status);
    } else {
      // Removed debugging log
    }
  } catch (error) {
    console.warn('[Gold Manager] Error logging transaction:', error);
    // Don't fail the main operation if logging fails
  }
} 