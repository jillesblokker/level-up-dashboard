import { getRandomElement, getRandomInt } from '@/lib/utils'
import { toast } from "@/components/ui/use-toast";
import { addToInventory, InventoryItem } from "@/lib/inventory-manager"
import { createEventNotification } from "@/lib/notifications"
import { gainGold } from "@/lib/gold-manager"
import { gainExperience } from "@/lib/experience-manager"

export type MysteryEventType = 'treasure' | 'quest' | 'trade' | 'blessing' | 'curse' | 'riddle'

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

export interface MysteryEventReward {
  type: 'gold' | 'experience' | 'scroll' | 'artifact' | 'book' | 'nothing' | 'item';
  amount?: number;
  message?: string;
  scroll?: {
    id: string;
    name: string;
    content: string;
    category: string;
  };
  item?: InventoryItem[];
}

export interface MysteryEventOutcome {
  message: string;
  reward?: MysteryEventReward;
}

export interface MysteryEvent {
  id: string;
  type: MysteryEventType;
  title: string;
  description: string;
  choices: string[];
  outcomes: Record<string, MysteryEventOutcome>;
  enemyName?: string;
  enemyLevel?: number;
  requiredItems?: string[];
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
    outcomes: {
      'Open the chest carefully': {
        message: 'You successfully open the chest and find valuable treasures!',
        reward: (() => {
          const roll = getRandomInt(1, 3);
          if (roll === 1) {
            return { type: 'gold', amount: getRandomInt(30, 50), message: 'You found a pile of ancient gold coins!' };
          } else if (roll === 2) {
            return { type: 'experience', amount: getRandomInt(20, 40), message: 'You gained wisdom from deciphering the runes!' };
          } else {
            return { type: 'item', item: [{ id: 'ancient-artifact', name: 'Ancient Artifact', description: 'A mysterious artifact from the chest.', quantity: 1, type: 'artifact', category: 'artifact' }], message: 'You found an ancient artifact!' };
          }
        })()
      },
      'Leave it alone': {
        message: 'You decide to leave the chest untouched.',
        reward: {
          type: 'nothing',
          message: 'Perhaps it was for the best...'
        }
      }
    }
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
    outcomes: {
      'Pray at the shrine': {
        message: 'As you pray, you feel enlightened by ancient wisdom!',
        reward: {
          type: 'experience',
          amount: getRandomInt(30, 50),
          message: 'The ancient knowledge flows through you!'
        }
      },
      'Walk away': {
        message: 'You decide not to disturb the shrine.',
        reward: {
          type: 'nothing',
          message: 'The shrine continues its silent vigil.'
        }
      }
    }
  },
  {
    id: 'ancient-ruins',
    type: 'treasure',
    title: 'Ancient Ruins',
    description: 'You stumble upon ancient ruins...',
    choices: ['Explore the ruins', 'Leave'],
    outcomes: {
      'Explore the ruins': {
        message: 'You find an ancient artifact!',
        reward: {
          type: 'item',
          item: [{
            id: 'ancient-artifact',
            name: 'Ancient Artifact',
            description: 'A mysterious artifact from the ruins.',
            quantity: 1,
            type: 'artifact',
            category: 'artifact'
          }]
        }
      },
      'Leave': {
        message: 'You decide to leave the ruins untouched.',
        reward: {
          type: 'nothing',
          message: 'Sometimes discretion is the better part of valor.'
        }
      }
    }
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
    outcomes: {
      'Study the scrolls': {
        message: 'You carefully examine the scrolls and find valuable knowledge!',
        reward: {
          type: 'scroll',
          message: 'You discovered an ancient scroll of wisdom! 📜',
          scroll: {
            id: 'scroll-' + getRandomInt(1, 5),
            name: 'Ancient Scroll',
            content: 'This scroll contains ancient wisdom...',
            category: 'knowledge'
          }
        }
      },
      'Leave them be': {
        message: 'You leave the scrolls untouched.',
        reward: {
          type: 'nothing',
          message: 'The knowledge remains hidden.'
        }
      }
    }
  }
]

const artifactEvents: MysteryEvent[] = [
  {
    id: 'mysterious-pedestal',
    type: 'treasure',
    title: 'Mysterious Pedestal',
    description: 'You find a mysterious artifact on a pedestal...',
    choices: [
      'Take the artifact',
      'Leave it alone'
    ],
    outcomes: {
      'Take the artifact': {
        message: 'You carefully retrieve the mysterious artifact!',
        reward: {
          type: 'item',
          item: [{
            id: `artifact-${getRandomInt(1, 5)}`,
            name: 'Mysterious Artifact',
            description: 'An ancient artifact of unknown origin.',
            quantity: 1,
            type: 'artifact',
            category: 'artifact'
          }]
        }
      },
      'Leave it alone': {
        message: 'You decide not to disturb the artifact.',
        reward: {
          type: 'nothing',
          message: 'The artifact remains on its pedestal.'
        }
      }
    }
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
    outcomes: {
      'A Map': {
        message: 'Correct! The answer is "A Map". You are rewarded for your wisdom!',
        reward: {
          type: 'gold',
          amount: getRandomInt(30, 50),
          message: 'You gained gold and experience!'
        }
      },
      'A Globe': {
        message: 'Incorrect. The answer was "A Map". You lose some gold for your mistake.',
        reward: {
          type: 'gold',
          amount: -10,
          message: 'You lost 10 gold.'
        }
      },
      'A Painting': {
        message: 'Incorrect. The answer was "A Map". You lose some gold for your mistake.',
        reward: {
          type: 'gold',
          amount: -10,
          message: 'You lost 10 gold.'
        }
      },
      'A Book': {
        message: 'Incorrect. The answer was "A Map". You lose some gold for your mistake.',
        reward: {
          type: 'gold',
          amount: -10,
          message: 'You lost 10 gold.'
        }
      }
    }
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
    outcomes: {
      'A Piano': {
        message: 'That is incorrect. The answer was "A Keyboard".',
        reward: {
          type: 'nothing',
          message: 'Better luck next time...'
        }
      },
      'A Keyboard': {
        message: 'Correct! The answer is "A Keyboard".',
        reward: {
          type: 'gold',
          amount: getRandomInt(30, 50),
          message: 'Your wisdom has earned you gold!'
        }
      },
      'A Computer': {
        message: 'That is incorrect. The answer was "A Keyboard".',
        reward: {
          type: 'nothing',
          message: 'Better luck next time...'
        }
      },
      'A Phone': {
        message: 'That is incorrect. The answer was "A Keyboard".',
        reward: {
          type: 'nothing',
          message: 'Better luck next time...'
        }
      }
    }
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
    outcomes: {
      'Gold': {
        message: 'That is incorrect. The answer was "A Pencil Lead".',
        reward: {
          type: 'nothing',
          message: 'Better luck next time...'
        }
      },
      'Diamond': {
        message: 'That is incorrect. The answer was "A Pencil Lead".',
        reward: {
          type: 'nothing',
          message: 'Better luck next time...'
        }
      },
      'A Pencil Lead': {
        message: 'Correct! The answer is "A Pencil Lead".',
        reward: {
          type: 'gold',
          amount: getRandomInt(30, 50),
          message: 'Your wisdom has earned you gold!'
        }
      },
      'Coal': {
        message: 'That is incorrect. The answer was "A Pencil Lead".',
        reward: {
          type: 'nothing',
          message: 'Better luck next time...'
        }
      }
    }
  }
]

export function generateMysteryEvent(): MysteryEvent {
  const possibleEvents: MysteryEvent[] = [
    ...treasureEvents,
    ...scrollEvents,
    ...artifactEvents,
    ...riddleEvents
  ];
  const event = getRandomElement(possibleEvents);
  return (event ? event : possibleEvents[0]) as MysteryEvent;
}

export const handleEventOutcome = (event: MysteryEvent, choice: string) => {
  const outcome = event.outcomes[choice];
  if (!outcome) {
    toast({
      title: "Incorrect",
      description: "That wasn't the right answer. Try again!",
      variant: "destructive",
      duration: 3000
    });
    return;
  }

  const reward = outcome.reward;
  if (!reward) return;

  // Show outcome message if present
  if (outcome.message) {
    toast({
      title: "Outcome",
      description: outcome.message,
      duration: 3000
    });
  }

  let experienceGained = 0;
  let goldGained = 0;

  if (reward.type === 'gold' && reward.amount) {
    goldGained = reward.amount;
    // Use the proper gainGold function
    gainGold(reward.amount, 'mystery-events');
    createEventNotification('Treasure Found!', `You opened a treasure chest and gained ${reward.amount} gold!`);
  }
  
  if (reward.type === 'item' && reward.item && reward.item.length > 0) {
    // Always give experience for finding items
    experienceGained = 25;
    gainExperience(experienceGained, 'mystery-events', 'general');
    
    reward.item.forEach(item => addToInventory(item));
    const firstItem = reward.item[0];
    if (firstItem) {
      toast({
        title: "Item Found!",
        description: `You found ${firstItem.name} and gained ${experienceGained} XP!`,
        duration: 3000
      });

      createEventNotification('Artifact Found', `You found a mysterious artifact and gained ${experienceGained} XP!`);
    }
  }
  
  if (reward.type === 'scroll' && reward.scroll) {
    // Always give experience for finding scrolls
    experienceGained = 25;
    gainExperience(experienceGained, 'mystery-events', 'general');
    
    addToInventory({
      type: 'scroll',
      name: reward.scroll.name,
      description: reward.scroll.content,
      id: reward.scroll.id,
      quantity: 1,
      category: reward.scroll.category
    });
    
    toast({
      title: "Scroll Discovered!",
      description: `You found ${reward.scroll.name} and gained ${experienceGained} XP!`,
      duration: 3000
    });

    createEventNotification('Scroll Discovered!', `You found ${reward.scroll.name} and gained ${experienceGained} XP!`);
  }

  if (reward.type === 'experience' && reward.amount) {
    experienceGained = reward.amount;
    // Use the proper gainExperience function
    gainExperience(reward.amount, 'mystery-events', 'general');
    createEventNotification('Ancient Shrine', `You prayed at the shrine and gained ${reward.amount} XP!`);
  }

  // Show combined reward message if multiple rewards
  if (goldGained > 0 && experienceGained > 0) {
    toast({
      title: "Rewards Gained!",
      description: `+${goldGained} Gold\n+${experienceGained} XP`,
      duration: 4000
    });
  }
};

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

// Helper function to check required items
export const hasRequiredItems = (event: MysteryEvent, inventory: { id: string }[]): boolean => {
  if (!event.requiredItems) return true;
  return event.requiredItems.every(itemId => inventory.some(item => item.id === itemId));
}; 