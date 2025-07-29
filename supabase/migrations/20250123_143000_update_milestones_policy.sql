-- Update milestones RLS policy to be more specific
-- This allows users to manage only their own milestones

-- Drop the existing policy
DROP POLICY IF EXISTS "Authenticated users can manage milestones" ON milestones;

-- Create a more specific policy that allows users to manage their own milestones
CREATE POLICY "Users can manage own milestones" ON milestones
  FOR ALL USING (user_id = auth.uid());