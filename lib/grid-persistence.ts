import { Tile } from '@/types/tiles';
import { TileType } from '@/types/tiles';
// Replaced all Supabase direct calls with API routes for authentication flow
// All database logic now uses authenticated API routes

// Convert tile type to numeric value for database storage
const tileTypeToNumeric: Record<TileType, number> = {
  empty: 0,
  grass: 1,
  water: 2,
  mountain: 3,
  forest: 4,
  desert: 5,
  city: 6,
  cave: 7,
  treasure: 8,
  castle: 9,
  dungeon: 10,
  town: 11,
  mystery: 12,
  'portal-entrance': 13,
  'portal-exit': 14,
  snow: 15,
  ice: 16,
  lava: 17,
  volcano: 18,
  sheep: 19,
  horse: 20,
  special: 21,
  swamp: 22,
  monster: 23,
  vacant: 24,
  // Property tiles
  archery: 25,
  blacksmith: 26,
  sawmill: 27,
  fisherman: 28,
  grocery: 29,
  foodcourt: 30,
  well: 31,
  windmill: 32,
  fountain: 33,
  house: 34,
  inn: 35,
  jousting: 36,
  mansion: 37,
  mayor: 38,
  'streak-scroll': 39,
  farm: 40,
  lumber_mill: 41,
  market: 42,
  cottage: 43,
  crossroad: 44,
  straightroad: 45,
  cornerroad: 46,
  tsplitroad: 47,
  jungle: 48,
  ruins: 49,
  graveyard: 50,
  farmland: 51,
  oasis: 52,
  coral_reef: 53,
  crystal_cavern: 54,
  floating_island: 55,
  'zen-garden': 56,
  'quest-board': 57,
  monument: 58,
  'training-grounds': 59,
  tavern: 60,
  watchtower: 61,
  library: 62,
  wizard: 63,
  temple: 64,
  'market-stalls': 65,
};

// Convert numeric value back to tile type
const numericToTileType = Object.fromEntries(
  Object.entries(tileTypeToNumeric).map(([key, value]) => [value, key])
) as Record<number, TileType>;

function createTileFromNumeric(numeric: number, x: number, y: number): Tile {
  return {
    type: numericToTileType[numeric] || 'empty',
    id: `${x}-${y}`,
    name: '',
    description: '',
    connections: [],
    rotation: 0,
    revealed: true,
    isVisited: false,
    x,
    y,
    ariaLabel: '',
    image: '',
  };
}

async function getClerkToken(): Promise<string | null> {
  if (typeof window === 'undefined') {
    console.error('[Grid Persistence] getClerkToken called on server side');
    return null;
  }

  try {
    // Access Clerk from window if available
    const clerk = (window as any).__clerk;
    if (!clerk) {
      console.error('[Grid Persistence] Clerk not available on window');
      return null;
    }

    const session = clerk.session;
    if (!session) {
      console.error('[Grid Persistence] No active Clerk session');
      return null;
    }

    const token = await session.getToken();
    // Removed debugging log
    return token;
  } catch (error) {
    console.error('[Grid Persistence] Error getting Clerk token:', error);
    return null;
  }
}

export async function loadGridFromSupabase(userId: string): Promise<Tile[][] | null> {
  if (!userId) {
    console.error('[Grid Persistence] No user ID provided');
    return null;
  }

  try {
    const token = await getClerkToken();
    if (!token) {
      console.error('[Grid Persistence] No authentication token available');
      return null;
    }

    // Removed debugging log
    const response = await fetch('/api/realm', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      console.error('[Grid Persistence] Failed to load grid:', response.status, response.statusText);
      return null;
    }

    const data = await response.json();
    if (!data || !data.grid) {
      // Removed debugging log
      return null;
    }

    // Removed debugging log
    return data.grid.map((row: number[], y: number) =>
      row.map((numeric: number, x: number) => createTileFromNumeric(numeric, x, y))
    );
  } catch (error) {
    console.error('[Grid Persistence] Error loading grid:', error);
    return null;
  }
}

export async function saveGridToSupabase(userId: string, grid: Tile[][]): Promise<void> {
  if (!userId) {
    console.error('[Grid Persistence] No user ID provided');
    return;
  }

  try {
    const token = await getClerkToken();
    if (!token) {
      console.error('[Grid Persistence] No authentication token available');
      return;
    }

    // Removed debugging log
    const numericGrid = grid.map(row =>
      row.map(tile => tileTypeToNumeric[tile.type])
    );

    const response = await fetch('/api/realm', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        grid: numericGrid,
      }),
    });

    if (!response.ok) {
      console.error('[Grid Persistence] Failed to save grid:', response.status, response.statusText);
      throw new Error('Failed to save grid to API');
    }

    // Removed debugging log
  } catch (error) {
    console.error('[Grid Persistence] Error saving grid:', error);
    throw error;
  }
} 