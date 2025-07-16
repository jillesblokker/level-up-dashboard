import { supabase } from '@/lib/supabase/client';

export interface UserPreference {
  id: string;
  user_id: string;
  preference_key: string;
  value: string;
}

export async function getUserPreferences(userId: string): Promise<UserPreference[]> {
  if (!userId) return [];
  const { data, error } = await supabase
    .from('user_preferences')
    .select('*')
    .eq('user_id', userId);
  if (error) {
    console.error('Error fetching user preferences:', error);
    return [];
  }
  return data as UserPreference[];
}

export async function getUserPreference(userId: string, key: string): Promise<UserPreference | null> {
  if (!userId) return null;
  const { data, error } = await supabase
    .from('user_preferences')
    .select('*')
    .eq('user_id', userId)
    .eq('preference_key', key)
    .single();
  if (error) {
    return null;
  }
  return data as UserPreference;
}

export async function setUserPreference(userId: string, key: string, value: string) {
  if (!userId) return;
  // Upsert (insert or update)
  await supabase
    .from('user_preferences')
    .upsert({
      user_id: userId,
      preference_key: key,
      value,
    }, { onConflict: 'user_id,preference_key' });
  window.dispatchEvent(new Event('user-preferences-update'));
}

export async function removeUserPreference(userId: string, key: string) {
  if (!userId) return;
  await supabase
    .from('user_preferences')
    .delete()
    .eq('user_id', userId)
    .eq('preference_key', key);
  window.dispatchEvent(new Event('user-preferences-update'));
} 