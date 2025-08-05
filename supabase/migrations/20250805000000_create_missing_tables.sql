-- Migration: Create Missing Tables with Proper Supabase/Postgres Standards
-- This migration creates the missing tables following best practices

-- Create character_stats table
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

-- Create gold_transactions table
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

-- Create experience_transactions table
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

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_character_stats_user_id ON public.character_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_gold_transactions_user_id ON public.gold_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_gold_transactions_type ON public.gold_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_gold_transactions_created_at ON public.gold_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_experience_transactions_user_id ON public.experience_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_experience_transactions_type ON public.experience_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_experience_transactions_created_at ON public.experience_transactions(created_at);

-- Enable Row Level Security
ALTER TABLE public.character_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gold_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.experience_transactions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for character_stats
DROP POLICY IF EXISTS "Users can view own character stats" ON public.character_stats;
CREATE POLICY "Users can view own character stats" ON public.character_stats
    FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert own character stats" ON public.character_stats;
CREATE POLICY "Users can insert own character stats" ON public.character_stats
    FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own character stats" ON public.character_stats;
CREATE POLICY "Users can update own character stats" ON public.character_stats
    FOR UPDATE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete own character stats" ON public.character_stats;
CREATE POLICY "Users can delete own character stats" ON public.character_stats
    FOR DELETE USING (user_id = auth.uid());

-- Create RLS policies for gold_transactions
DROP POLICY IF EXISTS "Users can view own gold transactions" ON public.gold_transactions;
CREATE POLICY "Users can view own gold transactions" ON public.gold_transactions
    FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert own gold transactions" ON public.gold_transactions;
CREATE POLICY "Users can insert own gold transactions" ON public.gold_transactions
    FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own gold transactions" ON public.gold_transactions;
CREATE POLICY "Users can update own gold transactions" ON public.gold_transactions
    FOR UPDATE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete own gold transactions" ON public.gold_transactions;
CREATE POLICY "Users can delete own gold transactions" ON public.gold_transactions
    FOR DELETE USING (user_id = auth.uid());

-- Create RLS policies for experience_transactions
DROP POLICY IF EXISTS "Users can view own experience transactions" ON public.experience_transactions;
CREATE POLICY "Users can view own experience transactions" ON public.experience_transactions
    FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert own experience transactions" ON public.experience_transactions;
CREATE POLICY "Users can insert own experience transactions" ON public.experience_transactions
    FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own experience transactions" ON public.experience_transactions;
CREATE POLICY "Users can update own experience transactions" ON public.experience_transactions
    FOR UPDATE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete own experience transactions" ON public.experience_transactions;
CREATE POLICY "Users can delete own experience transactions" ON public.experience_transactions
    FOR DELETE USING (user_id = auth.uid());

-- Grant permissions to authenticated users
GRANT ALL ON public.character_stats TO authenticated;
GRANT ALL ON public.gold_transactions TO authenticated;
GRANT ALL ON public.experience_transactions TO authenticated;

-- Grant usage on sequences (for the identity columns)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated; 