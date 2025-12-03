-- Add user_id columns to quests, challenges, and milestones tables
-- This allows each user to have their own custom content
#
-- IMPORTANT: Run this migration to enable multi-user support
-- Existing data will remain as "global" content (user_id = NULL)

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

-- New policies for quests
CREATE POLICY "Users can read own or global quests" 
ON public.quests 
FOR SELECT 
USING (user_id IS NULL OR user_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can insert own quests" 
ON public.quests 
FOR INSERT 
WITH CHECK (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can update own quests" 
ON public.quests 
FOR UPDATE 
USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can delete own quests" 
ON public.quests 
FOR DELETE 
USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

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
CREATE POLICY "Users can read own or global challenges" 
ON public.challenges 
FOR SELECT 
USING (user_id IS NULL OR user_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can insert own challenges" 
ON public.challenges 
FOR INSERT 
WITH CHECK (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can update own challenges" 
ON public.challenges 
FOR UPDATE 
USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can delete own challenges" 
ON public.challenges 
FOR DELETE 
USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

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
CREATE POLICY "Users can read own or global milestones" 
ON public.milestones 
FOR SELECT 
USING (user_id IS NULL OR user_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can insert own milestones" 
ON public.milestones 
FOR INSERT 
WITH CHECK (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can update own milestones" 
ON public.milestones 
FOR UPDATE 
USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can delete own milestones" 
ON public.milestones 
FOR DELETE 
USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Service role can manage all milestones" 
ON public.milestones 
FOR ALL 
USING (auth.role() = 'service_role');

-- ==========================================
-- PART 6: ADD COMMENTS
-- ==========================================

COMMENT ON COLUMN public.quests.user_id IS 'User ID from Clerk. NULL = global/default quest visible to all users.';
COMMENT ON COLUMN public.challenges.user_id IS 'User ID from Clerk. NULL = global/default challenge visible to all users.';
COMMENT ON COLUMN public.milestones.user_id IS 'User ID from Clerk. NULL = global/default milestone visible to all users.';

-- ==========================================
-- NOTES:
-- ==========================================
-- - Existing quests/challenges/milestones have user_id = NULL, making them "global defaults"
-- - Global defaults are visible to ALL users
-- - New quests/challenges/milestones created by users will have their user_id
-- - Users can only see their own custom content + global defaults
-- - This preserves backward compatibility while enabling multi-user support
