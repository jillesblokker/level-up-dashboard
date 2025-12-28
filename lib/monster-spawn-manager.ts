import { Tile } from '@/types/tiles';
import { MonsterType, SpawnCheckResult, MonsterSpawn } from '@/types/monsters';

// Export for backwards compatibility if needed, but prefer import from types
export type { MonsterType } from '@/types/monsters';

export type SpawnResult = SpawnCheckResult;

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

export function checkMonsterSpawn(grid: Tile[][], placedTileType: string, existingMonsters: MonsterSpawn[] = []): SpawnResult {
  const condition = monsterSpawnConditions[placedTileType as keyof typeof monsterSpawnConditions];

  if (!condition) {
    return { shouldSpawn: false };
  }

  // Check if a monster of this type already exists in the ACTIVE monsters list
  // (We check BOTH the grid logic AND the authoritative monsters list from DB)
  const monsterAlreadyExists = existingMonsters.some(m =>
    m.monster_type === condition.monsterType && !m.defeated
  );

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
  // NOTE: Logic assumes we only spawn ONE per threshold.
  if (tileCount === condition.count) {
    // Find a random position for the monster (preferably on grass)
    const grassPositions: { x: number; y: number }[] = [];
    for (let y = 0; y < grid.length; y++) {
      const row = grid[y];
      if (!row) continue;
      for (let x = 0; x < row.length; x++) {
        const tile = row[x];
        if (tile?.type === 'grass' && !tile.hasMonster) {
          // Double check there isn't actually a monster here from the existing list
          const hasMonsterHere = existingMonsters.some(m => m.x === x && m.y === y && !m.defeated);
          if (!hasMonsterHere) {
            grassPositions.push({ x, y });
          }
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
    } else {
      // Dispatch event to update UI
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('monster-spawned'));
      }
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