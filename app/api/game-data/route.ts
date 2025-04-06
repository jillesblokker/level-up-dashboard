import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

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
    const data = await req.json()
    const { character, realmMap, quests, achievements, kingdom } = data

    // Update character data
    if (character) {
      await prisma.character.upsert({
        where: { id: character.id || 1 },
        update: character,
        create: { ...character, id: 1 },
      })
    }

    // Update realm map
    if (realmMap) {
      await prisma.realmMap.upsert({
        where: { id: realmMap.id || 1 },
        update: realmMap,
        create: { ...realmMap, id: 1 },
      })
    }

    // Update quests
    if (quests) {
      for (const quest of quests) {
        await prisma.quest.upsert({
          where: { id: quest.id || 1 },
          update: quest,
          create: quest,
        })
      }
    }

    // Update achievements
    if (achievements) {
      for (const achievement of achievements) {
        await prisma.achievement.upsert({
          where: { id: achievement.id || 1 },
          update: achievement,
          create: achievement,
        })
      }
    }

    // Update kingdom
    if (kingdom) {
      await prisma.kingdom.upsert({
        where: { id: kingdom.id || 1 },
        update: kingdom,
        create: { ...kingdom, id: 1 },
      })
    }

    return NextResponse.json({ message: 'Game data updated successfully' })
  } catch (error) {
    console.error('Error updating game data:', error)
    return NextResponse.json({ error: 'Failed to update game data' }, { status: 500 })
  }
} 