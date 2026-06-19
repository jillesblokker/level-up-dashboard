const fs = require('fs');
const file = 'app/api/inventory/route.ts';

const content = `import { logger } from "@/lib/logger";
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseServer } from '@/lib/supabase/server-client';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const category = searchParams.get('category');
    const itemId = searchParams.get('itemId');
    const equipped = searchParams.get('equipped');

    let query = supabaseServer
      .from('inventory_items')
      .select('*')
      .eq('user_id', userId);

    if (type) query = query.eq('type', type);
    if (category) query = query.eq('category', category);
    if (itemId) query = query.eq('item_id', itemId);
    if (equipped === 'true') query = query.eq('equipped', true);
    if (equipped === 'false') query = query.eq('equipped', false);

    const { data, error } = await query;
    if (error) {
      logger.error('[Inventory API] GET DB Error:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    const formattedData = (data || []).map((row: any) => ({
      ...row,
      id: row.item_id,
      stats: row.stats || {},
    }));

    if (itemId && formattedData.length > 0) {
      return NextResponse.json({ success: true, data: formattedData[0] });
    }

    return NextResponse.json({ success: true, data: formattedData });
  } catch (error) {
    logger.error('[Inventory API] GET Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  return NextResponse.json({ error: 'Not implemented' }, { status: 501 });
}

export async function PATCH(request: Request) {
  return NextResponse.json({ error: 'Not implemented' }, { status: 501 });
}

export async function DELETE(request: Request) {
  return NextResponse.json({ error: 'Not implemented' }, { status: 501 });
}
`;

fs.writeFileSync(file, content);
