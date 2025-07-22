-- Complete Supabase Setup for Level Up Game
-- Run this script in your Supabase SQL editor to set up all required tables and connections

-- 1. Achievement Definitions Table (for monster battle achievements)
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

-- 2. Monster Spawns Table (for tracking monster spawns on the map)
CREATE TABLE IF NOT EXISTS monster_spawns (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL,
    x INTEGER NOT NULL,
    y INTEGER NOT NULL,
    monster_type VARCHAR(50) NOT NULL,
    spawned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. User Achievements Table (if not exists - for tracking unlocked achievements)
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

-- 4. User Progress Table (for tracking various game progress metrics)
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

-- 5. Tile Placement History Table (for tracking tile placement for monster spawning)
CREATE TABLE IF NOT EXISTS tile_placements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL,
    tile_type VARCHAR(50) NOT NULL,
    x INTEGER NOT NULL,
    y INTEGER NOT NULL,
    placed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Game Events Table (for tracking various game events)
CREATE TABLE IF NOT EXISTS game_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    event_data JSONB,
    occurred_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE achievement_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE monster_spawns ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE tile_placements ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_events ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for achievement_definitions (read-only for all authenticated users)
CREATE POLICY "achievement_definitions_read_policy" ON achievement_definitions
    FOR SELECT USING (true);

-- Create RLS policies for monster_spawns (users can only see their own spawns)
CREATE POLICY "monster_spawns_user_policy" ON monster_spawns
    FOR ALL USING (user_id = auth.uid());

-- Create RLS policies for achievements (users can only see their own achievements)
CREATE POLICY "achievements_user_policy" ON achievements
    FOR ALL USING (user_id = auth.uid());

-- Create RLS policies for user_progress (users can only see their own progress)
CREATE POLICY "user_progress_user_policy" ON user_progress
    FOR ALL USING (user_id = auth.uid());

-- Create RLS policies for tile_placements (users can only see their own placements)
CREATE POLICY "tile_placements_user_policy" ON tile_placements
    FOR ALL USING (user_id = auth.uid());

-- Create RLS policies for game_events (users can only see their own events)
CREATE POLICY "game_events_user_policy" ON game_events
    FOR ALL USING (user_id = auth.uid());

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_monster_spawns_user_id ON monster_spawns(user_id);
CREATE INDEX IF NOT EXISTS idx_monster_spawns_coordinates ON monster_spawns(x, y);
CREATE INDEX IF NOT EXISTS idx_achievements_user_id ON achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_achievements_achievement_id ON achievements(achievement_id);
CREATE INDEX IF NOT EXISTS idx_tile_placements_user_id ON tile_placements(user_id);
CREATE INDEX IF NOT EXISTS idx_tile_placements_tile_type ON tile_placements(tile_type);
CREATE INDEX IF NOT EXISTS idx_game_events_user_id ON game_events(user_id);
CREATE INDEX IF NOT EXISTS idx_game_events_event_type ON game_events(event_type);

-- Create functions for common operations

-- Function to get user's tile count by type
CREATE OR REPLACE FUNCTION get_user_tile_count(user_uuid TEXT, tile_type_filter VARCHAR)
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)
        FROM tile_placements
        WHERE user_id = user_uuid AND tile_type = tile_type_filter
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if monster should spawn
CREATE OR REPLACE FUNCTION should_spawn_monster(user_uuid TEXT, tile_type_filter VARCHAR)
RETURNS BOOLEAN AS $$
DECLARE
    tile_count INTEGER;
    spawn_threshold INTEGER;
BEGIN
    -- Get current tile count
    tile_count := get_user_tile_count(user_uuid, tile_type_filter);
    
    -- Define spawn thresholds
    CASE tile_type_filter
        WHEN 'desert' THEN spawn_threshold := 3;
        WHEN 'swamp' THEN spawn_threshold := 2;
        WHEN 'mountain' THEN spawn_threshold := 5;
        WHEN 'ice' THEN spawn_threshold := 4;
        WHEN 'snow' THEN spawn_threshold := 3;
        WHEN 'forest' THEN spawn_threshold := 6;
        ELSE spawn_threshold := 999; -- Never spawn for unknown types
    END CASE;
    
    RETURN tile_count = spawn_threshold;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get monster type for tile type
CREATE OR REPLACE FUNCTION get_monster_type_for_tile(tile_type_filter VARCHAR)
RETURNS VARCHAR AS $$
BEGIN
    CASE tile_type_filter
        WHEN 'desert' THEN RETURN 'dragon';
        WHEN 'swamp' THEN RETURN 'goblin';
        WHEN 'mountain' THEN RETURN 'troll';
        WHEN 'ice' THEN RETURN 'wizard';
        WHEN 'snow' THEN RETURN 'pegasus';
        WHEN 'forest' THEN RETURN 'fairy';
        ELSE RETURN NULL;
    END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to unlock achievement
CREATE OR REPLACE FUNCTION unlock_achievement(user_uuid TEXT, achievement_id_filter VARCHAR)
RETURNS BOOLEAN AS $$
BEGIN
    INSERT INTO achievements (user_id, achievement_id, achievement_name, unlocked_at)
    VALUES (user_uuid, achievement_id_filter, achievement_id_filter, NOW())
    ON CONFLICT (user_id, achievement_id) DO NOTHING;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for automatic operations

-- Trigger to automatically unlock monster achievements when monsters spawn
CREATE OR REPLACE FUNCTION trigger_monster_achievement_unlock()
RETURNS TRIGGER AS $$
DECLARE
    achievement_id VARCHAR;
BEGIN
    -- Map monster type to achievement ID
    CASE NEW.monster_type
        WHEN 'dragon' THEN achievement_id := '201';
        WHEN 'goblin' THEN achievement_id := '202';
        WHEN 'troll' THEN achievement_id := '203';
        WHEN 'wizard' THEN achievement_id := '204';
        WHEN 'pegasus' THEN achievement_id := '205';
        WHEN 'fairy' THEN achievement_id := '206';
        ELSE achievement_id := NULL;
    END CASE;
    
    -- Unlock achievement if we have a valid achievement ID
    IF achievement_id IS NOT NULL THEN
        PERFORM unlock_achievement(NEW.user_id, achievement_id);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER monster_spawn_achievement_trigger
    AFTER INSERT ON monster_spawns
    FOR EACH ROW
    EXECUTE FUNCTION trigger_monster_achievement_unlock();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

COMMIT; 