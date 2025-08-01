import { toast } from "@/components/ui/use-toast"

// Toast helper functions for consistent messaging
export const showToast = {
  // Success messages
  success: (title: string, description?: string) => {
    toast({
      variant: "success",
      title,
      description,
    })
  },

  // Error messages
  error: (title: string, description?: string) => {
    toast({
      variant: "destructive",
      title,
      description,
    })
  },

  // Warning messages
  warning: (title: string, description?: string) => {
    toast({
      variant: "warning",
      title,
      description,
    })
  },

  // Info messages
  info: (title: string, description?: string) => {
    toast({
      variant: "info",
      title,
      description,
    })
  },

  // Achievement messages
  achievement: (title: string, description?: string) => {
    toast({
      variant: "achievement",
      title,
      description,
    })
  },

  // Quest messages
  quest: (title: string, description?: string) => {
    toast({
      variant: "quest",
      title,
      description,
    })
  },

  // Level up messages
  levelup: (title: string, description?: string) => {
    toast({
      variant: "levelup",
      title,
      description,
    })
  },

  // Default messages
  default: (title: string, description?: string) => {
    toast({
      variant: "default",
      title,
      description,
    })
  },
}

// Specific game-related toast messages
export const gameToasts = {
  // Quest completion
  questCompleted: (questName: string, goldEarned: number, expEarned: number) => {
    showToast.success(
      "Quest Completed! 🎉",
      `${questName} completed! You earned ${goldEarned} gold and ${expEarned} experience.`
    )
  },

  // Level up
  levelUp: (newLevel: number) => {
    showToast.levelup(
      "Level Up! ⭐",
      `Congratulations! You've reached level ${newLevel}. New features unlocked!`
    )
  },

  // Achievement unlocked
  achievementUnlocked: (achievementName: string) => {
    showToast.achievement(
      "Achievement Unlocked! 🏆",
      `You've earned the "${achievementName}" achievement!`
    )
  },

  // Gold earned
  goldEarned: (amount: number, source: string) => {
    showToast.success(
      "Gold Earned! 💰",
      `You earned ${amount} gold from ${source}.`
    )
  },

  // Tile purchased
  tilePurchased: (tileName: string, cost: number) => {
    showToast.success(
      "Tile Purchased! 🏰",
      `You've purchased ${tileName} for ${cost} gold.`
    )
  },

  // Kingdom event
  kingdomEvent: (eventName: string, description: string) => {
    showToast.info(
      `Kingdom Event: ${eventName} 🏰`,
      description
    )
  },

  // Discovery
  discovery: (itemName: string, description: string) => {
    showToast.info(
      `Discovery: ${itemName} 🔍`,
      description
    )
  },

  // Error messages
  insufficientGold: (required: number, current: number) => {
    showToast.error(
      "Insufficient Gold 💰",
      `You need ${required} gold but only have ${current}. Complete more quests to earn gold!`
    )
  },

  // Warning messages
  lowHealth: (currentHealth: number, maxHealth: number) => {
    showToast.warning(
      "Low Health ⚠️",
      `Your health is low: ${currentHealth}/${maxHealth}. Consider resting or using healing items.`
    )
  },
} 