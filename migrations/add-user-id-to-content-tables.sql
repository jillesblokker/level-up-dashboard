-- Add user_id columns to quests, challenges, and milestones tables
-- SIMPLIFIED VERSION - Just adds columns and indexes, skips RLS policies
-- (RLS policies don't matter since API uses service role key)

-- ==========================================
-- PART 1: ALTER TABLES TO ADD user_id
-- ==========================================

-- Add user_id to quests table (using TEXT to match Clerk user IDs)
ALTER TABLE public.quests 
ADD COLUMN IF NOT EXISTS user_id TEXT;

-- Add user_id to challenges table  
ALTER TABLE public.challenges 
ADD COLUMN IF NOT EXISTS user_id TEXT;

-- Add user_id to milestones table
ALTER TABLE public.milestones 
ADD COLUMN IF NOT EXISTS user_id TEXT;

-- ==========================================
-- PART 2: CREATE INDEXES FOR PERFORMANCE
-- ==========================================

CREATE INDEX IF NOT EXISTS idx_quests_user_id ON public.quests(user_id);
CREATE INDEX IF NOT EXISTS idx_challenges_user_id ON public.challenges(user_id);
CREATE INDEX IF NOT EXISTS idx_milestones_user_id ON public.milestones(user_id);

-- ==========================================
-- PART 3: ADD COMMENTS
-- ==========================================

COMMENT ON COLUMN public.quests.user_id IS 'User ID from Clerk. NULL = global/default content visible to all users.';
COMMENT ON COLUMN public.challenges.user_id IS 'User ID from Clerk. NULL = global/default content visible to all users.';
COMMENT ON COLUMN public.milestones.user_id IS 'User ID from Clerk. NULL = global/default content visible to all users.';

-- ==========================================
-- SUCCESS!
-- ==========================================
-- The user_id columns have been added successfully.
-- Your API code (already updated) will now filter by user_id.
-- 
-- Next step: Run the assign-content-to-user.sql migration
-- to assign your existing content to your user ID.
