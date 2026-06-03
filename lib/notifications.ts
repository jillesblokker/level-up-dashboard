import { notificationService } from "@/lib/notification-service"
import { getAchievementMessage, getAchievementIdFromSource } from "@/lib/achievement-messages"

export function createAchievementNotification(achievementName: string) {
  notificationService.addNotification(
    "New achievement",
    `You've earned the '${achievementName}' achievement!`,
    "achievement",
    "high",
    {
      label: "View Achievement",
      href: "/character",
    }
  )
}

export function createQuestNotification(questName: string, goldReward: number) {
  const isMuted = typeof window !== 'undefined' && localStorage.getItem("mute-quest-toasts") === "true";
  if (isMuted) return;

  notificationService.addNotification(
    "Quest Completed",
    `You've successfully completed '${questName}' and earned ${goldReward} gold!`,
    "quest",
    "high",
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
    "event",
    "medium"
  )
}

export function createLevelUpNotification(toLevel: number) {
  notificationService.addNotification(
    "Level Up! 🎉",
    `Congratulations! You've reached Level ${toLevel}! Your journey continues...`,
    "levelup",
    "high",
    {
      label: "View Character",
      href: "/character",
    }
  )
}

export function createExperienceGainedNotification(amount: number, source: string, perkBonus: number = 0) {
  const isMuted = typeof window !== 'undefined' && localStorage.getItem("mute-xp-toasts") === "true";
  const isMinor = source === 'kingdom-passive' || 
                  source.startsWith('tile-collect:') || 
                  source === 'mystery-events';
  if (isMuted && isMinor) return;

  const totalAmount = amount + perkBonus;
  
  // Check if this is an achievement source and get improved message
  const achievementId = getAchievementIdFromSource(source);
  const achievementMessage = achievementId ? getAchievementMessage(achievementId) : null;
  
  if (achievementMessage) {
    // Use improved achievement message
    notificationService.addNotification(
      achievementMessage.title,
      achievementMessage.description,
      "achievement",
      "high",
      {
        label: "View Achievements",
        href: "/achievements",
      }
    );
  } else {
    // Create improved messages for common sources
    let title = "Experience Gained! ⭐";
    let message = `You gained ${amount} experience from ${source}`;
    
    if (source.startsWith('tile-collect:')) {
      const tileType = source.split(':')[1];
      title = "🏰 Kingdom Knowledge!";
      message = `While tending to your ${tileType} building, you learned valuable skills and gained ${amount} experience!`;
    } else if (source === 'mystery-events') {
      title = "🔮 Mystical Discovery!";
      message = `Through exploring ancient mysteries, you gained ${amount} experience and expanded your knowledge!`;
    } else if (source === 'quest-completion') {
      title = "⚔️ Quest Mastery!";
      message = `By completing your quest, you gained ${amount} experience and grew stronger!`;
    } else if (source === 'level-up') {
      title = "🌟 Level Up!";
      message = `Congratulations! You've reached a new level and gained ${amount} experience!`;
    } else {
      // Fallback to generic message for other sources
      if (perkBonus > 0) {
        message += ` (+${perkBonus} from perks)`;
      }
      message += `! Total: +${totalAmount} XP`;
    }
    
    notificationService.addNotification(
      title,
      message,
      "success",
      "medium",
      {
        label: "View Progress",
        href: "/character",
      }
    );
  }
}

export function createGoldGainedNotification(amount: number, source: string) {
  const isMuted = typeof window !== 'undefined' && localStorage.getItem("mute-gold-toasts") === "true";
  const isMinor = source === 'kingdom-tile-reward' || 
                  source.startsWith('tile-collect:') || 
                  source.startsWith('citizen-collect:') || 
                  source === 'sheep-shave' || 
                  source === 'penguin-play';
  if (isMuted && isMinor) return;

  // Check if this is an achievement source and get improved message
  const achievementId = getAchievementIdFromSource(source);
  const achievementMessage = achievementId ? getAchievementMessage(achievementId) : null;
  
  if (achievementMessage) {
    // Use improved achievement message
    notificationService.addNotification(
      achievementMessage.title,
      achievementMessage.description,
      "achievement",
      "high",
      {
        label: "View Achievements",
        href: "/achievements",
      }
    );
  } else {
    // Create improved messages for common sources
    let title = "Gold Gained! 💰";
    let message = `You earned ${amount} gold from ${source}!`;
    
    if (source === 'kingdom-tile-reward') {
      title = "🏰 Kingdom Prosperity!";
      message = `Your kingdom buildings have generated ${amount} gold for your treasury!`;
    } else if (source === 'mystery-events') {
      title = "🔮 Treasure Discovered!";
      message = `You found a hidden treasure chest containing ${amount} gold!`;
    } else if (source === 'quest-completion') {
      title = "⚔️ Quest Reward!";
      message = `For completing your quest, you received ${amount} gold as payment!`;
    } else if (source === 'daily-bonus') {
      title = "🌅 Daily Blessing!";
      message = `The kingdom's daily prosperity has granted you ${amount} gold!`;
    } else if (source === 'weekly-bonus') {
      title = "📅 Weekly Fortune!";
      message = `Your weekly kingdom management has earned you ${amount} gold!`;
    } else if (source.startsWith('tile-collect:')) {
      const tileType = source.split(':')[1];
      title = "🏰 Building Income!";
      message = `Your ${tileType} building has produced ${amount} gold for your treasury!`;
    }
    
    notificationService.addNotification(
      title,
      message,
      "success",
      "medium",
      {
        label: "View Kingdom",
        href: "/kingdom",
      }
    );
  }
} 