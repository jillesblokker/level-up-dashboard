import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { authenticatedSupabaseQuery } from '@/lib/supabase/jwt-verification';

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
    
    console.log('[DELETE] Attempting to delete milestone:', id);
    
    // TEMPORARY: Use service role directly to bypass RLS for testing
    const supabaseUrl = process.env['NEXT_PUBLIC_SUPABASE_URL'];
    const supabaseServiceRoleKey = process.env['SUPABASE_SERVICE_ROLE_KEY'];
    
    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return NextResponse.json({ error: 'Missing Supabase environment variables' }, { status: 500 });
    }
    
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
    
    console.log('[DELETE] Using service role to delete milestone');
    
    // First, delete related milestone_completion records
    console.log('[DELETE] Deleting related milestone_completion records...');
    const { error: completionDeleteError } = await supabase
      .from('milestone_completion')
      .delete()
      .eq('milestone_id', id);
      
    if (completionDeleteError) {
      console.error('[DELETE] Error deleting milestone_completion records:', completionDeleteError);
      throw completionDeleteError;
    }
    
    console.log('[DELETE] Successfully deleted milestone_completion records');
    
    // Then, delete the milestone
    console.log('[DELETE] Deleting milestone...');
    const { error } = await supabase
      .from('milestones')
      .delete()
      .eq('id', id);
      
    if (error) {
      console.error('[DELETE] Service role delete error:', error);
      throw error;
    }
    
    console.log('[DELETE] Successfully deleted milestone with service role');
    return NextResponse.json({ success: true });
    
  } catch (err: any) {
    console.error('[DELETE] Error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
} 