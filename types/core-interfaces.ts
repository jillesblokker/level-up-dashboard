// types/core-interfaces.ts
// LEAF FILE: Do not import from any other project files here!

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
  | 'market-stalls'
  | 'cottage'
  | 'crossroad'
  | 'straightroad'
  | 'cornerroad'
  | 'tsplitroad'
  | 'jungle'
  | 'ruins'
  | 'graveyard'
  | 'farmland'
  | 'oasis'
  | 'coral_reef'
  | 'crystal_cavern'
  | 'floating_island'
  | 'zen-garden'
  | 'quest-board'
  | 'monument'
  | 'training-grounds'
  | 'tavern'
  | 'watchtower'
  | 'library'
  | 'wizard'
  | 'temple';

export type MysteryEventType = 'treasure' | 'quest' | 'trade' | 'blessing' | 'curse' | 'riddle';

export interface MysteryEventReward {
  type: 'gold' | 'experience' | 'scroll' | 'artifact' | 'book' | 'nothing' | 'item';
  amount?: number;
  message?: string;
  scroll?: {
    id: string;
    name: string;
    content: string;
    category: string;
  };
  item?: InventoryItem[];
}

export interface MysteryEventOutcome {
  message: string;
  reward?: MysteryEventReward;
}

export interface MysteryEvent {
  id: string;
  type: MysteryEventType;
  title: string;
  description: string;
  choices: string[];
  outcomes: Record<string, MysteryEventOutcome>;
  enemyName?: string;
  enemyLevel?: number;
  requiredItems?: string[];
}

export type ConnectionDirection = 'north' | 'east' | 'south' | 'west';

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
  isMainTile?: boolean;
  isTown?: boolean;
  cityName?: string;
  cityX?: number;
  cityY?: number;
  citySize?: 1 | 2 | 3;
  bigMysteryX?: number;
  bigMysteryY?: number;
  tileSize?: 1 | 2;
  cost?: number;
  quantity?: number;
  // Game state properties
  hasMonster?: string | null;
  hasTimer?: boolean;
  timerEnd?: string | null;
  isRewardClaimed?: boolean;
  isBurning?: boolean;
  canBurn?: boolean;
  isStashed?: boolean;
}

export interface InventoryItem {
  id: string;
  name: string;
  description?: string;
  type: 'mount' | 'weapon' | 'shield' | 'armor' | 'potion' | 'scroll' | 'artifact' | 'material' | 'food' | 'resource' | 'item' | 'creature' | 'equipment' | 'book' | 'building';
  category?: string;
  stats?: {
    movement?: number;
    attack?: number;
    defense?: number;
    health?: number;
    mana?: number;
    stamina?: number;
    gold?: number;
    experience?: number;
  };
  emoji?: string;
  quantity: number;
  isDefault?: boolean;
  image?: string;
  rarity?: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  cost?: number;
  isEquippable?: boolean;
  isConsumable?: boolean;
  equipped?: boolean;
  star_rating?: number;
}
