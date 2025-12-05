-- Restore Achievements Data for Level Up Game
-- This script restores all achievement definitions and sample data

-- First, ensure the tables exist with correct structure
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

CREATE TABLE IF NOT EXISTS achievements (
    id bigint primary key generated always as identity,
    user_id text not null, -- TEXT for Clerk authentication (not UUID)
    achievement_id varchar(10) not null,
    achievement_name varchar(255),
    description text,
    unlocked_at timestamp with time zone default now(),
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- Clear existing data to avoid duplicates
TRUNCATE TABLE achievement_definitions CASCADE;
TRUNCATE TABLE achievements CASCADE;

-- Insert Monster Battle Achievement Definitions (201-206)
INSERT INTO achievement_definitions (id, name, description, category, difficulty, xp_reward, gold_reward, image_url, unlock_condition) VALUES
('201', 'Ancient Dragon Slayer', 'Defeat Dragoni in a Simon Says battle', 'combat', 'hard', 100, 100, '/images/achievements/201.png', 'Complete Simon Says battle against Dragon'),
('202', 'Goblin Hunter', 'Defeat Orci in a Simon Says battle', 'combat', 'easy', 100, 100, '/images/achievements/202.png', 'Complete Simon Says battle against Goblin'),
('203', 'Troll Crusher', 'Defeat Trollie in a Simon Says battle', 'combat', 'medium', 100, 100, '/images/achievements/203.png', 'Complete Simon Says battle against Troll'),
('204', 'Dark Wizard Vanquisher', 'Defeat Sorcero in a Simon Says battle', 'combat', 'hard', 100, 100, '/images/achievements/204.png', 'Complete Simon Says battle against Wizard'),
('205', 'Pegasus Tamer', 'Defeat Peggie in a Simon Says battle', 'combat', 'medium', 100, 100, '/images/achievements/205.png', 'Complete Simon Says battle against Pegasus'),
('206', 'Fairy Friend', 'Defeat Fairiel in a Simon Says battle', 'combat', 'easy', 100, 100, '/images/achievements/206.png', 'Complete Simon Says battle against Fairy');

-- Insert Creature Discovery Achievement Definitions (000-018, 101-106)
INSERT INTO achievement_definitions (id, name, description, category, difficulty, xp_reward, gold_reward, image_url, unlock_condition) VALUES
-- Poisonous Creatures
('000', 'Necrion Discovered', 'Discover the mysterious poisonous creature Necrion', 'discovery', 'easy', 50, 25, '/images/creatures/000.png', 'Navigate to the realm map'),
-- Fire Creatures
('001', 'Flamio Discovered', 'Discover the fiery creature Flamio', 'discovery', 'easy', 50, 25, '/images/creatures/001.png', 'Destroy 1 forest tile'),
('002', 'Embera Discovered', 'Discover the powerful fire entity Embera', 'discovery', 'medium', 75, 50, '/images/creatures/002.png', 'Destroy 5 forest tiles'),
('003', 'Vulcana Discovered', 'Discover the ultimate fire creature Vulcana', 'discovery', 'hard', 100, 100, '/images/creatures/003.png', 'Destroy 10 forest tiles'),
-- Water Creatures
('004', 'Dolphio Discovered', 'Discover the playful water creature Dolphio', 'discovery', 'easy', 50, 25, '/images/creatures/004.png', 'Place 1 water tile'),
('005', 'Divero Discovered', 'Discover the experienced water dweller Divero', 'discovery', 'medium', 75, 50, '/images/creatures/005.png', 'Place 5 water tiles'),
('006', 'Flippur Discovered', 'Discover the supreme water creature Flippur', 'discovery', 'hard', 100, 100, '/images/creatures/006.png', 'Place 10 water tiles'),
-- Grass Creatures
('007', 'Leaf Discovered', 'Discover the small grass creature Leaf', 'discovery', 'easy', 50, 25, '/images/creatures/007.png', 'Place 1 forest tile'),
('008', 'Oaky Discovered', 'Discover the forest guardian Oaky', 'discovery', 'medium', 75, 50, '/images/creatures/008.png', 'Place 5 forest tiles'),
('009', 'Seqoio Discovered', 'Discover the mighty forest spirit Seqoio', 'discovery', 'hard', 100, 100, '/images/creatures/009.png', 'Place 10 forest tiles'),
-- Rock Creatures
('010', 'Rockie Discovered', 'Discover the small rock creature Rockie', 'discovery', 'easy', 50, 25, '/images/creatures/010.png', 'Destroy 1 mountain tile'),
('011', 'Buldour Discovered', 'Discover the mountain spirit Buldour', 'discovery', 'medium', 75, 50, '/images/creatures/011.png', 'Destroy 5 mountain tiles'),
('012', 'Montano Discovered', 'Discover the ultimate mountain creature Montano', 'discovery', 'hard', 100, 100, '/images/creatures/012.png', 'Destroy 10 mountain tiles'),
-- Ice Creatures
('013', 'Icey Discovered', 'Discover the small ice creature Icey', 'discovery', 'easy', 50, 25, '/images/creatures/013.png', 'Place 1 ice tile'),
('014', 'Blizzey Discovered', 'Discover the powerful ice spirit Blizzey', 'discovery', 'medium', 75, 50, '/images/creatures/014.png', 'Place 5 ice tiles'),
('015', 'Hailey Discovered', 'Discover the supreme ice creature Hailey', 'discovery', 'hard', 100, 100, '/images/creatures/015.png', 'Place 10 ice tiles'),
-- Electric Creatures
('016', 'Sparky Discovered', 'Discover the electric creature Sparky', 'discovery', 'easy', 50, 25, '/images/creatures/016.png', 'Visit 1 city'),
('017', 'Boulty Discovered', 'Discover the electric being Boulty', 'discovery', 'medium', 75, 50, '/images/creatures/017.png', 'Visit 5 cities'),
('018', 'Voulty Discovered', 'Discover the ultimate electric creature Voulty', 'discovery', 'hard', 100, 100, '/images/creatures/018.png', 'Visit 10 cities'),
-- Dragon Creatures
('101', 'Drakon Discovered', 'Discover the legendary dragon Drakon', 'discovery', 'legendary', 200, 200, '/images/creatures/101.png', 'Complete 100 quests'),
('102', 'Fireon Discovered', 'Discover the mighty dragon Fireon', 'discovery', 'legendary', 300, 300, '/images/creatures/102.png', 'Complete 500 quests'),
('103', 'Valerion Discovered', 'Discover the supreme dragon lord Valerion', 'discovery', 'legendary', 500, 500, '/images/creatures/103.png', 'Complete 1000 quests'),
-- Milestone Creatures
('104', 'Shello Discovered', 'Discover the cheerful turtle Shello', 'discovery', 'easy', 50, 25, '/images/creatures/104.png', 'Complete your first milestone'),
('105', 'Turtoisy Discovered', 'Discover the wise turtle Turtoisy', 'discovery', 'medium', 75, 50, '/images/creatures/105.png', 'Complete 5 milestones'),
('106', 'Turtlo Discovered', 'Discover the legendary turtle Turtlo', 'discovery', 'hard', 100, 100, '/images/creatures/106.png', 'Complete 10 milestones'),
-- Alliance Achievements
('107', 'First Alliance', 'Add your first ally to your fellowship', 'social', 'easy', 50, 10, '/images/achievements/107.png', 'Add your first friend'),
('108', 'Guild Founder', 'Gather 5 allies to your cause', 'social', 'medium', 100, 50, '/images/achievements/108.png', 'Add 5 friends'),
('109', 'Fellowship Leader', 'Unite 10 allies under your banner', 'social', 'hard', 200, 100, '/images/achievements/109.png', 'Add 10 friends'),
('110', 'Quest Giver', 'Send your first quest to an ally', 'social', 'easy', 50, 10, '/images/achievements/110.png', 'Send your first quest to a friend'),
('111', 'Master Strategist', 'Send 5 quests to challenge your allies', 'social', 'hard', 150, 75, '/images/achievements/111.png', 'Send 5 quests to friends'),
('112', 'Grand Questmaster', 'Send 10 quests to friends and earn the title of Questmaster', 'social', 'hard', 500, 100, '/images/achievements/112.png', 'Send 10 quests to friends');

-- Insert sample achievement unlocks for testing (replace 'user_2z5XXhrBco0CJWC' with your actual user ID)
-- You can modify these or remove them if you don't want sample data
INSERT INTO achievements (user_id, achievement_id, achievement_name, description, unlocked_at) VALUES
-- Sample monster battle achievements
('user_2z5XXhrBco0CJWC', '201', 'Ancient Dragon Slayer', 'Defeat Dragoni in a Simon Says battle', NOW() - INTERVAL '2 days'),
('user_2z5XXhrBco0CJWC', '202', 'Goblin Hunter', 'Defeat Orci in a Simon Says battle', NOW() - INTERVAL '1 day'),
-- Sample creature discoveries
('user_2z5XXhrBco0CJWC', '000', 'Necrion Discovered', 'Discover the mysterious poisonous creature Necrion', NOW() - INTERVAL '3 days'),
('user_2z5XXhrBco0CJWC', '001', 'Flamio Discovered', 'Discover the fiery creature Flamio', NOW() - INTERVAL '2 days'),
('user_2z5XXhrBco0CJWC', '004', 'Dolphio Discovered', 'Discover the playful water creature Dolphio', NOW() - INTERVAL '1 day');

-- Set up proper constraints and indexes
ALTER TABLE achievements DROP CONSTRAINT IF EXISTS unique_user_achievement;
ALTER TABLE achievements ADD CONSTRAINT unique_user_achievement UNIQUE (user_id, achievement_id);

-- Enable RLS on both tables
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievement_definitions ENABLE ROW LEVEL SECURITY;

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

-- Create RLS policy for achievement_definitions (read-only for all authenticated users)
DROP POLICY IF EXISTS "achievement_definitions_read_policy" ON achievement_definitions;
CREATE POLICY "achievement_definitions_read_policy" ON achievement_definitions
    FOR SELECT TO authenticated USING (true);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_achievements_user_id ON achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_achievements_achievement_id ON achievements(achievement_id);

-- Grant permissions
GRANT ALL ON achievements TO authenticated;
GRANT ALL ON achievement_definitions TO authenticated;

-- Verify the data
SELECT 'Achievement Definitions:' as info;
SELECT COUNT(*) as total_definitions FROM achievement_definitions;

SELECT 'Achievement Unlocks:' as info;
SELECT COUNT(*) as total_unlocks FROM achievements;

SELECT 'Sample Achievement Data:' as info;
SELECT a.user_id, a.achievement_id, a.achievement_name, a.unlocked_at 
FROM achievements a 
ORDER BY a.unlocked_at DESC 
LIMIT 5; 