import { CharacterStats } from "@/types/character"

// Default character stats
const DEFAULT_CHARACTER_STATS: CharacterStats = {
  level: 1,
  experience: 0,
  experienceToNextLevel: 100,
  gold: 1000,
  titles: {
    equipped: "",
    unlocked: 0,
    total: 10
  },
  perks: {
    active: 0,
    total: 5
  }
}

// Initialize character stats if they don't exist
export function initializeCharacterStats(): CharacterStats {
  try {
    const savedStats = localStorage.getItem("character-stats")
    if (savedStats) {
      try {
        return JSON.parse(savedStats) as CharacterStats
      } catch (parseError) {
        // If parsing fails, clear the corrupted value and use default
        localStorage.removeItem("character-stats")
        localStorage.setItem("character-stats", JSON.stringify(DEFAULT_CHARACTER_STATS))
        return DEFAULT_CHARACTER_STATS
      }
    } else {
      // Set default stats
      localStorage.setItem("character-stats", JSON.stringify(DEFAULT_CHARACTER_STATS))
      return DEFAULT_CHARACTER_STATS
    }
  } catch (error) {
    console.error("Error initializing character stats:", error)
    // Set default stats on error
    localStorage.setItem("character-stats", JSON.stringify(DEFAULT_CHARACTER_STATS))
    return DEFAULT_CHARACTER_STATS
  }
}

// Get current character stats
export function getCharacterStats(): CharacterStats {
  const stats = initializeCharacterStats()
  
  // Debug logging to help identify level discrepancies between devices
  console.log('[Character Stats Manager] === DEBUG INFO ===')
  console.log('[Character Stats Manager] Raw localStorage data:', localStorage.getItem('character-stats'))
  console.log('[Character Stats Manager] Parsed stats:', stats)
  console.log('[Character Stats Manager] Experience:', stats.experience)
  console.log('[Character Stats Manager] Stored level:', stats.level)
  console.log('[Character Stats Manager] ===================')
  
  return stats
}

// Update character stats
export function updateCharacterStats(newStats: Partial<CharacterStats>): CharacterStats {
  try {
    const currentStats = getCharacterStats()
    const updatedStats = { ...currentStats, ...newStats }
    
    localStorage.setItem("character-stats", JSON.stringify(updatedStats))
    
    // Dispatch event to notify components
    window.dispatchEvent(new Event("character-stats-update"))
    
    return updatedStats
  } catch (error) {
    console.error("Error updating character stats:", error)
    return getCharacterStats()
  }
}

// Force refresh character stats in all components
export function refreshCharacterStats(): void {
  window.dispatchEvent(new Event("character-stats-update"))
} 