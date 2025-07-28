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