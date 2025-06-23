import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';

// Create a new quest completion
export async function POST(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const { category, questName } = data;

    const questCompletion = await prisma.questCompletion.create({
      data: {
        userId,
        category,
        questName,
        date: new Date()
      }
    });

    return NextResponse.json(questCompletion);
  } catch (error) {
    console.error('Error creating quest completion:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Get quest completions for the current user
export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const questCompletions = await prisma.questCompletion.findMany({
      where: {
        userId
      },
      orderBy: {
        date: 'desc'
      }
    });

    return NextResponse.json(questCompletions);
  } catch (error) {
    console.error('Error fetching quest completions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
