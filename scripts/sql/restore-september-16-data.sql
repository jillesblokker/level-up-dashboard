-- Restore quest completion data for September 16th, 2025
-- This script will recreate completion records for all favorited quests

-- First, let's see what favorited quests exist
SELECT 
    id,
    name,
    category,
    xp_reward,
    gold_reward,
    favorited
FROM quests 
WHERE favorited = true
ORDER BY name;

-- Create completion records for September 16th, 2025 for all favorited quests
-- Use Netherlands timezone (Europe/Amsterdam) for the completion date
INSERT INTO quest_completion (
    user_id,
    quest_id,
    completed,
    completed_at,
    original_completion_date,
    xp_earned,
    gold_earned
)
SELECT 
    'user_2z5XXhrBfLdbU0P6AUCBco0CJWC' as user_id,
    id as quest_id,
    true as completed,
    '2025-09-16T12:00:00.000Z' as completed_at, -- Netherlands timezone
    '2025-09-16T12:00:00.000Z' as original_completion_date,
    COALESCE(xp_reward, 50) as xp_earned,
    COALESCE(gold_reward, 25) as gold_earned
FROM quests 
WHERE favorited = true
    AND id NOT IN (
        -- Don't create duplicates if records already exist
        SELECT quest_id 
        FROM quest_completion 
        WHERE user_id = 'user_2z5XXhrBfLdbU0P6AUCBco0CJWC'
            AND DATE(completed_at) = '2025-09-16'
    );

-- Verify the restoration
SELECT 
    COUNT(*) as restored_completions,
    SUM(xp_earned) as total_xp_restored,
    SUM(gold_earned) as total_gold_restored
FROM quest_completion 
WHERE user_id = 'user_2z5XXhrBfLdbU0P6AUCBco0CJWC'
    AND DATE(completed_at) = '2025-09-16';

-- Show all completion records for September 16th
SELECT 
    qc.id,
    q.name as quest_name,
    q.category,
    qc.completed_at,
    qc.xp_earned,
    qc.gold_earned
FROM quest_completion qc
JOIN quests q ON qc.quest_id = q.id
WHERE qc.user_id = 'user_2z5XXhrBfLdbU0P6AUCBco0CJWC'
    AND DATE(qc.completed_at) = '2025-09-16'
ORDER BY q.name;
