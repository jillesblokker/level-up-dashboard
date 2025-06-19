import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

export interface Quest {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard' | 'epic';
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
        difficulty: quest.difficulty as 'easy' | 'medium' | 'hard' | 'epic',
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
        difficulty: data.difficulty as 'easy' | 'medium' | 'hard' | 'epic',
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
        difficulty: data.difficulty as 'easy' | 'medium' | 'hard' | 'epic',
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
        difficulty: data.difficulty as 'easy' | 'medium' | 'hard' | 'epic',
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

  static async getCheckedQuests(
    supabase: SupabaseClient<Database>,
    userId: string
  ): Promise<string[]> {
    if (!supabase) {
      console.error('Supabase client not initialized');
      throw new Error('Supabase client not initialized');
    }
    try {
      const { data, error } = await supabase
        .from('checked_quests')
        .select('quest_id')
        .eq('user_id', userId);
      if (error) {
        console.error('Error fetching checked quests:', error);
        throw new Error(`Error fetching checked quests: ${error.message}`);
      }
      return data ? data.map((row: { quest_id: string }) => row.quest_id) : [];
    } catch (error) {
      console.error('Error in getCheckedQuests:', error);
      throw error;
    }
  }

  static async checkQuest(supabase: SupabaseClient<Database>, questId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('QuestCompletion')
      .update({ completed: true, progress: 100 })
      .eq('id', questId)
      .eq('userId', userId)
    if (error) {
      console.error('Error checking quest:', error)
      throw new Error(error.message)
    }
  }

  static async uncheckQuest(supabase: SupabaseClient<Database>, questId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('QuestCompletion')
      .update({ completed: false, progress: 0 })
      .eq('id', questId)
      .eq('userId', userId)
    if (error) {
      console.error('Error unchecking quest:', error)
      throw new Error(error.message)
    }
  }
} 