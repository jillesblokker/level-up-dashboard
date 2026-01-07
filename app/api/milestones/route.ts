import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { authenticatedSupabaseQuery } from '@/lib/supabase/jwt-verification';
import logger from '@/lib/logger';
import { calculateRewards } from '@/lib/game-logic';

export async function GET(request: Request) {
  try {
    const result = await authenticatedSupabaseQuery(request, async (supabase, userId) => {
      // Fetch milestones (user's own + global milestones with user_id = NULL)
      const { data: allMilestones, error: milestonesError } = await supabase
        .from('milestones')
        .select('*')
        .or(`user_id.is.null,user_id.eq.${userId}`);
      if (milestonesError) {
        console.error('[Milestones] Error fetching milestones:', milestonesError);
        throw milestonesError;
      }

      // Fetch user's milestone completions
      const { data: completions, error: completionError } = await supabase
        .from('milestone_completion')
        .select('*')
        .eq('user_id', userId);
      if (completionError) {
        console.error('[Milestones] Error fetching completions:', completionError);
        throw completionError;
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

      return milestonesWithCompletion;
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 401 });
    }

    return NextResponse.json(result.data, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch (error) {
    console.error('[Milestones Error]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, description, category, difficulty, target, icon } = body;

    if (!name || !category) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const result = await authenticatedSupabaseQuery(request, async (supabase, userId) => {
      const rewards = calculateRewards(difficulty || 'medium');
      // Create new milestone (global definition)
      const { data: newMilestone, error } = await supabase
        .from('milestones')
        .insert([
          {
            name,
            description: description || name,
            category,
            difficulty: difficulty || 'medium',
            xp: rewards.xp,
            gold: rewards.gold,
            target: target || 1,
            icon: icon || '🎯',
          },
        ])
        .select()
        .single();

      if (error) {
        console.error('[Milestones POST] Error:', error);
        throw error;
      }

      return newMilestone;
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 401 });
    }

    return NextResponse.json(result.data);
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

    const result = await authenticatedSupabaseQuery(request, async (supabase, userId) => {
      // Delete milestone (only if it's a global milestone)
      const { error } = await supabase
        .from('milestones')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('[Milestones DELETE] Error:', error);
        throw error;
      }

      return { success: true };
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 401 });
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error('[Milestones DELETE] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { milestoneId, completed } = body;

    if (!milestoneId || completed === undefined) {
      return NextResponse.json({ error: "Missing milestoneId or completed status" }, { status: 400 });
    }

    const result = await authenticatedSupabaseQuery(request, async (supabase, userId) => {
      if (completed) {
        // Mark milestone as completed
        const { data, error } = await supabase
          .from("milestone_completion")
          .upsert({
            user_id: userId,
            milestone_id: milestoneId,
            completed: true,
            date: new Date().toISOString().split('T')[0], // Use date format (YYYY-MM-DD)
          }, { onConflict: "user_id,milestone_id" })
          .select()
          .single();

        if (error) {
          console.error("[Milestones PUT] Error upserting completion:", error);
          throw error;
        }

        return data;
      } else {
        // Mark milestone as not completed (delete the completion record)
        const { error } = await supabase
          .from("milestone_completion")
          .delete()
          .eq("user_id", userId)
          .eq("milestone_id", milestoneId);

        if (error) {
          console.error("[Milestones PUT] Error deleting completion:", error);
          throw error;
        }

        return { success: true };
      }
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 401 });
    }

    return NextResponse.json(result.data, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch (error) {
    console.error("[Milestones PUT] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH: Update a specific milestone
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, name, description, category, difficulty, target, unit } = body;

    if (!id) {
      return NextResponse.json({ error: 'Milestone ID is required' }, { status: 400 });
    }

    // Use proper authentication
    const result = await authenticatedSupabaseQuery(request, async (supabase, userId) => {
      logger.info(`Updating milestone: ${id} for user: ${userId} `, 'Milestones PATCH');

      // Update the milestone in the database
      const { data, error } = await supabase
        .from('milestones')
        .update({
          name: name || undefined,
          description: description || undefined,
          category: category || undefined,
          difficulty: difficulty || undefined,
          xp: difficulty ? calculateRewards(difficulty).xp : undefined,
          gold: difficulty ? calculateRewards(difficulty).gold : undefined,
          target: target || undefined,
          unit: unit || undefined,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('[Milestones PATCH] Database error:', error);
        throw error;
      }

      logger.info(`Successfully updated milestone: ${JSON.stringify(data)} `, 'Milestones PATCH');
      return { success: true, data };
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 401 });
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error('[Milestones PATCH] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
