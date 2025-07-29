import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
  try {
    const supabaseUrl = process.env['NEXT_PUBLIC_SUPABASE_URL'];
    const supabaseServiceRoleKey = process.env['SUPABASE_SERVICE_ROLE_KEY'];

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return NextResponse.json({ error: 'Missing Supabase environment variables' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    console.log('[Simple Policy] Applying simple milestones RLS policy...');

    // Drop all existing policies
    const { error: dropError } = await supabase.rpc('exec_sql', {
      sql: `
        DROP POLICY IF EXISTS "All authenticated users can view milestones" ON milestones;
        DROP POLICY IF EXISTS "Authenticated users can manage milestones" ON milestones;
        DROP POLICY IF EXISTS "Users can manage own milestones" ON milestones;
      `
    });

    if (dropError) {
      console.error('[Simple Policy] Error dropping policies:', dropError);
    }

    // Create a simple policy that allows any authenticated user to manage milestones
    const { error: createError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE POLICY "Any authenticated user can manage milestones" ON milestones
        FOR ALL USING (auth.uid() IS NOT NULL);
      `
    });

    if (createError) {
      console.error('[Simple Policy] Error creating policy:', createError);
      return NextResponse.json({ error: 'Failed to create policy' }, { status: 500 });
    }

    console.log('[Simple Policy] Successfully applied simple milestones RLS policy');
    return NextResponse.json({ success: true, message: 'Simple policy applied successfully' });

  } catch (error) {
    console.error('[Simple Policy] Error:', error);
    return NextResponse.json({ error: 'Failed to apply simple policy' }, { status: 500 });
  }
}