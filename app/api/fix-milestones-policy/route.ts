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

    console.log('[Fix Policy] Applying milestones RLS policy fix...');

    // Drop the existing policy
    const { error: dropError } = await supabase.rpc('exec_sql', {
      sql: 'DROP POLICY IF EXISTS "Authenticated users can manage milestones" ON milestones;'
    });

    if (dropError) {
      console.error('[Fix Policy] Error dropping policy:', dropError);
    }

    // Create the new specific policy
    const { error: createError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE POLICY "Users can manage own milestones" ON milestones
        FOR ALL USING (user_id = auth.uid());
      `
    });

    if (createError) {
      console.error('[Fix Policy] Error creating policy:', createError);
      return NextResponse.json({ error: 'Failed to create policy' }, { status: 500 });
    }

    console.log('[Fix Policy] Successfully applied milestones RLS policy fix');
    return NextResponse.json({ success: true, message: 'Policy updated successfully' });

  } catch (error) {
    console.error('[Fix Policy] Error:', error);
    return NextResponse.json({ error: 'Failed to fix policy' }, { status: 500 });
  }
}