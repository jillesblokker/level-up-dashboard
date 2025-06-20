import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/types/supabase";
import { Quest } from "@/types/quest";
import { defaultQuests } from "@/lib/default-quests"; // Assuming default quests are here

export async function fetchQuestsFromSupabase(supabase: SupabaseClient<Database>): Promise<Quest[]> {
    const { data, error } = await supabase.from('quests').select('*');
    if (error) {
        console.error("Error fetching quests from Supabase, returning default.", error);
        return defaultQuests;
    }
    // Note: The 'quests' table in Supabase might not match the 'Quest' type exactly.
    // A transformation/mapping step is required here.
    return data.map((q: any) => ({
        id: q.id,
        title: q.title,
        description: q.description,
        category: q.category,
        difficulty: q.difficulty,
        rewards: q.rewards,
        // Add default values for any missing fields in the Quest type
        completed: false, 
        progress: 0,
        userId: '',
        createdAt: q.created_at,
        updatedAt: q.updated_at || q.created_at,
    }));
}

export async function fetchCheckedQuestsFromSupabase(supabase: SupabaseClient<Database>, userId: string): Promise<string[]> {
    const { data, error } = await supabase
        .from('checked_quests')
        .select('quest_id')
        .eq('user_id', userId);

    if (error) {
        console.error("Error fetching checked quests:", error);
        return [];
    }
    return data.map(item => item.quest_id);
}

export async function updateCheckedQuestInSupabase(
    supabase: SupabaseClient<Database>,
    userId: string,
    questId: string,
    isCompleted: boolean
): Promise<void> {
    if (isCompleted) {
        const { error } = await supabase
            .from('checked_quests')
            .upsert({ user_id: userId, quest_id: questId }, { onConflict: 'user_id, quest_id' });
        if (error) throw error;
    } else {
        const { error } = await supabase
            .from('checked_quests')
            .delete()
            .match({ user_id: userId, quest_id: questId });
        if (error) throw error;
    }
} 