-- Fix quest_favorites table to use TEXT for user_id (Clerk compatibility)
-- Run this in your Supabase SQL editor

-- First, drop the existing table if it exists
DROP TABLE IF EXISTS quest_favorites CASCADE;

-- Recreate the table with correct data types
CREATE TABLE quest_favorites (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL, -- Changed from UUID to TEXT for Clerk
    quest_id TEXT NOT NULL,
    favorited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, quest_id)
);

-- Enable Row Level Security
ALTER TABLE quest_favorites ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for user isolation
CREATE POLICY "quest_favorites_user_policy" ON quest_favorites
    FOR ALL USING (user_id = auth.uid());

-- Create indexes for performance
CREATE INDEX idx_quest_favorites_user_id ON quest_favorites(user_id);
CREATE INDEX idx_quest_favorites_quest_id ON quest_favorites(quest_id);

-- Grant permissions to authenticated users
GRANT ALL ON quest_favorites TO authenticated;

COMMIT; 