import { ComprehensiveItem, getDefaultItems, getItemsByType } from './comprehensive-items';

export interface InventoryItem {
  id: string;
  name: string;
  description: string;
  type: 'mount' | 'weapon' | 'shield' | 'armor' | 'potion' | 'scroll' | 'artifact' | 'material' | 'food';
  stats: {
    movement?: number;
    attack?: number;
    defense?: number;
    health?: number;
    mana?: number;
    stamina?: number;
    gold?: number;
    experience?: number;
  };
  emoji: string;
  quantity: number;
  isDefault?: boolean;
  image: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  cost: number;
  isEquippable: boolean;
  isConsumable: boolean;
}

// Convert comprehensive items to inventory format
const convertToInventoryItem = (item: ComprehensiveItem): InventoryItem => ({
  id: item.id,
  name: item.name,
  description: item.description,
  type: item.type as any,
  stats: item.stats,
  emoji: item.emoji,
  quantity: item.isDefault ? 1 : 0,
  isDefault: item.isDefault || false,
  image: item.image,
  rarity: item.rarity,
  cost: item.cost,
  isEquippable: item.isEquippable,
  isConsumable: item.isConsumable,
});

export const defaultInventoryItems: InventoryItem[] = [
  // Get all default items from comprehensive system
  ...getDefaultItems().map(convertToInventoryItem),
  
  // Add some additional starter items
  {
    id: 'potion-health-starter',
    name: 'Health Potion',
    description: 'A basic health potion to get you started',
    type: 'potion',
    stats: { health: 50 },
    emoji: '❤️',
    quantity: 3,
    isDefault: true,
    image: '/images/items/potion/potion-health.png',
    rarity: 'common',
    cost: 25,
    isEquippable: false,
    isConsumable: true,
  },
  {
    id: 'potion-mana-starter',
    name: 'Mana Potion',
    description: 'A basic mana potion to restore magical energy',
    type: 'potion',
    stats: { mana: 50 },
    emoji: '🌀',
    quantity: 2,
    isDefault: true,
    image: '/images/items/potion/potion-mana.png',
    rarity: 'common',
    cost: 30,
    isEquippable: false,
    isConsumable: true,
  },
  {
    id: 'material-logs-starter',
    name: 'Wooden Logs',
    description: 'Basic building material for construction',
    type: 'material',
    stats: {},
    emoji: '🪵',
    quantity: 5,
    isDefault: true,
          image: '/images/items/materials/material-logs.png',
    rarity: 'common',
    cost: 10,
    isEquippable: false,
    isConsumable: true,
  },
  {
    id: 'food-red-starter',
    name: 'Red Fish',
    description: 'A vibrant red fish that provides basic nourishment',
    type: 'food',
    stats: { health: 15, stamina: 10 },
    emoji: '🐟',
    quantity: 2,
    isDefault: true,
    image: '/images/items/food/fish-red.png',
    rarity: 'common',
    cost: 25,
    isEquippable: false,
    isConsumable: true,
  },
];

// Helper function to get all items by type
export const getInventoryItemsByType = (type: string): InventoryItem[] => {
  return getItemsByType(type).map(convertToInventoryItem);
};

// Helper function to get all available items (not just defaults)
export const getAllAvailableItems = (): InventoryItem[] => {
  return getItemsByType('weapon')
    .concat(getItemsByType('shield'))
    .concat(getItemsByType('armor'))
    .concat(getItemsByType('mount'))
    .concat(getItemsByType('potion'))
    .concat(getItemsByType('scroll'))
    .concat(getItemsByType('artifact'))
    .concat(getItemsByType('material'))
    .concat(getItemsByType('food'))
    .map(convertToInventoryItem);
}; 