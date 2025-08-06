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

    // Get all tables in the public schema
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public');

    if (tablesError) {
      return NextResponse.json({ error: tablesError.message }, { status: 500 });
    }

    // Get columns for quest_completion table specifically
    const { data: questCompletionColumns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_schema', 'public')
      .eq('table_name', 'quest_completion');

    // Get a sample of quest_completion data
    const { data: questCompletionSample, error: sampleError } = await supabase
      .from('quest_completion')
      .select('*')
      .limit(5);

    return NextResponse.json({
      tables: tables?.map(t => t.table_name) || [],
      questCompletionColumns: questCompletionColumns || [],
      questCompletionSample: questCompletionSample || [],
      errors: {
        tablesError: tablesError?.message,
        columnsError: columnsError?.message,
        sampleError: sampleError?.message
      }
    });

  } catch (error) {
    console.error('Error inspecting schema:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 