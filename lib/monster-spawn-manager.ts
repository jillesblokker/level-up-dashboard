import { Tile } from '@/types/tiles';

export interface SpawnResult {
  shouldSpawn: boolean;
  position?: { x: number; y: number };
  monsterType?: string;
}

export type MonsterType = 'dragon' | 'goblin' | 'troll' | 'wizard' | 'pegasus' | 'fairy';

// Monster spawn conditions based on tile placement
const monsterSpawnConditions = {
  'desert': {
    count: 3,
    monsterType: 'dragon' as MonsterType,
    achievementId: '201'
  },
  'swamp': {
    count: 2,
    monsterType: 'goblin' as MonsterType,
    achievementId: '202'
  },
  'mountain': {
    count: 5,
    monsterType: 'troll' as MonsterType,
    achievementId: '203'
  },
  'ice': {
    count: 4,
    monsterType: 'wizard' as MonsterType,
    achievementId: '204'
  },
  'snow': {
    count: 3,
    monsterType: 'pegasus' as MonsterType,
    achievementId: '205'
  },
  'forest': {
    count: 6,
    monsterType: 'fairy' as MonsterType,
    achievementId: '206'
  }
};

export function checkMonsterSpawn(grid: Tile[][], placedTileType: string): SpawnResult {
  const condition = monsterSpawnConditions[placedTileType as keyof typeof monsterSpawnConditions];
  
  if (!condition) {
    return { shouldSpawn: false };
  }

  // Check if a monster of this type already exists
  let monsterAlreadyExists = false;
  for (let y = 0; y < grid.length; y++) {
    const row = grid[y];
    if (!row) continue;
    for (let x = 0; x < row.length; x++) {
      const tile = row[x];
      if (tile?.hasMonster === condition.monsterType) {
        monsterAlreadyExists = true;
        break;
      }
    }
    if (monsterAlreadyExists) break;
  }

  // If monster already exists, don't spawn another one
  if (monsterAlreadyExists) {
    return { shouldSpawn: false };
  }

  // Count tiles of the placed type
  let tileCount = 0;
  for (let y = 0; y < grid.length; y++) {
    const row = grid[y];
    if (!row) continue;
    for (let x = 0; x < row.length; x++) {
      const tile = row[x];
      if (tile?.type === placedTileType) {
        tileCount++;
      }
    }
  }

  // Check if we just reached the spawn threshold
  if (tileCount === condition.count) {
    // Find a random position for the monster (preferably on grass)
    const grassPositions: { x: number; y: number }[] = [];
    for (let y = 0; y < grid.length; y++) {
      const row = grid[y];
      if (!row) continue;
      for (let x = 0; x < row.length; x++) {
        const tile = row[x];
        if (tile?.type === 'grass' && !tile.hasMonster) {
          grassPositions.push({ x, y });
        }
      }
    }

    if (grassPositions.length > 0) {
      const randomPosition = grassPositions[Math.floor(Math.random() * grassPositions.length)];
      if (randomPosition) {
        return {
          shouldSpawn: true,
          position: randomPosition,
          monsterType: condition.monsterType
        };
      }
    }
  }

  return { shouldSpawn: false };
}

export function spawnMonsterOnTile(grid: Tile[][], x: number, y: number, monsterType: MonsterType): boolean {
  const row = grid[y];
  if (!row || !row[x]) {
    return false;
  }

  // Update the tile to have a monster
  row[x].hasMonster = monsterType;
  
  // Save to Supabase
  saveMonsterToSupabase(x, y, monsterType);
  
  return true;
}

export function getMonsterAchievementId(monsterType: MonsterType): string {
  const monsterToAchievement: Record<MonsterType, string> = {
    'dragon': '201',
    'goblin': '202',
    'troll': '203',
    'wizard': '204',
    'pegasus': '205',
    'fairy': '206'
  };
  
  return monsterToAchievement[monsterType] || '';
}

async function saveMonsterToSupabase(x: number, y: number, monsterType: MonsterType) {
  try {
    const response = await fetch('/api/monster-spawn', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ x, y, monsterType })
    });
    
    if (!response.ok) {
      console.error('Failed to save monster to Supabase');
    }
  } catch (error) {
    console.error('Error saving monster to Supabase:', error);
  }
}

// Get monster type from tile
export function getTileMonsterType(tile: Tile): MonsterType | null {
  return tile.hasMonster || null;
}

// Check if a tile has a monster
export function tileHasMonster(tile: Tile): boolean {
  return !!tile.hasMonster;
} 