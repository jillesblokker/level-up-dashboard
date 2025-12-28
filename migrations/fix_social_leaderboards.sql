-- Create streaks table if it doesn't exist (Fix for Alliance/Streak Leaderboard)
CREATE TABLE IF NOT EXISTS streaks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    alliance_id UUID NOT NULL,
    current_streak INTEGER DEFAULT 0,
    last_check_in TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, alliance_id)
);
-- Enable RLS for streaks
ALTER TABLE streaks ENABLE ROW LEVEL SECURITY;
-- Allow users to read streaks (public or authenticated)
CREATE POLICY "Anyone can read streaks" ON streaks FOR
SELECT USING (true);
-- Allow users to insert/update their own streaks
CREATE POLICY "Users can manage their own streaks" ON streaks FOR ALL USING (auth.uid()::text = user_id);
-- Update character_stats to ensure display_name matches profile info if available
-- (Optional cleanup, but helps leaderboard look better than 'Anonymous')
-- This is a best-effort update based on auth.users if possible, but we don't have direct access here easily.
-- Instead, we ensure the column exists.
ALTER TABLE character_stats
ADD COLUMN IF NOT EXISTS display_name TEXT DEFAULT 'Anonymous Knight';
-- Ensure quest_completion table exists and supports text IDs (for Monthly Leaderboards)
CREATE TABLE IF NOT EXISTS quest_completion (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    quest_id TEXT NOT NULL,
    completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, quest_id)
);
-- Ensure RLS on quest_completion
ALTER TABLE quest_completion ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read quest_completion" ON quest_completion FOR
SELECT USING (true);
CREATE POLICY "Users can manage own quest_completion" ON quest_completion FOR ALL USING (auth.uid()::text = user_id);
-- Add index for monthly leaderboard performance
CREATE INDEX IF NOT EXISTS idx_quest_completion_completed_at ON quest_completion(completed_at);