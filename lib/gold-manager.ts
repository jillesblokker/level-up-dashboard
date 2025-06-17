import { toast } from "@/components/ui/use-toast";
import { emitGoldGained } from "@/lib/kingdom-events";
import { getCharacterStats, updateCharacterStats } from "@/lib/character-stats-manager";
import { createGoldGainedNotification } from "@/lib/notifications";

export function gainGold(amount: number, source: string) {
  try {
    // Get current stats using the character stats manager
    const currentStats = getCharacterStats();

    // Add gold to stats
    const newStats = {
      ...currentStats,
      gold: currentStats.gold + amount
    };

    // Update stats using the character stats manager
    updateCharacterStats(newStats);

    // Emit kingdom event for tracking weekly progress
    emitGoldGained(amount, source);

    // Create notification for gold gained
    createGoldGainedNotification(amount, source);

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

    return newStats;
  } catch (error) {
    console.error("Error managing gold:", error);
    return null;
  }
} 