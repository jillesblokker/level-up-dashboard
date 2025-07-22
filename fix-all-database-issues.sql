-- Comprehensive Database Fix for Level Up Game
-- Run this in your Supabase SQL editor to fix all 500 errors

-- 1. Fix quest_favorites table (drop and recreate with correct data types)
DROP TABLE IF EXISTS quest_favorites CASCADE;

CREATE TABLE quest_favorites (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL, -- TEXT for Clerk authentication
    quest_id TEXT NOT NULL,
    favorited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, quest_id)
);

-- 2. Create kingdom_grid table
DROP TABLE IF EXISTS kingdom_grid CASCADE;

CREATE TABLE kingdom_grid (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL UNIQUE, -- TEXT for Clerk authentication
    grid JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Enable Row Level Security on both tables
ALTER TABLE quest_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE kingdom_grid ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS policies for quest_favorites
DROP POLICY IF EXISTS "quest_favorites_user_policy" ON quest_favorites;
CREATE POLICY "quest_favorites_user_policy" ON quest_favorites
    FOR ALL USING (user_id = auth.uid());

-- 5. Create RLS policies for kingdom_grid
DROP POLICY IF EXISTS "kingdom_grid_user_policy" ON kingdom_grid;
CREATE POLICY "kingdom_grid_user_policy" ON kingdom_grid
    FOR ALL USING (user_id = auth.uid());

-- 6. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_quest_favorites_user_id ON quest_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_quest_favorites_quest_id ON quest_favorites(quest_id);
CREATE INDEX IF NOT EXISTS idx_kingdom_grid_user_id ON kingdom_grid(user_id);

-- 7. Grant permissions to authenticated users
GRANT ALL ON quest_favorites TO authenticated;
GRANT ALL ON kingdom_grid TO authenticated;

-- 8. Create any missing tables that might be referenced
-- Create user_progress table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_progress (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL UNIQUE,
    level INTEGER DEFAULT 1,
    experience INTEGER DEFAULT 0,
    gold INTEGER DEFAULT 0,
    build_tokens INTEGER DEFAULT 0,
    tiles_placed INTEGER DEFAULT 0,
    creatures_discovered INTEGER DEFAULT 0,
    achievements_unlocked INTEGER DEFAULT 0,
    quests_completed INTEGER DEFAULT 0,
    challenges_completed INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on user_progress
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for user_progress
DROP POLICY IF EXISTS "user_progress_user_policy" ON user_progress;
CREATE POLICY "user_progress_user_policy" ON user_progress
    FOR ALL USING (user_id = auth.uid());

-- Create index for user_progress
CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON user_progress(user_id);

-- Grant permissions for user_progress
GRANT ALL ON user_progress TO authenticated;

-- 9. Create achievements table if it doesn't exist
CREATE TABLE IF NOT EXISTS achievements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL,
    achievement_id VARCHAR(10) NOT NULL,
    achievement_name VARCHAR(255),
    description TEXT,
    unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, achievement_id)
);

-- Enable RLS on achievements
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for achievements
DROP POLICY IF EXISTS "achievements_user_policy" ON achievements;
CREATE POLICY "achievements_user_policy" ON achievements
    FOR ALL USING (user_id = auth.uid());

-- Create index for achievements
CREATE INDEX IF NOT EXISTS idx_achievements_user_id ON achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_achievements_achievement_id ON achievements(achievement_id);

-- Grant permissions for achievements
GRANT ALL ON achievements TO authenticated;

-- 10. Create achievement_definitions table if it doesn't exist
CREATE TABLE IF NOT EXISTS achievement_definitions (
    id VARCHAR(10) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL,
    difficulty VARCHAR(20) NOT NULL,
    xp_reward INTEGER DEFAULT 0,
    gold_reward INTEGER DEFAULT 0,
    image_url TEXT,
    is_hidden BOOLEAN DEFAULT FALSE,
    unlock_condition TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
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

-- Create RLS policy for achievement_definitions
DROP POLICY IF EXISTS "achievement_definitions_read_policy" ON achievement_definitions;
CREATE POLICY "achievement_definitions_read_policy" ON achievement_definitions
    FOR SELECT USING (true);

-- Grant permissions for achievement_definitions
GRANT ALL ON achievement_definitions TO authenticated;

COMMIT; 