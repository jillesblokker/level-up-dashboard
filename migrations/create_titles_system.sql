-- Create titles table
CREATE TABLE IF NOT EXISTS titles (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    required_level INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
-- Create user_titles table
CREATE TABLE IF NOT EXISTS user_titles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title_id TEXT REFERENCES titles(id) ON DELETE CASCADE,
    unlocked_at TIMESTAMPTZ DEFAULT NOW(),
    is_equipped BOOLEAN DEFAULT FALSE,
    UNIQUE(user_id, title_id)
);
-- Insert default titles
INSERT INTO titles (id, name, description, required_level)
VALUES (
        'squire',
        'Squire',
        'A young noble in training, beginning their journey.',
        0
    ),
    (
        'knight',
        'Knight',
        'A noble warrior, sworn to protect the realm.',
        10
    ),
    (
        'baron',
        'Baron',
        'A minor noble, ruling over a small territory.',
        20
    ),
    (
        'viscount',
        'Viscount',
        'A respected noble, governing a significant region.',
        30
    ),
    (
        'count',
        'Count',
        'A powerful noble, ruling over a large county.',
        40
    ),
    (
        'marquis',
        'Marquis',
        'A high-ranking noble, governing a march or border region.',
        50
    ),
    (
        'duke',
        'Duke',
        'A senior noble, ruling over a duchy.',
        60
    ),
    (
        'prince',
        'Prince',
        'A royal noble, heir to the throne.',
        70
    ),
    (
        'king',
        'King',
        'The supreme ruler of the realm.',
        80
    ),
    (
        'emperor',
        'Emperor',
        'The divine ruler of multiple realms, transcending mortal kings.',
        90
    ),
    (
        'god',
        'God',
        'A transcendent being of infinite power, beyond mortal comprehension.',
        100
    ) ON CONFLICT (id) DO
UPDATE
SET name = EXCLUDED.name,
    description = EXCLUDED.description,
    required_level = EXCLUDED.required_level;
-- RLS Policies
ALTER TABLE titles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_titles ENABLE ROW LEVEL SECURITY;
-- Drop existing policies if they exist to avoid errors
DROP POLICY IF EXISTS "Titles are viewable by everyone" ON titles;
CREATE POLICY "Titles are viewable by everyone" ON titles FOR
SELECT USING (true);
DROP POLICY IF EXISTS "Users can view their own unlocked titles" ON user_titles;
CREATE POLICY "Users can view their own unlocked titles" ON user_titles FOR
SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert their own titles" ON user_titles;
CREATE POLICY "Users can insert their own titles" ON user_titles FOR
INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update their own titles" ON user_titles;
CREATE POLICY "Users can update their own titles" ON user_titles FOR
UPDATE USING (auth.uid() = user_id);