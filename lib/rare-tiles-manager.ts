import { SupabaseClient } from '@supabase/supabase-js'

export interface RareTile {
  id: string
  name: string
  type: string
  image: string
  cost: number
  description: string
  unlockDate: {
    day: number
    month: number
  }
  unlocked: boolean
  quantity: number
}

export const RARE_TILES: RareTile[] = [
  {
    id: 'christmas-tile',
    name: 'Wonderful',
    type: 'christmas',
    image: '/images/tiles/rare tiles/christmas-tile.png',
    cost: 1000,
    description: 'A festive tile available on December 25th',
    unlockDate: { day: 25, month: 12 },
    unlocked: false,
    quantity: 0
  },
  {
    id: 'eastern-tile',
    name: 'Eggs',
    type: 'eastern',
    image: '/images/tiles/rare tiles/eastern-tile.png',
    cost: 800,
    description: 'A special tile available on April 20th',
    unlockDate: { day: 20, month: 4 },
    unlocked: false,
    quantity: 0
  },
  {
    id: 'fifth-tile',
    name: 'Presents',
    type: 'fifth',
    image: '/images/tiles/rare tiles/fifth-tile.png',
    cost: 600,
    description: 'A unique tile available on December 5th',
    unlockDate: { day: 5, month: 12 },
    unlocked: false,
    quantity: 0
  },
  {
    id: 'mango-tile',
    name: 'Friend',
    type: 'mango',
    image: '/images/tiles/rare tiles/mango-tile.png',
    cost: 750,
    description: 'A tropical tile available on October 4th',
    unlockDate: { day: 4, month: 10 },
    unlocked: false,
    quantity: 0
  },
  {
    id: 'newyear-tile',
    name: 'Explosions',
    type: 'newyear',
    image: '/images/tiles/rare tiles/newyear-tile.png',
    cost: 1200,
    description: 'A celebratory tile available on January 1st',
    unlockDate: { day: 1, month: 1 },
    unlocked: false,
    quantity: 0
  },
  {
    id: 'orange-tile',
    name: 'Royal',
    type: 'orange',
    image: '/images/tiles/rare tiles/orange-tile.png',
    cost: 900,
    description: 'A vibrant tile available on April 26th',
    unlockDate: { day: 26, month: 4 },
    unlocked: false,
    quantity: 0
  },
  {
    id: 'valentine-tile',
    name: 'Love',
    type: 'valentine',
    image: '/images/tiles/rare tiles/valentine-tile.png',
    cost: 1100,
    description: 'A romantic tile available on February 14th',
    unlockDate: { day: 14, month: 2 },
    unlocked: false,
    quantity: 0
  }
]

export function isRareTileUnlocked(tile: RareTile): boolean {
  const today = new Date()
  const currentDay = today.getDate()
  const currentMonth = today.getMonth() + 1 // getMonth() returns 0-11
  
  return currentDay === tile.unlockDate.day && currentMonth === tile.unlockDate.month
}

export function getRareTileUnlockDate(tile: RareTile): string {
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]
  
  return `${monthNames[tile.unlockDate.month - 1]} ${tile.unlockDate.day}`
}

export async function loadRareTiles(supabase: SupabaseClient, userId: string): Promise<RareTile[]> {
  try {
    const { data, error } = await supabase
      .from('rare_tiles')
      .select('*')
      .eq('user_id', userId)
    
    if (error) {
      console.error('Error loading rare tiles:', error)
      return RARE_TILES.map(tile => ({
        ...tile,
        unlocked: isRareTileUnlocked(tile)
      }))
    }
    
    // Merge saved data with default tiles
    return RARE_TILES.map(tile => {
      const savedTile = data?.find(saved => saved.tile_id === tile.id)
      return {
        ...tile,
        unlocked: savedTile?.unlocked || isRareTileUnlocked(tile),
        quantity: savedTile?.quantity || 0
      }
    })
  } catch (error) {
    console.error('Error loading rare tiles:', error)
    return RARE_TILES.map(tile => ({
      ...tile,
      unlocked: isRareTileUnlocked(tile)
    }))
  }
}

export async function saveRareTiles(supabase: SupabaseClient, userId: string, tiles: RareTile[]): Promise<void> {
  try {
    // Prepare data for insertion/update
    const tilesData = tiles.map(tile => ({
      user_id: userId,
      tile_id: tile.id,
      unlocked: tile.unlocked,
      quantity: tile.quantity,
      updated_at: new Date().toISOString()
    }))
    
    // Upsert the data
    const { error } = await supabase
      .from('rare_tiles')
      .upsert(tilesData, { onConflict: 'user_id,tile_id' })
    
    if (error) {
      console.error('Error saving rare tiles:', error)
    }
  } catch (error) {
    console.error('Error saving rare tiles:', error)
  }
}

export async function unlockRareTile(supabase: SupabaseClient, userId: string, tileId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('rare_tiles')
      .upsert({
        user_id: userId,
        tile_id: tileId,
        unlocked: true,
        quantity: 1,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id,tile_id' })
    
    if (error) {
      console.error('Error unlocking rare tile:', error)
      throw error
    }
  } catch (error) {
    console.error('Error unlocking rare tile:', error)
    throw error
  }
}

export async function clearRareTileUnlock(supabase: SupabaseClient, userId: string, tileId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('rare_tiles')
      .delete()
      .eq('user_id', userId)
      .eq('tile_id', tileId)
    
    if (error) {
      console.error('Error clearing rare tile unlock:', error)
      throw error
    }
  } catch (error) {
    console.error('Error clearing rare tile unlock:', error)
    throw error
  }
} 