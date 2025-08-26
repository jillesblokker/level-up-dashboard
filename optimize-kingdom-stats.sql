-- ==========================================
-- KINGDOM STATS AND GAINS OPTIMIZATION
-- This script optimizes tables for better performance and data structure
-- ==========================================

-- 1. Drop existing tables if they exist (to recreate with better structure)
DROP TABLE IF EXISTS kingdom_stats CASCADE;
DROP TABLE IF EXISTS kingdom_gains CASCADE;
DROP TABLE IF EXISTS kingdom_daily_stats CASCADE;
DROP TABLE IF EXISTS kingdom_achievements CASCADE;

-- 2. Create optimized kingdom_stats table
CREATE TABLE kingdom_stats (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id TEXT NOT NULL,
    
    -- Core Kingdom Stats
    population INTEGER NOT NULL DEFAULT 0,
    happiness INTEGER NOT NULL DEFAULT 50,
    prestige INTEGER NOT NULL DEFAULT 0,
    influence INTEGER NOT NULL DEFAULT 0,
    
    -- Resources
    gold INTEGER NOT NULL DEFAULT 0,
    experience INTEGER NOT NULL DEFAULT 0,
    level INTEGER NOT NULL DEFAULT 1,
    build_tokens INTEGER NOT NULL DEFAULT 0,
    kingdom_expansions INTEGER NOT NULL DEFAULT 0,
    
    -- Buildings Summary
    total_buildings INTEGER NOT NULL DEFAULT 0,
    houses_count INTEGER NOT NULL DEFAULT 0,
    farms_count INTEGER NOT NULL DEFAULT 0,
    markets_count INTEGER NOT NULL DEFAULT 0,
    mines_count INTEGER NOT NULL DEFAULT 0,
    barracks_count INTEGER NOT NULL DEFAULT 0,
    walls_count INTEGER NOT NULL DEFAULT 0,
    towers_count INTEGER NOT NULL DEFAULT 0,
    temples_count INTEGER NOT NULL DEFAULT 0,
    castles_count INTEGER NOT NULL DEFAULT 0,
    
    -- Military Summary
    total_military INTEGER NOT NULL DEFAULT 0,
    soldiers_count INTEGER NOT NULL DEFAULT 0,
    archers_count INTEGER NOT NULL DEFAULT 0,
    cavalry_count INTEGER NOT NULL DEFAULT 0,
    siege_count INTEGER NOT NULL DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_happiness CHECK (happiness >= 0 AND happiness <= 100),
    CONSTRAINT valid_population CHECK (population >= 0),
    CONSTRAINT valid_prestige CHECK (prestige >= 0),
    CONSTRAINT valid_influence CHECK (influence >= 0),
    CONSTRAINT valid_gold CHECK (gold >= 0),
    CONSTRAINT valid_experience CHECK (experience >= 0),
    CONSTRAINT valid_level CHECK (level >= 1),
    CONSTRAINT valid_build_tokens CHECK (build_tokens >= 0),
    CONSTRAINT valid_kingdom_expansions CHECK (kingdom_expansions >= 0)
);

-- 3. Create optimized kingdom_gains table for tracking all gains
CREATE TABLE kingdom_gains (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id TEXT NOT NULL,
    
    -- Gain Details
    gain_type TEXT NOT NULL CHECK (gain_type IN ('quest', 'challenge', 'milestone', 'building', 'military', 'resource', 'achievement', 'daily', 'event')),
    source_id TEXT,
    source_name TEXT NOT NULL,
    
    -- Quantities
    gold_gained INTEGER NOT NULL DEFAULT 0,
    experience_gained INTEGER NOT NULL DEFAULT 0,
    population_gained INTEGER NOT NULL DEFAULT 0,
    happiness_gained INTEGER NOT NULL DEFAULT 0,
    prestige_gained INTEGER NOT NULL DEFAULT 0,
    influence_gained INTEGER NOT NULL DEFAULT 0,
    build_tokens_gained INTEGER NOT NULL DEFAULT 0,
    
    -- Metadata
    description TEXT,
    category TEXT,
    rarity TEXT CHECK (rarity IN ('common', 'uncommon', 'rare', 'epic', 'legendary')),
    multiplier DECIMAL(5,2) DEFAULT 1.00,
    
    -- Timestamps
    gained_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_gold_gained CHECK (gold_gained >= 0),
    CONSTRAINT valid_experience_gained CHECK (experience_gained >= 0),
    CONSTRAINT valid_population_gained CHECK (population_gained >= 0),
    CONSTRAINT valid_happiness_gained CHECK (happiness_gained >= -100 AND happiness_gained <= 100),
    CONSTRAINT valid_prestige_gained CHECK (prestige_gained >= 0),
    CONSTRAINT valid_influence_gained CHECK (influence_gained >= 0),
    CONSTRAINT valid_build_tokens_gained CHECK (build_tokens_gained >= 0),
    CONSTRAINT valid_multiplier CHECK (multiplier > 0)
);

-- 4. Create optimized kingdom_daily_stats table for daily tracking
CREATE TABLE kingdom_daily_stats (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id TEXT NOT NULL,
    stat_date DATE NOT NULL,
    
    -- Daily Totals
    daily_gold_gained INTEGER NOT NULL DEFAULT 0,
    daily_experience_gained INTEGER NOT NULL DEFAULT 0,
    daily_population_gained INTEGER NOT NULL DEFAULT 0,
    daily_happiness_gained INTEGER NOT NULL DEFAULT 0,
    daily_prestige_gained INTEGER NOT NULL DEFAULT 0,
    daily_influence_gained INTEGER NOT NULL DEFAULT 0,
    daily_build_tokens_gained INTEGER NOT NULL DEFAULT 0,
    
    -- Daily Counts
    daily_quests_completed INTEGER NOT NULL DEFAULT 0,
    daily_challenges_completed INTEGER NOT NULL DEFAULT 0,
    daily_milestones_completed INTEGER NOT NULL DEFAULT 0,
    daily_buildings_placed INTEGER NOT NULL DEFAULT 0,
    daily_military_recruited INTEGER NOT NULL DEFAULT 0,
    
    -- Daily Averages
    daily_avg_happiness DECIMAL(5,2) DEFAULT 50.00,
    daily_avg_population DECIMAL(8,2) DEFAULT 0.00,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(user_id, stat_date),
    CONSTRAINT valid_daily_gold CHECK (daily_gold_gained >= 0),
    CONSTRAINT valid_daily_experience CHECK (daily_experience_gained >= 0),
    CONSTRAINT valid_daily_population CHECK (daily_population_gained >= 0),
    CONSTRAINT valid_daily_happiness CHECK (daily_happiness_gained >= -100 AND daily_happiness_gained <= 100),
    CONSTRAINT valid_daily_prestige CHECK (daily_prestige_gained >= 0),
    CONSTRAINT valid_daily_influence CHECK (daily_influence_gained >= 0),
    CONSTRAINT valid_daily_build_tokens CHECK (daily_build_tokens_gained >= 0)
);

-- 5. Create optimized kingdom_achievements table
CREATE TABLE kingdom_achievements (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id TEXT NOT NULL,
    
    -- Achievement Details
    achievement_id TEXT NOT NULL,
    achievement_name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard', 'epic', 'legendary')),
    
    -- Rewards
    gold_reward INTEGER NOT NULL DEFAULT 0,
    experience_reward INTEGER NOT NULL DEFAULT 0,
    population_reward INTEGER NOT NULL DEFAULT 0,
    happiness_reward INTEGER NOT NULL DEFAULT 0,
    prestige_reward INTEGER NOT NULL DEFAULT 0,
    influence_reward INTEGER NOT NULL DEFAULT 0,
    build_tokens_reward INTEGER NOT NULL DEFAULT 0,
    
    -- Achievement Status
    is_hidden BOOLEAN NOT NULL DEFAULT false,
    is_unlocked BOOLEAN NOT NULL DEFAULT false,
    unlocked_at TIMESTAMP WITH TIME ZONE,
    progress_current INTEGER DEFAULT 0,
    progress_required INTEGER NOT NULL DEFAULT 1,
    
    -- Metadata
    unlock_condition TEXT,
    image_url TEXT,
    rarity TEXT CHECK (rarity IN ('common', 'uncommon', 'rare', 'epic', 'legendary')),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(user_id, achievement_id),
    CONSTRAINT valid_gold_reward CHECK (gold_reward >= 0),
    CONSTRAINT valid_experience_reward CHECK (experience_reward >= 0),
    CONSTRAINT valid_population_reward CHECK (population_reward >= 0),
    CONSTRAINT valid_happiness_reward CHECK (happiness_reward >= -100 AND happiness_reward <= 100),
    CONSTRAINT valid_prestige_reward CHECK (prestige_reward >= 0),
    CONSTRAINT valid_influence_reward CHECK (influence_reward >= 0),
    CONSTRAINT valid_build_tokens_reward CHECK (build_tokens_reward >= 0),
    CONSTRAINT valid_progress CHECK (progress_current >= 0 AND progress_required > 0)
);

-- 6. Create comprehensive indexes for optimal performance
CREATE INDEX idx_kingdom_stats_user_id ON kingdom_stats(user_id);
CREATE INDEX idx_kingdom_stats_level ON kingdom_stats(level);
CREATE INDEX idx_kingdom_stats_population ON kingdom_stats(population);
CREATE INDEX idx_kingdom_stats_prestige ON kingdom_stats(prestige);

CREATE INDEX idx_kingdom_gains_user_id ON kingdom_gains(user_id);
CREATE INDEX idx_kingdom_gains_type ON kingdom_gains(gain_type);
CREATE INDEX idx_kingdom_gains_date ON kingdom_gains(gained_at);
CREATE INDEX idx_kingdom_gains_source ON kingdom_gains(source_id);
CREATE INDEX idx_kingdom_gains_category ON kingdom_gains(category);
CREATE INDEX idx_kingdom_gains_rarity ON kingdom_gains(rarity);

CREATE INDEX idx_kingdom_daily_stats_user_id ON kingdom_daily_stats(user_id);
CREATE INDEX idx_kingdom_daily_stats_date ON kingdom_daily_stats(stat_date);
CREATE INDEX idx_kingdom_daily_stats_user_date ON kingdom_daily_stats(user_id, stat_date);

CREATE INDEX idx_kingdom_achievements_user_id ON kingdom_achievements(user_id);
CREATE INDEX idx_kingdom_achievements_category ON kingdom_achievements(category);
CREATE INDEX idx_kingdom_achievements_difficulty ON kingdom_achievements(difficulty);
CREATE INDEX idx_kingdom_achievements_unlocked ON kingdom_achievements(is_unlocked);
CREATE INDEX idx_kingdom_achievements_rarity ON kingdom_achievements(rarity);

-- 7. Create composite indexes for common query patterns
CREATE INDEX idx_kingdom_gains_user_type_date ON kingdom_gains(user_id, gain_type, gained_at);
CREATE INDEX idx_kingdom_gains_user_category_date ON kingdom_gains(user_id, category, gained_at);
CREATE INDEX idx_kingdom_daily_stats_user_category_date ON kingdom_daily_stats(user_id, stat_date);

-- 8. Create materialized view for kingdom summary (updated daily)
CREATE MATERIALIZED VIEW kingdom_summary AS
SELECT 
    ks.user_id,
    ks.population,
    ks.happiness,
    ks.prestige,
    ks.influence,
    ks.gold,
    ks.experience,
    ks.level,
    ks.build_tokens,
    ks.kingdom_expansions,
    ks.total_buildings,
    ks.total_military,
    
    -- Recent gains (last 7 days)
    COALESCE(SUM(CASE WHEN kg.gained_at >= CURRENT_DATE - INTERVAL '7 days' THEN kg.gold_gained ELSE 0 END), 0) as weekly_gold_gained,
    COALESCE(SUM(CASE WHEN kg.gained_at >= CURRENT_DATE - INTERVAL '7 days' THEN kg.experience_gained ELSE 0 END), 0) as weekly_experience_gained,
    COALESCE(SUM(CASE WHEN kg.gained_at >= CURRENT_DATE - INTERVAL '7 days' THEN kg.population_gained ELSE 0 END), 0) as weekly_population_gained,
    
    -- Achievement count
    COUNT(ka.id) FILTER (WHERE ka.is_unlocked = true) as achievements_unlocked,
    COUNT(ka.id) as total_achievements,
    
    -- Last updated
    ks.updated_at as last_updated
FROM kingdom_stats ks
LEFT JOIN kingdom_gains kg ON ks.user_id = kg.user_id
LEFT JOIN kingdom_achievements ka ON ks.user_id = ka.user_id
GROUP BY ks.id, ks.user_id, ks.population, ks.happiness, ks.prestige, ks.influence, 
         ks.gold, ks.experience, ks.level, ks.build_tokens, ks.kingdom_expansions,
         ks.total_buildings, ks.total_military, ks.updated_at;

-- 9. Create index on materialized view
CREATE UNIQUE INDEX idx_kingdom_summary_user_id ON kingdom_summary(user_id);

-- 10. Create function to refresh materialized view
CREATE OR REPLACE FUNCTION refresh_kingdom_summary()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY kingdom_summary;
END;
$$ LANGUAGE plpgsql;

-- 11. Create function to update daily stats
CREATE OR REPLACE FUNCTION update_kingdom_daily_stats()
RETURNS void AS $$
BEGIN
    -- Insert or update daily stats for today
    INSERT INTO kingdom_daily_stats (
        user_id, stat_date, daily_gold_gained, daily_experience_gained,
        daily_population_gained, daily_happiness_gained, daily_prestige_gained,
        daily_influence_gained, daily_build_tokens_gained, daily_quests_completed,
        daily_challenges_completed, daily_milestones_completed, daily_buildings_placed,
        daily_military_recruited, daily_avg_happiness, daily_avg_population
    )
    SELECT 
        user_id,
        CURRENT_DATE,
        COALESCE(SUM(gold_gained), 0),
        COALESCE(SUM(experience_gained), 0),
        COALESCE(SUM(population_gained), 0),
        COALESCE(SUM(happiness_gained), 0),
        COALESCE(SUM(prestige_gained), 0),
        COALESCE(SUM(influence_gained), 0),
        COALESCE(SUM(build_tokens_gained), 0),
        COUNT(CASE WHEN gain_type = 'quest' THEN 1 END),
        COUNT(CASE WHEN gain_type = 'challenge' THEN 1 END),
        COUNT(CASE WHEN gain_type = 'milestone' THEN 1 END),
        COUNT(CASE WHEN gain_type = 'building' THEN 1 END),
        COUNT(CASE WHEN gain_type = 'military' THEN 1 END),
        AVG(CASE WHEN gain_type IN ('quest', 'challenge', 'milestone') THEN 50 + COALESCE(SUM(happiness_gained), 0) END),
        AVG(CASE WHEN gain_type IN ('quest', 'challenge', 'milestone') THEN COALESCE(SUM(population_gained), 0) END)
    FROM kingdom_gains
    WHERE gained_at >= CURRENT_DATE
    GROUP BY user_id
    ON CONFLICT (user_id, stat_date) DO UPDATE SET
        daily_gold_gained = EXCLUDED.daily_gold_gained,
        daily_experience_gained = EXCLUDED.daily_experience_gained,
        daily_population_gained = EXCLUDED.daily_population_gained,
        daily_happiness_gained = EXCLUDED.daily_happiness_gained,
        daily_prestige_gained = EXCLUDED.daily_prestige_gained,
        daily_influence_gained = EXCLUDED.daily_influence_gained,
        daily_build_tokens_gained = EXCLUDED.daily_build_tokens_gained,
        daily_quests_completed = EXCLUDED.daily_quests_completed,
        daily_challenges_completed = EXCLUDED.daily_challenges_completed,
        daily_milestones_completed = EXCLUDED.daily_milestones_completed,
        daily_buildings_placed = EXCLUDED.daily_buildings_placed,
        daily_military_recruited = EXCLUDED.daily_military_recruited,
        daily_avg_happiness = EXCLUDED.daily_avg_happiness,
        daily_avg_population = EXCLUDED.daily_avg_population,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- 12. Create trigger to automatically update daily stats
CREATE OR REPLACE FUNCTION trigger_update_daily_stats()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM update_kingdom_daily_stats();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_kingdom_gains_daily_stats
    AFTER INSERT OR UPDATE ON kingdom_gains
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_daily_stats();

-- 13. Enable Row Level Security
ALTER TABLE kingdom_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE kingdom_gains ENABLE ROW LEVEL SECURITY;
ALTER TABLE kingdom_daily_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE kingdom_achievements ENABLE ROW LEVEL SECURITY;

-- 14. Create RLS policies
CREATE POLICY "Users can view their own kingdom stats" ON kingdom_stats
    FOR SELECT USING (user_id = current_user_id());

CREATE POLICY "Users can update their own kingdom stats" ON kingdom_stats
    FOR UPDATE USING (user_id = current_user_id());

CREATE POLICY "Users can view their own kingdom gains" ON kingdom_gains
    FOR SELECT USING (user_id = current_user_id());

CREATE POLICY "Users can insert their own kingdom gains" ON kingdom_gains
    FOR INSERT WITH CHECK (user_id = current_user_id());

CREATE POLICY "Users can view their own daily stats" ON kingdom_daily_stats
    FOR SELECT USING (user_id = current_user_id());

CREATE POLICY "Users can view their own achievements" ON kingdom_achievements
    FOR SELECT USING (user_id = current_user_id());

CREATE POLICY "Users can update their own achievements" ON kingdom_achievements
    FOR UPDATE USING (user_id = current_user_id());

-- 15. Create function to get current user ID (for RLS)
CREATE OR REPLACE FUNCTION current_user_id()
RETURNS TEXT AS $$
BEGIN
    RETURN current_setting('request.jwt.claims', true)::json->>'sub';
EXCEPTION
    WHEN OTHERS THEN
        RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 16. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- 17. Create sample data insertion function
CREATE OR REPLACE FUNCTION insert_sample_kingdom_data(p_user_id TEXT)
RETURNS void AS $$
BEGIN
    -- Insert sample kingdom stats
    INSERT INTO kingdom_stats (user_id, population, happiness, prestige, influence, gold, experience, level)
    VALUES (p_user_id, 100, 75, 10, 5, 1000, 500, 5)
    ON CONFLICT (user_id) DO NOTHING;
    
    -- Insert sample gains
    INSERT INTO kingdom_gains (user_id, gain_type, source_name, gold_gained, experience_gained, category, rarity)
    VALUES 
        (p_user_id, 'quest', 'Daily Quest', 50, 25, 'daily', 'common'),
        (p_user_id, 'challenge', 'Weekly Challenge', 100, 50, 'weekly', 'uncommon'),
        (p_user_id, 'milestone', 'First Building', 200, 100, 'achievement', 'rare');
    
    -- Insert sample achievements
    INSERT INTO kingdom_achievements (user_id, achievement_id, achievement_name, description, category, difficulty, gold_reward, experience_reward)
    VALUES 
        (p_user_id, 'FIRST_QUEST', 'First Quest', 'Complete your first quest', 'quests', 'easy', 50, 25),
        (p_user_id, 'KINGDOM_BUILDER', 'Kingdom Builder', 'Place your first building', 'building', 'easy', 100, 50);
END;
$$ LANGUAGE plpgsql;

-- 18. Final verification
SELECT 'Kingdom Stats and Gains tables optimized successfully!' as status;
SELECT 'Tables created:' as info;
SELECT '  - kingdom_stats' as table_name;
SELECT '  - kingdom_gains' as table_name;
SELECT '  - kingdom_daily_stats' as table_name;
SELECT '  - kingdom_achievements' as table_name;
SELECT '  - kingdom_summary (materialized view)' as table_name;
