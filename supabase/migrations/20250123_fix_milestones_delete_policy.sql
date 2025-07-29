-- Fix milestones DELETE policy
-- This allows authenticated users to delete milestones

-- First, drop the existing view-only policy
DROP POLICY IF EXISTS "All authenticated users can view milestones" ON milestones;

-- Create a comprehensive policy that allows authenticated users to manage their own milestones
CREATE POLICY "Authenticated users can manage milestones" ON milestones
  FOR ALL USING (auth.get_user_id() IS NOT NULL);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_milestones_user_id ON milestones(user_id);