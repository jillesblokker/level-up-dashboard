import { NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { supabaseServer } from '../../../lib/supabase/server-client';

export async function GET(request: Request) {
  try {
    // Secure Clerk JWT verification
    const { userId } = getAuth(request as any);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = supabaseServer;
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase client not initialized' }, { status: 500 });
    }

    // Test 1: Check if checked_quests table exists
    const { data: checkedQuestsData, error: checkedQuestsError } = await supabase
      .from('checked_quests')
      .select('*')
      .limit(1);

    // Test 2: Get table schema
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_schema', 'public')
      .eq('table_name', 'checked_quests');

    // Test 3: Get all tables
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public');

    return NextResponse.json({
      checkedQuests: {
        exists: !checkedQuestsError,
        error: checkedQuestsError?.message,
        data: checkedQuestsData
      },
      columns: columns || [],
      columnsError: columnsError?.message,
      allTables: tables?.map(t => t.table_name) || [],
      tablesError: tablesError?.message
    });

  } catch (error) {
    console.error('Error testing database:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 