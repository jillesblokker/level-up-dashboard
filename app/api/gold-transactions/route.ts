import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { apiLogger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { amount, balanceAfter, transactionType, source, metadata } = body;

    apiLogger.info('[Gold Transaction Log]', {
      userId,
      amount,
      balanceAfter,
      transactionType,
      source,
      metadata,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    apiLogger.error('Error logging gold transaction:', error);
    return NextResponse.json({ success: true }); // Return 200 so background logger never fails UI
  }
}

export async function GET() {
  return NextResponse.json({ success: true, data: [] });
}