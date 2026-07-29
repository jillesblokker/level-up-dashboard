import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server-client';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const supabase = supabaseServer;
    const currentYear = new Date().getFullYear();

    // 1. Create house_cup_ledger table
    try {
      await supabase.rpc('exec_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS public.house_cup_ledger (
            id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id text NOT NULL,
            category_id text NOT NULL,
            source_type text NOT NULL,
            source_id text NOT NULL,
            points integer NOT NULL,
            reversal_of uuid REFERENCES public.house_cup_ledger(id),
            occurred_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
            cup_year integer NOT NULL DEFAULT ${currentYear}
          );
          CREATE INDEX IF NOT EXISTS idx_house_cup_ledger_lookup ON public.house_cup_ledger(user_id, cup_year, category_id, occurred_at);
        `
      });
    } catch {}

    // 2. Create house_cup_totals table
    try {
      await supabase.rpc('exec_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS public.house_cup_totals (
            user_id text NOT NULL,
            cup_year integer NOT NULL,
            category_id text NOT NULL,
            points integer NOT NULL DEFAULT 0,
            updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
            PRIMARY KEY (user_id, cup_year, category_id)
          );
        `
      });
    } catch {}

    // 3. Create house_cup_results table
    try {
      await supabase.rpc('exec_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS public.house_cup_results (
            viewer_id text NOT NULL,
            cup_year integer NOT NULL,
            winner_user_id text NOT NULL,
            category_winners jsonb NOT NULL DEFAULT '{}'::jsonb,
            standings jsonb NOT NULL DEFAULT '[]'::jsonb,
            ally_count integer NOT NULL DEFAULT 0,
            rewards_granted_at timestamp with time zone,
            acknowledged_at timestamp with time zone,
            PRIMARY KEY (viewer_id, cup_year)
          );
        `
      });
    } catch {}

    // 4. Create house_cup_seen table
    try {
      await supabase.rpc('exec_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS public.house_cup_seen (
            user_id text NOT NULL,
            category_id text NOT NULL,
            seen_points integer NOT NULL DEFAULT 0,
            seen_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
            PRIMARY KEY (user_id, category_id)
          );
        `
      });
    } catch {}

    // 5. Backfill existing quest completions for current year into house_cup_totals
    const { data: completions } = await supabase
      .from('quest_completion')
      .select('user_id, quest_id, completed_at, xp_earned')
      .gte('completed_at', `${currentYear}-01-01T00:00:00.000Z`);

    if (completions && completions.length > 0) {
      const userCategoryTotals = new Map<string, number>();

      for (const c of completions) {
        if (!c.user_id) continue;
        const key = `${c.user_id}:${currentYear}:might`;
        userCategoryTotals.set(key, (userCategoryTotals.get(key) || 0) + 1);
      }

      for (const [key, pts] of userCategoryTotals.entries()) {
        const parts = key.split(':');
        const uid = parts[0] || '';
        const yr = parts[1] || String(currentYear);
        const cat = parts[2] || 'might';
        await supabase
          .from('house_cup_totals')
          .upsert({
            user_id: uid,
            cup_year: parseInt(yr, 10),
            category_id: cat,
            points: pts,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'user_id,cup_year,category_id' });
      }
    }

    return NextResponse.json({ success: true, message: 'House Cup tables and backfill complete' });
  } catch (error: any) {
    logger.error('[House Cup Setup] Error:', error);
    return NextResponse.json({ error: error.message || 'Setup failed' }, { status: 500 });
  }
}
