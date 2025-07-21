-- ==========================================
-- MISSING TABLES SETUP FOR LEVEL-UP APP
-- Run this SQL in your Supabase SQL Editor
-- ==========================================

-- 1. CREATE CHALLENGES TABLE (for global challenge definitions)
CREATE TABLE IF NOT EXISTS public.challenges (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
    xp INTEGER NOT NULL DEFAULT 0,
    gold INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. CREATE CHALLENGE_COMPLETION TABLE (for user completions)
CREATE TABLE IF NOT EXISTS public.challenge_completion (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL, -- Clerk user ID
    challenge_id UUID NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
    completed BOOLEAN NOT NULL DEFAULT false,
    date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, challenge_id, date)
);

-- 3. CREATE MILESTONES TABLE (for global milestone definitions)
CREATE TABLE IF NOT EXISTS public.milestones (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
    xp INTEGER NOT NULL DEFAULT 0,
    gold INTEGER NOT NULL DEFAULT 0,
    target INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. CREATE MILESTONE_COMPLETION TABLE (for user completions)
CREATE TABLE IF NOT EXISTS public.milestone_completion (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL, -- Clerk user ID
    milestone_id UUID NOT NULL REFERENCES public.milestones(id) ON DELETE CASCADE,
    completed BOOLEAN NOT NULL DEFAULT false,
    progress INTEGER NOT NULL DEFAULT 0,
    date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, milestone_id)
);

-- 5. ENABLE ROW LEVEL SECURITY
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_completion ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.milestone_completion ENABLE ROW LEVEL SECURITY;

-- 6. CREATE POLICIES

-- Challenges: Anyone can read (global data)
CREATE POLICY "Anyone can read challenges" ON public.challenges FOR SELECT USING (true);

-- Challenge completions: Users can only access their own data
CREATE POLICY "Users can read own challenge completions" ON public.challenge_completion 
    FOR SELECT USING (auth.jwt() ->> 'sub' = user_id);
CREATE POLICY "Users can insert own challenge completions" ON public.challenge_completion 
    FOR INSERT WITH CHECK (auth.jwt() ->> 'sub' = user_id);
CREATE POLICY "Users can update own challenge completions" ON public.challenge_completion 
    FOR UPDATE USING (auth.jwt() ->> 'sub' = user_id);

-- Milestones: Anyone can read (global data)
CREATE POLICY "Anyone can read milestones" ON public.milestones FOR SELECT USING (true);

-- Milestone completions: Users can only access their own data
CREATE POLICY "Users can read own milestone completions" ON public.milestone_completion 
    FOR SELECT USING (auth.jwt() ->> 'sub' = user_id);
CREATE POLICY "Users can insert own milestone completions" ON public.milestone_completion 
    FOR INSERT WITH CHECK (auth.jwt() ->> 'sub' = user_id);
CREATE POLICY "Users can update own milestone completions" ON public.milestone_completion 
    FOR UPDATE USING (auth.jwt() ->> 'sub' = user_id);

-- 7. SERVICE ROLE POLICIES (for seeding/admin operations)
CREATE POLICY "Service role can manage challenges" ON public.challenges FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role can manage challenge completions" ON public.challenge_completion FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role can manage milestones" ON public.milestones FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role can manage milestone completions" ON public.milestone_completion FOR ALL USING (auth.role() = 'service_role');

-- 8. CREATE INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_challenge_completion_user_id ON public.challenge_completion(user_id);
CREATE INDEX IF NOT EXISTS idx_challenge_completion_date ON public.challenge_completion(date);
CREATE INDEX IF NOT EXISTS idx_milestone_completion_user_id ON public.milestone_completion(user_id);
CREATE INDEX IF NOT EXISTS idx_milestone_completion_date ON public.milestone_completion(date);

-- 9. SEED INITIAL CHALLENGES DATA
INSERT INTO public.challenges (name, description, category, difficulty, xp, gold) VALUES
-- Push Day (Chest, Shoulders, Triceps)
('Push-up', 'Start in high plank, keep core tight, lower to near-ground, push up (3x12)', 'Push Day (Chest, Shoulders, Triceps)', 'medium', 50, 25),
('Overhead Press', 'Stand tall, press dumbbells overhead, control the descent (3x10)', 'Push Day (Chest, Shoulders, Triceps)', 'medium', 50, 25),
('Tricep Dip', 'Sit on chair edge, lower body using arms, push back up (3x10)', 'Push Day (Chest, Shoulders, Triceps)', 'medium', 50, 25),
('Pike Push-up', 'Start in downward dog, lower head towards ground, push up (3x8)', 'Push Day (Chest, Shoulders, Triceps)', 'medium', 50, 25),
('Diamond Push-up', 'Make diamond with hands, perform push-up (3x8)', 'Push Day (Chest, Shoulders, Triceps)', 'medium', 50, 25),

-- Pull Day (Back, Biceps)
('Pull-up', 'Hang from bar, pull up until chin over bar, lower with control (3x8)', 'Pull Day (Back, Biceps)', 'medium', 50, 25),
('Bent-over Row', 'Hinge at hips, pull dumbbells to your sides, squeeze shoulder blades (3x12)', 'Pull Day (Back, Biceps)', 'medium', 50, 25),
('Bicep Curl', 'Stand tall, curl dumbbells up, control the descent (3x15)', 'Pull Day (Back, Biceps)', 'medium', 50, 25),
('Reverse Fly', 'Hinge forward, spread arms wide with dumbbells, squeeze shoulder blades (3x12)', 'Pull Day (Back, Biceps)', 'medium', 50, 25),
('Hammer Curl', 'Hold dumbbells with neutral grip, curl up and down (3x12)', 'Pull Day (Back, Biceps)', 'medium', 50, 25),

-- Leg Day
('Squat', 'Feet shoulder-width apart, lower hips back and down, drive through heels to stand (3x15)', 'Leg Day', 'medium', 50, 25),
('Lunge', 'Step forward into lunge, push back to starting position (3x10 per leg)', 'Leg Day', 'medium', 50, 25),
('Calf Raise', 'Rise up on toes, hold briefly, lower slowly (3x20)', 'Leg Day', 'medium', 50, 25),
('Glute Bridge', 'Lie on back, drive hips up, squeeze glutes at top (3x15)', 'Leg Day', 'medium', 50, 25),
('Wall Sit', 'Back against wall, slide down to 90-degree angle, hold (3x45 sec)', 'Leg Day', 'medium', 50, 25),

-- Core & Flexibility
('Plank', 'Hold high plank position, keep core tight, breathe steady (3x45 sec)', 'Core & Flexibility', 'medium', 50, 25),
('Russian Twist', 'Sit with legs up, twist torso side to side (3x20)', 'Core & Flexibility', 'medium', 50, 25),
('Dead Bug', 'Lie on back, extend opposite arm and leg, return to start (3x10 per side)', 'Core & Flexibility', 'medium', 50, 25),
('Cat-Cow Stretch', 'On hands and knees, arch and round your spine slowly (2x10)', 'Core & Flexibility', 'easy', 30, 15),
('Child Pose', 'Kneel and sit back on heels, reach arms forward (2x30 sec)', 'Core & Flexibility', 'easy', 30, 15),

-- HIIT & Full Body
('Burpee', 'Squat, jump to plank, jump in, explode up – repeat (3x15)', 'HIIT & Full Body', 'hard', 75, 35),
('Mountain Climber', 'Start in high plank, run knees to chest quickly (3x30 sec)', 'HIIT & Full Body', 'hard', 75, 35),
('Jump Squat', 'Squat down then jump explosively, land softly (3x20)', 'HIIT & Full Body', 'hard', 75, 35),
('Full Body Push-up', 'Choose board color to target chest/triceps/shoulders (3x12)', 'HIIT & Full Body', 'medium', 50, 25)

ON CONFLICT (name, category) DO NOTHING; -- Avoid duplicates if running multiple times

-- 10. SEED INITIAL MILESTONES DATA
INSERT INTO public.milestones (name, description, category, difficulty, xp, gold, target) VALUES
-- Might category
('300 Pushups in One Day', 'Complete 300 pushups in a single day', 'might', 'hard', 500, 250, 300),
('Plank for 3 Minutes', 'Hold a plank for 3 minutes straight', 'might', 'medium', 300, 150, 180),
('Complete 100 Workouts', 'Complete 100 workout sessions', 'might', 'hard', 1000, 500, 100),

-- Knowledge category  
('365 Days of Learning', 'Learn something new every day for a year', 'knowledge', 'hard', 2000, 1000, 365),
('Read 50 Books', 'Read 50 books this year', 'knowledge', 'hard', 1500, 750, 50),
('Master a New Language', 'Achieve conversational fluency in a new language', 'knowledge', 'hard', 2500, 1250, 1),

-- Honor category
('Wake Up Before 6AM for 100 Days', 'Wake up before 6AM for 100 consecutive days', 'honor', 'hard', 800, 400, 100),
('365 Acts of Kindness', 'Perform one act of kindness every day for a year', 'honor', 'hard', 1800, 900, 365),
('Volunteer 100 Hours', 'Volunteer 100 hours for a good cause', 'honor', 'medium', 1200, 600, 100),

-- Castle category
('Host 50 Dinners', 'Host 50 dinners or gatherings at your home', 'castle', 'medium', 1000, 500, 50),
('Organize Life Completely', 'Organize every area of your living space', 'castle', 'medium', 600, 300, 1),
('Build Something with Your Hands', 'Complete a major DIY project', 'castle', 'medium', 800, 400, 1),

-- Craft category
('365-Day Drawing Challenge', 'Draw something every day for a year', 'craft', 'hard', 1500, 750, 365),
('Master a Musical Instrument', 'Learn to play a song perfectly on an instrument', 'craft', 'medium', 1000, 500, 1),
('Create 50 Recipes', 'Create and perfect 50 original recipes', 'craft', 'medium', 1200, 600, 50),

-- Vitality category
('Run 1000 Miles', 'Run a total of 1000 miles', 'vitality', 'hard', 2000, 1000, 1000),
('Perfect Sleep for 30 Days', 'Get 8+ hours of quality sleep for 30 consecutive days', 'vitality', 'medium', 600, 300, 30),
('Meditate for 365 Days', 'Meditate every day for a full year', 'vitality', 'hard', 1800, 900, 365),
('Yoga Master', 'Complete 100 yoga sessions', 'vitality', 'medium', 800, 400, 100),
('Stress-Free Month', 'Practice stress management techniques daily for 30 days', 'vitality', 'medium', 500, 250, 30)

ON CONFLICT (name, category) DO NOTHING; -- Avoid duplicates if running multiple times

-- ==========================================
-- ALL DONE! Your database is now ready.
-- ========================================== 