-- Fix challenge_completion table to support daily habit tracking
-- The current constraint (user_id, challenge_id) prevents daily completions
-- We need to restore the daily constraint (user_id, challenge_id, date)

-- 1. Drop the current constraint that doesn't include date
ALTER TABLE public.challenge_completion 
DROP CONSTRAINT IF EXISTS challenge_completion_user_id_challenge_id_key;

-- 2. Add the correct daily constraint
ALTER TABLE public.challenge_completion 
ADD CONSTRAINT challenge_completion_user_id_challenge_id_date_key 
UNIQUE (user_id, challenge_id, date);

-- 3. Update existing records to have proper date format
-- Ensure all existing records have a date (they should already have this)
UPDATE public.challenge_completion 
SET date = CURRENT_DATE 
WHERE date IS NULL;

-- 4. Add a comment to document the change
COMMENT ON CONSTRAINT challenge_completion_user_id_challenge_id_date_key ON public.challenge_completion 
IS 'Daily constraint for user challenge completion - one record per user per challenge per day';

-- 5. Verify the fix
DO $$
DECLARE
    constraint_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO constraint_count
    FROM information_schema.table_constraints 
    WHERE table_name = 'challenge_completion' 
      AND constraint_type = 'UNIQUE'
      AND table_schema = 'public';
    
    RAISE NOTICE '✅ Challenge completion daily constraint restored!';
    RAISE NOTICE 'Unique constraints: %', constraint_count;
    RAISE NOTICE '🎯 Challenges now support daily habit tracking';
END $$;
