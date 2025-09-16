-- Fix challenge_completion table unique constraint to match API usage
-- The API uses onConflict: 'user_id,challenge_id' but the table has UNIQUE(user_id, challenge_id, date)

-- Drop the existing unique constraint that includes date
ALTER TABLE public.challenge_completion 
DROP CONSTRAINT IF EXISTS challenge_completion_user_id_challenge_id_date_key;

-- Add a new unique constraint that only includes user_id and challenge_id
-- This allows one completion record per user per challenge (regardless of date)
ALTER TABLE public.challenge_completion 
ADD CONSTRAINT challenge_completion_user_id_challenge_id_key 
UNIQUE (user_id, challenge_id);

-- Update the challenge completion API to handle the date field properly
-- The date field will be set to CURRENT_DATE by default, but won't be part of the unique constraint
-- This allows the upsert to work correctly with onConflict: 'user_id,challenge_id'

-- Add a comment to document the change
COMMENT ON CONSTRAINT challenge_completion_user_id_challenge_id_key ON public.challenge_completion 
IS 'Unique constraint for user challenge completion - one record per user per challenge';
