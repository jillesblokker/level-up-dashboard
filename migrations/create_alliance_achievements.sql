-- Create alliance_achievements table if it doesn't exist
CREATE TABLE IF NOT EXISTS alliance_achievements (
    id bigint generated always as identity primary key,
    user_id text not null,
    achievement_type text not null,
    progress integer default 0,
    unlocked_at timestamp with time zone,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now(),
    CONSTRAINT unique_user_achievement_type UNIQUE (user_id, achievement_type)
);

-- Enable RLS
ALTER TABLE alliance_achievements ENABLE ROW LEVEL SECURITY;

-- Create policies
DROP POLICY IF EXISTS "Users can view their own alliance achievements" ON alliance_achievements;
CREATE POLICY "Users can view their own alliance achievements" ON alliance_achievements
    FOR SELECT USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can update their own alliance achievements" ON alliance_achievements;
CREATE POLICY "Users can update their own alliance achievements" ON alliance_achievements
    FOR ALL USING (auth.uid()::text = user_id);

-- Grant access
GRANT ALL ON alliance_achievements TO authenticated;
