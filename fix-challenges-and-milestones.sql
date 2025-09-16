-- Fix both challenges and milestones completion constraints
-- Run this directly in your Supabase SQL editor

-- ==========================================
-- 1. CHECK CURRENT CONSTRAINTS
-- ==========================================

-- Check challenge_completion constraints
SELECT 
    'challenge_completion' as table_name,
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'public.challenge_completion'::regclass
AND contype = 'u'
UNION ALL
-- Check milestone_completion constraints
SELECT 
    'milestone_completion' as table_name,
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'public.milestone_completion'::regclass
AND contype = 'u';

-- ==========================================
-- 2. FIX CHALLENGE_COMPLETION CONSTRAINTS
-- ==========================================

DO $$ 
BEGIN
    -- Drop any existing constraints that include date
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conrelid = 'public.challenge_completion'::regclass 
        AND conname LIKE '%user_id%challenge_id%date%'
    ) THEN
        ALTER TABLE public.challenge_completion 
        DROP CONSTRAINT IF EXISTS challenge_completion_user_id_challenge_id_date_key;
    END IF;
    
    -- Add the correct constraint for challenges
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conrelid = 'public.challenge_completion'::regclass 
        AND conname = 'challenge_completion_user_id_challenge_id_key'
    ) THEN
        ALTER TABLE public.challenge_completion 
        ADD CONSTRAINT challenge_completion_user_id_challenge_id_key 
        UNIQUE (user_id, challenge_id);
    END IF;
END $$;

-- ==========================================
-- 3. FIX MILESTONE_COMPLETION CONSTRAINTS
-- ==========================================

DO $$
BEGIN
    -- Drop any existing constraints that might conflict
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conrelid = 'public.milestone_completion'::regclass 
        AND conname LIKE '%user_id%milestone_id%date%'
    ) THEN
        ALTER TABLE public.milestone_completion 
        DROP CONSTRAINT IF EXISTS milestone_completion_user_id_milestone_id_date_key;
    END IF;
    
    -- Add the correct constraint for milestones
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conrelid = 'public.milestone_completion'::regclass 
        AND conname = 'milestone_completion_user_id_milestone_id_key'
    ) THEN
        ALTER TABLE public.milestone_completion 
        ADD CONSTRAINT milestone_completion_user_id_milestone_id_key 
        UNIQUE (user_id, milestone_id);
    END IF;
END $$;

-- ==========================================
-- 4. VERIFY THE FIXES
-- ==========================================

-- Check the final constraints
SELECT 
    'challenge_completion' as table_name,
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'public.challenge_completion'::regclass
AND contype = 'u'
UNION ALL
SELECT 
    'milestone_completion' as table_name,
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'public.milestone_completion'::regclass
AND contype = 'u';

-- ==========================================
-- 5. TEST THE FIXES
-- ==========================================

-- Test challenge completion upsert (only if challenges exist)
DO $$
DECLARE
    test_challenge_id UUID;
BEGIN
    -- Get a real challenge ID from the table
    SELECT id INTO test_challenge_id FROM public.challenges LIMIT 1;
    
    IF test_challenge_id IS NOT NULL THEN
        -- Test the upsert with a real challenge ID
        INSERT INTO public.challenge_completion (user_id, challenge_id, completed, date)
        VALUES ('test_user', test_challenge_id, true, CURRENT_DATE)
        ON CONFLICT (user_id, challenge_id) 
        DO UPDATE SET completed = EXCLUDED.completed, date = EXCLUDED.date;
        
        -- Clean up the test record
        DELETE FROM public.challenge_completion WHERE user_id = 'test_user' AND challenge_id = test_challenge_id;
        
        RAISE NOTICE 'Challenge completion test passed successfully';
    ELSE
        RAISE NOTICE 'No challenges found in table - skipping challenge test';
    END IF;
END $$;

-- Test milestone completion upsert (only if milestones exist)
DO $$
DECLARE
    test_milestone_id UUID;
BEGIN
    -- Get a real milestone ID from the table
    SELECT id INTO test_milestone_id FROM public.milestones LIMIT 1;
    
    IF test_milestone_id IS NOT NULL THEN
        -- Test the upsert with a real milestone ID
        INSERT INTO public.milestone_completion (user_id, milestone_id, completed, date)
        VALUES ('test_user', test_milestone_id, true, CURRENT_DATE)
        ON CONFLICT (user_id, milestone_id) 
        DO UPDATE SET completed = EXCLUDED.completed, date = EXCLUDED.date;
        
        -- Clean up the test record
        DELETE FROM public.milestone_completion WHERE user_id = 'test_user' AND milestone_id = test_milestone_id;
        
        RAISE NOTICE 'Milestone completion test passed successfully';
    ELSE
        RAISE NOTICE 'No milestones found in table - skipping milestone test';
    END IF;
END $$;

-- Success! Both challenge and milestone completion constraints are now fixed.
-- The APIs can now use onConflict: 'user_id,challenge_id' and onConflict: 'user_id,milestone_id' without issues.
