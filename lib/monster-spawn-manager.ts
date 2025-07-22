import { Tile, TileType } from '@/types/tiles'

interface MonsterSpawnCondition {
  monsterType: 'dragon' | 'goblin' | 'troll' | 'wizard' | 'pegasus' | 'fairy'
  condition: {
    type: 'tile_count' | 'cave_count' | 'portal_usage' | 'mystery_events'
    tileType?: TileType
    count: number
  }
  achievementId: string
}

const monsterSpawnConditions: MonsterSpawnCondition[] = [
  {
    monsterType: 'dragon',
    condition: { type: 'cave_count', count: 2 },
    achievementId: '201'
  },
  {
    monsterType: 'goblin',
    condition: { type: 'tile_count', tileType: 'forest', count: 20 },
    achievementId: '202'
  },
  {
    monsterType: 'troll',
    condition: { type: 'tile_count', tileType: 'lava', count: 5 },
    achievementId: '203'
  },
  {
    monsterType: 'wizard',
    condition: { type: 'portal_usage', count: 2 },
    achievementId: '204'
  },
  {
    monsterType: 'pegasus',
    condition: { type: 'tile_count', tileType: 'desert', count: 3 },
    achievementId: '205'
  },
  {
    monsterType: 'fairy',
    condition: { type: 'mystery_events', count: 5 },
    achievementId: '206'
  }
]

interface MonsterSpawnState {
  spawnedMonsters: Set<string> // Set of monster types that have been spawned
  tileCounts: Record<TileType, number>
  caveCount: number
  portalUsageCount: number
  mysteryEventCount: number
}

// Initialize state from localStorage
function getMonsterSpawnState(): MonsterSpawnState {
  if (typeof window === 'undefined') {
    return {
      spawnedMonsters: new Set(),
      tileCounts: {} as Record<TileType, number>,
      caveCount: 0,
      portalUsageCount: 0,
      mysteryEventCount: 0
    }
  }

  const saved = localStorage.getItem('monster-spawn-state')
  if (saved) {
    const parsed = JSON.parse(saved)
    return {
      ...parsed,
      spawnedMonsters: new Set(parsed.spawnedMonsters || [])
    }
  }

  return {
    spawnedMonsters: new Set(),
    tileCounts: {} as Record<TileType, number>,
    caveCount: 0,
    portalUsageCount: 0,
    mysteryEventCount: 0
  }
}

// Save state to localStorage
function saveMonsterSpawnState(state: MonsterSpawnState) {
  if (typeof window === 'undefined') return

  const serializableState = {
    ...state,
    spawnedMonsters: Array.from(state.spawnedMonsters)
  }
  localStorage.setItem('monster-spawn-state', JSON.stringify(serializableState))
}

// Check if a monster should spawn based on current conditions
export function checkMonsterSpawn(
  grid: Tile[][],
  tileType?: TileType,
  eventType?: 'cave_placed' | 'portal_used' | 'mystery_event'
): { shouldSpawn: boolean; monsterType?: string; position?: { x: number; y: number } | undefined } {
  const state = getMonsterSpawnState()
  
  // Update counts based on the event
  if (tileType) {
    state.tileCounts[tileType] = (state.tileCounts[tileType] || 0) + 1
  }
  
  if (eventType === 'cave_placed') {
    state.caveCount += 1
  } else if (eventType === 'portal_used') {
    state.portalUsageCount += 1
  } else if (eventType === 'mystery_event') {
    state.mysteryEventCount += 1
  }

  // Check each spawn condition
  for (const condition of monsterSpawnConditions) {
    if (state.spawnedMonsters.has(condition.monsterType)) {
      continue // Monster already spawned
    }

    let shouldSpawn = false

    switch (condition.condition.type) {
      case 'tile_count':
        if (condition.condition.tileType) {
          const count = state.tileCounts[condition.condition.tileType] || 0
          shouldSpawn = count >= condition.condition.count
        }
        break
      
      case 'cave_count':
        shouldSpawn = state.caveCount >= condition.condition.count
        break
      
      case 'portal_usage':
        shouldSpawn = state.portalUsageCount >= condition.condition.count
        break
      
      case 'mystery_events':
        shouldSpawn = state.mysteryEventCount >= condition.condition.count
        break
    }

    if (shouldSpawn) {
      // Find a random grass tile to spawn the monster
      const grassTiles: { x: number; y: number }[] = []
      
             for (let y = 0; y < grid.length; y++) {
         const row = grid[y]
         if (!row) continue
         for (let x = 0; x < row.length; x++) {
           const tile = row[x]
           if (tile && tile.type === 'grass' && !tile.hasMonster) {
             grassTiles.push({ x, y })
           }
         }
       }

             if (grassTiles.length > 0) {
         const randomIndex = Math.floor(Math.random() * grassTiles.length)
         const position = grassTiles[randomIndex]
         
         // Mark monster as spawned
         state.spawnedMonsters.add(condition.monsterType)
         saveMonsterSpawnState(state)
         
         return {
           shouldSpawn: true,
           monsterType: condition.monsterType,
           position: position
         }
       }
    }
  }

  // Save updated state
  saveMonsterSpawnState(state)
  
  return { shouldSpawn: false }
}

// Spawn a monster on a specific tile
export function spawnMonsterOnTile(
  grid: Tile[][],
  x: number,
  y: number,
  monsterType: 'dragon' | 'goblin' | 'troll' | 'wizard' | 'pegasus' | 'fairy'
): boolean {
  if (!grid[y] || !grid[y][x]) return false
  
  const tile = grid[y][x]
  if (tile.type !== 'grass' || tile.hasMonster) return false

  // Add monster to the tile
  tile.hasMonster = monsterType
  tile.monsterAchievementId = getMonsterAchievementId(monsterType)
  
  return true
}

// Get achievement ID for monster type
export function getMonsterAchievementId(monsterType: string): string {
  const condition = monsterSpawnConditions.find(c => c.monsterType === monsterType)
  return condition?.achievementId || ''
}

// Check if a tile has a monster
export function tileHasMonster(tile: Tile): boolean {
  return !!tile.hasMonster
}

// Get monster type from tile
export function getTileMonsterType(tile: Tile): string | null {
  return tile.hasMonster || null
}

// Reset monster spawn state (for testing)
export function resetMonsterSpawnState() {
  if (typeof window === 'undefined') return
  localStorage.removeItem('monster-spawn-state')
}

// Get current spawn state for debugging
export function getCurrentSpawnState() {
  return getMonsterSpawnState()
} 