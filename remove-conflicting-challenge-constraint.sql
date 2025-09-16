-- Remove the conflicting challenge constraint that prevents daily tracking
-- This constraint conflicts with the daily tracking approach

DO $$
BEGIN
    -- Remove the old constraint that doesn't include date
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conrelid = 'public.challenge_completion'::regclass 
        AND conname = 'challenge_completion_user_id_challenge_id_key'
    ) THEN
        ALTER TABLE public.challenge_completion 
        DROP CONSTRAINT challenge_completion_user_id_challenge_id_key;
        RAISE NOTICE 'Removed conflicting constraint challenge_completion_user_id_challenge_id_key';
    ELSE
        RAISE NOTICE 'Constraint challenge_completion_user_id_challenge_id_key does not exist';
    END IF;
    
    -- Ensure the correct daily tracking constraint exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conrelid = 'public.challenge_completion'::regclass 
        AND conname = 'challenge_completion_user_id_challenge_id_date_key'
    ) THEN
        ALTER TABLE public.challenge_completion 
        ADD CONSTRAINT challenge_completion_user_id_challenge_id_date_key 
        UNIQUE (user_id, challenge_id, date);
        RAISE NOTICE 'Added daily tracking constraint challenge_completion_user_id_challenge_id_date_key';
    ELSE
        RAISE NOTICE 'Daily tracking constraint challenge_completion_user_id_challenge_id_date_key already exists';
    END IF;
END $$;

-- Verify the final state
SELECT 
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type,
    tc.constraint_definition
FROM information_schema.table_constraints tc
WHERE tc.table_name IN ('challenge_completion', 'milestone_completion')
AND tc.constraint_type = 'UNIQUE'
ORDER BY tc.table_name, tc.constraint_name;
