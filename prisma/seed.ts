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

// --- Achievement Definitions ---
const defaultAchievementDefinitions = [
  { code: 'defeat_100_monsters', name: 'Monster Hunter', description: 'Defeat 100 monsters in battle', icon: null },
  { code: 'win_50_battles', name: 'Battle Master', description: 'Win 50 battles', icon: null },
  { code: 'learn_20_spells', name: 'Spell Scholar', description: 'Learn 20 different spells', icon: null },
  { code: 'read_30_scrolls', name: 'Scroll Sage', description: 'Read 30 ancient scrolls', icon: null },
  { code: 'visit_all_regions', name: 'World Explorer', description: 'Visit all regions in the realm', icon: null },
  { code: 'discover_secret_locations', name: 'Secret Seeker', description: 'Discover 10 secret locations', icon: null },
  { code: 'complete_50_quests', name: 'Quest Champion', description: 'Complete 50 quests for the villagers', icon: null },
  { code: 'max_reputation', name: 'Beloved Hero', description: 'Reach maximum reputation in any region', icon: null },
  { code: 'craft_legendary', name: 'Legendary Craftsman', description: 'Craft a legendary item', icon: null },
  { code: 'craft_100_items', name: 'Master Artisan', description: 'Craft 100 items', icon: null },
  { code: 'collect_all_creatures', name: 'Creature Master', description: 'Discover all creatures in the realm', icon: null },
  { code: 'collect_rare_items', name: 'Rare Collector', description: 'Collect 20 rare items', icon: null },
];

// --- Challenge Definitions ---
const defaultChallenges = [
  { name: '300x Pushups', description: 'Complete 300 pushups.', category: 'might', difficulty: 3, rewards: JSON.stringify({ xp: 50, gold: 25 }) },
  { name: 'Plank 3:00', description: 'Hold a plank for 3 minutes.', category: 'might', difficulty: 2, rewards: JSON.stringify({ xp: 50, gold: 25 }) },
  { name: 'Walk', description: 'Go for a walk.', category: 'might', difficulty: 1, rewards: JSON.stringify({ xp: 50, gold: 25 }) },
  { name: 'Spanish', description: 'Practice Spanish language learning.', category: 'knowledge', difficulty: 2, rewards: JSON.stringify({ xp: 50, gold: 25 }) },
  { name: 'Duo Piano', description: 'Practice piano with Duolingo.', category: 'knowledge', difficulty: 2, rewards: JSON.stringify({ xp: 50, gold: 25 }) },
  { name: 'Mindpal', description: 'Use Mindpal for learning.', category: 'knowledge', difficulty: 2, rewards: JSON.stringify({ xp: 50, gold: 25 }) },
  { name: 'Quick Typing', description: 'Practice typing skills.', category: 'knowledge', difficulty: 1, rewards: JSON.stringify({ xp: 50, gold: 25 }) },
  { name: 'Read 5 Minutes', description: 'Read for 5 minutes.', category: 'knowledge', difficulty: 1, rewards: JSON.stringify({ xp: 50, gold: 25 }) },
  { name: 'Vitamin D', description: 'Get vitamin D exposure.', category: 'knowledge', difficulty: 1, rewards: JSON.stringify({ xp: 50, gold: 25 }) },
  { name: '24 Draw Lesson', description: 'Complete a drawing lesson.', category: 'knowledge', difficulty: 2, rewards: JSON.stringify({ xp: 50, gold: 25 }) },
  { name: 'Daily Hype 4 Academy', description: 'Complete daily academy tasks.', category: 'knowledge', difficulty: 2, rewards: JSON.stringify({ xp: 50, gold: 25 }) },
  { name: 'Wake Up Before 10', description: 'Wake up before 10 AM.', category: 'honor', difficulty: 2, rewards: JSON.stringify({ xp: 50, gold: 25 }) },
  { name: 'Toothbrushing', description: 'Brush your teeth properly.', category: 'honor', difficulty: 1, rewards: JSON.stringify({ xp: 50, gold: 25 }) },
  { name: 'Handwriting', description: 'Practice handwriting.', category: 'honor', difficulty: 1, rewards: JSON.stringify({ xp: 50, gold: 25 }) },
  { name: 'Shave', description: 'Shave properly.', category: 'honor', difficulty: 1, rewards: JSON.stringify({ xp: 50, gold: 25 }) },
  { name: 'Barber', description: 'Visit the barber.', category: 'honor', difficulty: 2, rewards: JSON.stringify({ xp: 50, gold: 25 }) },
  { name: 'Dishwasher', description: 'Load/unload the dishwasher.', category: 'castle', difficulty: 1, rewards: JSON.stringify({ xp: 50, gold: 25 }) },
  { name: 'Diaper Bin', description: 'Empty the diaper bin.', category: 'castle', difficulty: 1, rewards: JSON.stringify({ xp: 50, gold: 25 }) },
  { name: 'Vacuuming', description: 'Vacuum the house.', category: 'castle', difficulty: 2, rewards: JSON.stringify({ xp: 50, gold: 25 }) },
  { name: 'Water Plants', description: 'Water the plants.', category: 'castle', difficulty: 1, rewards: JSON.stringify({ xp: 50, gold: 25 }) },
  { name: 'Bed Laundry', description: 'Change bed sheets and do laundry.', category: 'castle', difficulty: 2, rewards: JSON.stringify({ xp: 50, gold: 25 }) },
  { name: 'Trash Bin at the Road', description: 'Take trash bin to the road.', category: 'castle', difficulty: 1, rewards: JSON.stringify({ xp: 50, gold: 25 }) },
  { name: 'Paper on the Road', description: 'Take paper recycling to the road.', category: 'castle', difficulty: 1, rewards: JSON.stringify({ xp: 50, gold: 25 }) },
  { name: 'Doodle', description: 'Create a doodle or sketch.', category: 'craft', difficulty: 1, rewards: JSON.stringify({ xp: 50, gold: 25 }) },
  { name: 'Animate', description: 'Work on animation project.', category: 'craft', difficulty: 2, rewards: JSON.stringify({ xp: 50, gold: 25 }) },
  { name: 'Battubby', description: 'Take a bath or shower.', category: 'vitality', difficulty: 1, rewards: JSON.stringify({ xp: 50, gold: 25 }) },
  { name: 'Mango Food Fill', description: 'Eat healthy food like mango.', category: 'vitality', difficulty: 1, rewards: JSON.stringify({ xp: 50, gold: 25 }) },
];

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

    // --- Seed AchievementDefinition ---
    for (const achievement of defaultAchievementDefinitions) {
      await prisma.achievementDefinition.upsert({
        where: { code: achievement.code },
        update: achievement,
        create: achievement,
      });
    }
    console.log('Seeded AchievementDefinition table');

    // --- Seed Challenge ---
    for (const challenge of defaultChallenges) {
      await prisma.challenge.upsert({
        where: { name: challenge.name },
        update: challenge,
        create: challenge,
      });
    }
    console.log('Seeded Challenge table');

    // --- Seed Example User Progress ---
    // Seed a UserChallenge for the default user
    const firstChallenge = await prisma.challenge.findFirst();
    if (firstChallenge) {
      await prisma.userChallenge.upsert({
        where: { userId_challengeId: { userId: defaultUser.id, challengeId: firstChallenge.id } },
        update: { progress: 2, completed: false },
        create: {
          userId: defaultUser.id,
          challengeId: firstChallenge.id,
          progress: 2,
          completed: false,
        },
      });
    }
    // Seed a user Achievement progress for the default user
    const firstAchievementDef = await prisma.achievementDefinition.findFirst();
    if (firstAchievementDef) {
      await prisma.achievement.upsert({
        where: { userId_achievementId: { userId: defaultUser.id, achievementId: firstAchievementDef.id } },
        update: { progress: 5, unlocked: false },
        create: {
          userId: defaultUser.id,
          achievementId: firstAchievementDef.id,
          progress: 5,
          unlocked: false,
        },
      });
    }
    console.log('Seeded example user progress for UserChallenge and Achievement');
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