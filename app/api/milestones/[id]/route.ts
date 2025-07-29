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
    
    // Use authenticated Supabase query with proper Clerk JWT verification
    const result = await authenticatedSupabaseQuery(request, async (supabase, userId) => {
      const { error } = await supabase
        .from('milestones')
        .delete()
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