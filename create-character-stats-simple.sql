-- Simple character_stats table creation
-- Run this in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS character_stats (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL,
    gold INTEGER DEFAULT 0,
    experience INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    health INTEGER DEFAULT 100,
    max_health INTEGER DEFAULT 100,
    build_tokens INTEGER DEFAULT 0,
    kingdom_expansions INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_character_stats_user_id ON character_stats(user_id);

-- Verify the table was created
SELECT 'character_stats table created successfully!' as status;
