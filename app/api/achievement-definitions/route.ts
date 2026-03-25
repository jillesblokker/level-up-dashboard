import { logger } from "@/lib/logger";
import { NextResponse } from 'next/server';
import { supabaseServer } from '../../../lib/supabase/server-client';

export async function GET() {
  try {
    logger.debug('[ACHIEVEMENT-DEFINITIONS][GET] Fetching achievement definitions...');
    
    const { data, error } = await supabaseServer
      .from('achievement_definitions')
      .select('*')
      .order('id', { ascending: true });

    if (error) {
      logger.error('[ACHIEVEMENT-DEFINITIONS][GET] Query error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    logger.debug('[ACHIEVEMENT-DEFINITIONS][GET] Successfully fetched:', data?.length || 0, 'definitions');
    return NextResponse.json(data || []);
  } catch (error) {
    logger.error('[ACHIEVEMENT-DEFINITIONS][GET] Internal server error:', error instanceof Error ? error.stack : error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 