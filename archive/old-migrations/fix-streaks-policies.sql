-- Fix missing RLS policies for streaks table
-- This script adds the required policies to allow authenticated users access to their own streaks

-- First, check if RLS is enabled and enable it if not
ALTER TABLE streaks ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies (just in case)
DROP POLICY IF EXISTS "Users can view own streaks" ON streaks;
DROP POLICY IF EXISTS "Users can insert own streaks" ON streaks;
DROP POLICY IF EXISTS "Users can update own streaks" ON streaks;
DROP POLICY IF EXISTS "Users can delete own streaks" ON streaks;

-- Create policies for streaks table using the public schema function
CREATE POLICY "Users can view own streaks" ON streaks
  FOR SELECT USING (user_id = public.get_current_user_id());

CREATE POLICY "Users can insert own streaks" ON streaks
  FOR INSERT WITH CHECK (user_id = public.get_current_user_id());

CREATE POLICY "Users can update own streaks" ON streaks
  FOR UPDATE USING (user_id = public.get_current_user_id());

CREATE POLICY "Users can delete own streaks" ON streaks
  FOR DELETE USING (user_id = public.get_current_user_id());

-- Verify the policies were created
SELECT 'Streaks RLS policies created successfully!' as status;

-- Show the created policies
SELECT schemaname, tablename, policyname, cmd 
FROM pg_policies 
WHERE tablename = 'streaks'; 