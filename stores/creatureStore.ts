import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { grantAchievementRewards } from '@/lib/achievement-rewards';
import { getCurrentUserId } from '@/lib/user-scoped-storage';

export interface Creature {
  id: string;
  number: string;
  name: string;
  description: string;
  image: string;
  category: string;
  discovered: boolean;
  stats: {
    hp: number;
    attack: number;
    defense: number;
    speed: number;
    type: string;
  };
  requirement: string;
}

interface CreatureStore {
  creatures: Creature[];
  discoveredCreatures: string[];
  discoverCreature: (creatureId: string) => void;
  getCreature: (creatureId: string) => Creature | undefined;
  isCreatureDiscovered: (creatureId: string) => boolean;
}

const initialCreatures: Creature[] = [
  {
    id: '000',
    number: '#000',
    name: 'Necrion',
    description: 'A mysterious poisonous creature that appears when first exploring the realm.',
    image: '/images/creatures/000.png',
    category: 'poisonous',
    discovered: true,
    stats: {
      hp: 64,
      attack: 16,
      defense: 8,
      speed: 12,
      type: 'Poisonous'
    },
    requirement: 'Navigating to the realm map'
  },
  {
    id: '001',
    number: '#001',
    name: 'Flamio',
    description: 'A fiery creature awakened by the destruction of forests.',
    image: '/images/creatures/001.png',
    category: 'fire',
    discovered: false,
    stats: {
      hp: 64,
      attack: 16,
      defense: 8,
      speed: 12,
      type: 'Fire'
    },
    requirement: 'Destroy 1 forest tile'
  },
  {
    id: '002',
    number: '#002',
    name: 'Embera',
    description: 'A more powerful fire entity born from continued forest destruction.',
    image: '/images/creatures/002.png',
    category: 'fire',
    discovered: false,
    stats: {
      hp: 72,
      attack: 22,
      defense: 12,
      speed: 18,
      type: 'Fire'
    },
    requirement: 'Destroy 5 forest tiles'
  },
  {
    id: '003',
    number: '#003',
    name: 'Vulcana',
    description: 'The ultimate fire creature, master of forest destruction.',
    image: '/images/creatures/003.png',
    category: 'fire',
    discovered: false,
    stats: {
      hp: 86,
      attack: 31,
      defense: 16,
      speed: 22,
      type: 'Fire'
    },
    requirement: 'Destroy 10 forest tiles'
  },
  {
    id: '004',
    number: '#004',
    name: 'Dolphio',
    description: 'A playful water creature that appears when expanding water territories.',
    image: '/images/creatures/004.png',
    category: 'water',
    discovered: false,
    stats: {
      hp: 62,
      attack: 15,
      defense: 10,
      speed: 14,
      type: 'Water'
    },
    requirement: 'Place 1 water tile'
  },
  {
    id: '005',
    number: '#005',
    name: 'Divero',
    description: 'A more experienced water dweller, guardian of expanding waters.',
    image: '/images/creatures/005.png',
    category: 'water',
    discovered: false,
    stats: {
      hp: 74,
      attack: 21,
      defense: 14,
      speed: 19,
      type: 'Water'
    },
    requirement: 'Place 5 water tiles'
  },
  {
    id: '006',
    number: '#006',
    name: 'Flippur',
    description: 'The supreme water creature, master of vast water territories.',
    image: '/images/creatures/006.png',
    category: 'water',
    discovered: false,
    stats: {
      hp: 88,
      attack: 28,
      defense: 18,
      speed: 24,
      type: 'Water'
    },
    requirement: 'Place 10 water tiles'
  },
  {
    id: '007',
    number: '#007',
    name: 'Leaf',
    description: 'A small grass creature that appears when planting new forests.',
    image: '/images/creatures/007.png',
    category: 'grass',
    discovered: false,
    stats: {
      hp: 63,
      attack: 17,
      defense: 9,
      speed: 13,
      type: 'Grass'
    },
    requirement: 'Place 1 forest tile'
  },
  {
    id: '008',
    number: '#008',
    name: 'Oaky',
    description: 'A stronger forest guardian, protector of growing woodlands.',
    image: '/images/creatures/008.png',
    category: 'grass',
    discovered: false,
    stats: {
      hp: 75,
      attack: 22,
      defense: 13,
      speed: 17,
      type: 'Grass'
    },
    requirement: 'Place 5 forest tiles'
  },
  {
    id: '009',
    number: '#009',
    name: 'Seqoio',
    description: 'The mighty forest spirit, overseer of vast woodlands.',
    image: '/images/creatures/009.png',
    category: 'grass',
    discovered: false,
    stats: {
      hp: 89,
      attack: 29,
      defense: 19,
      speed: 21,
      type: 'Grass'
    },
    requirement: 'Place 10 forest tiles'
  },
  {
    id: '010',
    number: '#010',
    name: 'Rockie',
    description: 'A small rock creature that emerges from destroyed mountains.',
    image: '/images/creatures/010.png',
    category: 'rock',
    discovered: false,
    stats: {
      hp: 65,
      attack: 16,
      defense: 11,
      speed: 11,
      type: 'Rock'
    },
    requirement: 'Destroy 1 mountain tile'
  },
  {
    id: '011',
    number: '#011',
    name: 'Buldour',
    description: 'A stronger mountain spirit, born from continued destruction.',
    image: '/images/creatures/011.png',
    category: 'rock',
    discovered: false,
    stats: {
      hp: 77,
      attack: 24,
      defense: 15,
      speed: 16,
      type: 'Rock'
    },
    requirement: 'Destroy 5 mountain tiles'
  },
  {
    id: '012',
    number: '#012',
    name: 'Montano',
    description: 'The ultimate mountain creature, master of destroyed peaks.',
    image: '/images/creatures/012.png',
    category: 'rock',
    discovered: false,
    stats: {
      hp: 91,
      attack: 30,
      defense: 20,
      speed: 20,
      type: 'Rock'
    },
    requirement: 'Destroy 10 mountain tiles'
  },
  {
    id: '013',
    number: '#013',
    name: 'Icey',
    description: 'A small ice creature that appears in frozen territories.',
    image: '/images/creatures/013.png',
    category: 'ice',
    discovered: false,
    stats: {
      hp: 60,
      attack: 15,
      defense: 9,
      speed: 13,
      type: 'Ice'
    },
    requirement: 'Place 1 ice tile'
  },
  {
    id: '014',
    number: '#014',
    name: 'Blizzey',
    description: 'A powerful ice spirit, master of frozen landscapes.',
    image: '/images/creatures/014.png',
    category: 'ice',
    discovered: false,
    stats: {
      hp: 74,
      attack: 22,
      defense: 14,
      speed: 18,
      type: 'Ice'
    },
    requirement: 'Place 5 ice tiles'
  },
  {
    id: '015',
    number: '#015',
    name: 'Hailey',
    description: 'The supreme ice creature, ruler of vast frozen realms.',
    image: '/images/creatures/015.png',
    category: 'ice',
    discovered: false,
    stats: {
      hp: 88,
      attack: 30,
      defense: 19,
      speed: 21,
      type: 'Ice'
    },
    requirement: 'Place 10 ice tiles'
  },
  {
    id: '016',
    number: '#016',
    name: 'Sparky',
    description: 'An electric creature that appears near city power sources.',
    image: '/images/creatures/016.png',
    category: 'electric',
    discovered: false,
    stats: {
      hp: 66,
      attack: 17,
      defense: 10,
      speed: 14,
      type: 'Electric'
    },
    requirement: 'Visit 1 city'
  },
  {
    id: '017',
    number: '#017',
    name: 'Boulty',
    description: 'A stronger electric being, drawn to urban development.',
    image: '/images/creatures/017.png',
    category: 'electric',
    discovered: false,
    stats: {
      hp: 78,
      attack: 25,
      defense: 14,
      speed: 20,
      type: 'Electric'
    },
    requirement: 'Visit 5 cities'
  },
  {
    id: '018',
    number: '#018',
    name: 'Voulty',
    description: 'The ultimate electric creature, master of city networks.',
    image: '/images/creatures/018.png',
    category: 'electric',
    discovered: false,
    stats: {
      hp: 92,
      attack: 33,
      defense: 18,
      speed: 25,
      type: 'Electric'
    },
    requirement: 'Visit 10 cities'
  },
  {
    id: '101',
    number: '#101',
    name: 'Drakon',
    description: 'A legendary dragon awakened by great achievements.',
    image: '/images/creatures/101.png',
    category: 'dragon',
    discovered: false,
    stats: {
      hp: 94,
      attack: 36,
      defense: 21,
      speed: 19,
      type: 'Dragon'
    },
    requirement: 'Complete 100 quests'
  },
  {
    id: '102',
    number: '#102',
    name: 'Fireon',
    description: 'A mighty dragon drawn to exceptional accomplishments.',
    image: '/images/creatures/102.png',
    category: 'dragon',
    discovered: false,
    stats: {
      hp: 98,
      attack: 41,
      defense: 24,
      speed: 23,
      type: 'Dragon'
    },
    requirement: 'Complete 500 quests'
  },
  {
    id: '103',
    number: '#103',
    name: 'Valerion',
    description: 'The supreme dragon lord, master of all realms.',
    image: '/images/creatures/103.png',
    category: 'dragon',
    discovered: false,
    stats: {
      hp: 98,
      attack: 44,
      defense: 28,
      speed: 25,
      type: 'Dragon'
    },
    requirement: 'Complete 1000 quests'
  },
  {
    id: '104',
    number: '#104',
    name: 'Shello',
    description: 'A cheerful turtle that appears when you complete your first milestone.',
    image: '/images/creatures/104.png',
    category: 'milestone',
    discovered: false,
    stats: { hp: 70, attack: 12, defense: 20, speed: 8, type: 'Water' },
    requirement: 'Complete your first milestone'
  },
  {
    id: '105',
    number: '#105',
    name: 'Turtoisy',
    description: 'A wise turtle that appears after completing 5 milestones.',
    image: '/images/creatures/105.png',
    category: 'milestone',
    discovered: false,
    stats: { hp: 90, attack: 15, defense: 28, speed: 7, type: 'Water' },
    requirement: 'Complete 5 milestones'
  },
  {
    id: '106',
    number: '#106',
    name: 'Turtlo',
    description: 'A legendary turtle that appears after completing 10 milestones.',
    image: '/images/creatures/106.png',
    category: 'milestone',
    discovered: false,
    stats: { hp: 120, attack: 20, defense: 40, speed: 6, type: 'Water' },
    requirement: 'Complete 10 milestones'
  },
  {
    id: '107',
    number: '#107',
    name: 'First Alliance',
    description: 'A friendly companion that appears when you add your first ally to your fellowship.',
    image: '/images/achievements/107.png',
    category: 'social',
    discovered: false,
    stats: { hp: 50, attack: 10, defense: 10, speed: 15, type: 'Social' },
    requirement: 'Add your first friend'
  },
  {
    id: '108',
    number: '#108',
    name: 'Guild Founder',
    description: 'A loyal companion that appears when you gather 5 allies to your cause.',
    image: '/images/achievements/108.png',
    category: 'social',
    discovered: false,
    stats: { hp: 75, attack: 15, defense: 15, speed: 18, type: 'Social' },
    requirement: 'Add 5 friends'
  },
  {
    id: '109',
    number: '#109',
    name: 'Fellowship Leader',
    description: 'A noble companion that appears when you unite 10 allies under your banner.',
    image: '/images/achievements/109.png',
    category: 'social',
    discovered: false,
    stats: { hp: 100, attack: 20, defense: 20, speed: 20, type: 'Social' },
    requirement: 'Add 10 friends'
  },
  {
    id: '110',
    number: '#110',
    name: 'Quest Giver',
    description: 'A helpful companion that appears when you send your first quest to an ally.',
    image: '/images/achievements/110.png',
    category: 'social',
    discovered: false,
    stats: { hp: 60, attack: 12, defense: 12, speed: 16, type: 'Social' },
    requirement: 'Send your first quest to a friend'
  },
  {
    id: '111',
    number: '#111',
    name: 'Master Strategist',
    description: 'A wise companion that appears when you send 10 quests to challenge your allies.',
    image: '/images/achievements/111.png',
    category: 'social',
    discovered: false,
    stats: { hp: 90, attack: 18, defense: 18, speed: 22, type: 'Social' },
    requirement: 'Send 10 quests to friends'
  }
];

export const useCreatureStore = create<CreatureStore>()(
  persist(
    (set, get) => ({
      creatures: initialCreatures,
      discoveredCreatures: [],
      discoverCreature: (creatureId: string) => {
        const creature = get().getCreature(creatureId);
        if (creature && !get().isCreatureDiscovered(creatureId)) {
          set((state) => ({
            discoveredCreatures: [...state.discoveredCreatures, creatureId],
            creatures: state.creatures.map((c) =>
              c.id === creatureId ? { ...c, discovered: true } : c
            ),
          }));

          // Grant achievement rewards
          grantAchievementRewards(creatureId, creature.name);
        }
      },
      getCreature: (creatureId: string) => {
        return get().creatures.find((creature) => creature.id === creatureId);
      },
      isCreatureDiscovered: (creatureId: string) => {
        return get().discoveredCreatures.includes(creatureId);
      },
    }),
    {
      name: (() => {
        const userId = getCurrentUserId();
        return userId ? `user_${userId}_creature-store` : 'creature-store';
      })(),
    }
  )
); 