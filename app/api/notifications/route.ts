import { logger } from "@/lib/logger";
import { NextResponse } from 'next/server';
import { verifyClerkJWT } from '@/lib/supabase/jwt-verification';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

function getSupabaseAdmin() {
  const url = process.env['NEXT_PUBLIC_SUPABASE_URL'];
  const key = process.env['SUPABASE_SERVICE_ROLE_KEY'] || process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'];
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function GET(req: Request) {
  try {
    const authResult = await verifyClerkJWT(req);
    const userId = authResult.userId;
    if (!userId) {
      return NextResponse.json({ notifications: [] });
    }

    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json({ notifications: [] });
    }

    const queryPromise = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);

    const timeoutPromise = new Promise<{ data: any; error: any }>((_, reject) =>
      setTimeout(() => reject(new Error('Notifications query timeout')), 4000)
    );

    const { data, error } = await Promise.race([queryPromise, timeoutPromise]) as any;

    if (error) {
      logger.error('[Notifications API] GET Error:', error);
      return NextResponse.json({ notifications: [] });
    }

    // Auto-archive read notifications older than 24 hours to maintain a zero-clutter inbox
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const freshNotifications = (data || []).filter((item: any) => {
      if (item.read && item.created_at && item.created_at < twentyFourHoursAgo) {
        return false;
      }
      return true;
    });

    // Wrap in object with 'notifications' key as expected by NotificationCenter.tsx
    return NextResponse.json({ notifications: freshNotifications }, {
      headers: {
        'Cache-Control': 'private, s-maxage=0, max-age=10, must-revalidate',
      }
    });
  } catch (err: any) {
    logger.error('[Notifications API] GET Exception:', err);
    return NextResponse.json({ notifications: [] });
  }
}

export async function PATCH(req: Request) {
  try {
    const authResult = await verifyClerkJWT(req);
    const userId = authResult.userId;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const notificationIds = body.notificationIds;

    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json({ error: 'Database service unavailable' }, { status: 503 });
    }
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
    const authResult = await verifyClerkJWT(req);
    const userId = authResult.userId;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({ notificationIds: 'all' }));
    const notificationIds = body.notificationIds;

    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json({ error: 'Database service unavailable' }, { status: 503 });
    }
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