-- Insert Alliance Achievement Definitions (107-112)

INSERT INTO achievement_definitions (id, name, description, category, difficulty, xp_reward, gold_reward, image_url, unlock_condition) VALUES
('107', 'First Alliance', 'Add your first ally to your fellowship', 'social', 'easy', 50, 10, '/images/achievements/107.png', 'Add your first friend'),
('108', 'Guild Founder', 'Gather 5 allies to your cause', 'social', 'medium', 100, 50, '/images/achievements/108.png', 'Add 5 friends'),
('109', 'Fellowship Leader', 'Unite 10 allies under your banner', 'social', 'hard', 200, 100, '/images/achievements/109.png', 'Add 10 friends'),
('110', 'Quest Giver', 'Send your first quest to an ally', 'social', 'easy', 50, 10, '/images/achievements/110.png', 'Send your first quest to a friend'),
('111', 'Master Strategist', 'Send 5 quests to challenge your allies', 'social', 'hard', 150, 75, '/images/achievements/111.png', 'Send 5 quests to friends'),
('112', 'Grand Questmaster', 'Send 10 quests to friends and earn the title of Questmaster', 'social', 'hard', 500, 100, '/images/achievements/112.png', 'Send 10 quests to friends')
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    category = EXCLUDED.category,
    difficulty = EXCLUDED.difficulty,
    xp_reward = EXCLUDED.xp_reward,
    gold_reward = EXCLUDED.gold_reward,
    image_url = EXCLUDED.image_url,
    unlock_condition = EXCLUDED.unlock_condition;
