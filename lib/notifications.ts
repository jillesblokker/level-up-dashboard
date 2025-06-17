import { notificationService } from "@/lib/notification-service"

export function createAchievementNotification(achievementName: string) {
  notificationService.addNotification(
    "Achievement Unlocked!",
    `You've earned the '${achievementName}' achievement!`,
    "achievement",
    {
      label: "View Achievement",
      href: "/character",
    }
  )
}

export function createQuestNotification(questName: string, goldReward: number) {
  notificationService.addNotification(
    "Quest Completed",
    `You've successfully completed '${questName}' and earned ${goldReward} gold!`,
    "quest",
    {
      label: "View Rewards",
      href: "/quests",
    }
  )
}

export function createEventNotification(title: string, message: string) {
  notificationService.addNotification(
    title,
    message,
    "event"
  )
}

export function createLevelUpNotification(fromLevel: number, toLevel: number) {
  notificationService.addNotification(
    "Level Up! 🎉",
    `Congratulations! You've reached Level ${toLevel}! Your journey continues...`,
    "levelup",
    {
      label: "View Character",
      href: "/character",
    }
  )
}

export function createExperienceGainedNotification(amount: number, source: string, perkBonus: number = 0) {
  const totalAmount = amount + perkBonus;
  let message = `You gained ${amount} experience from ${source}`;
  
  if (perkBonus > 0) {
    message += ` (+${perkBonus} from perks)`;
  }
  
  message += `! Total: +${totalAmount} XP`;
  
  notificationService.addNotification(
    "Experience Gained! ⭐",
    message,
    "success",
    {
      label: "View Progress",
      href: "/character",
    }
  )
}

export function createGoldGainedNotification(amount: number, source: string) {
  notificationService.addNotification(
    "Gold Gained! 💰",
    `You earned ${amount} gold from ${source}!`,
    "success",
    {
      label: "View Treasury",
      href: "/treasury",
    }
  )
} 