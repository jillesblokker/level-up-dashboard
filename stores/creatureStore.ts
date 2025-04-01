import { create } from 'zustand';

interface Creature {
  id: string;
  name: string;
  description: string;
  stats: {
    hp: number;
    attack: number;
    defense: number;
    speed: number;
    type: string;
  };
  requirement: string;
  discovered: boolean;
}

interface CreatureStore {
  creatures: Creature[];
  discoveredCreatures: string[];
  discoverCreature: (creatureId: string) => void;
  getCreature: (creatureId: string) => Creature | undefined;
  isCreatureDiscovered: (creatureId: string) => boolean;
  handleMountainDelete: () => void;
}

// Create initial creatures array with card 000 and cards 001-012
const defaultCreatures: Creature[] = [
  {
    id: '000',
    name: 'Necrion',
    description: 'A mysterious poisonous creature that appears when first exploring the realm.',
    stats: {
      hp: 64,
      attack: 16,
      defense: 8,
      speed: 12,
      type: 'Poisonous'
    },
    requirement: 'Navigating to the realm map',
    discovered: true,
  },
  {
    id: '001',
    name: 'Flamio',
    description: 'A fiery creature awakened by the destruction of forests.',
    stats: {
      hp: 64,
      attack: 16,
      defense: 8,
      speed: 12,
      type: 'Fire'
    },
    requirement: 'Destroy 1 forest tile',
    discovered: false,
  },
  {
    id: '002',
    name: 'Embera',
    description: 'A more powerful fire entity born from continued forest destruction.',
    stats: {
      hp: 72,
      attack: 22,
      defense: 12,
      speed: 18,
      type: 'Fire'
    },
    requirement: 'Destroy 5 forest tiles',
    discovered: false,
  },
  {
    id: '003',
    name: 'Vulcana',
    description: 'The ultimate fire creature, master of forest destruction.',
    stats: {
      hp: 86,
      attack: 31,
      defense: 16,
      speed: 22,
      type: 'Fire'
    },
    requirement: 'Destroy 10 forest tiles',
    discovered: false,
  },
  {
    id: '004',
    name: 'Dolphio',
    description: 'A playful water creature that appears when expanding water territories.',
    stats: {
      hp: 62,
      attack: 15,
      defense: 10,
      speed: 14,
      type: 'Water'
    },
    requirement: 'Place 1 water tile',
    discovered: false,
  },
  {
    id: '005',
    name: 'Divero',
    description: 'A more experienced water dweller, guardian of expanding waters.',
    stats: {
      hp: 74,
      attack: 21,
      defense: 14,
      speed: 19,
      type: 'Water'
    },
    requirement: 'Place 5 water tiles',
    discovered: false,
  },
  {
    id: '006',
    name: 'Flippur',
    description: 'The supreme water creature, master of vast water territories.',
    stats: {
      hp: 88,
      attack: 28,
      defense: 18,
      speed: 24,
      type: 'Water'
    },
    requirement: 'Place 10 water tiles',
    discovered: false,
  },
  {
    id: '007',
    name: 'Leaf',
    description: 'A small grass creature that appears when planting new forests.',
    stats: {
      hp: 63,
      attack: 17,
      defense: 9,
      speed: 13,
      type: 'Grass'
    },
    requirement: 'Place 1 forest tile',
    discovered: false,
  },
  {
    id: '008',
    name: 'Oaky',
    description: 'A stronger forest guardian, protector of growing woodlands.',
    stats: {
      hp: 75,
      attack: 22,
      defense: 13,
      speed: 17,
      type: 'Grass'
    },
    requirement: 'Place 5 forest tiles',
    discovered: false,
  },
  {
    id: '009',
    name: 'Seqoio',
    description: 'The mighty forest spirit, overseer of vast woodlands.',
    stats: {
      hp: 89,
      attack: 29,
      defense: 19,
      speed: 21,
      type: 'Grass'
    },
    requirement: 'Place 10 forest tiles',
    discovered: false,
  },
  {
    id: '010',
    name: 'Rockie',
    description: 'A small rock creature that emerges from destroyed mountains.',
    stats: {
      hp: 65,
      attack: 16,
      defense: 11,
      speed: 11,
      type: 'Rock'
    },
    requirement: 'Destroy 1 mountain tile',
    discovered: false,
  },
  {
    id: '011',
    name: 'Buldour',
    description: 'A stronger mountain spirit, born from continued destruction.',
    stats: {
      hp: 77,
      attack: 24,
      defense: 15,
      speed: 16,
      type: 'Rock'
    },
    requirement: 'Destroy 5 mountain tiles',
    discovered: false,
  },
  {
    id: '012',
    name: 'Montano',
    description: 'The ultimate mountain creature, master of destroyed peaks.',
    stats: {
      hp: 91,
      attack: 30,
      defense: 20,
      speed: 20,
      type: 'Rock'
    },
    requirement: 'Destroy 10 mountain tiles',
    discovered: false,
  },
];

export const useCreatureStore = create<CreatureStore>((set, get) => ({
  discoveredCreatures: ['000'], // Necrion is discovered by default
  creatures: defaultCreatures,
  
  discoverCreature: (id: string) => {
    set((state) => ({
      discoveredCreatures: [...state.discoveredCreatures, id]
    }));
  },

  getCreature: (creatureId: string) => {
    return get().creatures.find((creature) => creature.id === creatureId);
  },

  isCreatureDiscovered: (id: string) => {
    return get().discoveredCreatures.includes(id);
  },

  handleMountainDelete: () => {
    const { discoverCreature, isCreatureDiscovered } = get();
    if (!isCreatureDiscovered('010')) {
      discoverCreature('010');
    }
  },
})); 