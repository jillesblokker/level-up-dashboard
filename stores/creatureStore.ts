import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Creature {
  id: string;
  name: string;
  description: string;
  image: string;
  category: 'fire' | 'water' | 'forest' | 'mountain' | 'poisonous' | 'might' | 'knowledge' | 'exploration' | 'social' | 'crafting';
  discovered: boolean;
}

export interface CreatureStore {
  creatures: Creature[];
  discoverCreature: (id: string) => void;
  getCreaturesByCategory: (category: string) => Creature[];
  isCreatureDiscovered: (id: string) => boolean;
}

const initialCreatures: Creature[] = [
  // Poisonous Creatures (Realm exploring)
  {
    id: '000',
    name: 'Curious Crawler',
    description: 'A small, inquisitive creature that appears when first exploring the realm.',
    image: '/images/creatures/000.png',
    category: 'poisonous',
    discovered: false
  },
  
  // Fire Creatures (Forest burning)
  {
    id: '001',
    name: 'Ember Sprite',
    description: 'A tiny fire spirit that appears when burning your first forest.',
    image: '/images/creatures/001.png',
    category: 'fire',
    discovered: false
  },
  {
    id: '002',
    name: 'Flame Dancer',
    description: 'A graceful fire entity that emerges after burning 5 forests.',
    image: '/images/creatures/002.png',
    category: 'fire',
    discovered: false
  },
  {
    id: '003',
    name: 'Inferno Dragon',
    description: 'A powerful dragon that awakens after burning 10 forests.',
    image: '/images/creatures/003.png',
    category: 'fire',
    discovered: false
  },

  // Water Creatures (Water placement)
  {
    id: '004',
    name: 'Water Sprite',
    description: 'A playful water spirit that appears when placing your first water tile.',
    image: '/images/creatures/004.png',
    category: 'water',
    discovered: false
  },
  {
    id: '005',
    name: 'River Guardian',
    description: 'A protective water entity that emerges after placing 5 water tiles.',
    image: '/images/creatures/005.png',
    category: 'water',
    discovered: false
  },
  {
    id: '006',
    name: 'Sea Serpent',
    description: 'A mighty sea creature that appears after placing 10 water tiles.',
    image: '/images/creatures/006.png',
    category: 'water',
    discovered: false
  },

  // Forest Creatures (Forest placement)
  {
    id: '007',
    name: 'Forest Sprite',
    description: 'A gentle forest spirit that appears when placing your first forest tile.',
    image: '/images/creatures/007.png',
    category: 'forest',
    discovered: false
  },
  {
    id: '008',
    name: 'Ancient Treant',
    description: 'A wise tree guardian that emerges after placing 5 forest tiles.',
    image: '/images/creatures/008.png',
    category: 'forest',
    discovered: false
  },
  {
    id: '009',
    name: 'Forest Ancient',
    description: 'A powerful forest deity that awakens after placing 10 forest tiles.',
    image: '/images/creatures/009.png',
    category: 'forest',
    discovered: false
  },

  // Mountain Creatures (Mountain destruction)
  {
    id: '010',
    name: 'Stone Breaker',
    description: 'A small but strong creature that appears when destroying your first mountain.',
    image: '/images/creatures/010.png',
    category: 'mountain',
    discovered: false
  },
  {
    id: '011',
    name: 'Rock Crusher',
    description: 'A powerful mountain spirit that emerges after destroying 5 mountains.',
    image: '/images/creatures/011.png',
    category: 'mountain',
    discovered: false
  },
  {
    id: '012',
    name: 'Mountain Titan',
    description: 'A colossal being that awakens after destroying 10 mountains.',
    image: '/images/creatures/012.png',
    category: 'mountain',
    discovered: false
  },

  // Might Creatures (Combat and strength)
  {
    id: '020',
    name: 'Battle Sage',
    description: 'A wise warrior that appears when discovering ancient battle tactics.',
    image: '/images/creatures/020.png',
    category: 'might',
    discovered: false
  },

  // Knowledge Creatures (Learning and wisdom)
  {
    id: '021',
    name: 'Scroll Keeper',
    description: 'A mysterious being that guards ancient knowledge.',
    image: '/images/creatures/021.png',
    category: 'knowledge',
    discovered: false
  },

  // Exploration Creatures (Discovery)
  {
    id: '022',
    name: 'Path Finder',
    description: 'A curious explorer that helps discover hidden trails.',
    image: '/images/creatures/022.png',
    category: 'exploration',
    discovered: false
  },

  // Social Creatures (Trade and diplomacy)
  {
    id: '023',
    name: 'Trade Master',
    description: 'A charismatic being that understands the art of commerce.',
    image: '/images/creatures/023.png',
    category: 'social',
    discovered: false
  },

  // Crafting Creatures (Creation and building)
  {
    id: '024',
    name: 'Master Smith',
    description: 'An artisan spirit that embodies the essence of crafting.',
    image: '/images/creatures/024.png',
    category: 'crafting',
    discovered: false
  },

  // Artifact Creatures
  {
    id: '025',
    name: 'Relic Guardian',
    description: 'A mysterious being that appears when discovering ancient artifacts.',
    image: '/images/creatures/025.png',
    category: 'knowledge',
    discovered: false
  },

  // Book Creatures
  {
    id: '026',
    name: 'Tome Keeper',
    description: 'A scholarly spirit that manifests when finding ancient books.',
    image: '/images/creatures/026.png',
    category: 'knowledge',
    discovered: false
  }
];

export const useCreatureStore = create<CreatureStore>()(
  persist(
    (set, get) => ({
      creatures: initialCreatures,
      
      discoverCreature: (id: string) => {
        set((state) => {
          const creature = state.creatures.find(c => c.id === id);
          if (creature && !creature.discovered) {
            return {
              creatures: state.creatures.map(c => 
                c.id === id ? { ...c, discovered: true } : c
              )
            };
          }
          return state;
        });
      },

      getCreaturesByCategory: (category: string) => {
        return get().creatures.filter(creature => creature.category === category);
      },

      isCreatureDiscovered: (id: string) => {
        return get().creatures.some(creature => creature.id === id && creature.discovered);
      }
    }),
    {
      name: 'creature-storage',
    }
  )
); 