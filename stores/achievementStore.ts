import { create } from 'zustand';

interface Achievement {
  id: string;
  name: string;
  description: string;
  category: 'might' | 'knowledge' | 'exploration' | 'social' | 'crafting' | 'collection';
  progress: number;
  target: number;
  completed: boolean;
  rewards: {
    gold: number;
    experience: number;
  };
}

interface AchievementStore {
  achievements: Achievement[];
  updateProgress: (achievementId: string, progress: number) => void;
  completeAchievement: (achievementId: string) => void;
  getAchievementsByCategory: (category: Achievement['category']) => Achievement[];
}

const defaultAchievements: Achievement[] = [
  // Might
  {
    id: 'defeat_100_monsters',
    name: 'Monster Hunter',
    description: 'Defeat 100 monsters in battle',
    category: 'might',
    progress: 0,
    target: 100,
    completed: false,
    rewards: { gold: 1000, experience: 500 },
  },
  {
    id: 'win_50_battles',
    name: 'Battle Master',
    description: 'Win 50 battles',
    category: 'might',
    progress: 0,
    target: 50,
    completed: false,
    rewards: { gold: 800, experience: 400 },
  },
  
  // Knowledge
  {
    id: 'learn_20_spells',
    name: 'Spell Scholar',
    description: 'Learn 20 different spells',
    category: 'knowledge',
    progress: 0,
    target: 20,
    completed: false,
    rewards: { gold: 600, experience: 300 },
  },
  {
    id: 'read_30_scrolls',
    name: 'Scroll Sage',
    description: 'Read 30 ancient scrolls',
    category: 'knowledge',
    progress: 0,
    target: 30,
    completed: false,
    rewards: { gold: 500, experience: 250 },
  },

  // Exploration
  {
    id: 'visit_all_regions',
    name: 'World Explorer',
    description: 'Visit all regions in the realm',
    category: 'exploration',
    progress: 0,
    target: 6,
    completed: false,
    rewards: { gold: 1200, experience: 600 },
  },
  {
    id: 'discover_secret_locations',
    name: 'Secret Seeker',
    description: 'Discover 10 secret locations',
    category: 'exploration',
    progress: 0,
    target: 10,
    completed: false,
    rewards: { gold: 800, experience: 400 },
  },

  // Social
  {
    id: 'complete_50_quests',
    name: 'Quest Champion',
    description: 'Complete 50 quests for the villagers',
    category: 'social',
    progress: 0,
    target: 50,
    completed: false,
    rewards: { gold: 1000, experience: 500 },
  },
  {
    id: 'max_reputation',
    name: 'Beloved Hero',
    description: 'Reach maximum reputation in any region',
    category: 'social',
    progress: 0,
    target: 100,
    completed: false,
    rewards: { gold: 1500, experience: 750 },
  },

  // Crafting
  {
    id: 'craft_legendary',
    name: 'Legendary Craftsman',
    description: 'Craft a legendary item',
    category: 'crafting',
    progress: 0,
    target: 1,
    completed: false,
    rewards: { gold: 2000, experience: 1000 },
  },
  {
    id: 'craft_100_items',
    name: 'Master Artisan',
    description: 'Craft 100 items',
    category: 'crafting',
    progress: 0,
    target: 100,
    completed: false,
    rewards: { gold: 800, experience: 400 },
  },

  // Collection
  {
    id: 'collect_all_creatures',
    name: 'Creature Master',
    description: 'Discover all creatures in the realm',
    category: 'collection',
    progress: 0,
    target: 3,
    completed: false,
    rewards: { gold: 1500, experience: 750 },
  },
  {
    id: 'collect_rare_items',
    name: 'Rare Collector',
    description: 'Collect 20 rare items',
    category: 'collection',
    progress: 0,
    target: 20,
    completed: false,
    rewards: { gold: 1000, experience: 500 },
  },
];

export const useAchievementStore = create<AchievementStore>((set, get) => ({
  achievements: defaultAchievements,
  updateProgress: (achievementId: string, progress: number) => {
    set((state) => ({
      achievements: state.achievements.map((achievement) =>
        achievement.id === achievementId
          ? { ...achievement, progress: Math.min(progress, achievement.target) }
          : achievement
      ),
    }));
  },
  completeAchievement: (achievementId: string) => {
    set((state) => ({
      achievements: state.achievements.map((achievement) =>
        achievement.id === achievementId
          ? { ...achievement, completed: true, progress: achievement.target }
          : achievement
      ),
    }));
  },
  getAchievementsByCategory: (category) => {
    return get().achievements.filter((achievement) => achievement.category === category);
  },
})); 