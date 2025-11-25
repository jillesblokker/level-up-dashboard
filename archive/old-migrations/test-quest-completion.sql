-- Test Quest Completion Data
-- Run these queries in Supabase SQL Editor

-- 1. Check if quest_completion table exists and its structure
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'quest_completion' 
ORDER BY ordinal_position;

-- 2. Check if there's any data in the table
SELECT COUNT(*) as total_records FROM quest_completion;

-- 3. Check sample data
SELECT * FROM quest_completion LIMIT 5;

-- 4. Check if there are any completed quests
SELECT 
    id,
    user_id,
    quest_id,
    title,
    category,
    completed,
    completed_at,
    created_at
FROM quest_completion 
WHERE completed = true 
ORDER BY completed_at DESC 
LIMIT 10;

-- 5. Check user IDs in the system
SELECT DISTINCT user_id FROM quest_completion LIMIT 10;

-- 6. Check if there are any quests from today or yesterday
SELECT 
    id,
    user_id,
    quest_id,
    title,
    completed,
    completed_at,
    DATE(completed_at) as completion_date
FROM quest_completion 
WHERE completed = true 
    AND completed_at >= CURRENT_DATE - INTERVAL '7 days'
ORDER BY completed_at DESC;

-- 7. Check RLS policies on quest_completion
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'quest_completion';

-- 8. Check if the table has RLS enabled
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'quest_completion';
