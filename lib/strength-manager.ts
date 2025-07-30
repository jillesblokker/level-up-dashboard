/**
 * Strength Manager
 * 
 * This module manages character strengths for the 8 categories:
 * - Might: Physical strength and combat prowess
 * - Knowledge: Intellectual wisdom and learning  
 * - Honor: Noble character and integrity
 * - Castle: Leadership and governance
 * - Craft: Artisan skills and craftsmanship
 * - Vitality: Health, endurance, and life force
 * - Wellness: Mental and physical well-being
 * - Exploration: Discovery and adventure
 * 
 * Usage:
 * When a quest is completed, call:
 * gainStrengthFromQuest(questCategory, questLevel)
 * 
 * Example:
 * gainStrengthFromQuest('might', 2) // Gives 50 might experience for a level 2 might quest
 */

export interface Strength {
  id: string
  name: string
  category: string
  level: number
  experience: number
  experienceToNextLevel: number
  description: string
  icon: string
  color: string
}

const STRENGTHS_KEY = 'character-strengths'

// Default strengths for each category
const defaultStrengths: Strength[] = [
  {
    id: "might",
    name: "Might",
    category: "might",
    level: 1,
    experience: 0,
    experienceToNextLevel: 100,
    description: "Physical strength and combat prowess",
    icon: "⚔️",
    color: "text-red-500"
  },
  {
    id: "knowledge",
    name: "Knowledge",
    category: "knowledge", 
    level: 1,
    experience: 0,
    experienceToNextLevel: 100,
    description: "Intellectual wisdom and learning",
    icon: "📚",
    color: "text-blue-500"
  },
  {
    id: "honor",
    name: "Honor",
    category: "honor",
    level: 1,
    experience: 0,
    experienceToNextLevel: 100,
    description: "Noble character and integrity",
    icon: "👑",
    color: "text-yellow-500"
  },
  {
    id: "castle",
    name: "Castle",
    category: "castle",
    level: 1,
    experience: 0,
    experienceToNextLevel: 100,
    description: "Leadership and governance",
    icon: "🏰",
    color: "text-purple-500"
  },
  {
    id: "craft",
    name: "Craft",
    category: "craft",
    level: 1,
    experience: 0,
    experienceToNextLevel: 100,
    description: "Artisan skills and craftsmanship",
    icon: "🔨",
    color: "text-amber-500"
  },
  {
    id: "vitality",
    name: "Vitality",
    category: "vitality",
    level: 1,
    experience: 0,
    experienceToNextLevel: 100,
    description: "Health, endurance, and life force",
    icon: "❤️",
    color: "text-green-500"
  },
  {
    id: "wellness",
    name: "Wellness",
    category: "wellness",
    level: 1,
    experience: 0,
    experienceToNextLevel: 100,
    description: "Mental and physical well-being",
    icon: "☀️",
    color: "text-amber-400"
  },
  {
    id: "exploration",
    name: "Exploration",
    category: "exploration",
    level: 1,
    experience: 0,
    experienceToNextLevel: 100,
    description: "Discovery and adventure",
    icon: "🧭",
    color: "text-blue-400"
  }
]

export function getStrengths(): Strength[] {
  if (typeof window === 'undefined') return defaultStrengths
  
  const savedStrengths = localStorage.getItem(STRENGTHS_KEY)
  if (!savedStrengths) return defaultStrengths
  
  try {
    return JSON.parse(savedStrengths)
  } catch (err) {
    console.error('Error parsing strengths:', err)
    localStorage.removeItem(STRENGTHS_KEY)
    return defaultStrengths
  }
}

export function saveStrengths(strengths: Strength[]) {
  if (typeof window === 'undefined') return
  
  localStorage.setItem(STRENGTHS_KEY, JSON.stringify(strengths))
  window.dispatchEvent(new Event('character-strengths-update'))
}

export function gainStrengthExperience(category: string, amount: number): Strength[] {
  const strengths = getStrengths()
  
  const updatedStrengths = strengths.map(strength => {
    if (strength.category === category) {
      let newExperience = strength.experience + amount
      let newLevel = strength.level
      let newExperienceToNextLevel = strength.experienceToNextLevel

      // Check for level up
      while (newExperience >= newExperienceToNextLevel) {
        newExperience -= newExperienceToNextLevel
        newLevel += 1
        newExperienceToNextLevel = Math.floor(newExperienceToNextLevel * 1.2) // 20% increase per level
      }

      return {
        ...strength,
        level: newLevel,
        experience: newExperience,
        experienceToNextLevel: newExperienceToNextLevel
      }
    }
    return strength
  })

  saveStrengths(updatedStrengths)
  return updatedStrengths
}

export function calculateStrengthProgress(strength: Strength): number {
  return (strength.experience / strength.experienceToNextLevel) * 100
}

// Function to gain strength experience when a quest is completed
export function gainStrengthFromQuest(questCategory: string, questLevel: number = 1): void {
  // Map quest categories to strength categories
  const categoryMapping: Record<string, string> = {
    'might': 'might',
    'knowledge': 'knowledge',
    'honor': 'honor',
    'castle': 'castle',
    'craft': 'craft',
    'vitality': 'vitality',
    'wellness': 'wellness',
    'exploration': 'exploration'
  }

  const strengthCategory = categoryMapping[questCategory.toLowerCase()]
  if (!strengthCategory) {
    console.warn(`Unknown quest category: ${questCategory}`)
    return
  }

  // Calculate experience based on quest level (higher level quests give more exp)
  const baseExperience = 25
  const experienceGain = baseExperience * questLevel

  gainStrengthExperience(strengthCategory, experienceGain)
  
  console.log(`Gained ${experienceGain} ${strengthCategory} experience from ${questCategory} quest`)
} 