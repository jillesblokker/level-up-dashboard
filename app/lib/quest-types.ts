import { User } from "@prisma/client";

export interface QuestRewards {
  experience: number;
  gold: number;
  items?: string[];
}

export interface Quest {
  name: string;
  description: string;
  category: string;
  difficulty: string;
  rewards: QuestRewards;
  requirements?: string[];
  createdAt: Date;
  updatedAt: Date;
  completions?: QuestCompletion[];
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