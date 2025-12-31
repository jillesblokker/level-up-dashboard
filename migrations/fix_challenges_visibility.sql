-- Fix visibility for Challenges table
-- The challenges table contains global workout definitions and should be readable by all users.
-- RLS (Row Level Security) might be hiding these rows if enabled without a broad policy.
-- 1. Disable RLS on challenges table (Global Data)
ALTER TABLE challenges DISABLE ROW LEVEL SECURITY;
-- 2. Disable RLS on challenge_completion (User Data, but handled by API security)
-- The API uses authenticatedSupabaseQuery which verifies the user via Clerk/Supabase JWT
-- and filters by user_id explicitly in the query.
ALTER TABLE challenge_completion DISABLE ROW LEVEL SECURITY;
-- 3. Ensure proper indexes for performance
CREATE INDEX IF NOT EXISTS idx_challenges_category ON challenges(category);
CREATE INDEX IF NOT EXISTS idx_challenge_completion_user_date ON challenge_completion(user_id, date);