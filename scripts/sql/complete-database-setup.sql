-- Complete Database Setup Script
-- This script creates all the missing tables that are causing 401 errors
-- Run this in your Supabase SQL editor to fix the database schema issues

-- ==========================================
-- 1. CHARACTER STATS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS public.character_stats (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    gold INTEGER NOT NULL DEFAULT 0,
    experience INTEGER NOT NULL DEFAULT 0,
    level INTEGER NOT NULL DEFAULT 1,
    health INTEGER NOT NULL DEFAULT 100,
    max_health INTEGER NOT NULL DEFAULT 100,
    character_name TEXT DEFAULT 'Adventurer',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id)
);

-- ==========================================
-- 2. INVENTORY ITEMS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS public.inventory_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    item_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL CHECK (type IN ('resource', 'item', 'creature', 'scroll', 'equipment', 'artifact', 'book', 'mount', 'weapon', 'shield', 'armor')),
    category TEXT,
    quantity INTEGER NOT NULL DEFAULT 1,
    emoji TEXT,
    image TEXT,
    stats JSONB,
    equipped BOOLEAN NOT NULL DEFAULT false,
    is_default BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, item_id)
);

-- ==========================================
-- 3. USER PREFERENCES TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS public.user_preferences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    preference_key TEXT NOT NULL,
    preference_value JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, preference_key)
);

-- ==========================================
-- 4. CHARACTER PERKS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS public.character_perks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    perk_name TEXT NOT NULL,
    perk_type TEXT NOT NULL,
    description TEXT,
    effect_value INTEGER,
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    equipped BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==========================================
-- 5. CHARACTER TITLES TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS public.character_titles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    title_name TEXT NOT NULL,
    description TEXT,
    unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, title_name)
);

-- ==========================================
-- 6. CHARACTER STRENGTHS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS public.character_strengths (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    strength_name TEXT NOT NULL,
    strength_type TEXT NOT NULL,
    value INTEGER NOT NULL DEFAULT 0,
    max_value INTEGER NOT NULL DEFAULT 100,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, strength_name)
);

-- ==========================================
-- 7. ACHIEVEMENTS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS public.achievements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    achievement_id TEXT NOT NULL,
    achievement_name TEXT NOT NULL,
    description TEXT,
    unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, achievement_id)
);

-- ==========================================
-- 8. TILE INVENTORY TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS public.tile_inventory (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    tile_id TEXT NOT NULL,
    tile_type TEXT NOT NULL,
    name TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    cost INTEGER NOT NULL DEFAULT 0,
    connections JSONB DEFAULT '[]',
    rotation INTEGER NOT NULL DEFAULT 0,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, tile_id)
);

-- ==========================================
-- 9. QUESTS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS public.quests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    difficulty TEXT,
    rewards JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==========================================
-- 10. QUEST COMPLETION TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS public.quest_completion (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    quest_id UUID,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    completed BOOLEAN NOT NULL DEFAULT false,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, title, category)
);

-- ==========================================
-- 11. STREAKS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS public.streaks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    category TEXT NOT NULL,
    streak_days INTEGER NOT NULL DEFAULT 0,
    week_streaks INTEGER NOT NULL DEFAULT 0,
    last_activity_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, category)
);

-- ==========================================
-- ENABLE ROW LEVEL SECURITY
-- ==========================================
ALTER TABLE public.character_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.character_perks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.character_titles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.character_strengths ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tile_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quest_completion ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.streaks ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- CREATE RLS POLICIES
-- ==========================================

-- Character Stats Policies
CREATE POLICY "Users can view own character stats" ON public.character_stats
FOR SELECT USING (user_id::text = current_setting('app.current_user_id', TRUE));

CREATE POLICY "Users can insert own character stats" ON public.character_stats
FOR INSERT WITH CHECK (user_id::text = current_setting('app.current_user_id', TRUE));

CREATE POLICY "Users can update own character stats" ON public.character_stats
FOR UPDATE USING (user_id::text = current_setting('app.current_user_id', TRUE));

-- Inventory Items Policies
CREATE POLICY "Users can view own inventory" ON public.inventory_items
FOR SELECT USING (user_id::text = current_setting('app.current_user_id', TRUE));

CREATE POLICY "Users can insert own inventory" ON public.inventory_items
FOR INSERT WITH CHECK (user_id::text = current_setting('app.current_user_id', TRUE));

CREATE POLICY "Users can update own inventory" ON public.inventory_items
FOR UPDATE USING (user_id::text = current_setting('app.current_user_id', TRUE));

CREATE POLICY "Users can delete own inventory" ON public.inventory_items
FOR DELETE USING (user_id::text = current_setting('app.current_user_id', TRUE));

-- User Preferences Policies
CREATE POLICY "Users can view own preferences" ON public.user_preferences
FOR SELECT USING (user_id::text = current_setting('app.current_user_id', TRUE));

CREATE POLICY "Users can insert own preferences" ON public.user_preferences
FOR INSERT WITH CHECK (user_id::text = current_setting('app.current_user_id', TRUE));

CREATE POLICY "Users can update own preferences" ON public.user_preferences
FOR UPDATE USING (user_id::text = current_setting('app.current_user_id', TRUE));

CREATE POLICY "Users can delete own preferences" ON public.user_preferences
FOR DELETE USING (user_id::text = current_setting('app.current_user_id', TRUE));

-- Character Perks Policies
CREATE POLICY "Users can view own perks" ON public.character_perks
FOR SELECT USING (user_id::text = current_setting('app.current_user_id', TRUE));

CREATE POLICY "Users can insert own perks" ON public.character_perks
FOR INSERT WITH CHECK (user_id::text = current_setting('app.current_user_id', TRUE));

CREATE POLICY "Users can update own perks" ON public.character_perks
FOR UPDATE USING (user_id::text = current_setting('app.current_user_id', TRUE));

-- Character Titles Policies
CREATE POLICY "Users can view own titles" ON public.character_titles
FOR SELECT USING (user_id::text = current_setting('app.current_user_id', TRUE));

CREATE POLICY "Users can insert own titles" ON public.character_titles
FOR INSERT WITH CHECK (user_id::text = current_setting('app.current_user_id', TRUE));

CREATE POLICY "Users can update own titles" ON public.character_titles
FOR UPDATE USING (user_id::text = current_setting('app.current_user_id', TRUE));

-- Character Strengths Policies
CREATE POLICY "Users can view own strengths" ON public.character_strengths
FOR SELECT USING (user_id::text = current_setting('app.current_user_id', TRUE));

CREATE POLICY "Users can insert own strengths" ON public.character_strengths
FOR INSERT WITH CHECK (user_id::text = current_setting('app.current_user_id', TRUE));

CREATE POLICY "Users can update own strengths" ON public.character_strengths
FOR UPDATE USING (user_id::text = current_setting('app.current_user_id', TRUE));

-- Achievements Policies
CREATE POLICY "Users can view own achievements" ON public.achievements
FOR SELECT USING (user_id::text = current_setting('app.current_user_id', TRUE));

CREATE POLICY "Users can insert own achievements" ON public.achievements
FOR INSERT WITH CHECK (user_id::text = current_setting('app.current_user_id', TRUE));

-- Tile Inventory Policies
CREATE POLICY "Users can view own tile inventory" ON public.tile_inventory
FOR SELECT USING (user_id::text = current_setting('app.current_user_id', TRUE));

CREATE POLICY "Users can insert own tile inventory" ON public.tile_inventory
FOR INSERT WITH CHECK (user_id::text = current_setting('app.current_user_id', TRUE));

CREATE POLICY "Users can update own tile inventory" ON public.tile_inventory
FOR UPDATE USING (user_id::text = current_setting('app.current_user_id', TRUE));

CREATE POLICY "Users can delete own tile inventory" ON public.tile_inventory
FOR DELETE USING (user_id::text = current_setting('app.current_user_id', TRUE));

-- Quest Completion Policies
CREATE POLICY "Users can view own quest completions" ON public.quest_completion
FOR SELECT USING (user_id::text = current_setting('app.current_user_id', TRUE));

CREATE POLICY "Users can insert own quest completions" ON public.quest_completion
FOR INSERT WITH CHECK (user_id::text = current_setting('app.current_user_id', TRUE));

CREATE POLICY "Users can update own quest completions" ON public.quest_completion
FOR UPDATE USING (user_id::text = current_setting('app.current_user_id', TRUE));

-- Streaks Policies
CREATE POLICY "Users can view own streaks" ON public.streaks
FOR SELECT USING (user_id::text = current_setting('app.current_user_id', TRUE));

CREATE POLICY "Users can insert own streaks" ON public.streaks
FOR INSERT WITH CHECK (user_id::text = current_setting('app.current_user_id', TRUE));

CREATE POLICY "Users can update own streaks" ON public.streaks
FOR UPDATE USING (user_id::text = current_setting('app.current_user_id', TRUE));

-- Quests table (public read access)
CREATE POLICY "Everyone can view quests" ON public.quests FOR SELECT USING (true);

-- ==========================================
-- CREATE HELPFUL FUNCTIONS
-- ==========================================

-- Function to set user context for RLS
CREATE OR REPLACE FUNCTION public.set_user_context(user_id text)
RETURNS void AS $$
BEGIN
  PERFORM set_config('app.current_user_id', user_id, true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- CREATE INDEXES FOR PERFORMANCE
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_character_stats_user_id ON public.character_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_inventory_items_user_id ON public.inventory_items(user_id);
CREATE INDEX IF NOT EXISTS idx_inventory_items_equipped ON public.inventory_items(user_id, equipped);
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON public.user_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_user_preferences_key ON public.user_preferences(preference_key);
CREATE INDEX IF NOT EXISTS idx_character_perks_user_id ON public.character_perks(user_id);
CREATE INDEX IF NOT EXISTS idx_character_titles_user_id ON public.character_titles(user_id);
CREATE INDEX IF NOT EXISTS idx_character_strengths_user_id ON public.character_strengths(user_id);
CREATE INDEX IF NOT EXISTS idx_achievements_user_id ON public.achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_tile_inventory_user_id ON public.tile_inventory(user_id);
CREATE INDEX IF NOT EXISTS idx_quest_completion_user_id ON public.quest_completion(user_id);
CREATE INDEX IF NOT EXISTS idx_streaks_user_id ON public.streaks(user_id);

-- ==========================================
-- DONE!
-- ==========================================
SELECT 'Database setup completed successfully! All tables and policies have been created.' as status; 