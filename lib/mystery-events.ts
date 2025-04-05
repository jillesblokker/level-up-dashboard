import { getRandomElement, getRandomInt } from '@/lib/utils'
import { toast } from "@/components/ui/use-toast";

export type MysteryEventType = 'treasure' | 'battle' | 'quest' | 'trade' | 'blessing' | 'curse' | 'riddle'

export interface ScrollItem {
  id: string;
  name: string;
  content: string;
  category: 'might' | 'knowledge' | 'exploration' | 'social' | 'crafting';
}

export type GoldReward = {
  type: 'gold';
  amount: number;
  message: string;
};

export type ExperienceReward = {
  type: 'experience';
  amount: number;
  message: string;
};

export type ScrollReward = {
  type: 'scroll';
  scrollId: string;
  message: string;
};

export type ArtifactReward = {
  type: 'artifact';
  artifactId: string;
  message: string;
};

export type BookReward = {
  type: 'book';
  bookId: string;
  message: string;
};

export type NothingReward = {
  type: 'nothing';
  message: string;
};

export type MysteryEventReward = 
  | GoldReward 
  | ExperienceReward 
  | ScrollReward 
  | ArtifactReward 
  | BookReward 
  | NothingReward;

export interface MysteryEvent {
  id: string
  type: MysteryEventType
  title: string
  description: string
  choices: string[]
  outcomes: {
    message: string
    rewards?: MysteryEventReward
  }[]
  enemyName?: string
  enemyLevel?: number
}

const treasureEvents: MysteryEvent[] = [
  {
    id: 'ancient-chest',
    type: 'treasure',
    title: 'Ancient Chest',
    description: 'You stumble upon an ancient chest covered in mysterious runes.',
    choices: [
      'Open the chest carefully',
      'Leave it alone'
    ],
    outcomes: [
      {
        message: 'You successfully open the chest and find valuable treasures!',
        rewards: {
          type: 'gold',
          amount: getRandomInt(30, 50),
          message: 'You found a pile of ancient gold coins!'
        }
      },
      {
        message: 'You decide to leave the chest untouched.',
        rewards: {
          type: 'nothing',
          message: 'Perhaps it was for the best...'
        }
      }
    ]
  },
  {
    id: 'mysterious-shrine',
    type: 'blessing',
    title: 'Mysterious Shrine',
    description: 'You discover an ancient shrine emanating a soft glow.',
    choices: [
      'Pray at the shrine',
      'Walk away'
    ],
    outcomes: [
      {
        message: 'As you pray, you feel enlightened by ancient wisdom!',
        rewards: {
          type: 'experience',
          amount: getRandomInt(30, 50),
          message: 'The ancient knowledge flows through you!'
        }
      },
      {
        message: 'You decide not to disturb the shrine.',
        rewards: {
          type: 'nothing',
          message: 'The shrine continues its silent vigil.'
        }
      }
    ]
  }
]

const battleEvents: MysteryEvent[] = [
  {
    id: 'monster-encounter',
    type: 'battle',
    title: 'Fearsome Monster',
    description: 'A dangerous creature emerges from the shadows!',
    choices: ['Fight!', 'Try to escape'],
    outcomes: [
      {
        message: 'You ready your weapons and prepare for battle!',
        rewards: {
          type: 'nothing',
          message: 'The battle begins!'
        }
      },
      {
        message: 'You manage to escape, but drop some gold in your haste.',
        rewards: {
          type: 'gold',
          amount: -10,
          message: 'You lost some gold while fleeing!'
        }
      }
    ],
    enemyName: 'Mysterious Beast',
    enemyLevel: getRandomInt(1, 5)
  }
]

const scrollEvents: MysteryEvent[] = [
  {
    id: 'ancient-library',
    type: 'treasure',
    title: 'Ancient Library',
    description: 'You find a hidden collection of ancient scrolls.',
    choices: [
      'Study the scrolls',
      'Leave them be'
    ],
    outcomes: [
      {
        message: 'You carefully examine the scrolls and find valuable knowledge!',
        rewards: {
          type: 'scroll',
          scrollId: 'scroll-' + getRandomInt(1, 5),
          message: 'You discovered an ancient scroll of wisdom! 📜'
        }
      },
      {
        message: 'You leave the scrolls untouched.',
        rewards: {
          type: 'nothing',
          message: 'The knowledge remains hidden.'
        }
      }
    ]
  }
]

const artifactEvents: MysteryEvent[] = [
  {
    id: 'mysterious-pedestal',
    type: 'treasure',
    title: 'Mysterious Pedestal',
    description: 'A strange artifact sits atop an ancient pedestal.',
    choices: [
      'Take the artifact',
      'Leave it alone'
    ],
    outcomes: [
      {
        message: 'You carefully retrieve the mysterious artifact!',
        rewards: {
          type: 'artifact',
          artifactId: 'artifact-' + getRandomInt(1, 5),
          message: 'You obtained a mysterious artifact! ✨'
        }
      },
      {
        message: 'You decide not to disturb the artifact.',
        rewards: {
          type: 'nothing',
          message: 'The artifact remains on its pedestal.'
        }
      }
    ]
  }
]

const riddleEvents: MysteryEvent[] = [
  {
    id: 'ancient-riddle-1',
    type: 'riddle',
    title: 'Ancient Riddle',
    description: 'A mysterious voice echoes: "I have cities, but no houses. I have mountains, but no trees. I have water, but no fish. I have roads, but no cars. What am I?"',
    choices: [
      'A Map',
      'A Globe',
      'A Painting',
      'A Book'
    ],
    outcomes: [
      {
        message: 'Correct! The answer is "A Map".',
        rewards: {
          type: 'gold',
          amount: getRandomInt(30, 50),
          message: 'Your wisdom has earned you gold!'
        }
      },
      {
        message: 'That is incorrect. The answer was "A Map".',
        rewards: {
          type: 'nothing',
          message: 'Better luck next time...'
        }
      },
      {
        message: 'That is incorrect. The answer was "A Map".',
        rewards: {
          type: 'nothing',
          message: 'Better luck next time...'
        }
      },
      {
        message: 'That is incorrect. The answer was "A Map".',
        rewards: {
          type: 'nothing',
          message: 'Better luck next time...'
        }
      }
    ]
  },
  {
    id: 'ancient-riddle-2',
    type: 'riddle',
    title: 'Ancient Riddle',
    description: 'The ancient stone whispers: "What has keys, but no locks; space, but no room; and you can enter, but not go in?"',
    choices: [
      'A Piano',
      'A Keyboard',
      'A Computer',
      'A Phone'
    ],
    outcomes: [
      {
        message: 'That is incorrect. The answer was "A Keyboard".',
        rewards: {
          type: 'nothing',
          message: 'Better luck next time...'
        }
      },
      {
        message: 'Correct! The answer is "A Keyboard".',
        rewards: {
          type: 'gold',
          amount: getRandomInt(30, 50),
          message: 'Your wisdom has earned you gold!'
        }
      },
      {
        message: 'That is incorrect. The answer was "A Keyboard".',
        rewards: {
          type: 'nothing',
          message: 'Better luck next time...'
        }
      },
      {
        message: 'That is incorrect. The answer was "A Keyboard".',
        rewards: {
          type: 'nothing',
          message: 'Better luck next time...'
        }
      }
    ]
  },
  {
    id: 'ancient-riddle-3',
    type: 'riddle',
    title: 'Ancient Riddle',
    description: 'A mystical inscription reads: "I am taken from a mine and shut up in a wooden case, from which I am never released, and yet I am used by everyone. What am I?"',
    choices: [
      'Gold',
      'Diamond',
      'A Pencil Lead',
      'Coal'
    ],
    outcomes: [
      {
        message: 'That is incorrect. The answer was "A Pencil Lead".',
        rewards: {
          type: 'nothing',
          message: 'Better luck next time...'
        }
      },
      {
        message: 'That is incorrect. The answer was "A Pencil Lead".',
        rewards: {
          type: 'nothing',
          message: 'Better luck next time...'
        }
      },
      {
        message: 'Correct! The answer is "A Pencil Lead".',
        rewards: {
          type: 'gold',
          amount: getRandomInt(30, 50),
          message: 'Your wisdom has earned you gold!'
        }
      },
      {
        message: 'That is incorrect. The answer was "A Pencil Lead".',
        rewards: {
          type: 'nothing',
          message: 'Better luck next time...'
        }
      }
    ]
  }
]

const allEvents = [
  ...treasureEvents,
  ...battleEvents,
  ...scrollEvents,
  ...artifactEvents,
  ...riddleEvents
]

export function generateMysteryEvent(): MysteryEvent {
  return getRandomElement(allEvents)
}

export function handleEventOutcome(outcome: { message: string; rewards?: MysteryEventReward }) {
  if (!outcome.rewards) return;

  const { type, message } = outcome.rewards;
  
  toast({
    title: "Event Outcome",
    description: message
  });

  switch (type) {
    case 'gold': {
      const goldAmount = (outcome.rewards as GoldReward).amount;
      const currentGold = parseInt(localStorage.getItem('goldBalance') || '0');
      const newGold = currentGold + goldAmount;
      localStorage.setItem('goldBalance', newGold.toString());
      window.dispatchEvent(new CustomEvent('gold-update', { detail: { gold: newGold } }));
      break;
    }
    case 'experience': {
      const expAmount = (outcome.rewards as ExperienceReward).amount;
      const characterStats = JSON.parse(localStorage.getItem('character-stats') || '{"experience": 0}');
      characterStats.experience += expAmount;
      localStorage.setItem('character-stats', JSON.stringify(characterStats));
      window.dispatchEvent(new Event('character-stats-update'));
      break;
    }
    case 'scroll': {
      const scrollId = (outcome.rewards as ScrollReward).scrollId;
      const scroll = getScrollById(scrollId);
      if (scroll) {
        const inventory = JSON.parse(localStorage.getItem('inventory') || '[]');
        inventory.push({
          id: scroll.id,
          name: scroll.name,
          type: 'scroll',
          content: scroll.content,
          category: scroll.category
        });
        localStorage.setItem('inventory', JSON.stringify(inventory));
        window.dispatchEvent(new CustomEvent('inventory-update'));
      }
      break;
    }
  }

  return outcome.rewards;
}

export const getScrollById = (id: string): ScrollItem | undefined => {
  return scrolls.find(scroll => scroll.id === id);
};

export const getAllScrolls = (): ScrollItem[] => {
  return [...scrolls];
};

const scrolls: ScrollItem[] = [
  {
    id: 'scroll-1',
    name: 'Battle Techniques',
    content: 'Ancient combat maneuvers and strategies.',
    category: 'might'
  },
  {
    id: 'scroll-2',
    name: 'Mystical Knowledge',
    content: 'Forgotten magical theories and practices.',
    category: 'knowledge'
  },
  {
    id: 'scroll-3',
    name: 'Explorer\'s Guide',
    content: 'Maps and notes from an ancient explorer.',
    category: 'exploration'
  },
  {
    id: 'scroll-4',
    name: 'Trade Secrets',
    content: 'Valuable trading techniques and routes.',
    category: 'social'
  },
  {
    id: 'scroll-5',
    name: 'Crafting Mastery',
    content: 'Advanced crafting methods and recipes.',
    category: 'crafting'
  }
]; 