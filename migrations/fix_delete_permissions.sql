-- Fix RLS Policies to allow Quest Deletion

-- 1. Ensure RLS is enabled
ALTER TABLE quests ENABLE ROW LEVEL SECURITY;
ALTER TABLE quest_completion ENABLE ROW LEVEL SECURITY;

-- 2. Add DELETE policy for Quests
-- Users can delete quests where they are the owner (user_id matches)
DROP POLICY IF EXISTS "Users can delete their own quests" ON quests;
CREATE POLICY "Users can delete their own quests" ON quests
    FOR DELETE USING (user_id = auth.uid()::text);

-- 3. Add DELETE policy for Quest Completions
-- Users can delete their own completion records
DROP POLICY IF EXISTS "Users can delete their own quest completions" ON quest_completion;
CREATE POLICY "Users can delete their own quest completions" ON quest_completion
    FOR DELETE USING (user_id = auth.uid()::text);

-- 4. Grant Delete permissions (just in case)
GRANT DELETE ON quests TO authenticated;
GRANT DELETE ON quest_completion TO authenticated;
