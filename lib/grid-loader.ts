import { TileType } from '@/types/tiles'

// Map numeric values to TileType
export const numericToTileType: { [key: number]: TileType } = {
  0: 'empty',
  1: 'mountain',
  2: 'grass',
  3: 'forest',
  4: 'water',
  5: 'city',
  6: 'town',
  7: 'mystery'
}

export interface GridData {
  grid: number[][]
  rows: number
  columns: number
}

export async function loadInitialGrid(): Promise<GridData> {
  try {
    const response = await fetch('/data/initial-grid.csv')
    const csvText = await response.text()
    
    // Parse CSV into 2D array
    const rows = csvText.trim().split('\n')
    const grid = rows.map(row => row.split(',').map(Number))
    
    return {
      grid,
      rows: grid.length,
      columns: grid[0].length
    }
  } catch (error) {
    console.error('Error loading initial grid:', error)
    throw new Error('Failed to load initial grid data')
  }
}

export function convertNumericToTileType(numeric: number): TileType {
  const tileType = numericToTileType[numeric]
  if (!tileType) {
    throw new Error(`Invalid numeric tile type: ${numeric}`)
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
    image: `/images/tiles/${type}-tile.png`
  }
} 