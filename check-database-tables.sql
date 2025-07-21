-- ==========================================
-- DATABASE VERIFICATION SCRIPT
-- Run this SQL in your Supabase SQL Editor to check table status
-- ==========================================

-- 1. CHECK IF TABLES EXIST
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_name IN ('challenges', 'challenge_completion', 'milestones', 'milestone_completion', 'quest_completion', 'streaks')
ORDER BY table_name;

-- 2. COUNT RECORDS IN EACH TABLE
SELECT 'challenges' as table_name, COUNT(*) as record_count FROM public.challenges
UNION ALL
SELECT 'challenge_completion' as table_name, COUNT(*) as record_count FROM public.challenge_completion
UNION ALL
SELECT 'milestones' as table_name, COUNT(*) as record_count FROM public.milestones
UNION ALL
SELECT 'milestone_completion' as table_name, COUNT(*) as record_count FROM public.milestone_completion
UNION ALL
SELECT 'quest_completion' as table_name, COUNT(*) as record_count FROM public.quest_completion
UNION ALL
SELECT 'streaks' as table_name, COUNT(*) as record_count FROM public.streaks;

-- 3. CHECK CHALLENGES DATA (first 5 records)
SELECT id, name, category, difficulty, xp, gold 
FROM public.challenges 
LIMIT 5;

-- 4. CHECK MILESTONES DATA (first 5 records)  
SELECT id, name, category, difficulty, xp, gold, target
FROM public.milestones 
LIMIT 5;

-- 5. CHECK RLS POLICIES
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename IN ('challenges', 'challenge_completion', 'milestones', 'milestone_completion')
ORDER BY tablename, policyname;

-- 6. CHECK TABLE COLUMNS
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name IN ('challenges', 'challenge_completion', 'milestones', 'milestone_completion')
ORDER BY table_name, ordinal_position; 