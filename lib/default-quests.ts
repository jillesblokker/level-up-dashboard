import { Quest } from '@/types/game';

export const defaultQuests: Quest[] = [
  {
    id: 'might-1',
    title: 'First Steps of Power',
    description: 'Complete 1 workout session.',
    category: 'might',
    difficulty: 'easy',
    rewards: { xp: 50, gold: 10 },
    completed: false,
    progress: 0,
    userId: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'knowledge-1',
    title: 'A Spark of Wisdom',
    description: 'Read one chapter of a book.',
    category: 'knowledge',
    difficulty: 'easy',
    rewards: { xp: 50, gold: 10 },
    completed: false,
    progress: 0,
    userId: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  // ... add more default quests for other categories
]; 