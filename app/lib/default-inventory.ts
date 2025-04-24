export interface InventoryItem {
  id: string;
  name: string;
  description: string;
  type: 'mount' | 'weapon' | 'shield';
  stats: {
    movement?: number;
    attack?: number;
    defense?: number;
  };
  emoji: string;
  quantity: number;
  isDefault?: boolean;
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
    isDefault: true
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
    isDefault: true
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
    isDefault: true
  }
]; 