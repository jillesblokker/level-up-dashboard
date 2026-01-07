-- Create Chronicle Entries table for Nightly Journaling
CREATE TABLE IF NOT EXISTS chronicle_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    entry_date DATE NOT NULL,
    content TEXT,
    mood_score INTEGER CHECK (
        mood_score BETWEEN 1 AND 5
    ),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, entry_date)
);
-- Enable RLS
ALTER TABLE chronicle_entries ENABLE ROW LEVEL SECURITY;
-- Create Policy for User Access
CREATE POLICY "Users can manage their own chronicle entries" ON chronicle_entries FOR ALL USING (
    user_id = current_setting('request.jwt.claim.sub', true)
) WITH CHECK (
    user_id = current_setting('request.jwt.claim.sub', true)
);
-- Add index for date lookups
CREATE INDEX IF NOT EXISTS idx_chronicle_user_date ON chronicle_entries(user_id, entry_date);