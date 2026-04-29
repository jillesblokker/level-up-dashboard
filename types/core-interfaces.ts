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
  // Game state properties
  hasMonster?: string | null | undefined;
  hasTimer?: boolean | undefined;
  timerEnd?: string | null | undefined;
  isRewardClaimed?: boolean | undefined;
  isBurning?: boolean | undefined;
  canBurn?: boolean | undefined;
  isStashed?: boolean | undefined;
  tokenCost?: number | undefined;
  materialCost?: { itemId: string; quantity: number }[] | undefined;
  levelRequired?: number | undefined;
  monsterAchievementId?: string | undefined;
  owned?: number | undefined;
  unlocked?: boolean | undefined;
  version?: number | undefined;
  last_updated?: string | undefined;
}

export interface InventoryItem {
  id: string;
  name: string;
  description?: string | undefined;
  type: string;
  category?: string | undefined;
  stats?: {
    movement?: number | undefined;
    attack?: number | undefined;
    defense?: number | undefined;
    health?: number | undefined;
    mana?: number | undefined;
    stamina?: number | undefined;
    gold?: number | undefined;
    experience?: number | undefined;
  } | undefined;
  emoji?: string | undefined;
  quantity: number;
  isDefault?: boolean | undefined;
  image?: string | undefined;
  rarity?: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | undefined;
  cost?: number | undefined;
  isEquippable?: boolean | undefined;
  isConsumable?: boolean | undefined;
  equipped?: boolean | undefined;
  star_rating?: number | undefined;
}
