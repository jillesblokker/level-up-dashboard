-- Migration: Create Missing Tables
-- This migration creates the missing gold_transactions and experience_transactions tables

-- Create gold_transactions table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.gold_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL,
    transaction_type TEXT NOT NULL,
    amount INTEGER NOT NULL,
    balance_after INTEGER NOT NULL,
    source TEXT,
    description TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create experience_transactions table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.experience_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL,
    transaction_type TEXT NOT NULL,
    amount INTEGER NOT NULL,
    total_after INTEGER NOT NULL,
    source TEXT,
    description TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create character_stats table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.character_stats (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL,
    gold INTEGER NOT NULL DEFAULT 0,
    experience INTEGER NOT NULL DEFAULT 0,
    level INTEGER NOT NULL DEFAULT 1,
    health INTEGER NOT NULL DEFAULT 100,
    max_health INTEGER NOT NULL DEFAULT 100,
    character_name TEXT DEFAULT 'Adventurer',
    build_tokens INTEGER NOT NULL DEFAULT 0,
    kingdom_expansions INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_gold_transactions_user_id ON public.gold_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_gold_transactions_type ON public.gold_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_gold_transactions_created_at ON public.gold_transactions(created_at);

CREATE INDEX IF NOT EXISTS idx_experience_transactions_user_id ON public.experience_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_experience_transactions_type ON public.experience_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_experience_transactions_created_at ON public.experience_transactions(created_at);

CREATE INDEX IF NOT EXISTS idx_character_stats_user_id ON public.character_stats(user_id);

-- Enable RLS
ALTER TABLE public.gold_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.experience_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.character_stats ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for gold_transactions
DROP POLICY IF EXISTS "Users can view own gold transactions" ON public.gold_transactions;
CREATE POLICY "Users can view own gold transactions" ON public.gold_transactions
    FOR SELECT USING (user_id = auth.jwt() ->> 'sub');

DROP POLICY IF EXISTS "Users can insert own gold transactions" ON public.gold_transactions;
CREATE POLICY "Users can insert own gold transactions" ON public.gold_transactions
    FOR INSERT WITH CHECK (user_id = auth.jwt() ->> 'sub');

-- Create RLS policies for experience_transactions
DROP POLICY IF EXISTS "Users can view own experience transactions" ON public.experience_transactions;
CREATE POLICY "Users can view own experience transactions" ON public.experience_transactions
    FOR SELECT USING (user_id = auth.jwt() ->> 'sub');

DROP POLICY IF EXISTS "Users can insert own experience transactions" ON public.experience_transactions;
CREATE POLICY "Users can insert own experience transactions" ON public.experience_transactions
    FOR INSERT WITH CHECK (user_id = auth.jwt() ->> 'sub');

-- Create RLS policies for character_stats
DROP POLICY IF EXISTS "Users can view own character stats" ON public.character_stats;
CREATE POLICY "Users can view own character stats" ON public.character_stats
    FOR SELECT USING (user_id = auth.jwt() ->> 'sub');

DROP POLICY IF EXISTS "Users can insert own character stats" ON public.character_stats;
CREATE POLICY "Users can insert own character stats" ON public.character_stats
    FOR INSERT WITH CHECK (user_id = auth.jwt() ->> 'sub');

DROP POLICY IF EXISTS "Users can update own character stats" ON public.character_stats;
CREATE POLICY "Users can update own character stats" ON public.character_stats
    FOR UPDATE USING (user_id = auth.jwt() ->> 'sub');

-- Grant permissions
GRANT ALL ON public.gold_transactions TO authenticated;
GRANT ALL ON public.experience_transactions TO authenticated;
GRANT ALL ON public.character_stats TO authenticated; 