-- Custom Migration Script for Level-Up Dashboard
-- This script safely creates or updates tables without errors

-- 1. Kingdom Grid Table (for kingdom layout persistence)
CREATE TABLE IF NOT EXISTS kingdom_grid (
    user_id UUID PRIMARY KEY,
    grid_data JSONB NOT NULL DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Kingdom Tile Timers Table (for tile cooldowns and timers)
CREATE TABLE IF NOT EXISTS kingdom_timers (
    user_id UUID PRIMARY KEY,
    timers_data JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Kingdom Tile Items Table (for items stored in tiles)
CREATE TABLE IF NOT EXISTS kingdom_items (
    user_id UUID PRIMARY KEY,
    items_data JSONB NOT NULL DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Kingdom Tile States Table (for individual tile states)
CREATE TABLE IF NOT EXISTS kingdom_tile_states (
    user_id UUID PRIMARY KEY,
    states_data JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Quest Progress Table
CREATE TABLE IF NOT EXISTS quest_progress (
    user_id UUID PRIMARY KEY,
    progress_data JSONB NOT NULL DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Challenge Progress Table
CREATE TABLE IF NOT EXISTS challenge_progress (
    user_id UUID PRIMARY KEY,
    progress_data JSONB NOT NULL DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Milestone Progress Table
CREATE TABLE IF NOT EXISTS milestone_progress (
    user_id UUID PRIMARY KEY,
    progress_data JSONB NOT NULL DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Character Stats Table (already exists, but adding missing columns if needed)
-- Note: This table already exists with individual columns, so we'll add a stats_data column
-- for backward compatibility and future flexibility

-- Add stats_data column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'character_stats' 
        AND column_name = 'stats_data'
    ) THEN
        ALTER TABLE character_stats ADD COLUMN stats_data JSONB;
    END IF;
END $$;

-- 9. Create a unified view for character stats (backward compatibility)
CREATE OR REPLACE VIEW character_stats_unified AS
SELECT 
    user_id,
    gold,
    experience,
    level,
    health,
    max_health,
    build_tokens,
    kingdom_expansions,
    stats_data,
    created_at,
    updated_at
FROM character_stats;

-- 10. Create a function to sync individual columns with stats_data
CREATE OR REPLACE FUNCTION sync_character_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- Update stats_data when individual columns change
    NEW.stats_data = jsonb_build_object(
        'gold', NEW.gold,
        'experience', NEW.experience,
        'level', NEW.level,
        'health', NEW.health,
        'max_health', NEW.max_health,
        'build_tokens', NEW.build_tokens,
        'kingdom_expansions', NEW.kingdom_expansions
    );
    
    -- Update the updated_at timestamp
    NEW.updated_at = NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 11. Create trigger to automatically sync stats_data
DROP TRIGGER IF EXISTS trigger_sync_character_stats ON character_stats;
CREATE TRIGGER trigger_sync_character_stats
    BEFORE INSERT OR UPDATE ON character_stats
    FOR EACH ROW
    EXECUTE FUNCTION sync_character_stats();

-- 12. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_kingdom_grid_user_id ON kingdom_grid(user_id);
CREATE INDEX IF NOT EXISTS idx_kingdom_timers_user_id ON kingdom_timers(user_id);
CREATE INDEX IF NOT EXISTS idx_kingdom_items_user_id ON kingdom_items(user_id);
CREATE INDEX IF NOT EXISTS idx_kingdom_tile_states_user_id ON kingdom_tile_states(user_id);
CREATE INDEX IF NOT EXISTS idx_quest_progress_user_id ON quest_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_challenge_progress_user_id ON challenge_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_milestone_progress_user_id ON milestone_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_character_stats_user_id ON character_stats(user_id);

-- 13. Add RLS (Row Level Security) policies for all tables
-- Kingdom Grid
ALTER TABLE kingdom_grid ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own kingdom grid" ON kingdom_grid
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own kingdom grid" ON kingdom_grid
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own kingdom grid" ON kingdom_grid
    FOR UPDATE USING (auth.uid() = user_id);

-- Kingdom Timers
ALTER TABLE kingdom_timers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own kingdom timers" ON kingdom_timers
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own kingdom timers" ON kingdom_timers
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own kingdom timers" ON kingdom_timers
    FOR UPDATE USING (auth.uid() = user_id);

-- Kingdom Items
ALTER TABLE kingdom_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own kingdom items" ON kingdom_items
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own kingdom items" ON kingdom_items
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own kingdom items" ON kingdom_items
    FOR UPDATE USING (auth.uid() = user_id);

-- Kingdom Tile States
ALTER TABLE kingdom_tile_states ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own kingdom tile states" ON kingdom_tile_states
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own kingdom tile states" ON kingdom_tile_states
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own kingdom tile states" ON kingdom_tile_states
    FOR UPDATE USING (auth.uid() = user_id);

-- Quest Progress
ALTER TABLE quest_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own quest progress" ON quest_progress
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own quest progress" ON quest_progress
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own quest progress" ON quest_progress
    FOR UPDATE USING (auth.uid() = user_id);

-- Challenge Progress
ALTER TABLE challenge_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own challenge progress" ON challenge_progress
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own challenge progress" ON challenge_progress
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own challenge progress" ON challenge_progress
    FOR UPDATE USING (auth.uid() = user_id);

-- Milestone Progress
ALTER TABLE milestone_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own milestone progress" ON milestone_progress
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own milestone progress" ON milestone_progress
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own milestone progress" ON milestone_progress
    FOR UPDATE USING (auth.uid() = user_id);

-- Character Stats (already has RLS, but ensuring policies exist)
ALTER TABLE character_stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own character stats" ON character_stats
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own character stats" ON character_stats
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own character stats" ON character_stats
    FOR UPDATE USING (auth.uid() = user_id);

-- 14. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- 15. Output confirmation
SELECT 'Migration completed successfully!' as status;
