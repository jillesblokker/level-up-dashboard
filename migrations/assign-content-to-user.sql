-- Assign existing quests/challenges/milestones to a specific user
-- This script should be run AFTER add-user-id-to-content-tables.sql

-- ==========================================
-- STEP 1: Find your Clerk user ID
-- ==========================================
-- Your Clerk user ID is: user_2z5XXhrBfLdbU0P6AUCBco0CJWC

-- ==========================================
-- STEP 2: Assign your existing content
-- ==========================================

-- Assign all NULL quests to your user
UPDATE public.quests 
SET user_id = 'user_2z5XXhrBfLdbU0P6AUCBco0CJWC'
WHERE user_id IS NULL;

-- Assign all NULL challenges to your user  
UPDATE public.challenges 
SET user_id = 'user_2z5XXhrBfLdbU0P6AUCBco0CJWC'
WHERE user_id IS NULL;

-- Assign all NULL milestones to your user
UPDATE public.milestones 
SET user_id = 'user_2z5XXhrBfLdbU0P6AUCBco0CJWC'
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
