import { supabase } from '@/lib/supabase/client';
import type { CharacterStats, Perk } from '@/types/character';

// Minimal interfaces for strengths and titles
export interface CharacterStrength {
  id: string;
  user_id: string;
  name: string;
  category: string;
  level: number;
  experience: number;
  experienceToNextLevel: number;
}

export interface CharacterTitle {
  id: string;
  user_id: string;
  name: string;
  equipped: boolean;
  unlocked: boolean;
}

// Character Stats
export async function getCharacterStats(userId: string): Promise<CharacterStats | null> {
  if (!userId) return null;
  const { data, error } = await supabase
    .from('character_stats')
    .select('*')
    .eq('user_id', userId)
    .single();
  if (error) {
    console.error('Error fetching character stats:', error);
    return null;
  }
  return data as CharacterStats;
}

export async function updateCharacterStats(userId: string, stats: Partial<CharacterStats>) {
  if (!userId) return;
  await supabase
    .from('character_stats')
    .update(stats)
    .eq('user_id', userId);
  window.dispatchEvent(new Event('character-stats-update'));
}

// Character Strengths
export async function getCharacterStrengths(userId: string): Promise<CharacterStrength[]> {
  if (!userId) return [];
  const { data, error } = await supabase
    .from('character_strengths')
    .select('*')
    .eq('user_id', userId);
  if (error) {
    console.error('Error fetching character strengths:', error);
    return [];
  }
  return data as CharacterStrength[];
}

export async function updateCharacterStrengths(userId: string, strengths: CharacterStrength[]) {
  if (!userId) return;
  // Remove all and re-insert (or update individually if needed)
  await supabase
    .from('character_strengths')
    .delete()
    .eq('user_id', userId);
  if (strengths.length > 0) {
    await supabase
      .from('character_strengths')
      .insert(strengths.map(s => ({ ...s, user_id: userId })));
  }
  window.dispatchEvent(new Event('character-strengths-update'));
}

// Character Titles
export async function getCharacterTitles(userId: string): Promise<CharacterTitle[]> {
  if (!userId) return [];
  const { data, error } = await supabase
    .from('character_titles')
    .select('*')
    .eq('user_id', userId);
  if (error) {
    console.error('Error fetching character titles:', error);
    return [];
  }
  return data as CharacterTitle[];
}

export async function updateCharacterTitles(userId: string, titles: CharacterTitle[]) {
  if (!userId) return;
  await supabase
    .from('character_titles')
    .delete()
    .eq('user_id', userId);
  if (titles.length > 0) {
    await supabase
      .from('character_titles')
      .insert(titles.map(t => ({ ...t, user_id: userId })));
  }
  window.dispatchEvent(new Event('character-titles-update'));
}

// Character Perks
export async function getCharacterPerks(userId: string): Promise<Perk[]> {
  if (!userId) return [];
  const { data, error } = await supabase
    .from('character_perks')
    .select('*')
    .eq('user_id', userId);
  if (error) {
    console.error('Error fetching character perks:', error);
    return [];
  }
  return data as Perk[];
}

export async function updateCharacterPerks(userId: string, perks: Perk[]) {
  if (!userId) return;
  await supabase
    .from('character_perks')
    .delete()
    .eq('user_id', userId);
  if (perks.length > 0) {
    await supabase
      .from('character_perks')
      .insert(perks.map(p => ({ ...p, user_id: userId })));
  }
  window.dispatchEvent(new Event('character-perks-update'));
} 