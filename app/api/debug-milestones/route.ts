import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(req: NextRequest) {
  try {
    const supabaseUrl = process.env['NEXT_PUBLIC_SUPABASE_URL'];
    const supabaseServiceRoleKey = process.env['SUPABASE_SERVICE_ROLE_KEY'];

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return NextResponse.json({ error: 'Missing Supabase environment variables' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    console.log('[Debug] Checking milestones table structure and policies...');

    // Check table structure
    const { data: tableInfo, error: tableError } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_name = 'milestones' 
        ORDER BY ordinal_position;
      `
    });

    if (tableError) {
      console.error('[Debug] Error getting table structure:', tableError);
    }

    // Check RLS policies
    const { data: policies, error: policiesError } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
        FROM pg_policies 
        WHERE tablename = 'milestones';
      `
    });

    if (policiesError) {
      console.error('[Debug] Error getting policies:', policiesError);
    }

    // Check if RLS is enabled
    const { data: rlsEnabled, error: rlsError } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT schemaname, tablename, rowsecurity 
        FROM pg_tables 
        WHERE tablename = 'milestones';
      `
    });

    if (rlsError) {
      console.error('[Debug] Error checking RLS:', rlsError);
    }

    // Get a sample milestone to check user_id
    const { data: sampleMilestone, error: sampleError } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT id, name, user_id, category 
        FROM milestones 
        LIMIT 1;
      `
    });

    if (sampleError) {
      console.error('[Debug] Error getting sample milestone:', sampleError);
    }

    return NextResponse.json({
      tableStructure: tableInfo,
      policies: policies,
      rlsEnabled: rlsEnabled,
      sampleMilestone: sampleMilestone
    });

  } catch (error) {
    console.error('[Debug] Error:', error);
    return NextResponse.json({ error: 'Failed to debug milestones' }, { status: 500 });
  }
}