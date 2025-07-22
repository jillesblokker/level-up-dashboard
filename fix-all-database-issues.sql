-- Comprehensive Database Fix for Level Up Game
-- Following Supabase/Postgres best practices with Clerk compatibility
-- Run this in your Supabase SQL editor to fix all 500 errors

-- 1. Fix quest_favorites table (drop and recreate with best practices)
-- First, backup existing data if table exists
CREATE TABLE IF NOT EXISTS quest_favorites_backup AS 
SELECT * FROM quest_favorites WHERE 1=0;

-- Copy existing data to backup (if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'quest_favorites') THEN
        INSERT INTO quest_favorites_backup 
        SELECT * FROM quest_favorites;
    END IF;
END $$;

-- Drop the existing table
DROP TABLE IF EXISTS quest_favorites CASCADE;

-- Create new table with proper structure
CREATE TABLE quest_favorites (
    id bigint primary key generated always as identity,
    user_id text not null, -- TEXT for Clerk authentication (not UUID)
    quest_id text not null,
    favorited_at timestamp with time zone default now(),
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- Add unique constraint after table creation
ALTER TABLE quest_favorites ADD CONSTRAINT unique_user_quest UNIQUE (user_id, quest_id);

-- Restore data from backup, removing duplicates
INSERT INTO quest_favorites (user_id, quest_id, favorited_at, created_at, updated_at)
SELECT DISTINCT ON (user_id, quest_id) 
    user_id, 
    quest_id, 
    favorited_at, 
    created_at, 
    updated_at
FROM quest_favorites_backup
ORDER BY user_id, quest_id, created_at DESC;

-- Drop backup table
DROP TABLE IF EXISTS quest_favorites_backup;

-- 2. Create kingdom_grid table with best practices
-- First, backup existing data if table exists
CREATE TABLE IF NOT EXISTS kingdom_grid_backup AS 
SELECT * FROM kingdom_grid WHERE 1=0;

-- Copy existing data to backup (if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'kingdom_grid') THEN
        INSERT INTO kingdom_grid_backup 
        SELECT * FROM kingdom_grid;
    END IF;
END $$;

-- Drop the existing table
DROP TABLE IF EXISTS kingdom_grid CASCADE;

-- Create new table with proper structure
CREATE TABLE kingdom_grid (
    id bigint primary key generated always as identity,
    user_id text not null, -- TEXT for Clerk authentication (not UUID)
    grid jsonb not null default '[]'::jsonb,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- Add unique constraint after table creation
ALTER TABLE kingdom_grid ADD CONSTRAINT unique_user_kingdom_grid UNIQUE (user_id);

-- Restore data from backup
INSERT INTO kingdom_grid (user_id, grid, created_at, updated_at)
SELECT user_id, grid, created_at, updated_at
FROM kingdom_grid_backup;

-- Drop backup table
DROP TABLE IF EXISTS kingdom_grid_backup;

-- 3. Enable Row Level Security on both tables
ALTER TABLE quest_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE kingdom_grid ENABLE ROW LEVEL SECURITY;

-- 4. Create comprehensive RLS policies for quest_favorites
DROP POLICY IF EXISTS "quest_favorites_select_policy" ON quest_favorites;
CREATE POLICY "quest_favorites_select_policy" ON quest_favorites
    FOR SELECT TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "quest_favorites_insert_policy" ON quest_favorites;
CREATE POLICY "quest_favorites_insert_policy" ON quest_favorites
    FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "quest_favorites_update_policy" ON quest_favorites;
CREATE POLICY "quest_favorites_update_policy" ON quest_favorites
    FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "quest_favorites_delete_policy" ON quest_favorites;
CREATE POLICY "quest_favorites_delete_policy" ON quest_favorites
    FOR DELETE TO authenticated USING (user_id = auth.uid());

-- 5. Create comprehensive RLS policies for kingdom_grid
DROP POLICY IF EXISTS "kingdom_grid_select_policy" ON kingdom_grid;
CREATE POLICY "kingdom_grid_select_policy" ON kingdom_grid
    FOR SELECT TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "kingdom_grid_insert_policy" ON kingdom_grid;
CREATE POLICY "kingdom_grid_insert_policy" ON kingdom_grid
    FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "kingdom_grid_update_policy" ON kingdom_grid;
CREATE POLICY "kingdom_grid_update_policy" ON kingdom_grid
    FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "kingdom_grid_delete_policy" ON kingdom_grid;
CREATE POLICY "kingdom_grid_delete_policy" ON kingdom_grid
    FOR DELETE TO authenticated USING (user_id = auth.uid());

-- 6. Create indexes for performance (including foreign key indexes)
CREATE INDEX IF NOT EXISTS idx_quest_favorites_user_id ON quest_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_quest_favorites_quest_id ON quest_favorites(quest_id);
CREATE INDEX IF NOT EXISTS idx_kingdom_grid_user_id ON kingdom_grid(user_id);

-- 7. Grant permissions to authenticated users
GRANT ALL ON quest_favorites TO authenticated;
GRANT ALL ON kingdom_grid TO authenticated;

-- 8. Create user_progress table with best practices
-- First, backup existing data if table exists
CREATE TABLE IF NOT EXISTS user_progress_backup AS 
SELECT * FROM user_progress WHERE 1=0;

-- Copy existing data to backup (if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_progress') THEN
        INSERT INTO user_progress_backup 
        SELECT * FROM user_progress;
    END IF;
END $$;

-- Drop and recreate the table
DROP TABLE IF EXISTS user_progress CASCADE;

CREATE TABLE user_progress (
    id bigint primary key generated always as identity,
    user_id text not null, -- TEXT for Clerk authentication (not UUID)
    level integer default 1,
    experience integer default 0,
    gold integer default 0,
    build_tokens integer default 0,
    tiles_placed integer default 0,
    creatures_discovered integer default 0,
    achievements_unlocked integer default 0,
    quests_completed integer default 0,
    challenges_completed integer default 0,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- Add unique constraint after table creation
ALTER TABLE user_progress ADD CONSTRAINT unique_user_progress UNIQUE (user_id);

-- Restore data from backup, removing duplicates
INSERT INTO user_progress (user_id, level, experience, gold, build_tokens, tiles_placed, creatures_discovered, achievements_unlocked, quests_completed, challenges_completed, created_at, updated_at)
SELECT DISTINCT ON (user_id) 
    user_id, 
    level, 
    experience, 
    gold, 
    build_tokens, 
    tiles_placed, 
    creatures_discovered, 
    achievements_unlocked, 
    quests_completed, 
    challenges_completed, 
    created_at, 
    updated_at
FROM user_progress_backup
ORDER BY user_id, created_at DESC;

-- Drop backup table
DROP TABLE IF EXISTS user_progress_backup;

-- Enable RLS on user_progress
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;

-- Create comprehensive RLS policies for user_progress
DROP POLICY IF EXISTS "user_progress_select_policy" ON user_progress;
CREATE POLICY "user_progress_select_policy" ON user_progress
    FOR SELECT TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "user_progress_insert_policy" ON user_progress;
CREATE POLICY "user_progress_insert_policy" ON user_progress
    FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "user_progress_update_policy" ON user_progress;
CREATE POLICY "user_progress_update_policy" ON user_progress
    FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "user_progress_delete_policy" ON user_progress;
CREATE POLICY "user_progress_delete_policy" ON user_progress
    FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Create index for user_progress
CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON user_progress(user_id);

-- Grant permissions for user_progress
GRANT ALL ON user_progress TO authenticated;

-- 9. Create achievements table with best practices
-- First, backup existing data if table exists
CREATE TABLE IF NOT EXISTS achievements_backup AS 
SELECT * FROM achievements WHERE 1=0;

-- Copy existing data to backup (if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'achievements') THEN
        INSERT INTO achievements_backup 
        SELECT * FROM achievements;
    END IF;
END $$;

-- Drop and recreate the table
DROP TABLE IF EXISTS achievements CASCADE;

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

-- Add unique constraint after table creation
ALTER TABLE achievements ADD CONSTRAINT unique_user_achievement UNIQUE (user_id, achievement_id);

-- Restore data from backup, removing duplicates
INSERT INTO achievements (user_id, achievement_id, achievement_name, description, unlocked_at, created_at, updated_at)
SELECT DISTINCT ON (user_id, achievement_id) 
    user_id, 
    achievement_id, 
    achievement_name, 
    description, 
    unlocked_at, 
    created_at, 
    updated_at
FROM achievements_backup
ORDER BY user_id, achievement_id, created_at DESC;

-- Drop backup table
DROP TABLE IF EXISTS achievements_backup;

-- Enable RLS on achievements
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;

-- Create comprehensive RLS policies for achievements
DROP POLICY IF EXISTS "achievements_select_policy" ON achievements;
CREATE POLICY "achievements_select_policy" ON achievements
    FOR SELECT TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "achievements_insert_policy" ON achievements;
CREATE POLICY "achievements_insert_policy" ON achievements
    FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "achievements_update_policy" ON achievements;
CREATE POLICY "achievements_update_policy" ON achievements
    FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "achievements_delete_policy" ON achievements;
CREATE POLICY "achievements_delete_policy" ON achievements
    FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Create indexes for achievements
CREATE INDEX IF NOT EXISTS idx_achievements_user_id ON achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_achievements_achievement_id ON achievements(achievement_id);

-- Grant permissions for achievements
GRANT ALL ON achievements TO authenticated;

-- 10. Create achievement_definitions table (read-only for all authenticated users)
CREATE TABLE IF NOT EXISTS achievement_definitions (
    id varchar(10) primary key,
    name varchar(255) not null,
    description text,
    category varchar(50) not null,
    difficulty varchar(20) not null,
    xp_reward integer default 0,
    gold_reward integer default 0,
    image_url text,
    is_hidden boolean default false,
    unlock_condition text,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- Insert monster battle achievement definitions
INSERT INTO achievement_definitions (id, name, description, category, difficulty, xp_reward, gold_reward, image_url, unlock_condition) VALUES
('201', 'Ancient Dragon Slayer', 'Defeat Dragoni in a Simon Says battle', 'combat', 'hard', 100, 100, '/images/achievements/201.png', 'Complete Simon Says battle against Dragon'),
('202', 'Goblin Hunter', 'Defeat Orci in a Simon Says battle', 'combat', 'easy', 100, 100, '/images/achievements/202.png', 'Complete Simon Says battle against Goblin'),
('203', 'Troll Crusher', 'Defeat Trollie in a Simon Says battle', 'combat', 'medium', 100, 100, '/images/achievements/203.png', 'Complete Simon Says battle against Troll'),
('204', 'Dark Wizard Vanquisher', 'Defeat Sorcero in a Simon Says battle', 'combat', 'hard', 100, 100, '/images/achievements/204.png', 'Complete Simon Says battle against Wizard'),
('205', 'Pegasus Tamer', 'Defeat Peggie in a Simon Says battle', 'combat', 'medium', 100, 100, '/images/achievements/205.png', 'Complete Simon Says battle against Pegasus'),
('206', 'Fairy Friend', 'Defeat Fairiel in a Simon Says battle', 'combat', 'easy', 100, 100, '/images/achievements/206.png', 'Complete Simon Says battle against Fairy')
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    category = EXCLUDED.category,
    difficulty = EXCLUDED.difficulty,
    xp_reward = EXCLUDED.xp_reward,
    gold_reward = EXCLUDED.gold_reward,
    image_url = EXCLUDED.image_url,
    unlock_condition = EXCLUDED.unlock_condition,
    updated_at = NOW();

-- Enable RLS on achievement_definitions (read-only for all authenticated users)
ALTER TABLE achievement_definitions ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for achievement_definitions (read-only)
DROP POLICY IF EXISTS "achievement_definitions_read_policy" ON achievement_definitions;
CREATE POLICY "achievement_definitions_read_policy" ON achievement_definitions
    FOR SELECT TO authenticated USING (true);

-- Grant permissions for achievement_definitions
GRANT ALL ON achievement_definitions TO authenticated;

-- 11. Create additional tables that might be needed for the game
-- Create monster_spawns table with best practices
CREATE TABLE IF NOT EXISTS monster_spawns (
    id bigint primary key generated always as identity,
    user_id text not null, -- TEXT for Clerk authentication (not UUID)
    x integer not null,
    y integer not null,
    monster_type varchar(50) not null,
    spawned_at timestamp with time zone default now(),
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- Enable RLS on monster_spawns
ALTER TABLE monster_spawns ENABLE ROW LEVEL SECURITY;

-- Create comprehensive RLS policies for monster_spawns
DROP POLICY IF EXISTS "monster_spawns_select_policy" ON monster_spawns;
CREATE POLICY "monster_spawns_select_policy" ON monster_spawns
    FOR SELECT TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "monster_spawns_insert_policy" ON monster_spawns;
CREATE POLICY "monster_spawns_insert_policy" ON monster_spawns
    FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "monster_spawns_update_policy" ON monster_spawns;
CREATE POLICY "monster_spawns_update_policy" ON monster_spawns
    FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "monster_spawns_delete_policy" ON monster_spawns;
CREATE POLICY "monster_spawns_delete_policy" ON monster_spawns
    FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Create indexes for monster_spawns
CREATE INDEX IF NOT EXISTS idx_monster_spawns_user_id ON monster_spawns(user_id);
CREATE INDEX IF NOT EXISTS idx_monster_spawns_coordinates ON monster_spawns(x, y);

-- Grant permissions for monster_spawns
GRANT ALL ON monster_spawns TO authenticated;

-- 12. Create tile_placements table with best practices
-- First, backup existing data if table exists
CREATE TABLE IF NOT EXISTS tile_placements_backup AS 
SELECT * FROM tile_placements WHERE 1=0;

-- Copy existing data to backup (if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'tile_placements') THEN
        INSERT INTO tile_placements_backup 
        SELECT * FROM tile_placements;
    END IF;
END $$;

-- Drop and recreate the table
DROP TABLE IF EXISTS tile_placements CASCADE;

CREATE TABLE tile_placements (
    id bigint primary key generated always as identity,
    user_id text not null, -- TEXT for Clerk authentication (not UUID)
    x integer not null,
    y integer not null,
    tile_type integer not null,
    placed_at timestamp with time zone default now(),
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- Add unique constraint after table creation
ALTER TABLE tile_placements ADD CONSTRAINT unique_user_tile_position UNIQUE (user_id, x, y);

-- Restore data from backup, removing duplicates
INSERT INTO tile_placements (user_id, x, y, tile_type, placed_at, created_at, updated_at)
SELECT DISTINCT ON (user_id, x, y) 
    user_id, 
    x, 
    y, 
    tile_type, 
    placed_at, 
    created_at, 
    updated_at
FROM tile_placements_backup
ORDER BY user_id, x, y, created_at DESC;

-- Drop backup table
DROP TABLE IF EXISTS tile_placements_backup;

-- Enable RLS on tile_placements
ALTER TABLE tile_placements ENABLE ROW LEVEL SECURITY;

-- Create comprehensive RLS policies for tile_placements
DROP POLICY IF EXISTS "tile_placements_select_policy" ON tile_placements;
CREATE POLICY "tile_placements_select_policy" ON tile_placements
    FOR SELECT TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "tile_placements_insert_policy" ON tile_placements;
CREATE POLICY "tile_placements_insert_policy" ON tile_placements
    FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "tile_placements_update_policy" ON tile_placements;
CREATE POLICY "tile_placements_update_policy" ON tile_placements
    FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "tile_placements_delete_policy" ON tile_placements;
CREATE POLICY "tile_placements_delete_policy" ON tile_placements
    FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Create indexes for tile_placements
CREATE INDEX IF NOT EXISTS idx_tile_placements_user_id ON tile_placements(user_id);
CREATE INDEX IF NOT EXISTS idx_tile_placements_coordinates ON tile_placements(x, y);

-- Grant permissions for tile_placements
GRANT ALL ON tile_placements TO authenticated;

COMMIT; 