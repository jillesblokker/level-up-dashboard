// types/tiles.ts

import { MinimapEntity, MinimapRotationMode } from '@/types/minimap';
import { MysteryEvent } from '@/lib/mystery-events';

export type TileType =
  | 'empty'
  | 'mountain'
  | 'grass'
  | 'forest'
  | 'water'
  | 'city'
  | 'town'
  | 'mystery'
  | 'portal-entrance'
  | 'portal-exit'
  | 'snow'
  | 'cave'
  | 'dungeon'
  | 'castle'
  | 'ice'
  | 'desert'
  | 'lava'
  | 'volcano'
  | 'sheep'
  | 'horse'
  | 'special'
  | 'swamp'
  | 'treasure'
  | 'monster'
  | 'vacant'
  | 'archery'
  | 'blacksmith'
  | 'sawmill'
  | 'fisherman'
  | 'grocery'
  | 'foodcourt'
  | 'well'
  | 'windmill'
  | 'fountain'
  | 'house'
  | 'inn'
  | 'jousting'
  | 'mansion'
  | 'mayor'
  | 'streak-scroll'
  | 'farm'
  | 'lumber_mill'
  | 'market'
  | 'cottage'
  | 'crossroad'
  | 'straightroad'
  | 'cornerroad'
  | 'tsplitroad';

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
  owned?: number | undefined;
  hasMonster?: 'dragon' | 'goblin' | 'troll' | 'wizard' | 'pegasus' | 'fairy' | undefined;
  monsterAchievementId?: string | undefined;
  materialCost?: { itemId: string; quantity: number }[] | undefined;
  tokenCost?: number | undefined;
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
  unlocked?: boolean;
  materialCost?: { itemId: string; quantity: number }[] | undefined;
  tokenCost?: number | undefined;
}

// Interface for a tile selected from inventory, ready to be placed
// It extends InventoryItem and might have slight differences
export type SelectedInventoryItem = InventoryItem;

// Interface for the MapGrid component's props
export interface MapGridProps {
  grid: Tile[][];
  character: { x: number; y: number };
  onCharacterMove: (x: number, y: number) => void;
  onTileClick: (x: number, y: number) => void;
  selectedTile?: Tile | null;
  isMovementMode?: boolean;
  onGridUpdate?: (grid: Tile[][]) => void;
  hoveredTile?: { row: number; col: number } | null;
  setHoveredTile: (tile: { row: number; col: number } | null) => void;
  gridRotation?: number;
  minimapEntities?: MinimapEntity[];
  minimapZoom?: number;
  minimapRotationMode?: MinimapRotationMode;
  onTileDelete?: (x: number, y: number) => void;
  onReset?: () => void;
  showScrollMessage?: boolean;
  setShowScrollMessage?: (show: boolean) => void;
  inventory?: Record<TileType, Tile>;
  onInventoryUpdate?: (inventory: Record<TileType, Tile>) => void;
  onVisitLocation?: (location: { x: number; y: number; name: string }) => void;
  onEventChoice?: (choice: string) => void;
  currentEvent?: MysteryEvent | null;
  setCurrentEvent?: (event: MysteryEvent | null) => void;
  showLocationModal?: boolean;
  setShowLocationModal?: (show: boolean) => void;
  currentLocation?: { x: number; y: number; name: string } | null;
  setCurrentLocation?: (location: { x: number; y: number; name: string } | null) => void;
  isSyncing?: boolean;
  syncError?: string | null;
  saveStatus?: 'idle' | 'saving' | 'success' | 'error';
  lastSaveTime?: string | null;
  saveError?: string | null;
  retryCount?: number;
  tileCounts?: TileCounts;
  setTileCounts?: (counts: TileCounts) => void;
  onGoldUpdate?: (amount: number) => void;
  onExperienceUpdate?: (amount: number) => void;
  onQuestCompletion?: () => void;
  onRotateTile?: (x: number, y: number) => void;
  horsePos?: { x: number; y: number } | null;
  sheepPos?: { x: number; y: number } | null;
  eaglePos?: { x: number; y: number } | null;
  penguinPos?: { x: number; y: number } | null;
  isHorsePresent?: boolean;
  isPenguinPresent?: boolean;
  portalSource?: { x: number; y: number; type: TileType } | null;
  setPortalSource?: (source: { x: number; y: number; type: TileType } | null) => void;
  showPortalModal?: boolean;
  setShowPortalModal?: (show: boolean) => void;
}

export type GridCoordinates = { x: number; y: number };

export type GridPosition = { row: number; col: number };

// Define the structure of the raw grid data expected from Supabase (if it's numeric)
export type NumericGrid = number[][];

export interface TileCounts {
  forestPlaced: number;
  forestDestroyed: number;
  waterPlaced: number;
  mountainPlaced: number;
  mountainDestroyed: number;
  icePlaced: number;
  waterDestroyed: number;
}

// You might also have other types here, keep them as is.
// Example:
// export interface OtherRelamType {
//   // ... properties ...
// }