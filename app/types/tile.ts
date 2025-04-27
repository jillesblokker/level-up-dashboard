export enum TileType {
  EMPTY = 'empty',
  GRASS = 'grass',
  WATER = 'water',
  MOUNTAIN = 'mountain',
  FOREST = 'forest',
  DESERT = 'desert',
  SNOW = 'snow',
  CAVE = 'cave',
  DUNGEON = 'dungeon',
  CASTLE = 'castle',
  VILLAGE = 'village',
  CITY = 'city',
  PORTAL = 'portal'
}

export interface Tile {
  id: string;
  type: TileType;
  name: string;
  description: string;
  connections: string[];
  rotation: number;
  revealed: boolean;
  isVisited: boolean;
  ariaLabel: string;
  x: number;
  y: number;
  image: string;
  role?: string;
  tabIndex?: number;
  'aria-label'?: string;
  'aria-description'?: string;
} 