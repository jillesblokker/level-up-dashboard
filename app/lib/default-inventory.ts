export interface InventoryItem {
  id: string;
  name: string;
  description: string;
  type: 'mount' | 'weapon' | 'shield' | 'armor';
  stats: {
    movement?: number;
    attack?: number;
    defense?: number;
  };
  emoji: string;
  quantity: number;
  isDefault?: boolean;
  image: string;
}

export const defaultInventoryItems: InventoryItem[] = [
  {
    id: 'stelony',
    name: 'Stelony',
    description: 'A sturdy pony with basic armor - your trusty starter mount',
    type: 'mount',
    stats: {
      movement: 5
    },
    emoji: '🐎',
    quantity: 1,
    isDefault: true,
    image: '/images/items/horse/horse-stelony.png',
  },
  {
    id: 'twig',
    name: 'Twig',
    description: 'A simple wooden sword - every adventurer starts somewhere',
    type: 'weapon',
    stats: {
      attack: 2
    },
    emoji: '🗡️',
    quantity: 1,
    isDefault: true,
    image: '/images/items/sword/sword-twig.png',
  },
  {
    id: 'reflecto',
    name: 'Reflecto',
    description: 'A basic wooden shield - it may not look like much, but it gets the job done',
    type: 'shield',
    stats: {
      defense: 2
    },
    emoji: '🛡️',
    quantity: 1,
    isDefault: true,
    image: '/images/items/shield/shield-reflecto.png',
  },
  {
    id: 'normalo',
    name: 'Normalo',
    description: 'Standard issue armor for new adventurers',
    type: 'armor',
    stats: {
      defense: 1
    },
    emoji: '🥋',
    quantity: 1,
    isDefault: true,
    image: '/images/items/armor/armor-normalo.png',
  },
]; 