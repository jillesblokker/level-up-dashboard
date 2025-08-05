import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env['NEXT_PUBLIC_SUPABASE_URL'];
    const supabaseServiceKey = process.env['SUPABASE_SERVICE_ROLE_KEY'];
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Missing Supabase configuration' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const results = [];

    // Create character_stats table
    try {
      const { error: statsError } = await supabase.rpc('exec_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS public.character_stats (
            id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
            user_id uuid REFERENCES auth.users(id) NOT NULL,
            gold integer NOT NULL DEFAULT 0,
            experience integer NOT NULL DEFAULT 0,
            level integer NOT NULL DEFAULT 1,
            health integer NOT NULL DEFAULT 100,
            max_health integer NOT NULL DEFAULT 100,
            character_name text DEFAULT 'Adventurer',
            build_tokens integer NOT NULL DEFAULT 0,
            kingdom_expansions integer NOT NULL DEFAULT 0,
            created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
            updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
            UNIQUE(user_id)
          );
        `
      });
      
      if (statsError) {
        results.push({ table: 'character_stats', error: statsError.message });
      } else {
        results.push({ table: 'character_stats', success: true });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      results.push({ table: 'character_stats', error: errorMessage });
    }

    // Create gold_transactions table
    try {
      const { error: goldError } = await supabase.rpc('exec_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS public.gold_transactions (
            id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
            user_id uuid REFERENCES auth.users(id) NOT NULL,
            transaction_type text NOT NULL,
            amount integer NOT NULL,
            balance_after integer NOT NULL,
            source text,
            description text,
            metadata jsonb,
            created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
          );
        `
      });
      
      if (goldError) {
        results.push({ table: 'gold_transactions', error: goldError.message });
      } else {
        results.push({ table: 'gold_transactions', success: true });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      results.push({ table: 'gold_transactions', error: errorMessage });
    }

    // Create experience_transactions table
    try {
      const { error: expError } = await supabase.rpc('exec_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS public.experience_transactions (
            id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
            user_id uuid REFERENCES auth.users(id) NOT NULL,
            transaction_type text NOT NULL,
            amount integer NOT NULL,
            total_after integer NOT NULL,
            source text,
            description text,
            metadata jsonb,
            created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
          );
        `
      });
      
      if (expError) {
        results.push({ table: 'experience_transactions', error: expError.message });
      } else {
        results.push({ table: 'experience_transactions', success: true });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      results.push({ table: 'experience_transactions', error: errorMessage });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Database setup completed',
      results 
    });
  } catch (error) {
    console.error('[Setup Database API] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 