-- Check what quest completion data still exists
-- This will help us understand what data was lost

-- 1. Check all quest completion records for the user
SELECT 
    id,
    user_id,
    quest_id,
    completed,
    completed_at,
    original_completion_date,
    xp_earned,
    gold_earned,
    created_at
FROM quest_completion 
WHERE user_id = 'user_2z5XXhrBfLdbU0P6AUCBco0CJWC'
ORDER BY completed_at DESC;

-- 2. Check specifically for September 16th, 2025
SELECT 
    id,
    quest_id,
    completed,
    completed_at,
    original_completion_date,
    xp_earned,
    gold_earned
FROM quest_completion 
WHERE user_id = 'user_2z5XXhrBfLdbU0P6AUCBco0CJWC'
    AND (
        DATE(completed_at) = '2025-09-16' 
        OR DATE(original_completion_date) = '2025-09-16'
        OR completed_at::text LIKE '2025-09-16%'
        OR original_completion_date::text LIKE '2025-09-16%'
    )
ORDER BY completed_at DESC;

-- 3. Count total completion records by date
SELECT 
    DATE(completed_at) as completion_date,
    COUNT(*) as total_completions,
    SUM(xp_earned) as total_xp,
    SUM(gold_earned) as total_gold
FROM quest_completion 
WHERE user_id = 'user_2z5XXhrBfLdbU0P6AUCBco0CJWC'
    AND completed = true
GROUP BY DATE(completed_at)
ORDER BY completion_date DESC;

-- 4. Check if there are any quests that should have been completed
SELECT 
    q.id,
    q.name,
    q.category,
    q.xp_reward,
    q.gold_reward
FROM quests q
WHERE q.favorited = true
ORDER BY q.name;
