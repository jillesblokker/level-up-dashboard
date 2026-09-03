import { getUserPreference, setUserPreference } from './user-preferences-manager';
import { gainGold } from './gold-manager';
import { logger } from './logger';

export type VirtueCategory = 'might' | 'knowledge' | 'honor' | 'castle' | 'craft' | 'vitality' | 'wellness';

export interface StoryChoice {
  id: string;
  verb: string;                 // Highlighted action verb (e.g. "Run with Turtoisy")
  label: string;                // Descriptive choice label
  virtueType: VirtueCategory;
  virtuePoints: number;
  goldReward: number;
  itemReward?: string;
  resolutionText: string;       // Consequence outcome scene
  lessonMoral: string;          // Real-life habit metaphor
}

export interface StoryCharacter {
  name: string;
  image: string;
}

export interface StoryAdventure {
  id: string;
  storyNumber: string;          // e.g. "Scene 0042" (Galzyr style)
  title: string;
  characters: StoryCharacter[]; // Existing creatures with images
  avatarImage: string;          // Main character portrait
  locationName: string;         // Kingdom location
  narrativeText: string;        // Opening simple story
  choices: StoryChoice[];
  unlockedRequirement?: {
    habitCategory?: string;
    playerLevel?: number;
  };
}

export interface CompletedStoryRecord {
  storyId: string;
  storyNumber: string;
  storyTitle: string;
  chosenChoiceId: string;
  completedAt: string;          // ISO date
  virtueType: VirtueCategory;
  virtuePoints: number;
  goldReward: number;
}

const STORAGE_KEY = 'thrivehaven_completed_tales';

/**
 * Retrieves the list of completed story records from local storage.
 */
export function getCompletedStories(): CompletedStoryRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (err) {
    logger.error('Failed to load completed story records:', err);
    return [];
  }
}

/**
 * Checks if a story has already been completed.
 */
export function isStoryCompleted(storyId: string): boolean {
  const records = getCompletedStories();
  return records.some(r => r.storyId === storyId);
}

/**
 * Resolves a story choice: awards virtues, gold, items, and records completion in the Chronicle.
 */
export async function resolveStoryAdventure(
  story: StoryAdventure,
  choice: StoryChoice
): Promise<CompletedStoryRecord> {
  const record: CompletedStoryRecord = {
    storyId: story.id,
    storyNumber: story.storyNumber,
    storyTitle: story.title,
    chosenChoiceId: choice.id,
    completedAt: new Date().toISOString(),
    virtueType: choice.virtueType,
    virtuePoints: choice.virtuePoints,
    goldReward: choice.goldReward,
  };

  try {
    // 1. Award Gold
    if (choice.goldReward > 0) {
      await gainGold(choice.goldReward, `storybook-${story.id}`);
    }

    // 2. Award House Cup Virtue Energy
    const currentVirtues: Record<string, number> = ((await getUserPreference('house_cup_virtues')) as Record<string, number> | null) || {};
    currentVirtues[choice.virtueType] = (currentVirtues[choice.virtueType] || 0) + choice.virtuePoints;
    await setUserPreference('house_cup_virtues', currentVirtues);

    // 3. Save completed record
    if (typeof window !== 'undefined') {
      const records = getCompletedStories();
      // Remove any prior entry for the same story if replaying
      const filtered = records.filter(r => r.storyId !== story.id);
      filtered.unshift(record);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
      window.dispatchEvent(new Event('thrivehaven_story_completed'));
    }
  } catch (err) {
    logger.error('Failed to resolve story adventure rewards:', err);
  }

  return record;
}
