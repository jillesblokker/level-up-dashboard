import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { authenticatedSupabaseQuery } from '@/lib/supabase/jwt-verification';
import { apiLogger } from '@/lib/logger';

// Using any for context to avoid Next.js type conflicts across versions
// In Next.js 15, params is a Promise. In 14, it's an object.
export async function PATCH(
  request: NextRequest,
  context: any
) {
  try {
    const params = context.params;
    const id = params?.id;
    const body = await request.json();

    // Use authenticated Supabase query with proper Clerk JWT verification
    const result = await authenticatedSupabaseQuery(request, async (supabase) => {
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
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  context: any
) {
  try {
    const params = context.params;
    const id = params?.id;

    apiLogger.debug(`Attempting to delete milestone: ${id}`);

    // Use service role directly to bypass RLS
    const supabaseUrl = process.env['NEXT_PUBLIC_SUPABASE_URL'];
    const supabaseServiceRoleKey = process.env['SUPABASE_SERVICE_ROLE_KEY'];

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return NextResponse.json({ error: 'Missing Supabase environment variables' }, { status: 500 });
    }

    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    // First, delete related milestone_completion records
    const { error: completionDeleteError } = await supabase
      .from('milestone_completion')
      .delete()
      .eq('milestone_id', id);

    if (completionDeleteError) {
      apiLogger.error('Error deleting milestone_completion records:', completionDeleteError.message);
      throw completionDeleteError;
    }

    // Then, delete the milestone
    const { error } = await supabase
      .from('milestones')
      .delete()
      .eq('id', id);

    if (error) {
      apiLogger.error('Service role delete error:', error.message);
      throw error;
    }

    apiLogger.debug('Successfully deleted milestone');
    return NextResponse.json({ success: true });

  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Internal server error';
    apiLogger.error('Milestone delete error:', errorMessage);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}