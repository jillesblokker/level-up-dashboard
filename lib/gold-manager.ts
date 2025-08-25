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
    console.log('[Gold Manager] spendGold called with:', { amount, source, metadata });
    
    // Get current stats using the character stats manager
    const currentStats = getCharacterStats();
    console.log('[Gold Manager] Current stats:', currentStats);
    console.log('[Gold Manager] Current gold balance:', currentStats.gold);

    // Check if player has enough gold
    if (currentStats.gold < amount) {
      console.log('[Gold Manager] Insufficient gold:', { required: amount, available: currentStats.gold });
      toast({
        title: "Insufficient Gold",
        description: `You need ${amount} gold for ${source}. You have ${currentStats.gold} gold.`,
        variant: "destructive",
      });
      return false;
    }

    console.log('[Gold Manager] Gold check passed, proceeding with purchase...');
    
    // Subtract gold from stats using synchronous update for immediate effect
    addToCharacterStatSync('gold', -amount);
    console.log('[Gold Manager] Gold subtracted from stats');

    // Log transaction to database for audit trail
    const newBalance = currentStats.gold - amount;
    console.log('[Gold Manager] New balance will be:', newBalance);
    
    try {
      await logGoldTransaction(-amount, newBalance, 'spend', source, metadata);
      console.log('[Gold Manager] Transaction logged to database');
    } catch (error) {
      console.warn('[Gold Manager] Failed to log transaction, but continuing:', error);
    }

    // Emit kingdom event for tracking weekly progress (negative amount)
    emitGoldGained(-amount, source);
    console.log('[Gold Manager] Kingdom event emitted');

    // Dispatch gold spend event for perk bonuses
    const goldSpendEvent = new CustomEvent("gold-spend", {
      detail: { amount, source }
    });
    window.dispatchEvent(goldSpendEvent);
    console.log('[Gold Manager] Gold spend event dispatched');

    // Show toast notification
    toast({
      title: "Gold Spent!",
      description: `-${amount} gold for ${source}`,
    });

    console.log('[Gold Manager] spendGold completed successfully');
    return true;
  } catch (error) {
    console.error("[Gold Manager] Error spending gold:", error);
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