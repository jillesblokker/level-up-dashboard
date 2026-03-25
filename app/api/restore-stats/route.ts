import { logger } from "@/lib/logger";
import { NextRequest, NextResponse } from 'next/server';
import { authenticatedSupabaseQuery } from '@/lib/supabase/jwt-verification';

export async function POST(request: NextRequest) {
  try {
    logger.debug('[Restore Stats API] Starting restore process');
    
    const { data, error } = await authenticatedSupabaseQuery(request, async (supabase, userId) => {
      logger.debug('[Restore Stats API] Authenticated user:', userId);
      
      // Get the request body to see what stats to restore
      const body = await request.json();
      const { gold = 0, experience = 0, level = 1, health = 100, max_health = 100 } = body;
      
      logger.debug('[Restore Stats] Restoring stats for user:', userId, { gold, experience, level, health, max_health });
      
      // Check if character_stats table exists
      const { error: tableCheckError } = await supabase
        .from('character_stats')
        .select('user_id')
        .limit(1);
      
      if (tableCheckError) {
        logger.error('[Restore Stats] Table check error:', tableCheckError);
        return { error: `Database table not ready: ${tableCheckError.message}` };
      }
      
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
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id' // Use the column name instead of constraint name
        })
        .select()
        .single();
      
      if (statsError) {
        logger.error('[Restore Stats] Error updating character stats:', statsError);
        return { error: statsError };
      }
      
      logger.debug('[Restore Stats] Successfully updated character stats:', statsData);
      
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
          logger.error('[Restore Stats] Error creating gold transaction:', goldError);
        } else {
          logger.debug('[Restore Stats] Successfully created gold transaction');
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
          logger.error('[Restore Stats] Error creating experience transaction:', expError);
        } else {
          logger.debug('[Restore Stats] Successfully created experience transaction');
        }
      }
      
      return { data: statsData };
    });

    if (error) {
      logger.error('[Restore Stats API] Authentication error:', error);
      return NextResponse.json({ error: 'Authentication failed' }, { status: 401 });
    }

    if (data?.error) {
      logger.error('[Restore Stats API] Data error:', data.error);
      return NextResponse.json({ error: 'Failed to restore stats', details: data.error }, { status: 500 });
    }

    logger.debug('[Restore Stats API] Successfully restored stats');
    return NextResponse.json({ 
      success: true, 
      message: 'Character stats restored successfully',
      data: data?.data 
    });
  } catch (error) {
    logger.error('[Restore Stats API] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 