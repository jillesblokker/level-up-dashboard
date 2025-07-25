import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabase } from '@/lib/supabase/client';

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const body = await request.json();
    const { action } = body;
    if (!action) {
      return NextResponse.json({ error: 'Action is required' }, { status: 400 });
    }
    // Call the increment_user_progress function
    const { data, error } = await supabase.rpc('increment_user_progress', {
      user_id: userId,
      column_name: action
    });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true, newValue: data?.[0]?.new_value ?? null });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
} 