-- Simple Table Fix Script
-- This script creates all tables from scratch without any dependencies
-- Run this in your Supabase SQL editor

-- Drop tables if they exist (ignore errors)
DROP TABLE IF EXISTS quest_favorites CASCADE;
DROP TABLE IF EXISTS kingdom_grid CASCADE;
DROP TABLE IF EXISTS user_progress CASCADE;
DROP TABLE IF EXISTS achievements CASCADE;
DROP TABLE IF EXISTS tile_placements CASCADE;
DROP TABLE IF EXISTS monster_spawns CASCADE;
DROP TABLE IF EXISTS achievement_definitions CASCADE;

-- Create quest_favorites table
CREATE TABLE quest_favorites (
    id bigint primary key generated always as identity,
    user_id text not null,
    quest_id text not null,
    favorited_at timestamp with time zone default now(),
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- Create kingdom_grid table
CREATE TABLE kingdom_grid (
    id bigint primary key generated always as identity,
    user_id text not null,
    grid jsonb not null default '[]'::jsonb,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- Create user_progress table
CREATE TABLE user_progress (
    id bigint primary key generated always as identity,
    user_id text not null,
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

-- Create achievements table
CREATE TABLE achievements (
    id bigint primary key generated always as identity,
    user_id text not null,
    achievement_id varchar(10) not null,
    achievement_name varchar(255),
    description text,
    unlocked_at timestamp with time zone default now(),
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- Create tile_placements table
CREATE TABLE tile_placements (
    id bigint primary key generated always as identity,
    user_id text not null,
    x integer not null,
    y integer not null,
    tile_type integer not null,
    placed_at timestamp with time zone default now(),
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- Create monster_spawns table
CREATE TABLE monster_spawns (
    id bigint primary key generated always as identity,
    user_id text not null,
    x integer not null,
    y integer not null,
    monster_type varchar(50) not null,
    spawned_at timestamp with time zone default now(),
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- Create achievement_definitions table
CREATE TABLE achievement_definitions (
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

-- Add unique constraints
ALTER TABLE quest_favorites ADD CONSTRAINT unique_user_quest UNIQUE (user_id, quest_id);
ALTER TABLE kingdom_grid ADD CONSTRAINT unique_user_kingdom_grid UNIQUE (user_id);
ALTER TABLE user_progress ADD CONSTRAINT unique_user_progress UNIQUE (user_id);
ALTER TABLE achievements ADD CONSTRAINT unique_user_achievement UNIQUE (user_id, achievement_id);
ALTER TABLE tile_placements ADD CONSTRAINT unique_user_tile_position UNIQUE (user_id, x, y);

-- Enable RLS on all tables
ALTER TABLE quest_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE kingdom_grid ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE tile_placements ENABLE ROW LEVEL SECURITY;
ALTER TABLE monster_spawns ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievement_definitions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for quest_favorites
CREATE POLICY "quest_favorites_select_policy" ON quest_favorites
    FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "quest_favorites_insert_policy" ON quest_favorites
    FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "quest_favorites_update_policy" ON quest_favorites
    FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "quest_favorites_delete_policy" ON quest_favorites
    FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Create RLS policies for kingdom_grid
CREATE POLICY "kingdom_grid_select_policy" ON kingdom_grid
    FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "kingdom_grid_insert_policy" ON kingdom_grid
    FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "kingdom_grid_update_policy" ON kingdom_grid
    FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "kingdom_grid_delete_policy" ON kingdom_grid
    FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Create RLS policies for user_progress
CREATE POLICY "user_progress_select_policy" ON user_progress
    FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "user_progress_insert_policy" ON user_progress
    FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "user_progress_update_policy" ON user_progress
    FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "user_progress_delete_policy" ON user_progress
    FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Create RLS policies for achievements
CREATE POLICY "achievements_select_policy" ON achievements
    FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "achievements_insert_policy" ON achievements
    FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "achievements_update_policy" ON achievements
    FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "achievements_delete_policy" ON achievements
    FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Create RLS policies for tile_placements
CREATE POLICY "tile_placements_select_policy" ON tile_placements
    FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "tile_placements_insert_policy" ON tile_placements
    FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "tile_placements_update_policy" ON tile_placements
    FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "tile_placements_delete_policy" ON tile_placements
    FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Create RLS policies for monster_spawns
CREATE POLICY "monster_spawns_select_policy" ON monster_spawns
    FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "monster_spawns_insert_policy" ON monster_spawns
    FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "monster_spawns_update_policy" ON monster_spawns
    FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "monster_spawns_delete_policy" ON monster_spawns
    FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Create RLS policy for achievement_definitions (read-only)
CREATE POLICY "achievement_definitions_read_policy" ON achievement_definitions
    FOR SELECT TO authenticated USING (true);

-- Create indexes
CREATE INDEX idx_quest_favorites_user_id ON quest_favorites(user_id);
CREATE INDEX idx_quest_favorites_quest_id ON quest_favorites(quest_id);
CREATE INDEX idx_kingdom_grid_user_id ON kingdom_grid(user_id);
CREATE INDEX idx_user_progress_user_id ON user_progress(user_id);
CREATE INDEX idx_achievements_user_id ON achievements(user_id);
CREATE INDEX idx_achievements_achievement_id ON achievements(achievement_id);
CREATE INDEX idx_tile_placements_user_id ON tile_placements(user_id);
CREATE INDEX idx_tile_placements_coordinates ON tile_placements(x, y);
CREATE INDEX idx_monster_spawns_user_id ON monster_spawns(user_id);
CREATE INDEX idx_monster_spawns_coordinates ON monster_spawns(x, y);

-- Grant permissions
GRANT ALL ON quest_favorites TO authenticated;
GRANT ALL ON kingdom_grid TO authenticated;
GRANT ALL ON user_progress TO authenticated;
GRANT ALL ON achievements TO authenticated;
GRANT ALL ON tile_placements TO authenticated;
GRANT ALL ON monster_spawns TO authenticated;
GRANT ALL ON achievement_definitions TO authenticated;

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

COMMIT; 