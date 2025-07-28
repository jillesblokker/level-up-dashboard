-- Supabase Migration: Add Character Stats, Active Perks, and Game Settings Tables
-- This migration adds the remaining localStorage data to Supabase

-- Ensure the user_id is stored as text but can reference the uuid in auth.users
CREATE OR REPLACE FUNCTION text_to_uuid(text_id text)
RETURNS uuid AS $$
BEGIN
    RETURN text_id::uuid;
EXCEPTION 
    WHEN invalid_text_representation THEN
        RAISE EXCEPTION 'Invalid UUID format: %', text_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 1. Character Stats Table
CREATE TABLE IF NOT EXISTS character_stats (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id text NOT NULL,
    gold integer DEFAULT 0,
    experience integer DEFAULT 0,
    level integer DEFAULT 1,
    health integer DEFAULT 100,
    max_health integer DEFAULT 100,
    build_tokens integer DEFAULT 0,
    kingdom_expansions integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    UNIQUE(user_id),
    CONSTRAINT fk_user FOREIGN KEY (user_id) 
        REFERENCES auth.users(id) 
        ON DELETE CASCADE
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_character_stats_user_id ON character_stats(user_id);

-- RLS Policies for character_stats
ALTER TABLE character_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own stats" ON character_stats
    FOR SELECT USING (user_id = auth.uid()::text);

CREATE POLICY "Users can insert their own stats" ON character_stats
    FOR INSERT WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "Users can update their own stats" ON character_stats
    FOR UPDATE USING (user_id = auth.uid()::text);

-- 2. Active Perks Table
CREATE TABLE IF NOT EXISTS active_perks (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id text NOT NULL,
    perk_name text NOT NULL,
    effect text NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    UNIQUE(user_id, perk_name),
    CONSTRAINT fk_user FOREIGN KEY (user_id) 
        REFERENCES auth.users(id) 
        ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_active_perks_user_id ON active_perks(user_id);
CREATE INDEX IF NOT EXISTS idx_active_perks_expires_at ON active_perks(expires_at);

-- RLS Policies for active_perks
ALTER TABLE active_perks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own perks" ON active_perks
    FOR SELECT USING (user_id = auth.uid()::text);

CREATE POLICY "Users can insert their own perks" ON active_perks
    FOR INSERT WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "Users can update their own perks" ON active_perks
    FOR UPDATE USING (user_id = auth.uid()::text);

CREATE POLICY "Users can delete their own perks" ON active_perks
    FOR DELETE USING (user_id = auth.uid()::text);

-- 3. Game Settings Table
CREATE TABLE IF NOT EXISTS game_settings (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id text NOT NULL,
    setting_key text NOT NULL,
    setting_value jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    UNIQUE(user_id, setting_key),
    CONSTRAINT fk_user FOREIGN KEY (user_id) 
        REFERENCES auth.users(id) 
        ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_game_settings_user_id ON game_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_game_settings_key ON game_settings(setting_key);

-- RLS Policies for game_settings
ALTER TABLE game_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own settings" ON game_settings
    FOR SELECT USING (user_id = auth.uid()::text);

CREATE POLICY "Users can insert their own settings" ON game_settings
    FOR INSERT WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "Users can update their own settings" ON game_settings
    FOR UPDATE USING (user_id = auth.uid()::text);

CREATE POLICY "Users can delete their own settings" ON game_settings
    FOR DELETE USING (user_id = auth.uid()::text);

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