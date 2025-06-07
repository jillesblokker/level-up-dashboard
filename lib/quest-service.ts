import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

export interface Quest {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  rewards: {
    xp: number;
    gold: number;
    items: string[];
  };
  progress: number;
  completed: boolean;
  deadline: string;
  isNew: boolean;
  isAI: boolean;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface QuestFilters {
  category?: string;
  completed?: boolean;
  isNew?: boolean;
  isAI?: boolean;
}

export class QuestService {
  static async getQuests(
    supabase: SupabaseClient<Database>,
    userId: string,
    filters: QuestFilters = {}
  ): Promise<Quest[]> {
    if (!supabase) {
      console.error('Supabase client not initialized');
      throw new Error('Supabase client not initialized');
    }

    try {
      let query = supabase
        .from('quests')
        .select('*')
        .eq('userId', userId);

      if (filters.category) {
        query = query.eq('category', filters.category);
      }
      if (typeof filters.completed === 'boolean') {
        query = query.eq('completed', filters.completed);
      }
      if (typeof filters.isNew === 'boolean') {
        query = query.eq('isNew', filters.isNew);
      }
      if (typeof filters.isAI === 'boolean') {
        query = query.eq('isAI', filters.isAI);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching quests:', error);
        throw new Error(`Error fetching quests: ${error.message}`);
      }

      return data.map(quest => ({
        id: quest.id,
        title: quest.title,
        description: quest.description,
        category: quest.category,
        difficulty: quest.difficulty as 'easy' | 'medium' | 'hard',
        rewards: quest.rewards,
        progress: quest.progress,
        completed: quest.completed,
        deadline: quest.deadline,
        isNew: quest.isNew,
        isAI: quest.isAI,
        userId: quest.userId,
        createdAt: quest.createdAt,
        updatedAt: quest.updatedAt
      }));
    } catch (error) {
      console.error('Error in getQuests:', error);
      throw error;
    }
  }

  static async createQuest(
    supabase: SupabaseClient<Database>,
    quest: Omit<Quest, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Quest> {
    if (!supabase) {
      console.error('Supabase client not initialized');
      throw new Error('Supabase client not initialized');
    }

    try {
      const { data, error } = await supabase
        .from('quests')
        .insert([{
          title: quest.title,
          description: quest.description,
          category: quest.category,
          difficulty: quest.difficulty,
          rewards: quest.rewards,
          progress: quest.progress,
          completed: quest.completed,
          deadline: quest.deadline,
          isNew: quest.isNew,
          isAI: quest.isAI,
          userId: quest.userId
        }])
        .select()
        .single();

      if (error) {
        console.error('Error creating quest:', error);
        throw new Error(`Error creating quest: ${error.message}`);
      }

      if (!data) {
        throw new Error('No data returned after quest creation');
      }

      return {
        id: data.id,
        title: data.title,
        description: data.description,
        category: data.category,
        difficulty: data.difficulty as 'easy' | 'medium' | 'hard',
        rewards: data.rewards,
        progress: data.progress,
        completed: data.completed,
        deadline: data.deadline,
        isNew: data.isNew,
        isAI: data.isAI,
        userId: data.userId,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt
      };
    } catch (error) {
      console.error('Error in createQuest:', error);
      throw error;
    }
  }

  static async updateQuest(
    supabase: SupabaseClient<Database>,
    id: string,
    updates: Partial<Omit<Quest, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<Quest> {
    if (!supabase) {
      console.error('Supabase client not initialized');
      throw new Error('Supabase client not initialized');
    }

    try {
      const { data, error } = await supabase
        .from('quests')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating quest:', error);
        throw new Error(`Error updating quest: ${error.message}`);
      }

      if (!data) {
        throw new Error('No data returned after quest update');
      }

      return {
        id: data.id,
        title: data.title,
        description: data.description,
        category: data.category,
        difficulty: data.difficulty as 'easy' | 'medium' | 'hard',
        rewards: data.rewards,
        progress: data.progress,
        completed: data.completed,
        deadline: data.deadline,
        isNew: data.isNew,
        isAI: data.isAI,
        userId: data.userId,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt
      };
    } catch (error) {
      console.error('Error in updateQuest:', error);
      throw error;
    }
  }

  static async deleteQuest(
    supabase: SupabaseClient<Database>,
    id: string
  ): Promise<void> {
    if (!supabase) {
      console.error('Supabase client not initialized');
      throw new Error('Supabase client not initialized');
    }

    try {
      const { error } = await supabase
        .from('quests')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting quest:', error);
        throw new Error(`Error deleting quest: ${error.message}`);
      }
    } catch (error) {
      console.error('Error in deleteQuest:', error);
      throw error;
    }
  }

  static async toggleQuestCompletion(
    supabase: SupabaseClient<Database>,
    id: string,
    completed: boolean
  ): Promise<Quest> {
    if (!supabase) {
      console.error('Supabase client not initialized');
      throw new Error('Supabase client not initialized');
    }

    try {
      const { data, error } = await supabase
        .from('quests')
        .update({ completed })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error toggling quest completion:', error);
        throw new Error(`Error toggling quest completion: ${error.message}`);
      }

      if (!data) {
        throw new Error('No data returned after toggling quest completion');
      }

      return {
        id: data.id,
        title: data.title,
        description: data.description,
        category: data.category,
        difficulty: data.difficulty as 'easy' | 'medium' | 'hard',
        rewards: data.rewards,
        progress: data.progress,
        completed: data.completed,
        deadline: data.deadline,
        isNew: data.isNew,
        isAI: data.isAI,
        userId: data.userId,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt
      };
    } catch (error) {
      console.error('Error in toggleQuestCompletion:', error);
      throw error;
    }
  }
} 