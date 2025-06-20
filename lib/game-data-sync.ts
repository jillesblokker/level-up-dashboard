import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/supabase'
import { env } from '@/lib/env'
import { GameState } from '../types/game'

export type GameData = GameState

export async function syncGameData(
  localData: GameData,
  userId: string
): Promise<void> {
  const supabase = createClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )

  try {
    // Get existing data from the database
    const { data: existingData, error: fetchError } = await supabase
      .from('user_game_data')
      .select('game_progress')
      .eq('user_id', userId)
      .single()

    if (fetchError && fetchError.code !== 'PGRST116') {
      throw fetchError
    }

    // Merge local data with existing data
    const mergedData = {
      ...(existingData?.game_progress || {}),
      ...localData,
      last_sync: new Date().toISOString(),
    }

    // Update the database
    const { error: updateError } = await supabase
      .from('user_game_data')
      .upsert({
        user_id: userId,
        game_progress: mergedData,
        updated_at: new Date().toISOString(),
      })

    if (updateError) {
      throw updateError
    }
  } catch (error) {
    console.error('Error syncing game data:', error)
    throw error
  }
}

export async function loadGameData(userId: string): Promise<GameData | null> {
  const supabase = createClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )

  try {
    const { data, error } = await supabase
      .from('user_game_data')
      .select('game_progress')
      .eq('user_id', userId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null
      }
      throw error
    }

    return data?.game_progress || null
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

// Create a new Supabase client for this operation
const supabaseClient = createClient<Database>(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.NEXT_PUBLIC_SUPABASE_ANON_KEY
) 