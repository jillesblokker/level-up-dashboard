import { NextRequest, NextResponse } from 'next/server';
import { authenticatedSupabaseQuery } from '@/lib/supabase/jwt-verification';

export async function GET(request: NextRequest) {
  try {
    const { data, error } = await authenticatedSupabaseQuery(request, async (supabase, userId) => {
      // Get character stats
      const { data: characterStats, error: statsError } = await supabase
        .from('character_stats')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      // Get recent gold transactions
      const { data: goldTransactions, error: goldError } = await supabase
        .from('gold_transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);
      
      // Get recent experience transactions
      const { data: expTransactions, error: expError } = await supabase
        .from('experience_transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);
      
      return {
        characterStats: statsError ? null : characterStats,
        goldTransactions: goldError ? [] : goldTransactions,
        expTransactions: expError ? [] : expTransactions,
        errors: {
          stats: statsError,
          gold: goldError,
          exp: expError
        }
      };
    });

    if (error) {
      return NextResponse.json({ error: 'Authentication failed' }, { status: 401 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('[Debug Stats API] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 