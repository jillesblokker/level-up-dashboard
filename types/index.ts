import { Session } from 'next-auth';

// Global Window Interface
declare global {
  interface Window {
    headerImages?: {
      realm?: string;
      character?: string;
      quests?: string;
      guildhall?: string;
      achievements?: string;
    };
    mobileNavProps?: {
      tabs: string[];
      activeTab: string;
      onTabChange: (tab: string) => void;
    };
  }
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Character Types
export interface CharacterStats {
  level: number;
  experience: number;
  experienceToNextLevel: number;
  gold: number;
  titles: {
    equipped: string;
    unlocked: number;
    total: number;
  };
  perks: {
    active: number;
    total: number;
  };
}

export interface CharacterAction {
  type: 'GAIN_EXPERIENCE' | 'GAIN_GOLD' | 'UNLOCK_TITLE' | 'UNLOCK_PERK';
  amount?: number;
  source?: string;
  timestamp: Date;
}

export interface CharacterProgress {
  currentLevel: number;
  nextLevel: number;
  progressPercentage: number;
  remainingExperience: number;
}

// Quest Types
export interface QuestRequirement {
  type: 'LEVEL' | 'GOLD' | 'TITLE' | 'PERK' | 'QUEST';
  value: number | string;
  operator?: '>' | '>=' | '=' | '<=' | '<';
}

export interface QuestReward {
  experience: number;
  gold: number;
  items?: Array<{
    id: string;
    name: string;
    quantity: number;
  }>;
}

export interface Quest {
  id: string;
  name: string;
  description: string;
  category: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD' | 'EPIC';
  requirements?: QuestRequirement[];
  rewards: QuestReward;
  completions?: QuestCompletion[];
  createdAt: Date;
  updatedAt: Date;
}

export interface QuestCompletion {
  id: string;
  questId: string;
  userId: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Session Types
export interface ExtendedSession extends Session {
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    isAdmin: boolean;
  };
}

// Utility Types
export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// Helper Functions
export const isQuestCompletable = (quest: Quest, character: CharacterStats): boolean => {
  if (!quest.requirements) return true;
  
  return quest.requirements.every(req => {
    switch (req.type) {
      case 'LEVEL':
        return character.level >= (req.value as number);
      case 'GOLD':
        return character.gold >= (req.value as number);
      case 'TITLE':
        return character.titles.unlocked >= (req.value as number);
      case 'PERK':
        return character.perks.active >= (req.value as number);
      default:
        return true;
    }
  });
}; 