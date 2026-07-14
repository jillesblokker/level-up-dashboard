import { getRandomElement, getRandomInt, shuffleArray } from '@/lib/utils'
import { toast } from "@/components/ui/use-toast";
import { addToInventory } from "@/lib/inventory-manager"
import { createEventNotification } from "@/lib/notifications"
import { gainGold } from "@/lib/gold-manager"
import { gainExperience } from "@/lib/experience-manager"
import { MysteryEvent, MysteryEventType, MysteryEventOutcome, MysteryEventReward, InventoryItem } from '@/types/core-interfaces'

import { RIDDLE_DATA } from "@/lib/riddle-data"

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
            return { type: 'item', item: [{ id: 'ancient-artifact', name: 'Ancient Artifact', description: 'A mysterious artifact from the chest.', quantity: 1, type: 'artifact', category: 'artifact', emoji: '🏺', stats: {}, image: '/images/items/artifact/ancient-artifact.webp' }], message: 'You found an ancient artifact!' };
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
            category: 'artifact',
            emoji: '🏺',
            stats: {},
            image: '/images/items/artifact/ancient-artifact.webp'
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
            category: 'artifact',
            emoji: '🔮',
            stats: {},
            image: '/images/items/artifact/mysterious-artifact.webp'
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

const riddleEvents: MysteryEvent[] = RIDDLE_DATA.map(riddle => ({
  id: riddle.id,
  type: 'riddle',
  title: 'Ancient Riddle',
  description: `A mysterious voice echoes: "${riddle.question}"`,
  choices: shuffleArray(riddle.options),
  outcomes: riddle.options.reduce((acc, option) => {
    const isCorrect = option === riddle.correctAnswer;
    acc[option] = {
      message: isCorrect
        ? `Correct! The answer is "${riddle.correctAnswer}". You are rewarded for your wisdom!`
        : `Incorrect. The answer was "${riddle.correctAnswer}".`,
      reward: isCorrect ? {
        type: 'gold',
        amount: getRandomInt(30, 50),
        message: 'You gained gold and experience!'
      } : {
        type: 'nothing',
        message: 'Better luck next time...'
      }
    };
    return acc;
  }, {} as Record<string, MysteryEventOutcome>)
}));

export function generateMysteryEvent(): MysteryEvent {
  // Only allow treasure or riddle events for mystery tiles
  const eventType = Math.random() < 0.5 ? 'treasure' : 'riddle';
  let possibleEvents: MysteryEvent[] = [];
  if (eventType === 'treasure') {
    possibleEvents = treasureEvents;
  } else {
    possibleEvents = riddleEvents;
  }
  const event = getRandomElement(possibleEvents);
  return (event ? event : possibleEvents[0]) as MysteryEvent;
}

async function triggerRecipeDiscovery(userId: string) {
  try {
    const prefRes = await fetch("/api/user-preferences");
    if (!prefRes.ok) return;
    const prefData = await prefRes.json();
    if (!prefData || !prefData.success) return;
    
    const prefUnlocked = prefData.preferences?.unlocked_recipes;
    const currentUnlocked: string[] = Array.isArray(prefUnlocked) 
      ? prefUnlocked 
      : ["potion-focus", "potion-dread"];
      
    const allRecipes = ["potion-aegis", "potion-midas", "potion-sage", "potion-ironheart", "potion-mercury"];
    const undiscovered = allRecipes.filter(id => !currentUnlocked.includes(id));
    if (undiscovered.length === 0) return;
    
    const newRecipeId = undiscovered[Math.floor(Math.random() * undiscovered.length)]!;
    const nextUnlocked = [...currentUnlocked, newRecipeId];
    
    await fetch("/api/user-preferences", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: "unlocked_recipes", value: nextUnlocked })
    });
    
    const recipeNames: Record<string, { name: string; emoji: string }> = {
      "potion-aegis": { name: "Aegis Draught", emoji: "🛡️" },
      "potion-midas": { name: "Midas Draught", emoji: "🍯" },
      "potion-sage": { name: "Sage Brew", emoji: "🍵" },
      "potion-ironheart": { name: "Ironheart Tonic", emoji: "🧪" },
      "potion-mercury": { name: "Mercury Elixir", emoji: "🔮" }
    };
    
    const recipeInfo = recipeNames[newRecipeId] || { name: "Unknown Elixir", emoji: "🧪" };
    
    toast({
      title: "📖 Recipe Discovered!",
      description: `You discovered the formula for the ${recipeInfo.emoji} ${recipeInfo.name}! Check your Alchemist Cauldron ledger.`,
      duration: 5000
    });
    
    createEventNotification(
      "📖 Recipe Discovered!", 
      `While exploring, you discovered the formula for the ${recipeInfo.emoji} ${recipeInfo.name}! It is now available in your Alchemist Cauldron.`
    );
  } catch (err) {
    console.error("Error triggering recipe discovery:", err);
  }
}

export const handleEventOutcome = (event: MysteryEvent, choice: string, userId?: string) => {
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

  // 10% chance to discover a new recipe on successful outcome
  if (reward.type !== 'nothing' && userId) {
    if (Math.random() < 0.1) {
      triggerRecipeDiscovery(userId);
    }
  }

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
    createEventNotification('🔮 Treasure Discovered!', `You found a hidden treasure chest containing ${reward.amount} gold!`);
  }

  if (reward.type === 'item' && reward.item && reward.item.length > 0) {
    // Always give experience for finding items
    experienceGained = 25;
    gainExperience(experienceGained, 'mystery-events', 'general');

    if (userId) {
      reward.item.forEach(item => addToInventory(userId, item));
    }
    const firstItem = reward.item[0];
    if (firstItem) {
      toast({
        title: "Item Found!",
        description: `You found ${firstItem.name} and gained ${experienceGained} XP!`,
        duration: 3000
      });

      createEventNotification('🔮 Mystical Discovery!', `You found a mysterious artifact and gained ${experienceGained} experience through ancient knowledge!`);
    }
  }

  if (reward.type === 'scroll' && reward.scroll) {
    // Always give experience for finding scrolls
    experienceGained = 25;
    gainExperience(experienceGained, 'mystery-events', 'general');

    if (userId) {
      addToInventory(userId, {
        type: 'scroll',
        name: reward.scroll.name,
        description: reward.scroll.content,
        id: reward.scroll.id,
        quantity: 1,
        category: reward.scroll.category,
        emoji: '📜',
        stats: {},
        image: `/images/items/scroll/${reward.scroll.id}.webp`
      });
    }

    toast({
      title: "Scroll Discovered!",
      description: `You found ${reward.scroll.name} and gained ${experienceGained} XP!`,
      duration: 3000
    });

    createEventNotification('📜 Scroll Discovered!', `You found the ancient scroll "${reward.scroll.name}" and gained ${experienceGained} experience from its wisdom!`);
  }

  if (reward.type === 'experience' && reward.amount) {
    experienceGained = reward.amount;
    // Use the proper gainExperience function
    gainExperience(reward.amount, 'mystery-events', 'general');
    createEventNotification('🏛️ Ancient Shrine!', `You prayed at the sacred shrine and gained ${reward.amount} experience through divine blessing!`);
  }

  // Show combined reward message if multiple rewards
  if (goldGained > 0 && experienceGained > 0) {
    toast({
      title: "Rewards Gained!",
      description: `+${goldGained} Gold\n+${experienceGained} XP`,
      duration: 4000
    });
  }

  // Dispatch mystery event completion to trigger tile transformation
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('mystery-event-completed'));
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