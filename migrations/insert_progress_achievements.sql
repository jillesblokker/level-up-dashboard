-- New Achievement Definitions for Progress Milestones
-- These achievements track overall game progress
-- Quest Completion Achievements (301-303)
INSERT INTO achievement_definitions (
        id,
        name,
        description,
        category,
        difficulty,
        xp_reward,
        gold_reward,
        image_url,
        unlock_condition
    )
VALUES (
        '301',
        'Quest Apprentice',
        'Every journey begins with a single step. Complete your first 10 quests.',
        'progress',
        'easy',
        100,
        50,
        '/images/achievements/301.png',
        'Complete 10 quests'
    ),
    (
        '302',
        'Quest Journeyman',
        'Your dedication to duty grows stronger. Complete 25 quests.',
        'progress',
        'medium',
        250,
        125,
        '/images/achievements/302.png',
        'Complete 25 quests'
    ),
    (
        '303',
        'Quest Master',
        'Legendary heroes are forged through countless trials. Complete 50 quests.',
        'progress',
        'hard',
        500,
        250,
        '/images/achievements/303.png',
        'Complete 50 quests'
    ) ON CONFLICT (id) DO
UPDATE
SET name = EXCLUDED.name,
    description = EXCLUDED.description,
    category = EXCLUDED.category,
    difficulty = EXCLUDED.difficulty,
    xp_reward = EXCLUDED.xp_reward,
    gold_reward = EXCLUDED.gold_reward,
    image_url = EXCLUDED.image_url,
    unlock_condition = EXCLUDED.unlock_condition;
-- Character Level Achievements (304-306)
INSERT INTO achievement_definitions (
        id,
        name,
        description,
        category,
        difficulty,
        xp_reward,
        gold_reward,
        image_url,
        unlock_condition
    )
VALUES (
        '304',
        'Rising Hero',
        'Your power grows. Reach level 5.',
        'progress',
        'easy',
        150,
        75,
        '/images/achievements/304.png',
        'Reach level 5'
    ),
    (
        '305',
        'Seasoned Adventurer',
        'Experience has made you wise. Reach level 10.',
        'progress',
        'medium',
        300,
        150,
        '/images/achievements/305.png',
        'Reach level 10'
    ),
    (
        '306',
        'Legendary Champion',
        'Few reach such heights. Reach level 25.',
        'progress',
        'hard',
        750,
        400,
        '/images/achievements/306.png',
        'Reach level 25'
    ) ON CONFLICT (id) DO
UPDATE
SET name = EXCLUDED.name,
    description = EXCLUDED.description,
    category = EXCLUDED.category,
    difficulty = EXCLUDED.difficulty,
    xp_reward = EXCLUDED.xp_reward,
    gold_reward = EXCLUDED.gold_reward,
    image_url = EXCLUDED.image_url,
    unlock_condition = EXCLUDED.unlock_condition;
-- Challenge Completion Achievements (307-309)
INSERT INTO achievement_definitions (
        id,
        name,
        description,
        category,
        difficulty,
        xp_reward,
        gold_reward,
        image_url,
        unlock_condition
    )
VALUES (
        '307',
        'Challenge Seeker',
        'Embrace difficulty. Complete 5 challenges.',
        'progress',
        'easy',
        100,
        50,
        '/images/achievements/307.png',
        'Complete 5 challenges'
    ),
    (
        '308',
        'Challenge Conqueror',
        'Obstacles fuel your resolve. Complete 15 challenges.',
        'progress',
        'medium',
        250,
        125,
        '/images/achievements/308.png',
        'Complete 15 challenges'
    ),
    (
        '309',
        'Challenge Legend',
        'Nothing stands in your way. Complete 30 challenges.',
        'progress',
        'hard',
        500,
        250,
        '/images/achievements/309.png',
        'Complete 30 challenges'
    ) ON CONFLICT (id) DO
UPDATE
SET name = EXCLUDED.name,
    description = EXCLUDED.description,
    category = EXCLUDED.category,
    difficulty = EXCLUDED.difficulty,
    xp_reward = EXCLUDED.xp_reward,
    gold_reward = EXCLUDED.gold_reward,
    image_url = EXCLUDED.image_url,
    unlock_condition = EXCLUDED.unlock_condition;
-- Gold Accumulation Achievements (310-312)
INSERT INTO achievement_definitions (
        id,
        name,
        description,
        category,
        difficulty,
        xp_reward,
        gold_reward,
        image_url,
        unlock_condition
    )
VALUES (
        '310',
        'Coin Collector',
        'A growing treasury. Accumulate 1,000 gold total.',
        'wealth',
        'easy',
        100,
        100,
        '/images/achievements/310.png',
        'Accumulate 1000 gold'
    ),
    (
        '311',
        'Wealthy Merchant',
        'Your coffers overflow. Accumulate 5,000 gold total.',
        'wealth',
        'medium',
        250,
        250,
        '/images/achievements/311.png',
        'Accumulate 5000 gold'
    ),
    (
        '312',
        'Golden Sovereign',
        'A fortune fit for royalty. Accumulate 10,000 gold total.',
        'wealth',
        'hard',
        500,
        500,
        '/images/achievements/312.png',
        'Accumulate 10000 gold'
    ) ON CONFLICT (id) DO
UPDATE
SET name = EXCLUDED.name,
    description = EXCLUDED.description,
    category = EXCLUDED.category,
    difficulty = EXCLUDED.difficulty,
    xp_reward = EXCLUDED.xp_reward,
    gold_reward = EXCLUDED.gold_reward,
    image_url = EXCLUDED.image_url,
    unlock_condition = EXCLUDED.unlock_condition;