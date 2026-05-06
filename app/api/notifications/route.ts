import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

function getSupabaseAdmin() {
  return createClient(
    process.env['NEXT_PUBLIC_SUPABASE_URL']!,
    process.env['SUPABASE_SERVICE_ROLE_KEY']!,
    { auth: { persistSession: false } }
  );
}

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    return NextResponse.json(data || [], {
      headers: {
        'Cache-Control': 'private, s-maxage=0, max-age=10, must-revalidate',
      }
    });
  } catch (err) {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const notificationIds = body.notificationIds;

    const supabase = getSupabaseAdmin();
    let query = supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId);

    if (Array.isArray(notificationIds) && notificationIds.length > 0) {
      query = query.in('id', notificationIds);
    } else if (notificationIds === 'all') {
      // Mark all as read
    } else {
      return NextResponse.json({ message: 'No IDs provided', success: false }, { status: 400 });
    }

    const { data, error } = await query.select();
    if (error) {
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({ notificationIds: 'all' }));
    const notificationIds = body.notificationIds;

    const supabase = getSupabaseAdmin();
    let query = supabase
      .from('notifications')
      .delete()
      .eq('user_id', userId);

    if (Array.isArray(notificationIds) && notificationIds.length > 0) {
      query = query.in('id', notificationIds);
    } else if (notificationIds === 'all') {
      // Delete all
    } else {
      return NextResponse.json({ message: 'No IDs provided', success: false }, { status: 400 });
    }

    const { error } = await query;
    if (error) {
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}