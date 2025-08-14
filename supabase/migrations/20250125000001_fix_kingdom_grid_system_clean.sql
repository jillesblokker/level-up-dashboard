-- Migration: Fix Kingdom Grid System - Clean Version
-- This migration handles potential conflicts and ensures all types are correct

-- Step 1: Drop existing policies if they exist (to avoid conflicts)
DO $$ 
BEGIN
    -- Drop policies if they exist
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'kingdom_grid' AND policyname = 'Users can manage their own kingdom grid') THEN
        DROP POLICY "Users can manage their own kingdom grid" ON public.kingdom_grid;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'property_timers' AND policyname = 'Users can manage their own property timers') THEN
        DROP POLICY "Users can manage their own property timers" ON public.property_timers;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'gold_transactions' AND policyname = 'Users can view their own gold transactions') THEN
        DROP POLICY "Users can view their own gold transactions" ON public.gold_transactions;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'gold_transactions' AND policyname = 'Users can insert their own gold transactions') THEN
        DROP POLICY "Users can insert their own gold transactions" ON public.gold_transactions;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'experience_transactions' AND policyname = 'Users can view their own experience transactions') THEN
        DROP POLICY "Users can view their own experience transactions" ON public.experience_transactions;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'experience_transactions' AND policyname = 'Users can insert their own experience transactions') THEN
        DROP POLICY "Users can insert their own experience transactions" ON public.experience_transactions;
    END IF;
END $$;

-- Step 2: Drop existing tables if they exist (to ensure clean slate)
DROP TABLE IF EXISTS public.experience_transactions CASCADE;
DROP TABLE IF EXISTS public.gold_transactions CASCADE;
DROP TABLE IF EXISTS public.property_timers CASCADE;
DROP TABLE IF EXISTS public.kingdom_grid CASCADE;

-- Step 3: Drop existing functions if they exist
DROP FUNCTION IF EXISTS public.get_current_user_id() CASCADE;
DROP FUNCTION IF EXISTS public.handle_updated_at() CASCADE;

-- Step 4: Create the get_current_user_id function
CREATE OR REPLACE FUNCTION public.get_current_user_id()
RETURNS TEXT AS $$
BEGIN
    -- Extract user_id from JWT claims
    RETURN current_setting('request.jwt.claims', true)::json->>'sub';
EXCEPTION
    WHEN OTHERS THEN
        RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 5: Create the handle_updated_at function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 6: Create kingdom_grid table
CREATE TABLE public.kingdom_grid (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL,
    grid JSONB NOT NULL DEFAULT '[]'::jsonb,
    version INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Step 7: Create property_timers table
CREATE TABLE public.property_timers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL,
    tile_id TEXT NOT NULL,
    x INTEGER NOT NULL,
    y INTEGER NOT NULL,
    tile_type TEXT NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    is_ready BOOLEAN DEFAULT false,
    placed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Step 8: Create gold_transactions table
CREATE TABLE public.gold_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL,
    transaction_type TEXT NOT NULL,
    amount INTEGER NOT NULL,
    balance_after INTEGER NOT NULL,
    source TEXT NOT NULL,
    description TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Step 9: Create experience_transactions table
CREATE TABLE public.experience_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL,
    transaction_type TEXT NOT NULL,
    amount INTEGER NOT NULL,
    total_after INTEGER NOT NULL,
    source TEXT NOT NULL,
    description TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Step 10: Create unique constraints
ALTER TABLE public.kingdom_grid ADD CONSTRAINT kingdom_grid_user_id_unique UNIQUE (user_id);
ALTER TABLE public.property_timers ADD CONSTRAINT property_timers_user_position_unique UNIQUE (user_id, x, y);

-- Step 11: Create indexes for performance
CREATE INDEX idx_kingdom_grid_user_id ON public.kingdom_grid(user_id);
CREATE INDEX idx_property_timers_user_id ON public.property_timers(user_id);
CREATE INDEX idx_property_timers_ready ON public.property_timers(is_ready, end_time);
CREATE INDEX idx_gold_transactions_user_id ON public.gold_transactions(user_id);
CREATE INDEX idx_experience_transactions_user_id ON public.experience_transactions(user_id);

-- Step 12: Enable Row Level Security
ALTER TABLE public.kingdom_grid ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_timers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gold_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.experience_transactions ENABLE ROW LEVEL SECURITY;

-- Step 13: Create RLS policies
CREATE POLICY "Users can manage their own kingdom grid"
    ON public.kingdom_grid FOR ALL
    USING (user_id = public.get_current_user_id())
    WITH CHECK (user_id = public.get_current_user_id());

CREATE POLICY "Users can manage their own property timers"
    ON public.property_timers FOR ALL
    USING (user_id = public.get_current_user_id())
    WITH CHECK (user_id = public.get_current_user_id());

CREATE POLICY "Users can view their own gold transactions"
    ON public.gold_transactions FOR SELECT
    USING (user_id = public.get_current_user_id());

CREATE POLICY "Users can insert their own gold transactions"
    ON public.gold_transactions FOR INSERT
    WITH CHECK (user_id = public.get_current_user_id());

CREATE POLICY "Users can view their own experience transactions"
    ON public.experience_transactions FOR SELECT
    USING (user_id = public.get_current_user_id());

CREATE POLICY "Users can insert their own experience transactions"
    ON public.experience_transactions FOR INSERT
    WITH CHECK (user_id = public.get_current_user_id());

-- Step 14: Create triggers for updated_at
CREATE TRIGGER set_kingdom_grid_updated_at 
    BEFORE UPDATE ON public.kingdom_grid 
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_property_timers_updated_at 
    BEFORE UPDATE ON public.property_timers 
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Step 15: Grant permissions to authenticated users
GRANT ALL ON public.kingdom_grid TO authenticated;
GRANT ALL ON public.property_timers TO authenticated;
GRANT ALL ON public.gold_transactions TO authenticated;
GRANT ALL ON public.experience_transactions TO authenticated;

-- Step 16: Grant usage on sequences
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
