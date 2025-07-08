import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server-client';

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
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const tab = searchParams.get('tab') || 'challenges';
    const period = searchParams.get('period') || 'week';
    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }
    const days = getDateRange(period);
    // TODO: Replace with real aggregation logic from Supabase for each tab
    // For now, return dummy data (all zeros)
    const data = days.map(day => ({ day, value: 0 }));
    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 