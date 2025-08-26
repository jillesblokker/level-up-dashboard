-- ==========================================
-- TEST CHART DATA SCRIPT
-- Run this in your Supabase SQL Editor to verify chart data
-- ==========================================

-- 1. Check if the completion tables exist and have data
SELECT 'quest_completion' as table_name, COUNT(*) as total_records, 
       COUNT(CASE WHEN completed = true THEN 1 END) as completed_count
FROM quest_completion
UNION ALL
SELECT 'challenge_completion' as table_name, COUNT(*) as total_records,
       COUNT(CASE WHEN completed = true THEN 1 END) as completed_count
FROM challenge_completion
UNION ALL
SELECT 'milestone_completion' as table_name, COUNT(*) as total_records,
       COUNT(CASE WHEN completed = true THEN 1 END) as completed_count
FROM milestone_completion;

-- 2. Check quest completion data for the last 7 days
SELECT 
    DATE(completed_at) as completion_date,
    COUNT(*) as quests_completed,
    SUM(COALESCE(gold_earned, 0)) as total_gold,
    SUM(COALESCE(xp_earned, 0)) as total_xp
FROM quest_completion 
WHERE completed = true 
    AND completed_at >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY DATE(completed_at)
ORDER BY completion_date DESC;

-- 3. Check challenge completion data for the last 7 days
SELECT 
    date as completion_date,
    COUNT(*) as challenges_completed
FROM challenge_completion 
WHERE completed = true 
    AND date >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY date
ORDER BY date DESC;

-- 4. Check milestone completion data for the last 7 days
SELECT 
    date as completion_date,
    COUNT(*) as milestones_completed
FROM milestone_completion 
WHERE completed = true 
    AND date >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY date
ORDER BY date DESC;

-- 5. Check if there are any users with completion data
SELECT DISTINCT user_id FROM quest_completion WHERE completed = true LIMIT 5;

-- 6. Check the structure of quest_completion table
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'quest_completion' 
ORDER BY ordinal_position;

-- 7. Check sample quest completion records (only existing columns)
SELECT 
    id,
    user_id,
    quest_id,
    completed,
    completed_at,
    COALESCE(gold_earned, 0) as gold_earned,
    COALESCE(xp_earned, 0) as xp_earned
FROM quest_completion 
WHERE completed = true 
ORDER BY completed_at DESC 
LIMIT 5;

-- 8. Check if there are any quests with rewards
SELECT 
    COUNT(*) as quests_with_gold,
    COUNT(CASE WHEN COALESCE(gold_earned, 0) > 0 THEN 1 END) as quests_with_positive_gold,
    COUNT(CASE WHEN COALESCE(xp_earned, 0) > 0 THEN 1 END) as quests_with_positive_xp
FROM quest_completion 
WHERE completed = true;

-- 9. Check the structure of challenge_completion table
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'challenge_completion' 
ORDER BY ordinal_position;

-- 10. Check the structure of milestone_completion table
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'milestone_completion' 
ORDER BY ordinal_position;

-- 11. Check for any recent activity (last 30 days)
SELECT 
    'quests' as type,
    DATE(completed_at) as activity_date,
    COUNT(*) as count
FROM quest_completion 
WHERE completed = true 
    AND completed_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(completed_at)
UNION ALL
SELECT 
    'challenges' as type,
    date as activity_date,
    COUNT(*) as count
FROM challenge_completion 
WHERE completed = true 
    AND date >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY date
UNION ALL
SELECT 
    'milestones' as type,
    date as activity_date,
    COUNT(*) as count
FROM milestone_completion 
WHERE completed = true 
    AND date >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY date
ORDER BY activity_date DESC;
