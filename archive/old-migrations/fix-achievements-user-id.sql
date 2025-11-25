-- Fix achievements table user_id column to work with Clerk authentication
-- This fixes the "invalid input syntax for type uuid" error

-- First, backup existing data
CREATE TABLE IF NOT EXISTS achievements_backup AS 
SELECT * FROM achievements WHERE 1=0;

-- Copy existing data to backup
INSERT INTO achievements_backup 
SELECT * FROM achievements;

-- Drop the existing table
DROP TABLE IF EXISTS achievements CASCADE;

-- Create new table with correct user_id type (TEXT instead of UUID)
CREATE TABLE achievements (
    id bigint primary key generated always as identity,
    user_id text not null, -- TEXT for Clerk authentication (not UUID)
    achievement_id varchar(10) not null,
    achievement_name varchar(255),
    description text,
    unlocked_at timestamp with time zone default now(),
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- Add unique constraint
ALTER TABLE achievements ADD CONSTRAINT unique_user_achievement UNIQUE (user_id, achievement_id);

-- Restore data from backup (this will be empty if the old table had UUID user_ids)
INSERT INTO achievements (user_id, achievement_id, achievement_name, description, unlocked_at, created_at, updated_at)
SELECT 
    user_id::text, -- Convert UUID to text if needed
    achievement_id, 
    achievement_name, 
    description, 
    unlocked_at, 
    created_at, 
    updated_at
FROM achievements_backup
WHERE user_id IS NOT NULL;

-- Drop backup table
DROP TABLE IF EXISTS achievements_backup;

-- Enable RLS on achievements
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for achievements
DROP POLICY IF EXISTS "achievements_select_policy" ON achievements;
CREATE POLICY "achievements_select_policy" ON achievements
    FOR SELECT TO authenticated USING (user_id = auth.uid()::text);

DROP POLICY IF EXISTS "achievements_insert_policy" ON achievements;
CREATE POLICY "achievements_insert_policy" ON achievements
    FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid()::text);

DROP POLICY IF EXISTS "achievements_update_policy" ON achievements;
CREATE POLICY "achievements_update_policy" ON achievements
    FOR UPDATE TO authenticated USING (user_id = auth.uid()::text) WITH CHECK (user_id = auth.uid()::text);

DROP POLICY IF EXISTS "achievements_delete_policy" ON achievements;
CREATE POLICY "achievements_delete_policy" ON achievements
    FOR DELETE TO authenticated USING (user_id = auth.uid()::text);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_achievements_user_id ON achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_achievements_achievement_id ON achievements(achievement_id);

-- Grant permissions
GRANT ALL ON achievements TO authenticated;

-- Verify the fix
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'achievements' 
AND column_name = 'user_id'; 