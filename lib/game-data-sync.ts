import { GameState } from '../types/game'
import { supabase } from '@/lib/supabase/client';
// TODO: Replace all Prisma logic with Supabase client logic
// TODO: Implement all database logic with Supabase client here

export type GameData = GameState

export async function syncGameData(
  localData: GameData,
  userId: string
): Promise<void> {
  try {
    // Get existing data from the database
    const { data: existingData, error } = await supabase
      .from('realm_map')
      .select('grid')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error fetching realm map:', error);
      throw error;
    }

    // Parse existing grid JSON string if present
    const existingGrid = existingData?.grid ? JSON.parse(existingData.grid) : {}

    // Merge local data with existing data
    const mergedData = {
      ...existingGrid,
      ...localData,
      last_sync: new Date().toISOString(),
    }

    // Update the database
    await supabase
      .from('realm_map')
      .upsert({
        user_id: userId,
        grid: JSON.stringify(mergedData),
      })
      .eq('user_id', userId)
  } catch (error) {
    console.error('Error syncing game data:', error)
    throw error
  }
}

export async function loadGameData(userId: string): Promise<GameData | null> {
  try {
    const { data: existingData, error } = await supabase
      .from('realm_map')
      .select('grid')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error fetching realm map:', error);
      return null;
    }

    return existingData?.grid ? JSON.parse(existingData.grid) : null;
  } catch (error) {
    console.error('Error loading game data:', error)
    throw error
  }
}

export function getLocalGameData(): GameData {
  try {
    const grid = localStorage.getItem('grid')
    const inventory = localStorage.getItem('inventory')
    const character = localStorage.getItem('character')
    const quests = localStorage.getItem('quests')

    return {
      grid: grid ? JSON.parse(grid) : undefined,
      inventory: inventory ? JSON.parse(inventory) : {},
      character: character ? JSON.parse(character) : undefined,
      quests: quests ? JSON.parse(quests) : undefined,
      selectedTile: null
    }
  } catch (error) {
    console.error('Error getting local game data:', error)
    return {
      inventory: {},
      selectedTile: null
    }
  }
}

export function saveLocalGameData(data: GameData): void {
  try {
    if (data.grid) localStorage.setItem('grid', JSON.stringify(data.grid))
    if (data.inventory) localStorage.setItem('inventory', JSON.stringify(data.inventory))
    if (data.character) localStorage.setItem('character', JSON.stringify(data.character))
    if (data.quests) localStorage.setItem('quests', JSON.stringify(data.quests))
  } catch (error) {
    console.error('Error saving local game data:', error)
  }
} 