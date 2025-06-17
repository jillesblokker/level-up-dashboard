import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import getPrismaClient from '@/lib/prisma';

// Create a new quest completion
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const { category, questName } = data;

    const prisma = getPrismaClient();
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const questCompletion = await prisma.questCompletion.create({
      data: {
        userId: user.id,
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
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const prisma = getPrismaClient();
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const questCompletions = await prisma.questCompletion.findMany({
      where: {
        userId: user.id
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