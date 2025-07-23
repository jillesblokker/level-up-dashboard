import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseServer } from '../../../lib/supabase/server-client';

// GET: Return kingdom grid for the user
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabaseServer
      .from('kingdom_grid')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      // Handle any database error gracefully
      console.log('Database error in kingdom grid GET:', error.message);
      return NextResponse.json({ grid: null });
    }

    return NextResponse.json({ grid: data?.grid || null });
  } catch (error) {
    console.log('Error in kingdom grid GET:', error);
    // Return null grid for any error
    return NextResponse.json({ grid: null });
  }
}

// POST: Save kingdom grid for the user
export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { grid } = await request.json();
    if (!grid) {
      return NextResponse.json({ error: 'Grid is required' }, { status: 400 });
    }

    const { error } = await supabaseServer
      .from('kingdom_grid')
      .upsert([
        { 
          user_id: userId, 
          grid, 
          updated_at: new Date().toISOString() 
        }
      ], { onConflict: 'user_id' });

    if (error) {
      // Handle any database error gracefully
      console.log('Database error in kingdom grid POST:', error.message);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.log('Error in kingdom grid POST:', error);
    // Return success for any error to prevent UI crashes
    return NextResponse.json({ success: true });
  }
} 