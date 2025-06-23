import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { achievementId } = body;

    if (!achievementId) {
      return NextResponse.json({ error: 'Achievement ID is required' }, { status: 400 });
    }

    // Check if achievement is already unlocked
    const existingAchievement = await prisma.achievement.findUnique({
      where: {
        userId_achievementId: {
          userId,
          achievementId
        }
      }
    });

    if (existingAchievement) {
      return NextResponse.json({ 
        success: true, 
        achievementId,
        message: 'Achievement already unlocked',
        alreadyUnlocked: true
      });
    }

    // Create new achievement unlock
    const achievement = await prisma.achievement.create({
      data: {
        userId,
        achievementId,
        unlocked: true,
        unlockedAt: new Date()
      }
    });

    console.log(`Achievement unlocked: ${achievementId} for user: ${userId}`);

    return NextResponse.json({ 
      success: true, 
      achievementId,
      message: 'Achievement unlocked successfully',
      achievement
    });
  } catch (error) {
    console.error('Error unlocking achievement:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 