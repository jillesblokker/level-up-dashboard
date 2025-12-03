-- FIX: Change user_id column type from UUID to TEXT
-- This is needed because Clerk user IDs are strings (TEXT), not UUIDs.

-- ==========================================
-- STEP 1: Fix quests table
-- ==========================================
-- Drop index if exists to avoid issues
DROP INDEX IF EXISTS idx_quests_user_id;

-- Change column type to TEXT
ALTER TABLE public.quests 
ALTER COLUMN user_id TYPE TEXT USING user_id::text;

-- Re-create index
CREATE INDEX IF NOT EXISTS idx_quests_user_id ON public.quests(user_id);


-- ==========================================
-- STEP 2: Fix challenges table
-- ==========================================
DROP INDEX IF EXISTS idx_challenges_user_id;

ALTER TABLE public.challenges 
ALTER COLUMN user_id TYPE TEXT USING user_id::text;

CREATE INDEX IF NOT EXISTS idx_challenges_user_id ON public.challenges(user_id);


-- ==========================================
-- STEP 3: Fix milestones table
-- ==========================================
DROP INDEX IF EXISTS idx_milestones_user_id;

ALTER TABLE public.milestones 
ALTER COLUMN user_id TYPE TEXT USING user_id::text;

CREATE INDEX IF NOT EXISTS idx_milestones_user_id ON public.milestones(user_id);


-- ==========================================
-- STEP 4: Now assign your content
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
-- STEP 5: Verify
-- ==========================================

SELECT 'quests' as table_name, count(*) as count FROM public.quests WHERE user_id = 'user_2z5XXhrBfLdbU0P6AUCBco0CJWC'
UNION ALL
SELECT 'challenges' as table_name, count(*) as count FROM public.challenges WHERE user_id = 'user_2z5XXhrBfLdbU0P6AUCBco0CJWC'
UNION ALL
SELECT 'milestones' as table_name, count(*) as count FROM public.milestones WHERE user_id = 'user_2z5XXhrBfLdbU0P6AUCBco0CJWC';
