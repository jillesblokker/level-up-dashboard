export interface Title {
  id: string;
  name: string;
  level: number;
  description: string;
}

export const TITLES: Title[] = [
  {
    id: 'squire',
    name: 'Squire',
    level: 0,
    description: 'A young noble in training, beginning their journey.'
  },
  {
    id: 'knight',
    name: 'Knight',
    level: 10,
    description: 'A noble warrior, sworn to protect the realm.'
  },
  {
    id: 'baron',
    name: 'Baron',
    level: 20,
    description: 'A minor noble, ruling over a small territory.'
  },
  {
    id: 'viscount',
    name: 'Viscount',
    level: 30,
    description: 'A respected noble, governing a significant region.'
  },
  {
    id: 'count',
    name: 'Count',
    level: 40,
    description: 'A powerful noble, ruling over a large county.'
  },
  {
    id: 'marquis',
    name: 'Marquis',
    level: 50,
    description: 'A high-ranking noble, governing a march or border region.'
  },
  {
    id: 'duke',
    name: 'Duke',
    level: 60,
    description: 'A senior noble, ruling over a duchy.'
  },
  {
    id: 'prince',
    name: 'Prince',
    level: 70,
    description: 'A royal noble, heir to the throne.'
  },
  {
    id: 'king',
    name: 'King',
    level: 80,
    description: 'The supreme ruler of the realm.'
  },
  {
    id: 'emperor',
    name: 'Emperor',
    level: 90,
    description: 'The divine ruler of multiple realms, transcending mortal kings.'
  },
  {
    id: 'god',
    name: 'God',
    level: 100,
    description: 'A transcendent being of infinite power, beyond mortal comprehension.'
  }
];

export function getCurrentTitle(level: number): Title {
  // Find the highest title the player has earned
  let currentTitle: Title = TITLES[0]; // Default to Squire
  
  for (const title of TITLES) {
    if (level >= title.level) {
      currentTitle = title;
    } else {
      break; // Stop when we find a title the player hasn't reached yet
    }
  }
  
  return currentTitle;
}

export function getNextTitle(level: number): Title | null {
  for (const title of TITLES) {
    if (title.level > level) {
      return title;
    }
  }
  return null;
}

export function getTitleProgress(level: number): { current: Title; next: Title | null; progress: number } {
  const current = getCurrentTitle(level);
  const next: Title | null = getNextTitle(level);
  
  let progress = 0;
  if (next) {
    const levelRange = next.level - current.level;
    const playerProgress = level - current.level;
    progress = (playerProgress / levelRange) * 100;
  } else {
    progress = 100; // Max level reached
  }
  
  return { current, next, progress };
} 