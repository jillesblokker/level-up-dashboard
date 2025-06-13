import { TileType, Tile } from '@/types/tiles'
export async function loadAndProcessInitialGrid(): Promise<Tile[][]> {
  try {
    // Try to load from localStorage first
    if (typeof window !== 'undefined') {
      const savedGrid = localStorage.getItem('grid');
      if (savedGrid) {
        return JSON.parse(savedGrid);
      }
    }

    // If no saved grid, load the initial grid from CSV or fallback
    const gridData = await loadInitialGrid();
    // Convert numeric grid to Tile grid
    const tileGrid: Tile[][] = gridData.grid.map((row, y) =>
      row.map((numeric, x) => createTileFromNumeric(numeric, x, y))
    );

    // Save the processed grid
    if (typeof window !== 'undefined') {
      localStorage.setItem('grid', JSON.stringify(tileGrid));
    }

    return tileGrid;
  } catch (error) {
    console.error('Error in loadAndProcessInitialGrid:', error);
    // Return a basic grid if there's an error
    return Array(7).fill(null).map((_, y) =>
      Array(13).fill(null).map((_, x) => createTileFromNumeric(2, x, y)) // 2 is grass
    );
  }
}
// Map numeric values to TileType
export const numericToTileType: { [key: number]: TileType } = {
  0: 'empty',
  1: 'mountain',
  2: 'grass',
  3: 'forest',
  4: 'water',
  5: 'city',
  6: 'town',
  7: 'mystery',
  8: 'portal-entrance',
  9: 'portal-exit',
  10: 'snow',
  11: 'cave',
  12: 'dungeon',
  13: 'castle',
  14: 'ice',
  15: 'lava',
  16: 'volcano'
}

export interface GridData {
  grid: number[][]
  rows: number
  columns: number
}

// Assuming the expected grid width is 13 columns based on existing components
const EXPECTED_GRID_COLS = 13;
const INITIAL_ROWS = 7;

const defaultTile = (type: TileType): Tile => ({
  id: type,
  name: type.charAt(0).toUpperCase() + type.slice(1),
  description: `${type.charAt(0).toUpperCase() + type.slice(1)} tile`,
  type,
  connections: [],
  rotation: 0,
  revealed: true,
  isVisited: false,
  x: 0,
  y: 0,
  ariaLabel: `${type} tile`,
  image: `/tiles/${type}.png`,
  cost: 0,
  quantity: 0
});

const createBaseGrid = (): Tile[][] => {
  const grid: Tile[][] = [];
  for (let y = 0; y < INITIAL_ROWS; y++) {
    const row: Tile[] = [];
    for (let x = 0; x < EXPECTED_GRID_COLS; x++) {
      // Create a default grass tile
      row.push(defaultTile('grass'));
    }
    grid.push(row);
  }
  return grid;
};



export async function loadInitialGrid(): Promise<GridData> {
  try {
    console.log('Attempting to load initial grid from CSV...')
    const response = await fetch('/data/initial-grid.csv')
    console.log('Fetch response status:', response.status)
    if (!response.ok) {
      console.error('Failed to fetch initial grid:', response.status, response.statusText)
      throw new Error(`Failed to fetch initial grid: ${response.statusText}`)
    }
    const csvText = await response.text()
    console.log('CSV content loaded (first 100 chars):', csvText.substring(0, 100) + '...')
    
    // Parse CSV into 2D array, skipping the header row and taking only EXPECTED_GRID_COLS
    const rows = csvText.trim().split('\n')
    if (rows.length > 0) {
      // Remove the first row (header)
      rows.shift();
    }
    
    const grid = rows.map(row => row.split(',').map(Number).slice(0, EXPECTED_GRID_COLS));
    
    console.log('Parsed grid dimensions:', grid.length, 'x', grid[0]?.length);
    console.log('Parsed grid (first row):', grid[0]);
    
    // Basic validation
    if (grid.length === 0 || !grid[0] || grid[0].length === 0) {
        console.error('Parsed grid has unexpected dimensions.', grid.length, grid[0]?.length);
        throw new Error('Parsed grid has unexpected dimensions.');
    }
    
    return {
      grid,
      rows: grid.length,
      columns: grid[0].length
    }
  } catch (error) {
    console.error('Error loading initial grid:', error)
    // Return a default grid if loading fails
    console.log('Creating default grid as fallback...')
    const defaultGrid = Array(7).fill(null).map((_, y) =>
      Array(EXPECTED_GRID_COLS).fill(null).map((_, x) => {
        if (x === 0 || x === EXPECTED_GRID_COLS - 1 || y === 0 || y === 6) return 1 // Mountain borders
        if (x === 3 && y === 1) return 5 // City
        if (x === 7 && y === 4) return 6 // Town
        return 2 // Grass
      })
    )
    console.log('Default grid created dimensions:', defaultGrid.length, 'x', defaultGrid[0]?.length)
    return {
      grid: defaultGrid,
      rows: defaultGrid.length,
      columns: defaultGrid[0]?.length ?? EXPECTED_GRID_COLS
    }
  }
}

export function convertNumericToTileType(numeric: number): TileType {
  const tileType = numericToTileType[numeric]
  if (!tileType) {
    // Log the unexpected numeric value
    console.warn(`Unexpected numeric tile value encountered: ${numeric}`);
    // Return a default type or throw an error
    // Returning 'empty' as a fallback for unexpected numbers
    return 'empty';
    // Or re-throw if strict validation is needed:
    // throw new Error(`Invalid numeric tile type: ${numeric}`)
  }
  return tileType
}

export function createTileFromNumeric(numeric: number, x: number, y: number) {
  const type = convertNumericToTileType(numeric)
  return {
    id: `tile-${x}-${y}`,
    type,
    name: `${type.charAt(0).toUpperCase() + type.slice(1)} Tile`,
    description: `A ${type} tile`,
    connections: [],
    rotation: 0 as 0 | 90 | 180 | 270,
    revealed: true,
    isVisited: false,
    x,
    y,
    ariaLabel: `${type} tile at position ${x},${y}`,
    image: `/images/tiles/${type}-tile.png`,
    isMainTile: false,
    isTown: false,
    cityName: undefined,
    cityX: undefined,
    cityY: undefined,
    citySize: undefined,
    bigMysteryX: undefined,
    bigMysteryY: undefined,
    tileSize: undefined,
    cost: 0,
    quantity: 1
  }
}