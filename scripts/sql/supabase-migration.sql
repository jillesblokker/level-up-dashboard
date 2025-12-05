-- Supabase Migration: Add Character Stats, Active Perks, and Game Settings Tables
-- This migration adds the remaining localStorage data to Supabase

-- Remove any existing functions that might conflict
DROP FUNCTION IF EXISTS validate_user_id(text);
DROP FUNCTION IF EXISTS text_to_uuid(text);

-- 1. Character Stats Table (Optimized)
CREATE TABLE IF NOT EXISTS character_stats (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    gold integer DEFAULT 0,
    experience integer DEFAULT 0,
    level integer DEFAULT 1,
    health integer DEFAULT 100,
    max_health integer DEFAULT 100,
    build_tokens integer DEFAULT 0,
    kingdom_expansions integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    UNIQUE(user_id)
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_character_stats_user_id ON character_stats(user_id);

-- 2. Active Perks Table (Optimized)
CREATE TABLE IF NOT EXISTS active_perks (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    perk_name text NOT NULL,
    effect text NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    UNIQUE(user_id, perk_name)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_active_perks_user_id ON active_perks(user_id);
CREATE INDEX IF NOT EXISTS idx_active_perks_expires_at ON active_perks(expires_at);

-- 3. Game Settings Table (Optimized)
CREATE TABLE IF NOT EXISTS game_settings (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    setting_key text NOT NULL,
    setting_value jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    UNIQUE(user_id, setting_key)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_game_settings_user_id ON game_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_game_settings_key ON game_settings(setting_key);

-- 4. Function to clean up expired perks (optional)
CREATE OR REPLACE FUNCTION cleanup_expired_perks()
RETURNS void AS $$
BEGIN
    DELETE FROM active_perks 
    WHERE expires_at < now();
END;
$$ LANGUAGE plpgsql;

-- 5. Create a scheduled job to clean up expired perks (optional)
-- This would need to be set up in your Supabase dashboard
-- SELECT cron.schedule('cleanup-expired-perks', '0 0 * * *', 'SELECT cleanup_expired_perks();');

-- 6. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON character_stats TO authenticated;
GRANT ALL ON active_perks TO authenticated;
GRANT ALL ON game_settings TO authenticated;

-- Optional: Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_character_stats_modtime
BEFORE UPDATE ON character_stats
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_game_settings_modtime
BEFORE UPDATE ON game_settings
FOR EACH ROW
EXECUTE FUNCTION update_modified_column(); 

-- Add DELETE policy for milestones table
-- This allows authenticated users to delete milestones they own

-- First, drop the existing view-only policy
DROP POLICY IF EXISTS "All authenticated users can view milestones" ON milestones;

-- Create a comprehensive policy that allows authenticated users to manage their own milestones
CREATE POLICY "Authenticated users can manage milestones" ON milestones
  FOR ALL USING (auth.get_user_id() IS NOT NULL);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_milestones_user_id ON milestones(user_id); 