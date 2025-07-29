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

    // Get the milestone ID from the request body
    const { milestoneId } = await req.json();

    console.log('[Test Delete] Checking milestone:', milestoneId);

    // Get the milestone data
    const { data: milestone, error: fetchError } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT id, name, user_id, category 
        FROM milestones 
        WHERE id = '${milestoneId}';
      `
    });

    if (fetchError) {
      console.error('[Test Delete] Error fetching milestone:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch milestone' }, { status: 500 });
    }

    console.log('[Test Delete] Milestone data:', milestone);

    // Try to delete the milestone directly with service role
    const { error: deleteError } = await supabase.rpc('exec_sql', {
      sql: `
        DELETE FROM milestones 
        WHERE id = '${milestoneId}';
      `
    });

    if (deleteError) {
      console.error('[Test Delete] Error deleting milestone:', deleteError);
      return NextResponse.json({ error: 'Failed to delete milestone' }, { status: 500 });
    }

    console.log('[Test Delete] Successfully deleted milestone');
    return NextResponse.json({ success: true, message: 'Milestone deleted successfully' });

  } catch (error) {
    console.error('[Test Delete] Error:', error);
    return NextResponse.json({ error: 'Failed to test delete' }, { status: 500 });
  }
}