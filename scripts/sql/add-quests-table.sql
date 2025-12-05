-- Add missing quests table
CREATE TABLE public.quests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('might', 'knowledge', 'honor', 'castle', 'craft', 'vitality')),
    difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
    rewards JSONB NOT NULL DEFAULT '{"xp": 0, "gold": 0}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for the quests table
ALTER TABLE public.quests ENABLE ROW LEVEL SECURITY;

-- Policy for authenticated users to read quests (quests are public, but we need RLS enabled)
CREATE POLICY "Anyone can read quests" ON public.quests FOR SELECT USING (true);

-- Policy for service role to manage quests
CREATE POLICY "Service role can manage quests" ON public.quests FOR ALL USING (auth.role() = 'service_role');

-- Insert some default quests
INSERT INTO public.quests (title, description, category, difficulty, rewards) VALUES
('First Steps of Power', 'Complete 1 workout session.', 'might', 'easy', '{"xp": 50, "gold": 10}'),
('A Spark of Wisdom', 'Read one chapter of a book.', 'knowledge', 'easy', '{"xp": 50, "gold": 10}'),
('Honor Among Thieves', 'Help someone in need today.', 'honor', 'easy', '{"xp": 50, "gold": 10}'),
('Castle Foundations', 'Organize your workspace.', 'castle', 'easy', '{"xp": 50, "gold": 10}'),
('Craft Mastery', 'Learn a new skill or hobby.', 'craft', 'easy', '{"xp": 50, "gold": 10}'),
('Vitality Boost', 'Take a 30-minute walk.', 'vitality', 'easy', '{"xp": 50, "gold": 10}'),
('Strength Training', 'Complete 3 workout sessions this week.', 'might', 'medium', '{"xp": 100, "gold": 25}'),
('Knowledge Seeker', 'Read 3 chapters this week.', 'knowledge', 'medium', '{"xp": 100, "gold": 25}'),
('Noble Deeds', 'Perform 5 acts of kindness this week.', 'honor', 'medium', '{"xp": 100, "gold": 25}'),
('Castle Builder', 'Complete a major organization project.', 'castle', 'medium', '{"xp": 100, "gold": 25}'),
('Master Craftsman', 'Spend 5 hours on your craft this week.', 'craft', 'medium', '{"xp": 100, "gold": 25}'),
('Health Champion', 'Exercise for 5 days this week.', 'vitality', 'medium', '{"xp": 100, "gold": 25}');

-- Grant permissions
GRANT ALL ON public.quests TO authenticated, anon; 