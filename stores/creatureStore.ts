import { create } from 'zustand';

interface Creature {
  id: string;
  name: string;
  description: string;
  stats: {
    strength: number;
    agility: number;
    intelligence: number;
  };
  discovered: boolean;
}

interface CreatureStore {
  creatures: Creature[];
  discoveredCreatures: string[];
  discoverCreature: (creatureId: string) => void;
  getCreature: (creatureId: string) => Creature | undefined;
  isCreatureDiscovered: (creatureId: string) => boolean;
}

// Create 9 placeholder creatures
const defaultCreatures: Creature[] = Array.from({ length: 9 }, (_, i) => ({
  id: String(i + 1).padStart(3, '0'), // Creates IDs like '001', '002', etc.
  name: 'Unknown Creature',
  description: 'This creature has not yet been discovered.',
  stats: {
    strength: 0,
    agility: 0,
    intelligence: 0,
  },
  discovered: false,
}));

// Update specific creatures with their actual data
defaultCreatures[0] = {
  id: '001',
  name: 'Flamio',
  description: 'A fiery creature with a passionate spirit.',
  stats: {
    strength: 75,
    agility: 60,
    intelligence: 45,
  },
  discovered: false,
};

defaultCreatures[1] = {
  id: '002',
  name: 'Embera',
  description: 'A mystical being born from ancient embers.',
  stats: {
    strength: 65,
    agility: 70,
    intelligence: 55,
  },
  discovered: false,
};

defaultCreatures[2] = {
  id: '003',
  name: 'Vulcana',
  description: 'Guardian of the volcanic depths.',
  stats: {
    strength: 85,
    agility: 50,
    intelligence: 60,
  },
  discovered: false,
};

export const useCreatureStore = create<CreatureStore>((set, get) => ({
  creatures: defaultCreatures,
  discoveredCreatures: [],
  discoverCreature: (creatureId: string) => {
    set((state) => ({
      discoveredCreatures: [...state.discoveredCreatures, creatureId],
      creatures: state.creatures.map((creature) =>
        creature.id === creatureId ? { ...creature, discovered: true } : creature
      ),
    }));
  },
  getCreature: (creatureId: string) => {
    return get().creatures.find((creature) => creature.id === creatureId);
  },
  isCreatureDiscovered: (creatureId: string) => {
    return get().discoveredCreatures.includes(creatureId);
  },
})); 