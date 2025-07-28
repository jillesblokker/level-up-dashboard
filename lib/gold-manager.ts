import { toast } from "@/components/ui/use-toast";
import { emitGoldGained } from "@/lib/kingdom-events";
import { getCharacterStats, addToCharacterStatSync } from "@/lib/character-stats-manager";
import { createGoldGainedNotification } from "@/lib/notifications";

export function gainGold(amount: number, source: string) {
  try {
    // Get current stats using the character stats manager
    const currentStats = getCharacterStats();

    // Add gold to stats using synchronous update for immediate effect
    addToCharacterStatSync('gold', amount);

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

export function spendGold(amount: number, source: string) {
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
    const currentStats = getCharacterStats();
    return currentStats.gold >= amount;
  } catch (error) {
    console.error("Error checking gold balance:", error);
    return false;
  }
} 