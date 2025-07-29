-- Fix milestones DELETE policy
-- This allows authenticated users to delete milestones

-- First, drop the existing view-only policy
DROP POLICY IF EXISTS "All authenticated users can view milestones" ON milestones;

-- Create a comprehensive policy that allows authenticated users to manage their own milestones
CREATE POLICY "Users can manage own milestones" ON milestones
  FOR ALL USING (user_id = auth.uid());

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_milestones_user_id ON milestones(user_id);