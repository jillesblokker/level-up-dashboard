import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({ 
      userId,
      userIdType: typeof userId,
      userIdLength: userId.length,
      isUUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)
    });

  } catch (error) {
    console.error('Error in auth debug API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 