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
  | "corner" 
  | "crossroad" 
  | "intersection"
  | "t-junction"
  | "dead-end"
  | "special" 
  | "snow"
  | "mystery" 
  | "big-mystery" 
  | "treasure" 
  | "monster" 
  | "dungeon"
  | "ice"
  | "farm"
  | "mine";

// Connection types
export type ConnectionDirection = "top" | "right" | "bottom" | "left";

// Define the tile interface
export interface Tile {
  id: string;
  type: TileType;
  connections: ConnectionDirection[];
  rotation: 0 | 90 | 180 | 270;
  revealed: boolean;
  name?: string;
  description?: string;
  isMainTile?: boolean;
  cityName?: string;
  cityX?: number;
  cityY?: number;
  citySize?: 1 | 2 | 3;
  bigMysteryX?: number;
  bigMysteryY?: number;
  tileSize?: 1 | 2;
  isVisited?: boolean;
  isTown?: boolean;
  x: number;
  y: number;
  ariaLabel?: string;
  image?: string;
}

export interface CityData {
  name: string;
  isTown: boolean;
  size: 1 | 2 | 3;
}

// Define the selected tile interface
export interface SelectedTile {
  id: string;
  type: TileType;
  name: string;
  description: string;
  connections: ConnectionDirection[];
  rotation: 0 | 90 | 180 | 270;
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
  connections?: ConnectionDirection[];
  rotation?: 0 | 90 | 180 | 270;
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
  connections: ConnectionDirection[];
  rotation?: 0 | 90 | 180 | 270;
  cost: number;
  quantity: number;
} 