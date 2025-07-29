import { supabase } from './supabase/client';

// TODO: Replace Prisma logic with Supabase client logic

const defaultQuests = {
  might: [
    { name: 'First Steps', completed: false },
    { name: 'Strength Training', completed: false },
  ],
  knowledge: [
    { name: 'Read a Book', completed: false },
    { name: 'Learn a new Skill', completed: false },
  ],
  honor: [
    { name: 'Help a Neighbor', completed: false },
    { name: 'Uphold a Promise', completed: false },
  ],
  castle: [
    { name: 'Build a Foundation', completed: false },
    { name: 'Decorate a Room', completed: false },
  ],
  craft: [
    { name: 'Craft a Simple Tool', completed: false },
    { name: 'Cook a Meal', completed: false },
  ],
  vitality: [
    { name: 'Go for a Walk', completed: false },
    { name: 'Get a Good Night\'s Sleep', completed: false },
  ],
};

export async function createDefaultQuestsForUser(userId: string) {
  const questCreations = [];

  for (const category in defaultQuests) {
    for (const quest of defaultQuests[category as keyof typeof defaultQuests]) {
      questCreations.push(
        supabase
          .from('quests')
          .insert({
            user_id: userId,
            name: quest.name,
            category: category,
            completed: quest.completed,
            description: `Default ${category} quest`,
            difficulty: 'easy',
            xp_reward: 50,
            gold_reward: 25,
          })
          .select()
      );
    }
  }

  try {
    const results = await Promise.all(questCreations);
    const errors = results.filter((result: any) => result.error);
    
    if (errors.length > 0) {
      console.error('Some quests failed to create:', errors);
    }
    
    console.log(`Created ${results.length - errors.length} default quests for user ${userId}`);
  } catch (error) {
    console.error(`Failed to create default quests for user ${userId}`, error);
    // Even if quest creation fails, we shouldn't block user creation.
    // The error is logged for debugging.
  }
}