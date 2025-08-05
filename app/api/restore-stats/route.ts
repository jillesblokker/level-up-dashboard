import { NextRequest, NextResponse } from 'next/server';
import { authenticatedSupabaseQuery } from '@/lib/supabase/jwt-verification';

export async function POST(request: NextRequest) {
  try {
    const { data, error } = await authenticatedSupabaseQuery(request, async (supabase, userId) => {
      // Get the request body to see what stats to restore
      const body = await request.json();
      const { gold = 0, experience = 0, level = 1, health = 100, max_health = 100 } = body;
      
      console.log('[Restore Stats] Restoring stats for user:', userId, { gold, experience, level, health, max_health });
      
      // Insert or update character stats
      const { data: statsData, error: statsError } = await supabase
        .from('character_stats')
        .upsert({
          user_id: userId,
          gold,
          experience,
          level,
          health,
          max_health,
          character_name: 'Adventurer',
          build_tokens: 0,
          kingdom_expansions: 0,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'character_stats_user_id_unique'
        })
        .select()
        .single();
      
      if (statsError) {
        console.error('[Restore Stats] Error updating character stats:', statsError);
        return { error: statsError };
      }
      
      // Create a transaction record for the restored stats
      if (gold > 0) {
        const { error: goldError } = await supabase
          .from('gold_transactions')
          .insert({
            user_id: userId,
            transaction_type: 'restore',
            amount: gold,
            balance_after: gold,
            source: 'localStorage_restore',
            description: 'Restored from localStorage backup',
            metadata: { restored_at: new Date().toISOString() }
          });
        
        if (goldError) {
          console.error('[Restore Stats] Error creating gold transaction:', goldError);
        }
      }
      
      if (experience > 0) {
        const { error: expError } = await supabase
          .from('experience_transactions')
          .insert({
            user_id: userId,
            transaction_type: 'restore',
            amount: experience,
            total_after: experience,
            source: 'localStorage_restore',
            description: 'Restored from localStorage backup',
            metadata: { restored_at: new Date().toISOString() }
          });
        
        if (expError) {
          console.error('[Restore Stats] Error creating experience transaction:', expError);
        }
      }
      
      return { data: statsData };
    });

    if (error) {
      return NextResponse.json({ error: 'Authentication failed' }, { status: 401 });
    }

    if (data.error) {
      return NextResponse.json({ error: 'Failed to restore stats', details: data.error }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Character stats restored successfully',
      data: data.data 
    });
  } catch (error) {
    console.error('[Restore Stats API] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 