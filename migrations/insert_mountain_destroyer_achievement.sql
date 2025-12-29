-- Insert Realm Achievement Definitions (201+)
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
        '201',
        'Mountain Destroyer',
        'Prove your power by destroying a mountain tile',
        'realm',
        'medium',
        100,
        50,
        '/images/achievements/mountain-destroyer.png',
        'Destroy a mountain tile'
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