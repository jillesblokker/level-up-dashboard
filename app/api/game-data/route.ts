import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { initialGrid } from '@/lib/hooks/use-realm-map'

export const dynamic = 'force-dynamic'

type GameData = {
  character?: {
    id?: number
    gold: number
    level: number
    experience: number
    inventory?: any
  }
  realmMap?: {
    id?: number
    grid: any
  }
  quests?: Array<{
    id?: number
    title: string
    description: string
    reward: number
    completed?: boolean
  }>
  achievements?: Array<{
    id?: number
    title: string
    description: string
    unlocked?: boolean
  }>
  kingdom?: {
    id?: number
    name: string
    resources: any
    buildings: any
  }
}

// GET all game data
export async function GET() {
  try {
    const [character, realmMap, quests, achievements, kingdom] = await Promise.all([
      prisma.character.findFirst(),
      prisma.realmMap.findFirst(),
      prisma.quest.findMany(),
      prisma.achievement.findMany(),
      prisma.kingdom.findFirst(),
    ])

    if (!realmMap?.grid) {
      // Create initial realm map if it doesn't exist
      const initialRealmMap = await prisma.realmMap.create({
        data: {
          grid: initialGrid
        }
      })
      return NextResponse.json({
        character,
        realmMap: initialRealmMap,
        quests,
        achievements,
        kingdom,
      })
    }

    return NextResponse.json({
      character,
      realmMap,
      quests,
      achievements,
      kingdom,
    })
  } catch (error) {
    console.error('Error fetching game data:', error)
    return NextResponse.json({ error: 'Failed to fetch game data' }, { status: 500 })
  }
}

// POST to update game data
export async function POST(req: Request) {
  try {
    const data: GameData = await req.json()
    const { character, realmMap, quests, achievements, kingdom } = data

    const updates = []

    // Update character data
    if (character) {
      updates.push(
        prisma.character.upsert({
          where: { id: character.id || 1 },
          update: character,
          create: { ...character, id: 1 },
        })
      )
    }

    // Update realm map with validation
    if (realmMap?.grid) {
      // Validate grid structure
      if (!Array.isArray(realmMap.grid) || !Array.isArray(realmMap.grid[0])) {
        throw new Error('Invalid grid structure')
      }

      updates.push(
        prisma.realmMap.upsert({
          where: { id: realmMap.id || 1 },
          update: { grid: realmMap.grid },
          create: { grid: realmMap.grid, id: 1 },
        })
      )
    }

    // Update quests
    if (quests) {
      updates.push(
        ...quests.map(quest =>
          prisma.quest.upsert({
            where: { id: quest.id || 1 },
            update: quest,
            create: { ...quest, id: quest.id || 1 },
          })
        )
      )
    }

    // Update achievements
    if (achievements) {
      updates.push(
        ...achievements.map(achievement =>
          prisma.achievement.upsert({
            where: { id: achievement.id || 1 },
            update: achievement,
            create: { ...achievement, id: achievement.id || 1 },
          })
        )
      )
    }

    // Update kingdom
    if (kingdom) {
      updates.push(
        prisma.kingdom.upsert({
          where: { id: kingdom.id || 1 },
          update: kingdom,
          create: { ...kingdom, id: 1 },
        })
      )
    }

    // Execute all updates in parallel
    await Promise.all(updates)

    return NextResponse.json({ message: 'Game data updated successfully' })
  } catch (error) {
    console.error('Error updating game data:', error)
    return NextResponse.json({ 
      error: 'Failed to update game data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 