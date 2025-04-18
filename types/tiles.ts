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
  | "dungeon"
  | "ice"
  | "farm"
  | "mine";

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
  isVisited?: boolean;
  isTown?: boolean;
  x: number;
  y: number;
}

export interface CityData {
  name: string;
  isTown: boolean;
  size: number;
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
export interface InventoryTile {
  id: string;
  type: TileType;
  name: string;
  count: number;
  cost: number;
  description?: string;
  connections?: string[];
  rotation?: number;
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