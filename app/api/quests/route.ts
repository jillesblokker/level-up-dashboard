import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { QuestResponse } from '@/types/quest';

// Define schemas for request validation
const questCompletionSchema = z.object({
  name: z.string().min(1),
  category: z.string().min(1)
});

const questUpdateSchema = z.object({
  questName: z.string().min(1),
  completed: z.boolean()
});

// Get quests for the current user
export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
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

    const questCompletions = await prisma.questCompletion.findMany({
      where: {
        user: {
          email: session.user.email
        },
        ...(date && {
          date: {
            gte: date,
            lt: new Date(date.setDate(date.getDate() + 1))
          }
        })
      },
      include: {
        user: true
      },
      orderBy: {
        date: 'desc'
      }
    });

    const quests: QuestResponse[] = questCompletions.map(completion => ({
      name: completion.questName,
      category: completion.category,
      completed: completion.completed,
      date: completion.date
    }));

    return NextResponse.json(quests);
  } catch (error) {
    console.error('Error fetching quests:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Create a new quest completion
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    // Validate request body
    const result = questCompletionSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: 'Invalid request body', details: result.error.issues }, { status: 400 });
    }
    
    const { name, category } = result.data;

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Create the quest completion
    const questCompletion = await prisma.questCompletion.create({
      data: {
        userId: user.id,
        category,
        questName: name,
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
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    // Validate request body
    const result = questUpdateSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: 'Invalid request body', details: result.error.issues }, { status: 400 });
    }
    
    const { questName, completed } = result.data;

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const questCompletion = await prisma.questCompletion.findFirst({
      where: {
        userId: user.id,
        questName
      }
    });

    if (!questCompletion) {
      return NextResponse.json({ error: 'Quest completion not found' }, { status: 404 });
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
      type CharacterRecord = {
        id: string;
        userId: string;
        name: string;
        class: string;
        level: number;
        exp: number;
        stats: { gold?: number };
        createdAt: Date;
        updatedAt: Date;
      };

      const [character] = await prisma.$queryRaw<CharacterRecord[]>`
        SELECT * FROM "Character"
        WHERE "userId" = ${user.id}
        LIMIT 1
      `;

      if (character) {
        const defaultRewards = {
          experience: 50,
          gold: 25
        } as const;

        await prisma.$executeRaw`
          UPDATE "Character"
          SET 
            exp = exp + ${defaultRewards.experience},
            stats = jsonb_set(
              stats::jsonb,
              '{gold}',
              ((COALESCE((stats->>'gold')::int, 0) + ${defaultRewards.gold})::text)::jsonb
            )
          WHERE id = ${character.id}
        `;
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
export async function PATCH(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const questCompletions = await prisma.questCompletion.findMany({
      where: {
        user: {
          email: session.user.email
        }
      },
      orderBy: {
        date: 'desc'
      }
    });

    // Convert to CSV
    let csv = 'date,name,category,completed\n';
    questCompletions.forEach(completion => {
      csv += `${completion.date.toISOString()},${completion.questName},${completion.category},${completion.completed}\n`;
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