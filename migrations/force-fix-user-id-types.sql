-- FORCE FIX: Drop incompatible Foreign Keys and convert to TEXT
-- This resolves the "incompatible types: text and uuid" error.

-- ==========================================
-- STEP 1: Drop blocking Foreign Key constraints
-- ==========================================

-- Drop constraints if they exist (using DO block to avoid errors if they don't exist)
DO $$ 
BEGIN
    -- Drop for milestones
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'milestones_user_id_fkey') THEN
        ALTER TABLE public.milestones DROP CONSTRAINT milestones_user_id_fkey;
    END IF;

    -- Drop for challenges (just in case)
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'challenges_user_id_fkey') THEN
        ALTER TABLE public.challenges DROP CONSTRAINT challenges_user_id_fkey;
    END IF;

    -- Drop for quests (just in case)
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'quests_user_id_fkey') THEN
        ALTER TABLE public.quests DROP CONSTRAINT quests_user_id_fkey;
    END IF;
END $$;

-- ==========================================
-- STEP 2: Convert columns to TEXT
-- ==========================================

-- Fix Quests
ALTER TABLE public.quests 
ALTER COLUMN user_id TYPE TEXT USING user_id::text;

-- Fix Challenges
ALTER TABLE public.challenges 
ALTER COLUMN user_id TYPE TEXT USING user_id::text;

-- Fix Milestones
ALTER TABLE public.milestones 
ALTER COLUMN user_id TYPE TEXT USING user_id::text;

-- ==========================================
-- STEP 3: Assign your content
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
-- STEP 4: Verify
-- ==========================================

SELECT 'quests' as table_name, count(*) as count FROM public.quests WHERE user_id = 'user_2z5XXhrBfLdbU0P6AUCBco0CJWC'
UNION ALL
SELECT 'challenges' as table_name, count(*) as count FROM public.challenges WHERE user_id = 'user_2z5XXhrBfLdbU0P6AUCBco0CJWC'
UNION ALL
SELECT 'milestones' as table_name, count(*) as count FROM public.milestones WHERE user_id = 'user_2z5XXhrBfLdbU0P6AUCBco0CJWC';
