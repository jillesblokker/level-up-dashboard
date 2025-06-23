console.log('DEBUG: DATABASE_URL is', process.env['DATABASE_URL'])
const prisma = require('../lib/prisma').default
const { defaultQuests } = require('../lib/quest-sample-data')

// Default character data
const defaultCharacter = {
  name: 'Hero',
  class: 'Warrior',
  level: 1,
  exp: 0,
  stats: {
    gold: 100,
    strength: 10,
    agility: 8,
    intelligence: 6,
    vitality: 12
  }
}

async function main() {
  try {
    // Define default tiles with better organization
    const defaultTiles = [
      // Center city
      { tileType: 'city', posX: 0, posY: 0 },
      
      // Surrounding grass tiles in a more organized pattern
      ...Array.from({ length: 8 }, (_, i) => ({
        tileType: 'grass',
        posX: Math.floor(i % 3) - 1,
        posY: Math.floor(i / 3) - 1
      })).filter(tile => !(tile.posX === 0 && tile.posY === 0)),
      
      // Forest cluster
      ...Array.from({ length: 3 }, (_, i) => ({
        tileType: 'forest',
        posX: -2,
        posY: i - 2
      })),
      
      // Water body
      ...Array.from({ length: 3 }, (_, i) => ({
        tileType: 'water',
        posX: 2,
        posY: 2 - i
      })),
      
      // Mountain range
      { tileType: 'mountain', posX: 0, posY: -2 },
      { tileType: 'mountain', posX: 1, posY: -2 },
      
      // Road to town
      { tileType: 'road', posX: 0, posY: 2 },
      { tileType: 'road', posX: 0, posY: 3 },
      { tileType: 'town', posX: 0, posY: 4 },
    ]

    // Get or create a default user
    const defaultUser = await prisma.user.upsert({
      where: {
        email: 'default@levelup.com',
      },
      update: {},
      create: {
        email: 'default@levelup.com',
        name: 'Default User',
        isAdmin: true,
      },
    })

    console.log('Created default user:', defaultUser.id)

    // Create all user-defined quests
    for (const quest of defaultQuests) {
      await prisma.quest.upsert({
        where: { id: quest.id },
        update: {
          name: quest.title,
          description: quest.description,
          category: quest.category,
          difficulty: typeof quest.difficulty === 'string' ? 1 : quest.difficulty, // fallback if needed
          rewards: JSON.stringify(quest.rewards),
        },
        create: {
          id: quest.id,
          name: quest.title,
          description: quest.description,
          category: quest.category,
          difficulty: typeof quest.difficulty === 'string' ? 1 : quest.difficulty, // fallback if needed
          rewards: JSON.stringify(quest.rewards),
        },
      })
    }

    console.log('Created all user-defined quests')

    // Create default character for the user
    await prisma.character.upsert({
      where: {
        userId_name: {
          userId: defaultUser.id,
          name: defaultCharacter.name,
        },
      },
      update: {
        ...defaultCharacter,
        stats: JSON.stringify(defaultCharacter.stats),
      },
      create: {
        ...defaultCharacter,
        userId: defaultUser.id,
        stats: JSON.stringify(defaultCharacter.stats),
      },
    })

    console.log('Created default character')

    // Add tiles for the default user
    for (const tile of defaultTiles) {
      await prisma.tilePlacement.upsert({
        where: {
          userId_posX_posY: {
            userId: defaultUser.id,
            posX: tile.posX,
            posY: tile.posY,
          },
        },
        update: tile,
        create: {
          userId: defaultUser.id,
          ...tile,
        },
      })
    }

    console.log('Added default tiles')
  } catch (error) {
    console.error('Error seeding database:', error)
    throw error
  }
}

main()
  .catch((e) => {
    console.error('Failed to seed database:', e)
    process.exit(1)
  })
  .finally(async () => {
    try {
      await prisma.$disconnect()
    } catch (e) {
      console.error('Failed to disconnect from database:', e)
      process.exit(1)
    }
  })