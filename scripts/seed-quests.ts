import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const defaultQuests = [
  // Might
  { name: '300x Pushups', description: 'Complete 300 pushups.', category: 'might', difficulty: 3, rewards: JSON.stringify({ xp: 50, gold: 25 }) },
  { name: 'Plank 3:00', description: 'Hold a plank for 3 minutes.', category: 'might', difficulty: 2, rewards: JSON.stringify({ xp: 50, gold: 25 }) },
  { name: 'Walk', description: 'Go for a walk.', category: 'might', difficulty: 1, rewards: JSON.stringify({ xp: 50, gold: 25 }) },
  
  // Knowledge
  { name: 'Spanish', description: 'Practice Spanish language learning.', category: 'knowledge', difficulty: 2, rewards: JSON.stringify({ xp: 50, gold: 25 }) },
  { name: 'Duo Piano', description: 'Practice piano with Duolingo.', category: 'knowledge', difficulty: 2, rewards: JSON.stringify({ xp: 50, gold: 25 }) },
  { name: 'Mindpal', description: 'Use Mindpal for learning.', category: 'knowledge', difficulty: 2, rewards: JSON.stringify({ xp: 50, gold: 25 }) },
  { name: 'Quick Typing', description: 'Practice typing skills.', category: 'knowledge', difficulty: 1, rewards: JSON.stringify({ xp: 50, gold: 25 }) },
  { name: 'Read 5 Minutes', description: 'Read for 5 minutes.', category: 'knowledge', difficulty: 1, rewards: JSON.stringify({ xp: 50, gold: 25 }) },
  { name: 'Vitamin D', description: 'Get vitamin D exposure.', category: 'knowledge', difficulty: 1, rewards: JSON.stringify({ xp: 50, gold: 25 }) },
  { name: '24 Draw Lesson', description: 'Complete a drawing lesson.', category: 'knowledge', difficulty: 2, rewards: JSON.stringify({ xp: 50, gold: 25 }) },
  { name: 'Daily Hype 4 Academy', description: 'Complete daily academy tasks.', category: 'knowledge', difficulty: 2, rewards: JSON.stringify({ xp: 50, gold: 25 }) },

  // Honor
  { name: 'Wake Up Before 10', description: 'Wake up before 10 AM.', category: 'honor', difficulty: 2, rewards: JSON.stringify({ xp: 50, gold: 25 }) },
  { name: 'Toothbrushing', description: 'Brush your teeth properly.', category: 'honor', difficulty: 1, rewards: JSON.stringify({ xp: 50, gold: 25 }) },
  { name: 'Handwriting', description: 'Practice handwriting.', category: 'honor', difficulty: 1, rewards: JSON.stringify({ xp: 50, gold: 25 }) },
  { name: 'Shave', description: 'Shave properly.', category: 'honor', difficulty: 1, rewards: JSON.stringify({ xp: 50, gold: 25 }) },
  { name: 'Barber', description: 'Visit the barber.', category: 'honor', difficulty: 2, rewards: JSON.stringify({ xp: 50, gold: 25 }) },

  // Castle
  { name: 'Dishwasher', description: 'Load/unload the dishwasher.', category: 'castle', difficulty: 1, rewards: JSON.stringify({ xp: 50, gold: 25 }) },
  { name: 'Diaper Bin', description: 'Empty the diaper bin.', category: 'castle', difficulty: 1, rewards: JSON.stringify({ xp: 50, gold: 25 }) },
  { name: 'Vacuuming', description: 'Vacuum the house.', category: 'castle', difficulty: 2, rewards: JSON.stringify({ xp: 50, gold: 25 }) },
  { name: 'Water Plants', description: 'Water the plants.', category: 'castle', difficulty: 1, rewards: JSON.stringify({ xp: 50, gold: 25 }) },
  { name: 'Bed Laundry', description: 'Change bed sheets and do laundry.', category: 'castle', difficulty: 2, rewards: JSON.stringify({ xp: 50, gold: 25 }) },
  { name: 'Trash Bin at the Road', description: 'Take trash bin to the road.', category: 'castle', difficulty: 1, rewards: JSON.stringify({ xp: 50, gold: 25 }) },
  { name: 'Paper on the Road', description: 'Take paper recycling to the road.', category: 'castle', difficulty: 1, rewards: JSON.stringify({ xp: 50, gold: 25 }) },

  // Craft
  { name: 'Doodle', description: 'Create a doodle or sketch.', category: 'craft', difficulty: 1, rewards: JSON.stringify({ xp: 50, gold: 25 }) },
  { name: 'Animate', description: 'Work on animation project.', category: 'craft', difficulty: 2, rewards: JSON.stringify({ xp: 50, gold: 25 }) },

  // Vitality
  { name: 'Battubby', description: 'Take a bath or shower.', category: 'vitality', difficulty: 1, rewards: JSON.stringify({ xp: 50, gold: 25 }) },
  { name: 'Mango Food Fill', description: 'Eat healthy food like mango.', category: 'vitality', difficulty: 1, rewards: JSON.stringify({ xp: 50, gold: 25 }) },
];

async function main() {
  console.log('Start seeding...');
  for (const quest of defaultQuests) {
    try {
      await prisma.quest.create({
        data: quest,
      });
      console.log(`Created quest: ${quest.name}`);
    } catch (error) {
      console.log(`Quest ${quest.name} already exists, skipping...`);
    }
  }
  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 