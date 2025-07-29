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

    console.log('[Migration] Applying milestones DELETE policy fix...');

    // Drop the existing view-only policy
    const { error: dropError } = await supabase.rpc('exec_sql', {
      sql: 'DROP POLICY IF EXISTS "All authenticated users can view milestones" ON milestones;'
    });

    if (dropError) {
      console.error('[Migration] Error dropping old policy:', dropError);
      return NextResponse.json({ error: 'Failed to drop old policy' }, { status: 500 });
    }

    // Create the new comprehensive policy
    const { error: createError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE POLICY "Authenticated users can manage milestones" ON milestones
        FOR ALL USING (auth.get_user_id() IS NOT NULL);
      `
    });

    if (createError) {
      console.error('[Migration] Error creating new policy:', createError);
      return NextResponse.json({ error: 'Failed to create new policy' }, { status: 500 });
    }

    // Create index for performance
    const { error: indexError } = await supabase.rpc('exec_sql', {
      sql: 'CREATE INDEX IF NOT EXISTS idx_milestones_user_id ON milestones(user_id);'
    });

    if (indexError) {
      console.error('[Migration] Error creating index:', indexError);
      // Don't fail the whole migration for index error
    }

    console.log('[Migration] Successfully applied milestones DELETE policy fix');
    return NextResponse.json({ success: true, message: 'Migration applied successfully' });

  } catch (error) {
    console.error('[Migration] Error applying migration:', error);
    return NextResponse.json({ error: 'Failed to apply migration' }, { status: 500 });
  }
}