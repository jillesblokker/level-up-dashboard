-- Fix challenge_completion table unique constraint to match API usage
-- Run this directly in your Supabase SQL editor

-- First, let's check the current constraints
SELECT 
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'public.challenge_completion'::regclass
AND contype = 'u'; -- unique constraints

-- Drop the existing unique constraint that includes date (if it exists)
DO $$ 
BEGIN
    -- Try to drop the constraint that includes date
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conrelid = 'public.challenge_completion'::regclass 
        AND conname = 'challenge_completion_user_id_challenge_id_date_key'
    ) THEN
        ALTER TABLE public.challenge_completion 
        DROP CONSTRAINT challenge_completion_user_id_challenge_id_date_key;
        RAISE NOTICE 'Dropped constraint: challenge_completion_user_id_challenge_id_date_key';
    END IF;
    
    -- Try to drop any other similar constraints
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conrelid = 'public.challenge_completion'::regclass 
        AND conname LIKE '%user_id%challenge_id%date%'
    ) THEN
        ALTER TABLE public.challenge_completion 
        DROP CONSTRAINT IF EXISTS challenge_completion_user_id_challenge_id_date_key;
        RAISE NOTICE 'Dropped similar constraint';
    END IF;
END $$;

-- Add a new unique constraint that only includes user_id and challenge_id
-- This allows one completion record per user per challenge (regardless of date)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conrelid = 'public.challenge_completion'::regclass 
        AND conname = 'challenge_completion_user_id_challenge_id_key'
    ) THEN
        ALTER TABLE public.challenge_completion 
        ADD CONSTRAINT challenge_completion_user_id_challenge_id_key 
        UNIQUE (user_id, challenge_id);
        RAISE NOTICE 'Added new constraint: challenge_completion_user_id_challenge_id_key';
    ELSE
        RAISE NOTICE 'Constraint already exists: challenge_completion_user_id_challenge_id_key';
    END IF;
END $$;

-- Verify the new constraint
SELECT 
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'public.challenge_completion'::regclass
AND contype = 'u'; -- unique constraints

-- Test the constraint works with a sample upsert (this will be rolled back)
BEGIN;
-- This should work now with the new constraint
INSERT INTO public.challenge_completion (user_id, challenge_id, completed, date)
VALUES ('test_user', gen_random_uuid(), true, CURRENT_DATE)
ON CONFLICT (user_id, challenge_id) 
DO UPDATE SET completed = EXCLUDED.completed, date = EXCLUDED.date;
ROLLBACK; -- Rollback the test

-- Success! The constraint fix is complete.
-- The API can now use onConflict: 'user_id,challenge_id' without issues.
