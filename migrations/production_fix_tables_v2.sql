-- COMPREHENSIVE PRODUCTION SCHEMA FIX
-- This script creates all necessary tables with the correct columns as expected by the API routes.
-- Run this in your Supabase SQL Editor.
-- 1. user_preferences
CREATE TABLE IF NOT EXISTS user_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    preference_key TEXT NOT NULL,
    preference_value JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, preference_key)
);
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);
ALTER TABLE user_preferences DISABLE ROW LEVEL SECURITY;
-- 2. creature_interactions
CREATE TABLE IF NOT EXISTS creature_interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    creature_definition_id TEXT NOT NULL,
    creature_instance_id TEXT,
    interaction_type TEXT NOT NULL,
    occurred_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, creature_definition_id, occurred_at)
);
-- Remove UNIQUE if it's too restrictive, just keep indexes
ALTER TABLE creature_interactions DROP CONSTRAINT IF EXISTS creature_interactions_user_id_creature_definition_id_occu_key;
CREATE INDEX IF NOT EXISTS idx_creature_interactions_user_id ON creature_interactions(user_id);
ALTER TABLE creature_interactions DISABLE ROW LEVEL SECURITY;
-- 3. character_stats
CREATE TABLE IF NOT EXISTS character_stats (
    user_id TEXT PRIMARY KEY,
    gold INTEGER DEFAULT 0,
    experience INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    health INTEGER DEFAULT 100,
    max_health INTEGER DEFAULT 100,
    build_tokens INTEGER DEFAULT 0,
    character_name TEXT DEFAULT 'Adventurer',
    stats_data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE character_stats DISABLE ROW LEVEL SECURITY;
-- 4. quest_progress
CREATE TABLE IF NOT EXISTS quest_progress (
    user_id TEXT PRIMARY KEY,
    progress_data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE quest_progress DISABLE ROW LEVEL SECURITY;
-- 5. milestone_progress
CREATE TABLE IF NOT EXISTS milestone_progress (
    user_id TEXT PRIMARY KEY,
    progress_data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE milestone_progress DISABLE ROW LEVEL SECURITY;
-- 6. kingdom_event_log
CREATE TABLE IF NOT EXISTS kingdom_event_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    event_type TEXT NOT NULL,
    related_id TEXT,
    amount INTEGER,
    context JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_kingdom_event_log_user_id ON kingdom_event_log(user_id);
ALTER TABLE kingdom_event_log DISABLE ROW LEVEL SECURITY;
-- 7. streaks
CREATE TABLE IF NOT EXISTS streaks (
    user_id TEXT NOT NULL,
    category TEXT NOT NULL,
    streak_days INTEGER DEFAULT 0,
    current_streak INTEGER DEFAULT 0,
    -- Fallback for code that uses current_streak
    week_streaks INTEGER DEFAULT 0,
    last_completed_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (user_id, category)
);
ALTER TABLE streaks DISABLE ROW LEVEL SECURITY;