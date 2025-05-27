// types/tiles.ts

export type TileType = 
  | 'empty'
  | 'mountain'
  | 'grass'
  | 'forest'
  | 'water'
  | 'city'
  | 'town'
  | 'mystery'
  | 'portal'
  | 'portal-entrance'
  | 'portal-exit'
  | 'snow'
  | 'cave'
  | 'dungeon'
  | 'castle'
  | 'ice'
  | 'desert'
  | 'lava'
  | 'volcano';

export type ConnectionDirection = 'north' | 'east' | 'south' | 'west';

// Interface for a tile on the map grid
export interface Tile {
  id: string;
  type: TileType;
  name: string;
  description: string;
  connections: ConnectionDirection[];
  rotation: 0 | 90 | 180 | 270;
  revealed: boolean;
  isVisited: boolean;
  x: number;
  y: number;
  ariaLabel: string;
  image: string;
  isMainTile?: boolean | undefined;
  isTown?: boolean | undefined;
  cityName?: string | undefined;
  cityX?: number | undefined;
  cityY?: number | undefined;
  citySize?: 1 | 2 | 3 | undefined;
  bigMysteryX?: number | undefined;
  bigMysteryY?: number | undefined;
  tileSize?: 1 | 2 | undefined;
  cost?: number | undefined;
  quantity?: number | undefined;
}

// Interface for an item in the player's inventory
export interface InventoryItem {
  id: string;
  type: TileType;
  name: string;
  description: string;
  connections: ConnectionDirection[];
  rotation: 0 | 90 | 180 | 270;
  revealed: boolean;
  isVisited: boolean;
  x: number;
  y: number;
  ariaLabel: string;
  image: string;
  cost: number;
  quantity: number;
  isMainTile?: boolean | undefined;
  isTown?: boolean | undefined;
  cityName?: string | undefined;
  cityX?: number | undefined;
  cityY?: number | undefined;
  citySize?: 1 | 2 | 3 | undefined;
  bigMysteryX?: number | undefined;
  bigMysteryY?: number | undefined;
  tileSize?: 1 | 2 | undefined;
}

// Interface for a tile selected from inventory, ready to be placed
// It extends InventoryItem and might have slight differences
export type SelectedInventoryItem = InventoryItem;

// Interface for the MapGrid component's props
export interface MapGridProps {
  grid: Tile[][];
  character: { x: number; y: number };
  onCharacterMove: (newX: number, newY: number) => void;
  onTileClick: (x: number, y: number) => void;
  selectedTile: SelectedInventoryItem | null;
  onGridUpdate: (newGrid: Tile[][]) => void;
  isMovementMode: boolean;
  onDiscovery: (message: string) => void;
  onTilePlaced: (x: number, y: number) => void;
  onGoldUpdate: (amount: number) => void;
  onHover: (x: number, y: number) => void;
  onHoverEnd: () => void;
  hoveredTile: { row: number; col: number } | null;
  onDeleteTile: (x: number, y: number) => void;
  gridRotation: number;
}

export type GridCoordinates = { x: number; y: number };

export type GridPosition = { row: number; col: number };

// Define the structure of the raw grid data expected from Supabase (if it's numeric)
export type NumericGrid = number[][];

// You might also have other types here, keep them as is.
// Example:
// export interface OtherRelamType {
//   // ... properties ...
// }