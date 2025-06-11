// Replayability Types
export type ReplayabilityFeature = 
  | 'dailyQuests' 
  | 'achievements' 
  | 'collectibles' 
  | 'challenges' 
  | 'leaderboards';

// Achievement Interface
export interface Achievement {
  id: string;
  title: string;
  description: string;
  category: string;
  points: number;
  isUnlocked: boolean;
  unlockDate?: Date;
  requirements: {
    type: string;
    count: number;
    current: number;
  }[];
  rewards: {
    experience: number;
    gold: number;
    items?: string[];
  };
}

// Challenge Interface
export interface Challenge {
  id: string;
  title: string;
  description: string;
  type: 'daily' | 'weekly' | 'monthly';
  startDate: Date;
  endDate: Date;
  requirements: {
    type: string;
    count: number;
    current: number;
  }[];
  rewards: {
    experience: number;
    gold: number;
    items?: string[];
  };
  isCompleted: boolean;
  progress: number;
}

// Collectible Interface
export interface Collectible {
  id: string;
  name: string;
  description: string;
  category: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  isCollected: boolean;
  collectionDate?: Date;
  location?: {
    x: number;
    y: number;
  };
}

// Leaderboard Entry Interface
export interface LeaderboardEntry {
  userId: string;
  username: string;
  score: number;
  rank: number;
  category: string;
  timestamp: Date;
}

// Replayability Manager Class
export class ReplayabilityManager {
  private static instance: ReplayabilityManager;
  private achievements: Map<string, Achievement>;
  private challenges: Map<string, Challenge>;
  private collectibles: Map<string, Collectible>;
  private leaderboards: Map<string, LeaderboardEntry[]>;

  private constructor() {
    this.achievements = new Map();
    this.challenges = new Map();
    this.collectibles = new Map();
    this.leaderboards = new Map();
    this.initializeFeatures();
    this.loadAchievementsFromStorage();
  }

  public static getInstance(): ReplayabilityManager {
    if (!ReplayabilityManager.instance) {
      ReplayabilityManager.instance = new ReplayabilityManager();
    }
    return ReplayabilityManager.instance;
  }

  private initializeFeatures() {
    // Initialize achievements
    this.initializeAchievements();
    // Initialize challenges
    this.initializeChallenges();
    // Initialize collectibles
    this.initializeCollectibles();
    // Initialize leaderboards
    this.initializeLeaderboards();
  }

  private initializeAchievements() {
    // Add default achievements
    const defaultAchievements: Achievement[] = [
      {
        id: 'first_quest',
        title: 'First Steps',
        description: 'Complete your first quest',
        category: 'quests',
        points: 10,
        isUnlocked: false,
        requirements: [
          { type: 'quests_completed', count: 1, current: 0 }
        ],
        rewards: {
          experience: 100,
          gold: 50
        }
      },
      // Add more default achievements here
    ];

    defaultAchievements.forEach(achievement => {
      this.achievements.set(achievement.id, achievement);
    });
  }

  private initializeChallenges() {
    // Add default challenges
    const defaultChallenges: Challenge[] = [
      {
        id: 'daily_quests',
        title: 'Daily Quest Master',
        description: 'Complete 5 daily quests',
        type: 'daily',
        startDate: new Date(),
        endDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
        requirements: [
          { type: 'daily_quests_completed', count: 5, current: 0 }
        ],
        rewards: {
          experience: 500,
          gold: 250
        },
        isCompleted: false,
        progress: 0
      },
      // Add more default challenges here
    ];

    defaultChallenges.forEach(challenge => {
      this.challenges.set(challenge.id, challenge);
    });
  }

  private initializeCollectibles() {
    // Add default collectibles
    const defaultCollectibles: Collectible[] = [
      {
        id: 'rare_scroll',
        name: 'Ancient Scroll',
        description: 'A mysterious scroll containing ancient knowledge',
        category: 'scrolls',
        rarity: 'rare',
        isCollected: false
      },
      // Add more default collectibles here
    ];

    defaultCollectibles.forEach(collectible => {
      this.collectibles.set(collectible.id, collectible);
    });
  }

  private initializeLeaderboards() {
    // Initialize leaderboards for different categories
    const categories = ['quests', 'achievements', 'collectibles', 'challenges'];
    categories.forEach(category => {
      this.leaderboards.set(category, []);
    });
  }

  private loadAchievementsFromStorage() {
    try {
      const unlocked = JSON.parse(localStorage.getItem('achievements') || '[]');
      unlocked.forEach((id: string) => {
        const achievement = this.achievements.get(id);
        if (achievement) {
          achievement.isUnlocked = true;
        }
      });
    } catch (error) {
      // Error handling intentionally left empty to avoid breaking the UI if replayability fails
    }
  }

  private saveAchievementsToStorage() {
    try {
      const unlocked = Array.from(this.achievements.values()).filter(a => a.isUnlocked).map(a => a.id);
      localStorage.setItem('achievements', JSON.stringify(unlocked));
    } catch (error) {
      // Error handling intentionally left empty to avoid breaking the UI if replayability fails
    }
  }

  // Achievement Methods
  public getAchievements(): Achievement[] {
    return Array.from(this.achievements.values());
  }

  public getAchievement(id: string): Achievement | undefined {
    return this.achievements.get(id);
  }

  public updateAchievementProgress(id: string, type: string, amount: number) {
    const achievement = this.achievements.get(id);
    if (achievement) {
      const requirement = achievement.requirements.find(req => req.type === type);
      if (requirement) {
        requirement.current = Math.min(requirement.count, requirement.current + amount);
        if (requirement.current >= requirement.count) {
          this.unlockAchievement(id);
        }
      }
    }
  }

  private unlockAchievement(id: string) {
    const achievement = this.achievements.get(id);
    if (achievement && !achievement.isUnlocked) {
      achievement.isUnlocked = true;
      achievement.unlockDate = new Date();
      this.saveAchievementsToStorage();
      // Emit achievement unlocked event
      window.dispatchEvent(new CustomEvent('achievement:unlocked', {
        detail: achievement
      }));
    }
  }

  // Challenge Methods
  public getChallenges(): Challenge[] {
    return Array.from(this.challenges.values());
  }

  public getChallenge(id: string): Challenge | undefined {
    return this.challenges.get(id);
  }

  public updateChallengeProgress(id: string, type: string, amount: number) {
    const challenge = this.challenges.get(id);
    if (challenge && !challenge.isCompleted) {
      const requirement = challenge.requirements.find(req => req.type === type);
      if (requirement) {
        requirement.current = Math.min(requirement.count, requirement.current + amount);
        challenge.progress = (requirement.current / requirement.count) * 100;
        if (requirement.current >= requirement.count) {
          this.completeChallenge(id);
        }
      }
    }
  }

  private completeChallenge(id: string) {
    const challenge = this.challenges.get(id);
    if (challenge && !challenge.isCompleted) {
      challenge.isCompleted = true;
      // Emit challenge completed event
      window.dispatchEvent(new CustomEvent('challenge:completed', {
        detail: challenge
      }));
    }
  }

  // Collectible Methods
  public getCollectibles(): Collectible[] {
    return Array.from(this.collectibles.values());
  }

  public getCollectible(id: string): Collectible | undefined {
    return this.collectibles.get(id);
  }

  public collectItem(id: string) {
    const collectible = this.collectibles.get(id);
    if (collectible && !collectible.isCollected) {
      collectible.isCollected = true;
      collectible.collectionDate = new Date();
      // Emit collectible found event
      window.dispatchEvent(new CustomEvent('collectible:found', {
        detail: collectible
      }));
    }
  }

  // Leaderboard Methods
  public getLeaderboard(category: string): LeaderboardEntry[] {
    return this.leaderboards.get(category) || [];
  }

  public updateLeaderboard(entry: LeaderboardEntry) {
    const leaderboard = this.leaderboards.get(entry.category) || [];
    const existingEntry = leaderboard.find(e => e.userId === entry.userId);
    
    if (existingEntry) {
      existingEntry.score = entry.score;
      existingEntry.timestamp = entry.timestamp;
    } else {
      leaderboard.push(entry);
    }

    // Sort and update ranks
    leaderboard.sort((a, b) => b.score - a.score);
    leaderboard.forEach((entry, index) => {
      entry.rank = index + 1;
    });

    this.leaderboards.set(entry.category, leaderboard);
  }
}

// Export singleton instance
export const replayability = ReplayabilityManager.getInstance(); 