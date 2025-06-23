import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { QuestResponse } from '@/types/quest';
import { env } from '@/lib/env';

// Define schemas for request validation
const questCompletionSchema = z.object({
  name: z.string().min(1),
  category: z.string().min(1)
});

const questUpdateSchema = z.object({
  questName: z.string().min(1),
  completed: z.boolean()
});

// Get all available quests and their completion status for the current user
export async function GET(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get('date');
    
    // Validate date parameter if provided
    let date: Date | undefined;
    if (dateParam) {
      try {
        date = new Date(dateParam);
        if (isNaN(date.getTime())) {
          throw new Error('Invalid date');
        }
      } catch {
        return NextResponse.json({ error: 'Invalid date parameter' }, { status: 400 });
      }
    }

    // Get all available quests
    const allQuests = await prisma.quest.findMany({
      orderBy: {
        category: 'asc'
      }
    });

    // Get user's quest completions
    const questCompletions = await prisma.questCompletion.findMany({
      where: {
        userId: userId,
        ...(date && {
          date: {
            gte: date,
            lt: new Date(new Date(date).setDate(date.getDate() + 1))
          }
        })
      },
      orderBy: {
        date: 'desc'
      }
    });

    // Create a map of quest completions for quick lookup
    const completionMap = new Map();
    questCompletions.forEach((completion: any) => {
      const key = `${completion.questName}`;
      completionMap.set(key, completion);
    });

    // Combine quests with completion status
    const questsWithCompletions = allQuests.map((quest: any) => {
      const key = `${quest.name}`;
      const completion = completionMap.get(key);
      
      return {
        id: quest.id,
        name: quest.name,
        description: quest.description,
        category: quest.category,
        difficulty: quest.difficulty,
        rewards: quest.rewards,
        completed: completion?.completed ?? false,
        date: completion?.date,
        isNew: !completion, // Mark as new if no completion record exists
        completionId: completion?.id
      };
    });

    return NextResponse.json(questsWithCompletions);
  } catch (error) {
    console.error('Error fetching quests:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Create a new quest completion
export async function POST(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    // Validate request body
    const result = questCompletionSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: 'Invalid request body', details: result.error.issues }, { status: 400 });
    }
    
    const { name, category } = result.data;

    // Create the quest completion
    const questCompletion = await prisma.questCompletion.create({
      data: {
        userId: userId,
        questName: name,
        category: category,
        completed: false,
        date: new Date()
      }
    });

    const response: QuestResponse = {
      name: questCompletion.questName,
      category: questCompletion.category,
      completed: questCompletion.completed,
      date: questCompletion.date
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error creating quest completion:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Update a quest completion status
export async function PUT(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    // Validate request body
    const result = questUpdateSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: 'Invalid request body', details: result.error.issues }, { status: 400 });
    }
    
    const { questName, completed } = result.data;

    // Find or create quest completion
    let questCompletion = await prisma.questCompletion.findFirst({
      where: {
        userId: userId,
        questName
      }
    });

    if (!questCompletion) {
      // Create a new completion record
      questCompletion = await prisma.questCompletion.create({
        data: {
          userId: userId,
          questName,
          category: 'general',
          completed: false,
          date: new Date()
        }
      });
    }

    // Update the completion status
    const updatedCompletion = await prisma.questCompletion.update({
      where: { id: questCompletion.id },
      data: {
        completed,
        date: completed ? new Date() : questCompletion.date
      }
    });

    // If quest is completed, update character stats with default rewards
    if (completed) {
      const character = await prisma.character.findFirst({
        where: { userId }
      });

      if (character) {
        const defaultRewards = {
          experience: 50,
          gold: 25
        };

        const currentStats = character.stats ? JSON.parse(character.stats) : {};
        const currentGold = currentStats.gold || 0;

        await prisma.character.update({
          where: { id: character.id },
          data: {
            exp: character.exp + defaultRewards.experience,
            stats: JSON.stringify({
              ...currentStats,
              gold: currentGold + defaultRewards.gold
            })
          }
        });
      }
    }

    const response: QuestResponse = {
      name: updatedCompletion.questName,
      category: updatedCompletion.category,
      completed: updatedCompletion.completed,
      date: updatedCompletion.date
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error updating quest completion:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Export quests as CSV
export async function PATCH() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const questCompletions = await prisma.questCompletion.findMany({
      where: {
        user: {
          id: userId
        }
      },
      orderBy: {
        date: 'desc'
      }
    });

    // Convert to CSV
    let csv = 'date,name,completed\n';
    questCompletions.forEach((completion: any) => {
      csv += `${completion.date.toISOString()},${completion.questName},${completion.completed}\n`;
    });

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename=quests.csv'
      }
    });
  } catch (error) {
    console.error('Error exporting quests:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'Quest completion ID is required' }, { status: 400 });
    }

    await prisma.questCompletion.delete({
      where: {
        id: id,
        userId: userId
      }
    });

    return NextResponse.json({ success: true, message: 'Quest completion deleted' });
  } catch (error) {
    console.error('Error deleting quest completion:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 