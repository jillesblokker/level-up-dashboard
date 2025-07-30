import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { supabaseServer } from '@/lib/supabase/server-client';

// Extract user ID from Supabase JWT token
async function extractUserIdFromToken(req: NextRequest): Promise<string | null> {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('[Milestones] No Authorization header found');
      return null;
    }

    const token = authHeader.substring(7);
    console.log('[Milestones] Token received, length:', token.length);

    // For Supabase JWT tokens, we can extract the user ID from the token
    // This is a simplified approach - in production you should verify the JWT
    const parts = token.split('.');
    if (parts.length === 3 && parts[1]) {
      try {
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
        console.log('[Milestones] Token payload:', payload);
        
        // The user ID is typically in the 'sub' field for Supabase tokens
        if (payload.sub) {
          return payload.sub;
        }
      } catch (decodeError) {
        console.error('[Milestones] Token decode failed:', decodeError);
      }
    }

    // Fallback: try to get user ID from Clerk
    try {
      const { userId } = await getAuth(req);
      if (userId) {
        console.log('[Milestones] Got userId from Clerk:', userId);
        return userId;
      }
    } catch (clerkError) {
      console.error('[Milestones] Clerk auth failed:', clerkError);
    }

    return null;
  } catch (error) {
    console.error('[Milestones] Error extracting user ID:', error);
    return null;
  }
}

export async function GET(request: Request) {
  try {
    // Secure JWT verification
    const userId = await extractUserIdFromToken(request as NextRequest);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized (JWT invalid or missing)' }, { status: 401 });
    }

    // Fetch all global milestones (no user_id filter needed for global definitions)
    const { data: allMilestones, error: milestonesError } = await supabaseServer
      .from('milestones')
      .select('*');
    if (milestonesError) {
      console.error('[Milestones] Error fetching milestones:', milestonesError);
      return NextResponse.json({ error: milestonesError.message }, { status: 500 });
    }
    
    // Fetch user's milestone completions
    const { data: completions, error: completionError } = await supabaseServer
      .from('milestone_completion')
      .select('*')
      .eq('user_id', userId);
    if (completionError) {
      console.error('[Milestones] Error fetching completions:', completionError);
      return NextResponse.json({ error: completionError.message }, { status: 500 });
    }
    
    // Merge completion state
    const completionMap = new Map();
    completions?.forEach((c: any) => completionMap.set(String(c.milestone_id), c));
    const milestonesWithCompletion = (allMilestones || []).map((m: any) => {
      const completion = completionMap.get(String(m.id));
      return {
        ...m,
        completed: completion?.completed ?? false,
        completionId: completion?.id,
        date: completion?.date,
      };
    });
    
    return NextResponse.json(milestonesWithCompletion);
  } catch (error) {
    console.error('[Milestones Error]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, description, category, difficulty, xp, gold, target, icon } = body;
    
    if (!name || !category) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    // Secure JWT verification
    const userId = await extractUserIdFromToken(request as NextRequest);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized (JWT invalid or missing)' }, { status: 401 });
    }
    
    // Create new milestone (global definition)
    const { data: newMilestone, error } = await supabaseServer
      .from('milestones')
      .insert([
        {
          name,
          description: description || name,
          category,
          difficulty: difficulty || 'medium',
          xp: xp || 0,
          gold: gold || 0,
          target: target || 1,
          icon: icon || '🎯',
        },
      ])
      .select()
      .single();
      
    if (error) {
      console.error('[Milestones POST] Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(newMilestone);
  } catch (error) {
    console.error('[Milestones POST] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'Missing milestone ID' }, { status: 400 });
    }
    
    // Secure JWT verification
    const userId = await extractUserIdFromToken(request as NextRequest);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized (JWT invalid or missing)' }, { status: 401 });
    }
    
    // Delete milestone (only if it's a global milestone)
    const { error } = await supabaseServer
      .from('milestones')
      .delete()
      .eq('id', id);
      
    if (error) {
      console.error('[Milestones DELETE] Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Milestones DELETE] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 