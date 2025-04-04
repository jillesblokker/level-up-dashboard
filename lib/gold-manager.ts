import { toast } from "@/components/ui/use-toast";
import { CharacterStats } from "@/types/character";

export function gainGold(amount: number, source: string) {
  try {
    // Get current stats
    const savedStats = localStorage.getItem("character-stats");
    const currentStats = savedStats ? JSON.parse(savedStats) as CharacterStats : {
      level: 1,
      experience: 0,
      experienceToNextLevel: 100,
      gold: 0,
      titles: {
        equipped: "",
        unlocked: 0,
        total: 10
      },
      perks: {
        active: 0,
        total: 5
      }
    };

    // Add gold to stats
    const newStats = {
      ...currentStats,
      gold: currentStats.gold + amount
    };

    // Save to localStorage
    localStorage.setItem("character-stats", JSON.stringify(newStats));

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

    // Dispatch event to notify components
    window.dispatchEvent(new Event("character-stats-update"));

    return newStats;
  } catch (error) {
    console.error("Error managing gold:", error);
    return null;
  }
} 