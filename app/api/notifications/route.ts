import { NextRequest, NextResponse } from 'next/server';
import { authenticatedSupabaseQuery } from '@/lib/supabase/jwt-verification';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const result = await authenticatedSupabaseQuery(req, async (supabase, userId) => {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;
    return data;
  });

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 401 });
  }

  // Normalize data to array if it's not already
  return NextResponse.json(result.data || []);
}

// Mark notifications as read
export async function PATCH(req: NextRequest) {
  try {
    const { notificationIds } = await req.json(); // Array of IDs or 'all'

    const result = await authenticatedSupabaseQuery(req, async (supabase, userId) => {
      let query = supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', userId);

      if (Array.isArray(notificationIds) && notificationIds.length > 0) {
        query = query.in('id', notificationIds);
      } else if (notificationIds === 'all') {
        // Mark all as read
      } else {
        return { message: 'No IDs provided', success: false }; // Return indicator
      }

      const { data, error } = await query.select();
      if (error) throw error;
      return data;
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 401 });
    }

    return NextResponse.json(result.data);

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}