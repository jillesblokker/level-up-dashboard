
-- Add recurrence columns to quests table
ALTER TABLE quests 
ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS recurrence_interval TEXT DEFAULT 'none'; -- 'daily', 'weekly', 'none'

-- Add tracking for one-time onboarding quests
CREATE TABLE IF NOT EXISTS user_quest_progress (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id TEXT NOT NULL,
  quest_id UUID REFERENCES quests(id) ON DELETE CASCADE,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  times_completed INTEGER DEFAULT 1
);

-- Enable RLS
ALTER TABLE user_quest_progress ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own progress
CREATE POLICY "Users can view their own quest progress" ON user_quest_progress
  FOR SELECT USING (auth.uid()::text = user_id);

-- Policy: Users can insert their own progress
CREATE POLICY "Users can insert their own quest progress" ON user_quest_progress
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);
