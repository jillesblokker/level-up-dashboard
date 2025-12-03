-- Add user_id columns to quests, challenges, and milestones tables
-- This allows each user to have their own custom content

-- IMPORTANT: This migration enables multi-user support for quest/challenge/milestone definitions
-- Existing data (your current quests/challenges/milestones) will have user_id = NULL
-- The API code will need to be updated to assign the correct user_id to these existing items

-- ==========================================
-- PART 1: ALTER TABLES TO ADD user_id
-- ==========================================

-- Add user_id to quests table
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
-- PART 3: UPDATE RLS POLICIES FOR QUESTS
-- ==========================================

-- Drop old quest policies
DROP POLICY IF EXISTS "Anyone can read quests" ON public.quests;
DROP POLICY IF EXISTS "Service role can manage quests" ON public.quests;

-- New policies for quests (using Clerk auth pattern)
CREATE POLICY "Users can read own or null quests" 
ON public.quests 
FOR SELECT 
USING (user_id IS NULL OR user_id = (auth.jwt() ->> 'sub'));

CREATE POLICY "Users can insert own quests" 
ON public.quests 
FOR INSERT 
WITH CHECK (user_id = (auth.jwt() ->> 'sub'));

CREATE POLICY "Users can update own quests" 
ON public.quests 
FOR UPDATE 
USING (user_id = (auth.jwt() ->> 'sub'));

CREATE POLICY "Users can delete own quests" 
ON public.quests 
FOR DELETE 
USING (user_id = (auth.jwt() ->> 'sub'));

CREATE POLICY "Service role can manage all quests" 
ON public.quests 
FOR ALL 
USING (auth.role() = 'service_role');

-- ==========================================
-- PART 4: UPDATE RLS POLICIES FOR CHALLENGES
-- ==========================================

-- Drop old challenge policies
DROP POLICY IF EXISTS "Anyone can read challenges" ON public.challenges;
DROP POLICY IF EXISTS "Service role can manage challenges" ON public.challenges;

-- New policies for challenges
CREATE POLICY "Users can read own or null challenges" 
ON public.challenges 
FOR SELECT 
USING (user_id IS NULL OR user_id = (auth.jwt() ->> 'sub'));

CREATE POLICY "Users can insert own challenges" 
ON public.challenges 
FOR INSERT 
WITH CHECK (user_id = (auth.jwt() ->> 'sub'));

CREATE POLICY "Users can update own challenges" 
ON public.challenges 
FOR UPDATE 
USING (user_id = (auth.jwt() ->> 'sub'));

CREATE POLICY "Users can delete own challenges" 
ON public.challenges 
FOR DELETE 
USING (user_id = (auth.jwt() ->> 'sub'));

CREATE POLICY "Service role can manage all challenges" 
ON public.challenges 
FOR ALL 
USING (auth.role() = 'service_role');

-- ==========================================
-- PART 5: UPDATE RLS POLICIES FOR MILESTONES
-- ==========================================

-- Drop old milestone policies
DROP POLICY IF EXISTS "Anyone can read milestones" ON public.milestones;
DROP POLICY IF EXISTS "Service role can manage milestones" ON public.milestones;

-- New policies for milestones
CREATE POLICY "Users can read own or null milestones" 
ON public.milestones 
FOR SELECT 
USING (user_id IS NULL OR user_id = (auth.jwt() ->> 'sub'));

CREATE POLICY "Users can insert own milestones" 
ON public.milestones 
FOR INSERT 
WITH CHECK (user_id = (auth.jwt() ->> 'sub'));

CREATE POLICY "Users can update own milestones" 
ON public.milestones 
FOR UPDATE 
USING (user_id = (auth.jwt() ->> 'sub'));

CREATE POLICY "Users can delete own milestones" 
ON public.milestones 
FOR DELETE 
USING (user_id = (auth.jwt() ->> 'sub'));

CREATE POLICY "Service role can manage all milestones" 
ON public.milestones 
FOR ALL 
USING (auth.role() = 'service_role');

-- ==========================================
-- PART 6: ADD COMMENTS
-- ==========================================

COMMENT ON COLUMN public.quests.user_id IS 'User ID from Clerk. NULL = not yet assigned to a user.';
COMMENT ON COLUMN public.challenges.user_id IS 'User ID from Clerk. NULL = not yet assigned to a user.';
COMMENT ON COLUMN public.milestones.user_id IS 'User ID from Clerk. NULL = not yet assigned to a user.';

-- ==========================================
-- NOTES FOR NEXT STEPS:
-- ==========================================
-- 1. After running this migration, ALL existing quests/challenges/milestones will have user_id = NULL
-- 2. You need to update your API code to filter queries by user_id
-- 3. Optionally, run a data migration to assign your existing items to your user_id
-- 4. New items created via the API should automatically get the creator's user_id
