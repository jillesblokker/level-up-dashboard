export interface Quest {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: "easy" | "medium" | "hard" | "epic";
  rewards: {
    xp: number;
    gold: number;
    items?: string[];
  };
  progress: number;
  completed: boolean;
  deadline?: string;
  isNew?: boolean;
  isAI?: boolean;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface QuestRewards {
  xp: number;
  gold: number;
  items?: string[];
}

export interface QuestFilters {
  category?: string;
  difficulty?: "easy" | "medium" | "hard" | "epic";
  completed?: boolean;
  isNew?: boolean;
  isAI?: boolean;
}

export interface QuestCompletion {
  id: string;
  questName: string;
  userId: string;
  user: User;
  quest: Quest;
  completed: boolean;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface QuestWithCompletion extends Quest {
  completion?: QuestCompletion;
}

// Example User type for Supabase (customize to your schema)
export interface User {
  id: string;
  email: string;
  // ...add other fields as needed
}

// TODO: Replace Prisma logic with Supabase client logic 