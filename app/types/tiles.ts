// Define types for the component
export type TileType = "empty" | "grass" | "forest" | "water" | "desert" | "road" | "corner-road" | "crossroad" | "city" | "town" | "mountain" | "mystery";

export interface Tile {
  id: string;
  type: TileType;
  connections: string[];
  rotation: number;
  revealed: boolean;
  isMainTile?: boolean;
  cityX?: number;
  cityY?: number;
}

export interface InventoryTile {
  id: string;
  name: string;
  description: string;
  cost: number;
  type: TileType;
  connections: string[];
  rotation: number;
  quantity: number;
}

export interface Character {
  x: number;
  y: number;
}

export interface SelectedTile {
  id: string;
  name: string;
  description: string;
  cost: number;
  type: TileType;
  connections: string[];
  rotation: number;
}

export interface Notification {
  title: string;
  message: string;
  type: "success" | "error" | "info" | "discovery";
  action?: () => void;
} 