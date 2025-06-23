import { GameState } from '../types/game'
import prisma from './prisma'

export type GameData = GameState

export async function syncGameData(
  localData: GameData,
  userId: string
): Promise<void> {
  try {
    // Get existing data from the database
    const existingData = await prisma.realmMap.findUnique({
      where: { userId },
      select: { grid: true }
    })

    // Parse existing grid JSON string if present
    const existingGrid = existingData?.grid ? JSON.parse(existingData.grid) : {}

    // Merge local data with existing data
    const mergedData = {
      ...existingGrid,
      ...localData,
      last_sync: new Date().toISOString(),
    }

    // Update the database
    await prisma.realmMap.upsert({
      where: { userId },
      update: {
        grid: JSON.stringify(mergedData),
      },
      create: {
        userId,
        grid: JSON.stringify(mergedData),
      }
    })
  } catch (error) {
    console.error('Error syncing game data:', error)
    throw error
  }
}

export async function loadGameData(userId: string): Promise<GameData | null> {
  try {
    const data = await prisma.realmMap.findUnique({
      where: { userId },
      select: { grid: true }
    })

    return data?.grid ? JSON.parse(data.grid) : null
  } catch (error) {
    console.error('Error loading game data:', error)
    throw error
  }
}

export function getLocalGameData(): GameData {
  try {
    const grid = localStorage.getItem('grid')
    const inventory = localStorage.getItem('inventory')
    const character = localStorage.getItem('character')
    const quests = localStorage.getItem('quests')

    return {
      grid: grid ? JSON.parse(grid) : undefined,
      inventory: inventory ? JSON.parse(inventory) : {},
      character: character ? JSON.parse(character) : undefined,
      quests: quests ? JSON.parse(quests) : undefined,
      selectedTile: null
    }
  } catch (error) {
    console.error('Error getting local game data:', error)
    return {
      inventory: {},
      selectedTile: null
    }
  }
}

export function saveLocalGameData(data: GameData): void {
  try {
    if (data.grid) localStorage.setItem('grid', JSON.stringify(data.grid))
    if (data.inventory) localStorage.setItem('inventory', JSON.stringify(data.inventory))
    if (data.character) localStorage.setItem('character', JSON.stringify(data.character))
    if (data.quests) localStorage.setItem('quests', JSON.stringify(data.quests))
  } catch (error) {
    console.error('Error saving local game data:', error)
  }
} 