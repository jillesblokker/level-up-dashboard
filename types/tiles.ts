// Tile types
export type TileType = 
  | "empty" 
  | "grass" 
  | "forest" 
  | "water" 
  | "mountain" 
  | "city" 
  | "town" 
  | "desert" 
  | "road" 
  | "corner-road" 
  | "crossroad" 
  | "special" 
  | "mystery" 
  | "big-mystery" 
  | "treasure" 
  | "monster" 
  | "dungeon";

// Define the tile interface
export interface Tile {
  id: string;
  type: TileType;
  connections: string[];
  rotation: number;
  revealed: boolean;
  name?: string;
  description?: string;
  isMainTile?: boolean;
  cityName?: string;
  cityX?: number;
  cityY?: number;
  citySize?: number;
  bigMysteryX?: number;
  bigMysteryY?: number;
  tileSize?: number;
  isDiscovered?: boolean;
  isVisited?: boolean;
  isTown?: boolean;
  x?: number;
  y?: number;
}

export interface CityData {
  name: string;
  type: 'city' | 'town';
}

// Define the selected tile interface
export interface SelectedTile {
  id: string;
  type: TileType;
  name: string;
  description: string;
  connections: string[];
  rotation: number;
  cost: number;
  quantity: number;
  isSelected?: boolean;
}

// Define the inventory tile interface
export interface InventoryTile extends Tile {
  name: string;
  quantity?: number;
  cost: number;
  description: string;
}

// Define the character interface
export interface Character {
  x: number;
  y: number;
}

export interface TileItem {
  id: string;
  type: TileType;
  name: string;
  description: string;
  connections: any[];
  rotation?: number;
  cost: number;
  quantity: number;
}

export interface MapGridProps {
  onDiscovery: (message: string) => void;
  selectedTile: Tile | null;
  onTilePlaced: (tile: Tile) => void;
  grid: Tile[][];
  character: { x: number; y: number };
  onCharacterMove: (x: number, y: number) => void;
  onTileClick: (x: number, y: number) => void;
  onGridUpdate: (newGrid: Tile[][]) => void;
  onGoldUpdate: (amount: number) => void;
  onExperienceUpdate?: (amount: number) => void;
  onHover?: (x: number, y: number) => void;
  onHoverEnd?: () => void;
  hoveredTile?: { row: number; col: number } | null;
  onRotateTile?: (x: number, y: number) => void;
  onDeleteTile?: (x: number, y: number) => void;
  isMovementMode?: boolean;
  onAddMoreRows?: () => void;
} 