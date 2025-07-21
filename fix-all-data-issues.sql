-- ==========================================
-- FIX ALL DATA ISSUES
-- ==========================================

-- PART 1: FIX MILESTONE CAPITALIZATION INCONSISTENCIES
-- Update all capitalized milestone categories to lowercase
UPDATE public.milestones SET category = 'castle' WHERE category = 'Castle';
UPDATE public.milestones SET category = 'craft' WHERE category = 'Craft';
UPDATE public.milestones SET category = 'honor' WHERE category = 'Honor';
UPDATE public.milestones SET category = 'knowledge' WHERE category = 'Knowledge';
UPDATE public.milestones SET category = 'might' WHERE category = 'Might';
UPDATE public.milestones SET category = 'vitality' WHERE category = 'Vitality';

-- PART 2: RE-SEED CHALLENGES (table appears empty)
-- First, delete any existing challenges to avoid conflicts
DELETE FROM public.challenges;

-- Now insert challenges with CORRECT FRONTEND CATEGORIES
INSERT INTO public.challenges (name, description, category, difficulty, xp, gold) VALUES
-- Push/Legs/Core category
('Push-up', 'Start in high plank, keep core tight, lower to near-ground, push up (3x12)', 'Push/Legs/Core', 'medium', 50, 25),
('Overhead Press', 'Stand tall, press dumbbells overhead, control the descent (3x10)', 'Push/Legs/Core', 'medium', 50, 25),
('Tricep Dip', 'Sit on chair edge, lower body using arms, push back up (3x10)', 'Push/Legs/Core', 'medium', 50, 25),
('Pike Push-up', 'Start in downward dog, lower head towards ground, push up (3x8)', 'Push/Legs/Core', 'medium', 50, 25),
('Diamond Push-up', 'Make diamond with hands, perform push-up (3x8)', 'Push/Legs/Core', 'medium', 50, 25),
('Goblet Squat', 'Hold weight in front of chest, squat deeply with control (3x15)', 'Push/Legs/Core', 'medium', 50, 25),

-- Pull/Shoulder/Core category  
('Pull-up', 'Hang from bar, pull up until chin over bar, lower with control (3x8)', 'Pull/Shoulder/Core', 'medium', 50, 25),
('Bent-over Row', 'Hinge at hips, pull dumbbells to your sides, squeeze shoulder blades (3x12)', 'Pull/Shoulder/Core', 'medium', 50, 25),
('Bicep Curl', 'Stand tall, curl dumbbells up, control the descent (3x15)', 'Pull/Shoulder/Core', 'medium', 50, 25),
('Reverse Fly', 'Hinge forward, spread arms wide with dumbbells, squeeze shoulder blades (3x12)', 'Pull/Shoulder/Core', 'medium', 50, 25),
('Hammer Curl', 'Hold dumbbells with neutral grip, curl up and down (3x12)', 'Pull/Shoulder/Core', 'medium', 50, 25),
('Australian Pull-up', 'Grip table edge, pull chest to edge, lower with control (3x max)', 'Pull/Shoulder/Core', 'medium', 50, 25),

-- Legs/Arms/Core category
('Squat', 'Feet shoulder-width apart, lower hips back and down, drive through heels to stand (3x15)', 'Legs/Arms/Core', 'medium', 50, 25),
('Lunge', 'Step forward into lunge, push back to starting position (3x10 per leg)', 'Legs/Arms/Core', 'medium', 50, 25),
('Calf Raise', 'Rise up on toes, hold briefly, lower slowly (3x20)', 'Legs/Arms/Core', 'medium', 50, 25),
('Glute Bridge', 'Lie on back, drive hips up, squeeze glutes at top (3x15)', 'Legs/Arms/Core', 'medium', 50, 25),
('Wall Sit', 'Back against wall, slide down to 90-degree angle, hold (3x45 sec)', 'Legs/Arms/Core', 'medium', 50, 25),
('Plank', 'Hold high plank position, keep core tight, breathe steady (3x45 sec)', 'Legs/Arms/Core', 'medium', 50, 25),

-- HIIT & Full Body category
('Burpee', 'Squat, jump to plank, jump in, explode up – repeat (3x15)', 'HIIT & Full Body', 'hard', 75, 35),
('Mountain Climber', 'Start in high plank, run knees to chest quickly (3x30 sec)', 'HIIT & Full Body', 'hard', 75, 35),
('Jump Squat', 'Squat down then jump explosively, land softly (3x20)', 'HIIT & Full Body', 'hard', 75, 35),
('Full Body Push-up', 'Choose board color to target chest/triceps/shoulders (3x12)', 'HIIT & Full Body', 'medium', 50, 25),
('Dumbbell Deadlift', 'Stand tall, bend at hips, lower dumbbells close to legs and lift (3x10-12)', 'HIIT & Full Body', 'medium', 50, 25),
('Reverse Plank', 'Sit with legs extended, lift hips, support on heels and hands (1x 30-60 sec)', 'HIIT & Full Body', 'medium', 50, 25)

ON CONFLICT (name, category) DO NOTHING;

-- PART 3: VERIFY FIXES
-- Check challenge categories (should show 4 categories with ~6 challenges each)
SELECT 'CHALLENGES' as table_name, category, COUNT(*) as count 
FROM public.challenges 
GROUP BY category
ORDER BY category;

-- Check milestone categories (should show 6 categories, all lowercase)
SELECT 'MILESTONES' as table_name, category, COUNT(*) as count 
FROM public.milestones 
GROUP BY category
ORDER BY category;

-- Total counts
SELECT 'TOTALS' as summary, 
       (SELECT COUNT(*) FROM public.challenges) as total_challenges,
       (SELECT COUNT(*) FROM public.milestones) as total_milestones; 