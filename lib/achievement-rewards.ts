import { gainGold } from "@/lib/gold-manager"
import { gainExperience } from "@/lib/experience-manager"
import { notificationService } from "@/lib/notification-service"

// Achievement reward tiers based on creature ID
// Tier 1 (000, 001, 004, 007, 010, etc.): 20 gold, 25 exp
// Tier 2 (002, 005, 008, 011, etc.): 40 gold, 50 exp  
// Tier 3 (003, 006, 009, 012, etc.): 60 gold, 100 exp

export function calculateAchievementRewards(creatureId: string): { gold: number; experience: number } {
  const id = parseInt(creatureId);
  
  // Determine tier based on the last digit pattern
  const lastDigit = id % 10;
  
  if (lastDigit === 0 || lastDigit === 1 || lastDigit === 4 || lastDigit === 7) {
    // Tier 1: Basic achievements
    return { gold: 20, experience: 25 };
  } else if (lastDigit === 2 || lastDigit === 5 || lastDigit === 8) {
    // Tier 2: Intermediate achievements
    return { gold: 40, experience: 50 };
  } else if (lastDigit === 3 || lastDigit === 6 || lastDigit === 9) {
    // Tier 3: Advanced achievements
    return { gold: 60, experience: 100 };
  }
  
  // Default fallback
  return { gold: 20, experience: 25 };
}

export function grantAchievementRewards(creatureId: string, creatureName: string) {
  const rewards = calculateAchievementRewards(creatureId);
  
  // Grant gold and experience
  gainGold(rewards.gold, `achievement-${creatureId}`);
  gainExperience(rewards.experience, `achievement-${creatureId}`, 'achievement');
  
  // Create achievement notification
  notificationService.addNotification(
    "Achievement Unlocked! 🏆",
    `You've discovered ${creatureName}! You earned ${rewards.gold} gold and ${rewards.experience} experience!`,
    "achievement",
    {
      label: "View Achievements",
      href: "/achievements",
    }
  );
  
  console.log(`Achievement reward granted for ${creatureName}: ${rewards.gold} gold, ${rewards.experience} exp`);
} 