import { logger } from "@/lib/logger";
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
      logger.error('[Notifications API] GET Error:', error);
      return NextResponse.json({ error: 'Database error', details: error.message }, { status: 500 });
    }

    // Wrap in object with 'notifications' key as expected by NotificationCenter.tsx
    return NextResponse.json({ notifications: data || [] }, {
      headers: {
        'Cache-Control': 'private, s-maxage=0, max-age=10, must-revalidate',
      }
    });
  } catch (err: any) {
    logger.error('[Notifications API] GET Exception:', err);
    return NextResponse.json({ error: 'Internal error', details: err.message }, { status: 500 });
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
      // Mark all as read for this user
    } else {
      return NextResponse.json({ message: 'No IDs provided', success: false }, { status: 400 });
    }

    const { data, error } = await query.select();
    if (error) {
      logger.error('[Notifications API] PATCH Error:', error);
      return NextResponse.json({ error: 'Database error', details: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, notifications: data });
  } catch (err: any) {
    logger.error('[Notifications API] PATCH Exception:', err);
    return NextResponse.json({ error: 'Internal error', details: err.message }, { status: 500 });
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
      logger.error('[Notifications API] DELETE Error:', error);
      return NextResponse.json({ error: 'Database error', details: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    logger.error('[Notifications API] DELETE Exception:', err);
    return NextResponse.json({ error: 'Internal error', details: err.message }, { status: 500 });
  }
}