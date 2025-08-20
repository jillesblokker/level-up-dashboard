import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { supabaseServer } from '../../../lib/supabase/server-client';

// Helper to extract and verify Clerk JWT, returns userId or null
async function getUserIdFromRequest(request: Request): Promise<string | null> {
  try {
    const { userId } = getAuth(request as NextRequest);
    return userId || null;
  } catch (e) {
    console.error('[Kingdom Stats] JWT verification failed:', e);
    return null;
  }
}

// Helper to get date ranges for each period
function getDateRange(period: string): string[] {
  const now = new Date();
  let days: string[] = [];
  if (period === 'week') {
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push(d.toISOString().slice(0, 10));
    }
  } else if (period === 'month') {
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push(d.toISOString().slice(0, 10));
    }
  } else if (period === 'year') {
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      days.push(d.toISOString().slice(0, 7));
    }
  } else if (period === 'all') {
    days = ['all'];
  }
  return days;
}

export async function GET(request: Request) {
  try {
    console.log('[Kingdom Stats] API called');
    
    const userId = await getUserIdFromRequest(request);
    console.log('[Kingdom Stats] User ID:', userId);
    
    if (!userId) {
      console.log('[Kingdom Stats] No user ID, returning 401');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { searchParams } = new URL(request.url);
    const tab = searchParams.get('tab') || 'challenges';
    const period = searchParams.get('period') || 'week';
    
    console.log('[Kingdom Stats] Tab:', tab, 'Period:', period);

    // For now, just return a simple response to test if the API works at all
    if (tab === 'quests') {
      console.log('[Kingdom Stats] Returning quests data');
      return NextResponse.json({ 
        data: [
          { day: '2024-01-01', value: 5 },
          { day: '2024-01-02', value: 3 },
          { day: '2024-01-03', value: 7 }
        ] 
      });
    }

    if (tab === 'challenges') {
      console.log('[Kingdom Stats] Returning challenges data');
      return NextResponse.json({ 
        data: [
          { day: '2024-01-01', value: 2 },
          { day: '2024-01-02', value: 4 },
          { day: '2024-01-03', value: 1 }
        ] 
      });
    }

    if (tab === 'milestones') {
      console.log('[Kingdom Stats] Returning milestones data');
      return NextResponse.json({ 
        data: [
          { day: '2024-01-01', value: 1 },
          { day: '2024-01-02', value: 0 },
          { day: '2024-01-03', value: 2 }
        ] 
      });
    }

    if (tab === 'gold') {
      console.log('[Kingdom Stats] Returning gold data');
      return NextResponse.json({ 
        data: [
          { day: '2024-01-01', value: 150 },
          { day: '2024-01-02', value: 200 },
          { day: '2024-01-03', value: 100 }
        ] 
      });
    }

    if (tab === 'experience') {
      console.log('[Kingdom Stats] Returning experience data');
      return NextResponse.json({ 
        data: [
          { day: '2024-01-01', value: 50 },
          { day: '2024-01-02', value: 75 },
          { day: '2024-01-03', value: 25 }
        ] 
      });
    }

    if (tab === 'level') {
      console.log('[Kingdom Stats] Returning level data');
      return NextResponse.json({ 
        data: [
          { day: '2024-01-01', value: 5 },
          { day: '2024-01-02', value: 6 },
          { day: '2024-01-03', value: 7 }
        ] 
      });
    }

    // For other tabs, return empty data
    console.log('[Kingdom Stats] Returning empty data for unknown tab');
    const data = [{ day: '2024-01-01', value: 0 }];
    return NextResponse.json({ data });

  } catch (error) {
    console.error('[Kingdom Stats] API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 