-- Migration: Fix Kingdom Grid System
-- Creates missing tables and enables real-time functionality

-- 1. Create kingdom_grid table for storing user grid layouts
CREATE TABLE IF NOT EXISTS public.kingdom_grid (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL,
    grid JSONB NOT NULL DEFAULT '[]'::jsonb,
    version INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id)
);

-- 2. Create property_timers table for tracking tile timers
CREATE TABLE IF NOT EXISTS public.property_timers (
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
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, x, y)
);

-- 3. Create gold_transactions table for proper gold tracking
CREATE TABLE IF NOT EXISTS public.gold_transactions (
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

-- 4. Create experience_transactions table for proper XP tracking
CREATE TABLE IF NOT EXISTS public.experience_transactions (
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

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_kingdom_grid_user_id ON public.kingdom_grid(user_id);
CREATE INDEX IF NOT EXISTS idx_property_timers_user_id ON public.property_timers(user_id);
CREATE INDEX IF NOT EXISTS idx_property_timers_ready ON public.property_timers(is_ready, end_time);
CREATE INDEX IF NOT EXISTS idx_gold_transactions_user_id ON public.gold_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_experience_transactions_user_id ON public.experience_transactions(user_id);

-- Enable Row Level Security
ALTER TABLE public.kingdom_grid ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_timers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gold_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.experience_transactions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
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

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER set_kingdom_grid_updated_at 
    BEFORE UPDATE ON public.kingdom_grid 
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_property_timers_updated_at 
    BEFORE UPDATE ON public.property_timers 
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
