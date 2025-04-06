import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const path = searchParams.get('path');

    if (!path) {
      return NextResponse.json({ error: 'No path provided' }, { status: 400 });
    }

    // Return the path directly
    return NextResponse.json({ path });
  } catch (error) {
    console.error('Error in images API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 