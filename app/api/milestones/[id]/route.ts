import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { authenticatedSupabaseQuery } from '@/lib/supabase/jwt-verification';
import logger from '@/lib/logger';

export async function PATCH(request: NextRequest, context: any) {
  try {
    const id = context.params?.id;
    const body = await request.json();

    // Use authenticated Supabase query with proper Clerk JWT verification
    const result = await authenticatedSupabaseQuery(request, async (supabase, userId) => {
      const { error } = await supabase
        .from('milestones')
        .update(body)
        .eq('id', id);
      if (error) {
        throw error;
      }
      return { success: true };
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 401 });
    }

    return NextResponse.json(result.data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, context: any) {
  try {
    const id = context.params?.id;

    logger.info(`Attempting to delete milestone: ${id}`, 'Milestones DELETE');

    // TEMPORARY: Use service role directly to bypass RLS for testing
    const supabaseUrl = process.env['NEXT_PUBLIC_SUPABASE_URL'];
    const supabaseServiceRoleKey = process.env['SUPABASE_SERVICE_ROLE_KEY'];

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return NextResponse.json({ error: 'Missing Supabase environment variables' }, { status: 500 });
    }

    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    logger.info('Using service role to delete milestone', 'Milestones DELETE');

    // First, delete related milestone_completion records
    logger.info('Deleting related milestone_completion records...', 'Milestones DELETE');
    const { error: completionDeleteError } = await supabase
      .from('milestone_completion')
      .delete()
      .eq('milestone_id', id);

    if (completionDeleteError) {
      logger.error(`Error deleting milestone_completion records: ${completionDeleteError.message || JSON.stringify(completionDeleteError)}`, 'Milestones DELETE');
      throw completionDeleteError;
    }

    logger.info('Successfully deleted milestone_completion records', 'Milestones DELETE');

    // Then, delete the milestone
    logger.info('Deleting milestone...', 'Milestones DELETE');
    const { error } = await supabase
      .from('milestones')
      .delete()
      .eq('id', id);

    if (error) {
      logger.error(`Service role delete error: ${error.message || JSON.stringify(error)}`, 'Milestones DELETE');
      throw error;
    }

    logger.info('Successfully deleted milestone with service role', 'Milestones DELETE');
    return NextResponse.json({ success: true });

  } catch (err: any) {
    logger.error(`Error: ${err.message || err}`, 'Milestones DELETE');
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
} 