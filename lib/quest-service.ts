import { Quest, QuestFilters } from './quest-types';

export class QuestService {
  static async getQuests(supabase: any, userId: string, filters?: QuestFilters): Promise<Quest[]> {
    if (!userId) {
      throw new Error('No user ID provided');
    }

    let query = supabase
      .from('QuestCompletionLog')
      .select('*')
      .eq('userId', userId);

    if (filters) {
      if (filters.category) query = query.eq('category', filters.category);
      if (filters.difficulty) query = query.eq('difficulty', filters.difficulty);
      if (filters.completed !== undefined) query = query.eq('completed', filters.completed);
      if (filters.isNew !== undefined) query = query.eq('isNew', filters.isNew);
      if (filters.isAI !== undefined) query = query.eq('isAI', filters.isAI);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching quests:', error, JSON.stringify(error));
      throw new Error(error.message || JSON.stringify(error) || 'Unknown error fetching quests');
    }

    return (data || []).map((q: any) => ({
      id: q.id,
      title: q.questName,
      description: q.description,
      category: q.category,
      difficulty: q.difficulty,
      rewards: q.rewards || { xp: 0, gold: 0, items: [] },
      progress: q.progress ?? 0,
      completed: q.completed ?? false,
      deadline: q.date,
      isNew: q.isNew,
      isAI: q.isAI,
      userId: q.userId,
      createdAt: q.created_at,
      updatedAt: q.updated_at
    }));
  }

  static async createQuest(supabase: any, quest: Omit<Quest, 'id' | 'createdAt' | 'updatedAt'>): Promise<Quest> {
    const { data, error } = await supabase
      .from('QuestCompletionLog')
      .insert({
        questName: quest.title,
        description: quest.description,
        category: quest.category,
        difficulty: quest.difficulty,
        rewards: quest.rewards,
        progress: quest.progress,
        completed: quest.completed,
        date: quest.deadline,
        isNew: quest.isNew,
        isAI: quest.isAI,
        userId: quest.userId
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating quest:', error);
      throw new Error(error.message);
    }

    return {
      id: data.id,
      title: data.questName,
      description: data.description,
      category: data.category,
      difficulty: data.difficulty,
      rewards: data.rewards || { xp: 0, gold: 0, items: [] },
      progress: data.progress ?? 0,
      completed: data.completed ?? false,
      deadline: data.date,
      isNew: data.isNew,
      isAI: data.isAI,
      userId: data.userId,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  }

  static async updateQuest(supabase: any, id: string, updates: Partial<Quest>): Promise<Quest> {
    const { data, error } = await supabase
      .from('QuestCompletionLog')
      .update({
        questName: updates.title,
        description: updates.description,
        category: updates.category,
        difficulty: updates.difficulty,
        rewards: updates.rewards,
        progress: updates.progress,
        completed: updates.completed,
        date: updates.deadline,
        isNew: updates.isNew,
        isAI: updates.isAI
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating quest:', error);
      throw new Error(error.message);
    }

    return {
      id: data.id,
      title: data.questName,
      description: data.description,
      category: data.category,
      difficulty: data.difficulty,
      rewards: data.rewards || { xp: 0, gold: 0, items: [] },
      progress: data.progress ?? 0,
      completed: data.completed ?? false,
      deadline: data.date,
      isNew: data.isNew,
      isAI: data.isAI,
      userId: data.userId,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  }

  static async deleteQuest(supabase: any, id: string): Promise<void> {
    const { error } = await supabase
      .from('QuestCompletionLog')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting quest:', error);
      throw new Error(error.message);
    }
  }

  static async updateQuestProgress(supabase: any, id: string, progress: number): Promise<Quest> {
    const { data, error } = await supabase
      .from('QuestCompletionLog')
      .update({
        progress,
        completed: progress >= 100
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating quest progress:', error);
      throw new Error(error.message);
    }

    return {
      id: data.id,
      title: data.questName,
      description: data.description,
      category: data.category,
      difficulty: data.difficulty,
      rewards: data.rewards || { xp: 0, gold: 0, items: [] },
      progress: data.progress ?? 0,
      completed: data.completed ?? false,
      deadline: data.date,
      isNew: data.isNew,
      isAI: data.isAI,
      userId: data.userId,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  }

  static async toggleQuestCompletion(supabase: any, id: string): Promise<Quest> {
    const { data: currentQuest, error: fetchError } = await supabase
      .from('QuestCompletionLog')
      .select('completed')
      .eq('id', id)
      .single();

    if (fetchError) {
      console.error('Error fetching quest:', fetchError);
      throw new Error(fetchError.message);
    }

    const { data, error } = await supabase
      .from('QuestCompletionLog')
      .update({
        completed: !currentQuest.completed,
        progress: !currentQuest.completed ? 100 : 0
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error toggling quest completion:', error);
      throw new Error(error.message);
    }

    return {
      id: data.id,
      title: data.questName,
      description: data.description,
      category: data.category,
      difficulty: data.difficulty,
      rewards: data.rewards || { xp: 0, gold: 0, items: [] },
      progress: data.progress ?? 0,
      completed: data.completed ?? false,
      deadline: data.date,
      isNew: data.isNew,
      isAI: data.isAI,
      userId: data.userId,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  }
} 