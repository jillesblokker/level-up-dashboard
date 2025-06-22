import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export async function GET() {
  try {
    const { userId } = await auth();
    
    return NextResponse.json({
      authenticated: !!userId,
      userId,
      authMethod: 'clerk'
    });
  } catch (error) {
    return NextResponse.json({
      authenticated: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      authMethod: 'clerk'
    });
  }
} 