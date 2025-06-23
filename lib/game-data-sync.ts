import { GameState } from '../types/game'
import { prisma } from './prisma'

export type GameData = GameState

export async function syncGameData(
  localData: GameData,
  userId: string
): Promise<void> {
  const prisma = getPrismaClient()

  try {
    // Get existing data from the database
    const existingData = await prisma.userGameData.findUnique({
      where: { userId },
      select: { gameProgress: true }
    })

    // Parse existing gameProgress JSON string if present
    const existingProgress = existingData?.gameProgress ? JSON.parse(existingData.gameProgress) : {}

    // Merge local data with existing data
    const mergedData = {
      ...existingProgress,
      ...localData,
      last_sync: new Date().toISOString(),
    }

    // Update the database
    await prisma.userGameData.upsert({
      where: { userId },
      update: {
        gameProgress: JSON.stringify(mergedData),
        updatedAt: new Date(),
      },
      create: {
        userId,
        gameProgress: JSON.stringify(mergedData),
        updatedAt: new Date(),
      }
    })
  } catch (error) {
    console.error('Error syncing game data:', error)
    throw error
  }
}

export async function loadGameData(userId: string): Promise<GameData | null> {
  const prisma = getPrismaClient()

  try {
    const data = await prisma.userGameData.findUnique({
      where: { userId },
      select: { gameProgress: true }
    })

    return data?.gameProgress ? JSON.parse(data.gameProgress) : null
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