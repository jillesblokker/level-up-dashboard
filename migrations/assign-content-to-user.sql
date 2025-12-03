-- Assign existing quests/challenges/milestones to a specific user
-- This script should be run AFTER add-user-id-to-content-tables.sql

-- ==========================================
-- STEP 1: Find your Clerk user ID
-- ==========================================
-- Your Clerk user ID can be found in:
-- 1. The Clerk Dashboard (Users section)
-- 2. By logging into your app and checking the browser console:
--    window.Clerk.user.id
-- 3. From the character_stats table:

SELECT DISTINCT user_id FROM character_stats 
WHERE character_name IS NOT NULL 
ORDER BY updated_at DESC 
LIMIT 5;

-- ==========================================
-- STEP 2: Assign your existing content
-- ==========================================
-- Replace 'YOUR_CLERK_USER_ID_HERE' with your actual Clerk user ID from Step 1

-- Assign all NULL quests to your user
UPDATE public.quests 
SET user_id = 'YOUR_CLERK_USER_ID_HERE'
WHERE user_id IS NULL;

-- Assign all NULL challenges to your user  
UPDATE public.challenges 
SET user_id = 'YOUR_CLERK_USER_ID_HERE'
WHERE user_id IS NULL;

-- Assign all NULL milestones to your user
UPDATE public.milestones 
SET user_id = 'YOUR_CLERK_USER_ID_HERE'
WHERE user_id IS NULL;

-- ==========================================
-- STEP 3: Verify the assignment
-- ==========================================

-- Count quests by user
SELECT user_id, COUNT(*) as quest_count 
FROM public.quests 
GROUP BY user_id;

-- Count challenges by user
SELECT user_id, COUNT(*) as challenge_count 
FROM public.challenges 
GROUP BY user_id;

-- Count milestones by user
SELECT user_id, COUNT(*) as milestone_count 
FROM public.milestones 
GROUP BY user_id;

-- ==========================================
-- ALTERNATIVE: Create default starter content
-- ==========================================
-- If you want NEW users to start with some default content,
-- you can create "template" quests/challenges/milestones with user_id = NULL
-- These will be visible to all users due to the RLS policy

-- Example:
-- INSERT INTO public.quests (name, description, category, difficulty, xp_reward, gold_reward, user_id)
-- VALUES ('Welcome Quest', 'Complete your first task', 'starter', 'easy', 10, 5, NULL);
