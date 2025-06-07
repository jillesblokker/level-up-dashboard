export type TileType = 
  | 'empty' 
  | 'grass'
  | 'water' 
  | 'forest' 
  | 'mountain' 
  | 'desert'
  | 'town'
  | 'city'
  | 'special'
  | 'snow'
  | 'mystery'
  | 'treasure'
  | 'dungeon'
  | 'monster';

export interface Tile {
  id: string;
  type: TileType;
  connections: string[];
  rotation: number;
  revealed: boolean;
  hasCharacter?: boolean;
}

export interface InventoryTile {
  id: string;
  type: TileType;
  name: string;
  count: number;
  cost: number;
}

export interface SelectedTile {
  id: string;
  type: TileType;
  name: string;
  cost: number;
} 